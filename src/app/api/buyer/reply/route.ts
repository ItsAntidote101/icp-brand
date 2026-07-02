import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getBuyerSession } from '@/lib/buyerSession'
import { getBuyerById } from '@/lib/buyers'
import { sendAdminReplyToUser } from '@/lib/email'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder',
)

export async function POST(req: NextRequest) {
  const session = await getBuyerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const buyer = getBuyerById(session.buyerId)
  if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })

  const { userId, escalationId, reply } = await req.json() as {
    userId: string; escalationId?: string; reply: string
  }
  if (!userId || !reply?.trim()) {
    return NextResponse.json({ error: 'userId and reply are required' }, { status: 400 })
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { error: msgError } = await supabase.from('chat_messages').insert({
    user_id: userId,
    role: 'media_buyer',
    buyer_id: buyer.id,
    content: reply.trim(),
  })
  if (msgError) console.warn('[buyer/reply] chat_messages insert warning:', msgError.message)

  if (escalationId) {
    // Replying implies taking over the ticket if nobody has claimed it yet.
    const { data: escalation } = await supabase
      .from('escalations')
      .select('claimed_by')
      .eq('id', escalationId)
      .single()

    const { error: updateEscalationError } = await supabase
      .from('escalations')
      .update({
        admin_reply: reply.trim(),
        replied_at: new Date().toISOString(),
        status: 'replied',
        claimed_by: escalation?.claimed_by ?? buyer.id,
        claimed_at: escalation?.claimed_by ? undefined : new Date().toISOString(),
      })
      .eq('id', escalationId)
    if (updateEscalationError) console.warn('[buyer/reply] escalation update warning:', updateEscalationError.message)
  }

  const { error: updateUserError } = await supabase
    .from('users')
    .update({ has_unread_reply: true })
    .eq('id', userId)
  if (updateUserError) console.warn('[buyer/reply] user update warning:', updateUserError.message)

  const { error: emailError } = await sendAdminReplyToUser({
    to: user.email,
    name: user.full_name ?? user.email,
    reply: reply.trim(),
    buyerName: buyer.name,
  })
  if (emailError) console.error('[buyer/reply] email error:', JSON.stringify(emailError))

  return NextResponse.json({ success: true })
}
