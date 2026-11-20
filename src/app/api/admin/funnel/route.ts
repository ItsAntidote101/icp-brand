import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildFunnel, type Ev } from '@/lib/admin-business'

export const dynamic = 'force-dynamic'
const DAY_MS = 86_400_000
const PAGE = 1000
const MAX_PAGES = 30

// Visits to diagnoses to calls to paid, for the last 7, 30 or 90 days. Read only.
export async function GET(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const asked = Number(req.nextUrl.searchParams.get('days'))
  const days  = [7, 30, 90].includes(asked) ? asked : 30
  const supabase = supabaseAdmin()
  const since = new Date(Date.now() - days * DAY_MS).toISOString()

  // Supabase returns 1,000 rows per request, so read in pages
  const events: Ev[] = []
  let capped = false
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await supabase.from('funnel_events')
      .select('event, anon_id, user_id, utm, created_at')
      .gte('created_at', since).order('created_at', { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    events.push(...((data ?? []) as Ev[]))
    if (!data || data.length < PAGE) break
    if (page === MAX_PAGES - 1) capped = true
  }

  const [payQ, usersQ] = await Promise.all([
    supabase.from('paystack_payments').select('email, paid_at, created_at').eq('status', 'paid').order('created_at', { ascending: true }).limit(3000),
    supabase.from('users').select('id, email').limit(2000),
  ])

  const { steps, outcomes, sources } = buildFunnel(events, payQ.data ?? [], usersQ.data ?? [], new Date(since).getTime())
  return NextResponse.json({ days, steps, outcomes, sources, capped })
}
