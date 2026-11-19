import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendWeeklyNumbersEmail } from '@/lib/email'
import { readStoredReport } from '@/lib/repair-json'
import { lastCompletedWeekStart, weekLabel, unsubscribeToken } from '@/lib/weeks'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DAY_MS = 86_400_000

// Mondays, 08:00 Nairobi. Asks each active client for last week's numbers.
// The email is the trigger, logging is the 30-second action, the cost per
// lead they see straight after is the reward.
//
// It stays quiet when it would be noise: no email if the week is already
// logged, if the person opted out, or if they have gone silent (no numbers
// in 5 weeks and no login in 30 days).
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = supabaseAdmin()
  const baseUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.idealicp.com'
  const due      = lastCompletedWeekStart()
  const label    = weekLabel(due)
  const now      = Date.now()

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, full_name, created_at, last_active_at')
    .eq('billing_status', 'active')
    .eq('weekly_numbers_opt_out', false)
  if (error) {
    console.error('[weekly-numbers] users query error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0, skipped = 0, failed = 0
  for (const u of users ?? []) {
    try {
      const [{ data: report }, { data: weeks }] = await Promise.all([
        supabase.from('reports').select('report_summary').eq('user_id', u.id).order('generated_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('weekly_checkins').select('week_start, spend, currency, leads').eq('user_id', u.id).order('week_start', { ascending: false }).limit(2),
      ])
      if (!report) { skipped++; continue }                              // no diagnosis yet
      const latest = weeks?.[0]
      if (latest?.week_start === due) { skipped++; continue }           // already logged

      const recentNumbers = latest ? now - new Date(`${latest.week_start}T00:00:00Z`).getTime() < 42 * DAY_MS : false
      const lastSeen = new Date(u.last_active_at ?? u.created_at).getTime()
      if (!recentNumbers && now - lastSeen > 30 * DAY_MS) { skipped++; continue }   // gone quiet

      const cpl = (w?: { spend: unknown; leads: number }) => w && w.leads > 0 ? Number(w.spend) / w.leads : null
      const a = cpl(latest), b = weeks?.[1]?.currency === latest?.currency ? cpl(weeks?.[1]) : null
      const lastCpl = a !== null && latest ? `${latest.currency} ${Math.round(a).toLocaleString('en-KE')}` : undefined
      const pct = a !== null && b !== null && b > 0 ? Math.round(((a - b) / b) * 100) : null
      const change = pct === null ? undefined : pct === 0 ? 'Same as the week before' : `${pct < 0 ? 'Down' : 'Up'} ${Math.abs(pct)}% on the week before`

      const diag = readStoredReport<{ quick_wins?: { action?: string }[] }>(report.report_summary)
      const fix  = diag.quick_wins?.[0]?.action
      const topFix = fix ? (fix.length > 110 ? `${fix.slice(0, fix.lastIndexOf(' ', 110))}…` : fix) : undefined

      const r = await sendWeeklyNumbersEmail({
        to: u.email, name: u.full_name ?? undefined, week: label, lastCpl, change, topFix, baseUrl,
        unsubscribeUrl: `${baseUrl}/api/weekly-checkin/unsubscribe?u=${u.id}&t=${unsubscribeToken(u.id)}`,
      })
      if (r.error) failed++; else sent++
    } catch (e) {
      failed++
      console.error('[weekly-numbers] user failed:', u.id, e instanceof Error ? e.message : e)
    }
  }

  console.log('[weekly-numbers] week', due, '| sent:', sent, '| skipped:', skipped, '| failed:', failed)
  return NextResponse.json({ week: due, sent, skipped, failed })
}
