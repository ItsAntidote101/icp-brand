import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAdminReplyToUser } from '@/lib/email'
import { timingSafeEqual } from 'crypto'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // 1. Validate admin key via header (timing-safe)
    const provided = Buffer.from(req.headers.get('x-admin-key') ?? '')
    const expected = Buffer.from(process.env.ADMIN_SECRET ?? '')
    if (!expected.length || provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json() as {
      escalationId: string
      reply: string
    }
    const { escalationId, reply } = body

    // 2. Fetch escalation
    const { data: escalation, error: escalationError } = await supabase
      .from('escalations')
      .select('*')
      .eq('id', escalationId)
      .single()

    if (escalationError || !escalation) {
      return NextResponse.json({ error: 'Escalation not found' }, { status: 404 })
    }

    // 3. Fetch user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', escalation.user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 4. Insert reply into chat_messages
    const { error: msgError } = await supabase.from('chat_messages').insert({
      user_id: escalation.user_id,
      role: 'media_buyer',
      content: reply,
    })
    if (msgError) console.warn('[admin/reply] chat_messages insert warning:', msgError.message)

    // 5. Update escalation
    const { error: updateEscalationError } = await supabase
      .from('escalations')
      .update({ admin_reply: reply, replied_at: new Date().toISOString(), status: 'replied' })
      .eq('id', escalationId)
    if (updateEscalationError) console.warn('[admin/reply] escalation update warning:', updateEscalationError.message)

    // 6. Update user unread flag
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ has_unread_reply: true })
      .eq('id', escalation.user_id)
    if (updateUserError) console.warn('[admin/reply] user update warning:', updateUserError.message)

    // 7. Send email notification
    const { error: emailError } = await sendAdminReplyToUser({
      to: user.email,
      name: user.full_name ?? user.email,
      reply,
    })
    if (emailError) console.error('[admin/reply] email error:', JSON.stringify(emailError))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/reply] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
