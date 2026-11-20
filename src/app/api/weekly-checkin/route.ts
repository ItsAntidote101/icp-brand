import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { lastCompletedWeekStart, weekLabel } from '@/lib/weeks'
import { loadIndustry, tradeWords } from '@/lib/trade-words'

export const dynamic = 'force-dynamic'

const supabase = supabaseAdmin()
const CURRENCIES = new Set(['KES', 'USD', 'GBP', 'EUR', 'NGN', 'ZAR', 'UGX', 'TZS', 'AED'])

// The client's own weekly numbers: last 12 weeks, newest first.
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('weekly_checkins')
    .select('week_start, spend, currency, leads, sales, sales_value')
    .eq('user_id', session.userId)
    .order('week_start', { ascending: false })
    .limit(12)
  if (error) {
    console.error('[weekly-checkin] read error:', error.message)
    return NextResponse.json({ error: 'Could not load your numbers' }, { status: 500 })
  }

  const due = lastCompletedWeekStart()
  return NextResponse.json({
    weeks: (data ?? []).map(w => ({ ...w, spend: Number(w.spend), sales_value: w.sales_value === null ? null : Number(w.sales_value) })),
    // The words this client's trade uses for a lead and a sale
    words: tradeWords(await loadIndustry(supabase, session.userId, session.email)),
    dueWeek: due,
    dueLabel: weekLabel(due),
  })
}

// Save (or correct) the numbers for the week that just ended.
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { spend?: unknown; leads?: unknown; sales?: unknown; salesValue?: unknown; currency?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const spend = Number(body.spend), leads = Number(body.leads), sales = Number(body.sales ?? 0)
  const currency = typeof body.currency === 'string' && CURRENCIES.has(body.currency) ? body.currency : 'KES'
  if (!Number.isFinite(spend) || spend < 0 || spend > 1e10) return NextResponse.json({ error: 'Enter your ad spend as a number' }, { status: 400 })
  if (!Number.isInteger(leads) || leads < 0 || leads > 1e7)  return NextResponse.json({ error: 'Enter your leads as a whole number' }, { status: 400 })
  if (!Number.isInteger(sales) || sales < 0 || sales > 1e7)  return NextResponse.json({ error: 'Enter your sales as a whole number' }, { status: 400 })
  // What those sales were worth. Optional: blank stays unknown, it is not zero
  const rawValue = body.salesValue
  const sales_value = rawValue === undefined || rawValue === null || rawValue === '' ? null : Number(rawValue)
  if (sales_value !== null && (!Number.isFinite(sales_value) || sales_value < 0 || sales_value > 1e12)) return NextResponse.json({ error: 'Enter the value of your sales as a number' }, { status: 400 })

  const week_start = lastCompletedWeekStart()
  const { error } = await supabase
    .from('weekly_checkins')
    .upsert(
      { user_id: session.userId, week_start, spend, currency, leads, sales, sales_value, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,week_start' },
    )
  if (error) {
    console.error('[weekly-checkin] save error:', error.message)
    return NextResponse.json({ error: 'Could not save your numbers' }, { status: 500 })
  }
  return NextResponse.json({ success: true, week_start })
}
