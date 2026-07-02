import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getBuyerSession } from '@/lib/buyerSession'
import { getBuyerById } from '@/lib/buyers'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder',
)

function parseReport(summary: string): Record<string, unknown> {
  try { return JSON.parse(summary) } catch { return {} }
}

export async function GET(req: NextRequest) {
  const session = await getBuyerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const filter = req.nextUrl.searchParams.get('filter') ?? 'open'

  let query = supabase
    .from('escalations')
    .select('id, user_id, urgency, user_note, status, assigned_buyer_id, claimed_by, created_at, replied_at')
    .order('created_at', { ascending: false })

  if (filter === 'mine') query = query.eq('claimed_by', session.buyerId)
  else if (filter === 'unclaimed') query = query.is('claimed_by', null).neq('status', 'resolved')
  else if (filter === 'open') query = query.neq('status', 'resolved')
  // filter === 'all' → no extra clause

  const { data: escalations, error } = await query

  if (error) {
    console.error('[buyer/inbox] fetch error:', error.message)
    return NextResponse.json({ error: 'Failed to load inbox' }, { status: 500 })
  }

  const userIds = Array.from(new Set((escalations ?? []).map(e => e.user_id)))

  const [{ data: users }, { data: reports }] = await Promise.all([
    userIds.length
      ? supabase.from('users').select('id, email, full_name, company_name, subscription_tier').in('id', userIds)
      : Promise.resolve({ data: [] as { id: string; email: string; full_name: string | null; company_name: string | null; subscription_tier: string | null }[] }),
    userIds.length
      ? supabase.from('reports').select('user_id, report_summary, generated_at').in('user_id', userIds).order('generated_at', { ascending: false })
      : Promise.resolve({ data: [] as { user_id: string; report_summary: string; generated_at: string }[] }),
  ])

  const usersById = new Map((users ?? []).map(u => [u.id, u]))
  const latestScoreByUser = new Map<string, number | null>()
  for (const r of reports ?? []) {
    if (latestScoreByUser.has(r.user_id)) continue
    const parsed = parseReport(r.report_summary)
    latestScoreByUser.set(r.user_id, (parsed.overall_score ?? parsed.health_score ?? null) as number | null)
  }

  const items = (escalations ?? []).map(e => {
    const u = usersById.get(e.user_id)
    return {
      id: e.id,
      userId: e.user_id,
      userName: u?.full_name ?? u?.email ?? 'Unknown',
      companyName: u?.company_name ?? null,
      tier: u?.subscription_tier ?? 'free',
      score: latestScoreByUser.get(e.user_id) ?? null,
      urgency: e.urgency,
      note: e.user_note,
      status: e.status,
      assignedBuyer: getBuyerById(e.assigned_buyer_id)?.name ?? null,
      claimedBy: getBuyerById(e.claimed_by)?.name ?? null,
      claimedByMe: e.claimed_by === session.buyerId,
      createdAt: e.created_at,
      repliedAt: e.replied_at,
    }
  })

  return NextResponse.json({ items })
}
