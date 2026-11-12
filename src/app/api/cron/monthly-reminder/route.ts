import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendRenewalReminderEmail, sendPlanEndedEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    serviceKey
  )

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.idealicp.com'

  const now            = new Date()

  // ── Expire lapsed paid plans ─────────────────────────────────────────────
  // Nothing used to downgrade a paid user once renewal_date passed, so Pro
  // access lasted forever after one payment. After a 3-day grace period the
  // account drops to free (it stays usable, just without paid features).
  const GRACE_MS = 3 * 24 * 60 * 60 * 1000
  const expiryCutoff = new Date(now.getTime() - GRACE_MS).toISOString()
  const { data: expired, error: expireErr } = await supabase
    .from('users')
    .update({ subscription_tier: 'free', updated_at: now.toISOString() })
    .neq('subscription_tier', 'free')
    .not('renewal_date', 'is', null)
    .lt('renewal_date', expiryCutoff)
    .select('id, email, full_name, cancelled_at')
  if (expireErr) {
    console.error('[cron] expiry update error:', JSON.stringify(expireErr))
  } else if (expired && expired.length > 0) {
    const ids = expired.map((u: { id: string }) => u.id)
    await supabase.from('subscriptions').update({ billing_status: 'expired', updated_at: now.toISOString() }).in('user_id', ids)
    console.log('[cron] expired', ids.length, 'lapsed paid plan(s)')
    // Tell them, unless they cancelled on purpose
    for (const u of expired as { email: string; full_name: string | null; cancelled_at: string | null }[]) {
      if (u.cancelled_at) continue
      await sendPlanEndedEmail({ to: u.email, name: u.full_name ?? undefined, baseUrl })
    }
  }

  // ── Renewal reminders ────────────────────────────────────────────────────
  // Plans do not charge automatically, so we ask exactly twice: 7 days and
  // 1 day before the paid period ends. (This used to send a generic
  // check-in email every day for the last 7 days, with no way to pay.)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name, subscription_tier, renewal_date')
    .eq('billing_status', 'active')
    .neq('subscription_tier', 'free')
    .is('cancelled_at', null)
    .gte('renewal_date', now.toISOString())
    .lte('renewal_date', new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString())

  if (usersError) {
    console.error('[cron] users query error:', JSON.stringify(usersError))
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  let sent = 0, failed = 0
  for (const u of users ?? []) {
    const daysLeft = Math.ceil((new Date(u.renewal_date as string).getTime() - now.getTime()) / 86_400_000)
    if (daysLeft !== 7 && daysLeft !== 1) continue
    const r = await sendRenewalReminderEmail({
      to: u.email, name: u.full_name ?? undefined, tier: u.subscription_tier,
      renewalDate: u.renewal_date as string, daysLeft, baseUrl,
    })
    if (r.error) failed++; else sent++
  }

  console.log('[cron] renewal reminders sent:', sent, '| failed:', failed)
  return NextResponse.json({ expired: expired?.length ?? 0, sent, failed }, { status: 200 })
}
