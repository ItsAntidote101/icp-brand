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
    .update({ status: 'resolved' })
    .eq('id', escalationId)

  if (error) {
    console.error('[buyer/resolve] update error:', error.message)
    return NextResponse.json({ error: 'Failed to resolve' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
