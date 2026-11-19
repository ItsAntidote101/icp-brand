import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { lastCompletedWeekStart, weekLabel } from '@/lib/weeks'

export const dynamic = 'force-dynamic'

const supabase = supabaseAdmin()
const CURRENCIES = new Set(['KES', 'USD', 'GBP', 'EUR', 'NGN', 'ZAR', 'UGX', 'TZS', 'AED'])

// The client's own weekly numbers: last 12 weeks, newest first.
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('weekly_checkins')
    .select('week_start, spend, currency, leads, sales')
    .eq('user_id', session.userId)
    .order('week_start', { ascending: false })
    .limit(12)
  if (error) {
    console.error('[weekly-checkin] read error:', error.message)
    return NextResponse.json({ error: 'Could not load your numbers' }, { status: 500 })
  }

  const due = lastCompletedWeekStart()
  return NextResponse.json({
    weeks: (data ?? []).map(w => ({ ...w, spend: Number(w.spend) })),
    dueWeek: due,
    dueLabel: weekLabel(due),
  })
}

// Save (or correct) the numbers for the week that just ended.
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { spend?: unknown; leads?: unknown; sales?: unknown; currency?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const spend = Number(body.spend), leads = Number(body.leads), sales = Number(body.sales ?? 0)
  const currency = typeof body.currency === 'string' && CURRENCIES.has(body.currency) ? body.currency : 'KES'
  if (!Number.isFinite(spend) || spend < 0 || spend > 1e10) return NextResponse.json({ error: 'Enter your ad spend as a number' }, { status: 400 })
  if (!Number.isInteger(leads) || leads < 0 || leads > 1e7)  return NextResponse.json({ error: 'Enter your leads as a whole number' }, { status: 400 })
  if (!Number.isInteger(sales) || sales < 0 || sales > 1e7)  return NextResponse.json({ error: 'Enter your sales as a whole number' }, { status: 400 })

  const week_start = lastCompletedWeekStart()
  const { error } = await supabase
    .from('weekly_checkins')
    .upsert(
      { user_id: session.userId, week_start, spend, currency, leads, sales, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,week_start' },
    )
  if (error) {
    console.error('[weekly-checkin] save error:', error.message)
    return NextResponse.json({ error: 'Could not save your numbers' }, { status: 500 })
  }
  return NextResponse.json({ success: true, week_start })
}
