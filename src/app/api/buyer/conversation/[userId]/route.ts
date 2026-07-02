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

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await getBuyerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId } = params

  const [{ data: user, error: userError }, { data: messages }, { data: reportRow }, { data: escalations }] = await Promise.all([
    supabase.from('users').select('id, email, full_name, company_name, subscription_tier, assigned_buyer_id').eq('id', userId).single(),
    supabase.from('chat_messages').select('id, role, content, buyer_id, created_at').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('reports').select('report_summary, generated_at').eq('user_id', userId).order('generated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('escalations').select('id, urgency, user_note, status, assigned_buyer_id, claimed_by, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
  ])

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Mark buyer-visible: user messages since this buyer last read them.
  void supabase.from('chat_messages').update({ read_by_buyer: true }).eq('user_id', userId).eq('role', 'user')

  const report = reportRow ? parseReport(reportRow.report_summary) : {}

  const thread = (messages ?? []).map(m => ({
    id: m.id,
    role: m.role,
    content: m.content,
    buyerName: getBuyerById(m.buyer_id)?.name ?? null,
    createdAt: m.created_at,
  }))

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      companyName: user.company_name,
      tier: user.subscription_tier,
      assignedBuyer: getBuyerById(user.assigned_buyer_id)?.name ?? null,
    },
    report: {
      score: (report.overall_score ?? report.health_score ?? null) as number | null,
      wasteEstimate: (report.monthly_waste_estimate ?? null) as string | null,
      findings: (report.critical_findings ?? report.findings ?? []) as unknown[],
      quickWins: (report.quick_wins ?? []) as unknown[],
      generatedAt: reportRow?.generated_at ?? null,
    },
    thread,
    escalations: (escalations ?? []).map(e => ({
      id: e.id,
      urgency: e.urgency,
      note: e.user_note,
      status: e.status,
      assignedBuyer: getBuyerById(e.assigned_buyer_id)?.name ?? null,
      claimedBy: getBuyerById(e.claimed_by)?.name ?? null,
      claimedByMe: e.claimed_by === session.buyerId,
      createdAt: e.created_at,
    })),
  })
}
