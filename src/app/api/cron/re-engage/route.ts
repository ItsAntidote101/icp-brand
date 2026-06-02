import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendReEngageEmail, type ReEngageScenario } from '@/lib/email'

export const dynamic = 'force-dynamic'

const TOTAL_QUESTIONS = 22

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const delayHours  = parseInt(process.env.RE_ENGAGE_DELAY_HOURS  ?? '24',  10)
  const repeatDays  = parseInt(process.env.RE_ENGAGE_REPEAT_DAYS  ?? '7',   10)

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', serviceKey)

  const now           = new Date()
  const cutoffSignup  = new Date(now.getTime() - delayHours * 60 * 60 * 1000).toISOString()
  const cutoffResend  = new Date(now.getTime() - repeatDays  * 24 * 60 * 60 * 1000).toISOString()

  console.log('[cron] re-engage | delay:', delayHours, 'h | repeat:', repeatDays, 'd')

  // Fetch users who haven't finished the questionnaire
  const { data: users, error: usersErr } = await supabase
    .from('users')
    .select('id, email, full_name, questionnaire_questions_answered, re_engage_sent_at, created_at')
    .or(`questionnaire_questions_answered.is.null,questionnaire_questions_answered.lt.${TOTAL_QUESTIONS}`)
    .or(`re_engage_sent_at.is.null,re_engage_sent_at.lt.${cutoffResend}`)
    .lt('created_at', cutoffSignup)
    .eq('billing_status', 'active')
    .neq('billing_status', 'cancelled')

  if (usersErr) {
    console.error('[cron] re-engage users query error:', JSON.stringify(usersErr))
    return NextResponse.json({ error: usersErr.message }, { status: 500 })
  }

  console.log('[cron] re-engage candidates:', users?.length ?? 0)

  type Result = { email: string; scenario: string; success: boolean; error?: string }
  const results: Result[] = []

  for (const user of users ?? []) {
    const questionsAnswered = user.questionnaire_questions_answered ?? 0

    // Skip if they somehow have a completed questionnaire in the questionnaires table
    const { count: qCount } = await supabase
      .from('questionnaires')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((qCount ?? 0) > 0) {
      // They submitted a full questionnaire — mark them done and skip
      await supabase
        .from('users')
        .update({ questionnaire_questions_answered: TOTAL_QUESTIONS })
        .eq('id', user.id)
      continue
    }

    // Check for CSV analysis
    const { data: csvRows } = await supabase
      .from('diagnostics')
      .select('diagnosis')
      .eq('user_id', user.id)
      .filter('diagnosis->>type', 'eq', 'csv_analysis')
      .order('created_at', { ascending: false })
      .limit(1)

    const hasCsv   = (csvRows ?? []).length > 0
    const csvDiag  = hasCsv ? (csvRows![0].diagnosis as Record<string, unknown>) : null
    const csvSummary     = typeof csvDiag?.summary === 'string' ? csvDiag.summary : undefined
    const csvFileName    = typeof csvDiag?.file    === 'string' ? csvDiag.file    : undefined
    const csvBudgetWaste = (csvDiag?.budget_waste as { estimated_amount?: string } | undefined)?.estimated_amount

    let scenario: ReEngageScenario
    if (hasCsv && questionsAnswered === 0) {
      scenario = 'csv_only'
    } else if (questionsAnswered === 0) {
      scenario = 'never_started'
    } else if (questionsAnswered < 10) {
      scenario = 'early_drop'
    } else {
      scenario = 'late_drop'
    }

    const result = await sendReEngageEmail({
      to:               user.email,
      name:             user.full_name ?? undefined,
      scenario,
      questionsAnswered,
      totalQuestions:   TOTAL_QUESTIONS,
      csvSummary,
      csvBudgetWaste,
      csvFileName,
    })

    const success = !result.error
    results.push({ email: user.email, scenario, success, ...(result.error ? { error: String(result.error) } : {}) })

    if (success) {
      await supabase
        .from('users')
        .update({ re_engage_sent_at: now.toISOString() })
        .eq('id', user.id)
    }
  }

  const sent   = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  console.log('[cron] re-engage done | sent:', sent, '| failed:', failed)

  return NextResponse.json({ sent, failed, results })
}
