import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getBuyerSession } from '@/lib/buyerSession'
import { getBuyerById } from '@/lib/buyers'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder',
)

export async function POST(req: NextRequest) {
  const session = await getBuyerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { escalationId } = await req.json() as { escalationId: string }
  if (!escalationId) return NextResponse.json({ error: 'escalationId required' }, { status: 400 })

  const { data: existing, error: fetchErr } = await supabase
    .from('escalations')
    .select('id, claimed_by, status')
    .eq('id', escalationId)
    .single()

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Escalation not found' }, { status: 404 })
  }

  if (existing.claimed_by && existing.claimed_by !== session.buyerId) {
    return NextResponse.json({
      error: 'Already claimed',
      claimedBy: getBuyerById(existing.claimed_by)?.name ?? 'another buyer',
    }, { status: 409 })
  }

  // Guard the update on the claimed_by state we just read, so two buyers
  // claiming at the same instant can't both "win".
  let update = supabase
    .from('escalations')
    .update({ claimed_by: session.buyerId, claimed_at: new Date().toISOString(), status: existing.status === 'resolved' ? 'resolved' : 'claimed' })
    .eq('id', escalationId)

  update = existing.claimed_by ? update.eq('claimed_by', existing.claimed_by) : update.is('claimed_by', null)

  const { data: updated, error: updateErr } = await update.select('id').maybeSingle()

  if (updateErr) {
    console.error('[buyer/claim] update error:', updateErr.message)
    return NextResponse.json({ error: 'Failed to claim' }, { status: 500 })
  }
  if (!updated) {
    return NextResponse.json({ error: 'Already claimed by someone else' }, { status: 409 })
  }

  return NextResponse.json({ success: true })
}
