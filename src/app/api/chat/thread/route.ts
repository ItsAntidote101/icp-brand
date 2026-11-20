import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getVerifiedSession } from '@/lib/session'
import { sendClientMessageToFounder } from '@/lib/email'

export const dynamic = 'force-dynamic'
const DAILY_LIMIT = 20

// The client's side of their conversation with the media buyer.
// GET  the last messages in both directions, shown in the dashboard chat
// POST a message to the buyer; it lands in the control room and his inbox
export async function GET() {
  const session = await getVerifiedSession()
  if (!session) return NextResponse.json({ messages: [] })
  const { data } = await supabaseAdmin()
    .from('client_messages')
    .select('id, direction, body, created_at')
    .eq('user_id', session.userId)
    .order('created_at', { ascending: false })
    .limit(30)
  const messages = (data ?? []).reverse().map(m => ({ id: m.id, from: m.direction === 'out' ? 'buyer' : 'client', body: m.body, at: m.created_at }))
  return NextResponse.json({ messages })
}

export async function POST(req: NextRequest) {
  const session = await getVerifiedSession()
  if (!session) return NextResponse.json({ error: 'Log in again to message Eugene.' }, { status: 401 })
  let b: { message?: unknown }
  try { b = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
  const message = typeof b.message === 'string' ? b.message.trim() : ''
  if (message.length < 2)    return NextResponse.json({ error: 'Write a message first.' }, { status: 400 })
  if (message.length > 3000) return NextResponse.json({ error: 'Keep the message under 3,000 characters.' }, { status: 400 })

  const supabase = supabaseAdmin()
  const { data: user } = await supabase.from('users').select('id, email, full_name, company_name, subscription_tier, billing_status').eq('id', session.userId).maybeSingle()
  if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 })
  if (user.subscription_tier === 'free' || user.billing_status !== 'active')
    return NextResponse.json({ error: 'Messaging Eugene is included from the Starter plan.' }, { status: 403 })

  const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0)
  const { count } = await supabase.from('client_messages').select('id', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('direction', 'in').gte('created_at', dayStart.toISOString())
  if ((count ?? 0) >= DAILY_LIMIT) return NextResponse.json({ error: 'That is a lot of messages for one day. Eugene has them and will reply.' }, { status: 429 })

  const { error } = await supabase.from('client_messages').insert({ user_id: user.id, direction: 'in', kind: 'message', body: message })
  if (error) {
    console.error('[chat/thread] save error:', error.message)
    return NextResponse.json({ error: 'Could not send that. Please try again.' }, { status: 500 })
  }
  // The control room already has it; the email is a nudge and must not fail the send
  try {
    await sendClientMessageToFounder({ userName: user.full_name ?? '', userEmail: user.email, companyName: user.company_name ?? '', tier: user.subscription_tier, message })
  } catch (err) { console.error('[chat/thread] email error:', err) }
  return NextResponse.json({ success: true })
}
