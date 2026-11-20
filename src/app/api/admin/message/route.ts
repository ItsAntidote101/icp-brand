import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendAdminReplyToUser } from '@/lib/email'

export const dynamic = 'force-dynamic'

// The buyer writes to a client. It shows in the client's dashboard chat with
// an unread badge, goes to their inbox, and closes whatever they had open.
export async function POST(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let b: { userId?: string; body?: string }
  try { b = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
  const body = (b.body ?? '').trim()
  if (!b.userId || !/^[0-9a-f-]{36}$/i.test(b.userId)) return NextResponse.json({ error: 'Pick a client' }, { status: 400 })
  if (body.length < 2)    return NextResponse.json({ error: 'Write a message first' }, { status: 400 })
  if (body.length > 3000) return NextResponse.json({ error: 'Keep the message under 3,000 characters' }, { status: 400 })

  const supabase = supabaseAdmin()
  const { data: user } = await supabase.from('users').select('id, email, full_name').eq('id', b.userId).maybeSingle()
  if (!user) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const now = new Date().toISOString()
  const { error } = await supabase.from('client_messages').insert({ user_id: user.id, direction: 'out', kind: 'message', body })
  if (error) {
    console.error('[admin/message] save error:', error.message)
    return NextResponse.json({ error: 'Could not send the message' }, { status: 500 })
  }

  // Deliver into the client's dashboard, and close their open items
  await Promise.all([
    supabase.from('chat_messages').insert({ user_id: user.id, role: 'media_buyer', content: body }),
    supabase.from('users').update({ has_unread_reply: true }).eq('id', user.id),
    supabase.from('client_messages').update({ handled_at: now }).eq('user_id', user.id).eq('direction', 'in').is('handled_at', null),
    supabase.from('escalations').update({ status: 'replied', admin_reply: body, replied_at: now }).eq('user_id', user.id).eq('status', 'pending'),
  ])

  const r = await sendAdminReplyToUser({ to: user.email, name: user.full_name ?? user.email, reply: body })
  return NextResponse.json({ success: true, emailed: !r.error })
}
