import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getBuyerSession } from '@/lib/buyerSession'

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

  const { error } = await supabase
    .from('escalations')
    .update({ claimed_by: null, claimed_at: null, status: 'pending' })
    .eq('id', escalationId)
    .eq('claimed_by', session.buyerId)

  if (error) {
    console.error('[buyer/release] update error:', error.message)
    return NextResponse.json({ error: 'Failed to release' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
