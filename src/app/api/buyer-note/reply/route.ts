import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendNoteReplyToFounder } from '@/lib/email'

export const dynamic = 'force-dynamic'

// A client replies to their note. It goes to the buyer's inbox, with the
// client's address as reply-to, so the conversation carries on by email.
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let b: { noteId?: string; message?: string }
  try { b = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
  const message = (b.message ?? '').trim()
  if (message.length < 2)    return NextResponse.json({ error: 'Write a reply first' }, { status: 400 })
  if (message.length > 2000) return NextResponse.json({ error: 'Keep your reply under 2,000 characters' }, { status: 400 })

  const supabase = supabaseAdmin()
  const { data: note } = await supabase
    .from('buyer_notes').select('id, body').eq('id', b.noteId ?? '').eq('user_id', session.userId).eq('status', 'sent').maybeSingle()
  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

  const { data: user } = await supabase.from('users').select('email, full_name, company_name, subscription_tier').eq('id', session.userId).maybeSingle()
  if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const r = await sendNoteReplyToFounder({
    userName: user.full_name ?? '', userEmail: user.email, companyName: user.company_name ?? '',
    tier: user.subscription_tier, message, noteBody: note.body,
  })
  if (r.error) return NextResponse.json({ error: 'Could not send your reply. Please try again.' }, { status: 502 })
  return NextResponse.json({ success: true })
}
