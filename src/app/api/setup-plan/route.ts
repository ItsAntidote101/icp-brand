import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSession } from '@/lib/session'
import { buildSetupPlan, type Week } from '@/lib/setup-plan'

export const dynamic = 'force-dynamic'

// GET  the campaign setup starting point for this client. Pro and Agency.
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ plan: null }, { status: 401 })
  const supabase = supabaseAdmin()
  const { data: user } = await supabase.from('users').select('id, subscription_tier, billing_status').eq('id', session.userId).maybeSingle()
  if (!user) return NextResponse.json({ plan: null }, { status: 404 })
  if (!['pro', 'agency'].includes(user.subscription_tier) || user.billing_status !== 'active')
    return NextResponse.json({ plan: null, upgrade: true }, { status: 403 })

  const [{ data: q }, { data: weeks }] = await Promise.all([
    supabase.from('questionnaires').select('responses').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('weekly_checkins').select('week_start, spend, leads').eq('user_id', user.id).order('week_start', { ascending: false }).limit(8),
  ])
  if (!q?.responses) return NextResponse.json({ plan: null })
  const rows: Week[] = (weeks ?? []).map(w => ({ week_start: String(w.week_start), spend: w.spend === null ? null : Number(w.spend), leads: w.leads === null ? null : Number(w.leads) }))
  return NextResponse.json({ plan: buildSetupPlan(q.responses as Record<string, unknown>, rows) })
}
