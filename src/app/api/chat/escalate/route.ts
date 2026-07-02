import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEscalationToFounder, sendEscalationConfirmationToUser } from '@/lib/email'
import { getSession } from '@/lib/session'
import { getAssignedBuyer, getBuyerById } from '@/lib/buyers'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder'
)

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      email: string
      urgency: string
      note: string
      conversationHistory: Array<{ role: string; content: string }>
    }
    const { email, urgency, note, conversationHistory } = body

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }
    if (session.email !== email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 1. Fetch user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name, company_name, subscription_tier, email, renewal_date, assigned_buyer_id')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 1b. Resolve (and persist) the assigned buyer so the inbox has someone
    // to point to, even before anyone claims the ticket.
    let assignedBuyer = getBuyerById(user.assigned_buyer_id)
    if (!assignedBuyer) {
      const { data: qRow } = await supabase
        .from('questionnaire_responses')
        .select('data')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      const qd = (qRow?.data ?? {}) as Record<string, unknown>
      const region = (qd.region ?? qd.country ?? 'Kenya') as string
      const industry = (qd.industry ?? qd.business_type ?? '') as string
      assignedBuyer = getAssignedBuyer(region, industry, user.subscription_tier ?? 'free')
      void supabase.from('users').update({ assigned_buyer_id: assignedBuyer.id }).eq('id', user.id)
    }

    // 2. Fetch latest report for score and waste
    const { data: reportData } = await supabase
      .from('reports')
      .select('report_summary')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let score: number | null = null
    let wasteEstimate = '-'
    if (reportData?.report_summary) {
      try {
        const summary = JSON.parse(reportData.report_summary) as Record<string, unknown>
        score = (summary.overall_score ?? summary.health_score ?? null) as number | null
        wasteEstimate = (summary.monthly_waste_estimate as string) ?? '-'
      } catch {
        // non-fatal
      }
    }

    // 3. Build transcript
    const transcript = conversationHistory
      .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
      .join('\n')

    // 4. Save escalation
    const { error: escalationError } = await supabase.from('escalations').insert({
      user_id: user.id,
      conversation_summary: transcript,
      urgency,
      user_note: note,
      status: 'pending',
      assigned_buyer_id: assignedBuyer.id,
    })
    if (escalationError) console.warn('[chat/escalate] escalation insert warning:', escalationError.message)

    // 5. Send emails
    const [founderResult, userResult] = await Promise.allSettled([
      sendEscalationToFounder({
        userName: user.full_name ?? user.email,
        userEmail: user.email,
        companyName: user.company_name,
        tier: user.subscription_tier ?? 'starter',
        score,
        wasteEstimate,
        urgency,
        note,
        conversationTranscript: transcript,
        buyerEmail: assignedBuyer.email,
      }),
      sendEscalationConfirmationToUser({
        to: user.email,
        name: user.full_name ?? user.email,
        tier: user.subscription_tier ?? 'starter',
        urgency,
        buyerName: assignedBuyer.firstName,
      }),
    ])

    if (founderResult.status === 'rejected') console.error('[chat/escalate] founder email failed:', founderResult.reason)
    if (userResult.status === 'rejected') console.error('[chat/escalate] user email failed:', userResult.reason)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[chat/escalate] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
