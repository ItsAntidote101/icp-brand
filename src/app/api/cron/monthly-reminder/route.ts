import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendReminderEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )

  const proto   = req.headers.get('x-forwarded-proto') ?? 'https'
  const host    = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'icpbrand.co'
  const baseUrl = `${proto}://${host}`

  const now            = new Date()
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  console.log('[cron] monthly-reminder — range:', now.toISOString(), '→', sevenDaysLater.toISOString())

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('billing_status', 'active')
    .gte('renewal_date', now.toISOString())
    .lte('renewal_date', sevenDaysLater.toISOString())

  if (usersError) {
    console.error('[cron] users query error:', JSON.stringify(usersError))
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  console.log('[cron] found', users?.length ?? 0, 'users to remind')

  type Result = { email: string; success: boolean; error?: string }
  const results: Result[] = []

  for (const user of users ?? []) {
    const { data: reportRows } = await supabase
      .from('reports')
      .select('report_summary')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(1)

    let lastScore: number | undefined
    if (reportRows?.[0]) {
      try {
        const d = JSON.parse(reportRows[0].report_summary)
        lastScore = typeof d?.health_score === 'number' ? d.health_score : undefined
      } catch { /* ignore */ }
    }

    const result = await sendReminderEmail({
      to:    user.email,
      name:  user.full_name ?? undefined,
      lastScore,
      baseUrl,
    })

    results.push({
      email:   user.email,
      success: !result.error,
      ...(result.error ? { error: String(result.error) } : {}),
    })
  }

  const sent   = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  console.log('[cron] done — sent:', sent, '| failed:', failed)

  return NextResponse.json({ sent, failed, results }, { status: 200 })
}
