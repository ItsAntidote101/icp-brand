import type { SupabaseClient } from '@supabase/supabase-js'

// Everything a client and the media buyer have said to each other, from every
// place it can start (call request, chat escalation, note, reply), as one
// conversation in time order.
export type ThreadItem = {
  key: string
  at: string
  from: 'client' | 'eugene'
  kind: 'message' | 'note_reply' | 'call' | 'escalation' | 'note' | 'reply'
  label: string                 // short description of what this is
  body: string
  open: boolean                 // still needs the buyer
  ref?: { type: 'call' | 'message' | 'escalation'; id: string }
}

type CallRow  = { id: string; user_email: string; session_format: string | null; preferred_time: string | null; additional_notes: string | null; status: string | null; created_at: string }
type EscRow   = { id: string; user_id: string; urgency: string | null; user_note: string | null; status: string | null; admin_reply: string | null; replied_at: string | null; created_at: string }
type MsgRow   = { id: string; user_id: string; direction: string; kind: string; body: string; created_at: string; handled_at: string | null }
type NoteRow  = { id: string; user_id: string; body: string; sent_at: string | null; status: string }

export const callItem = (c: CallRow): ThreadItem => ({
  key: `call-${c.id}`, at: c.created_at, from: 'client', kind: 'call',
  label: c.session_format || 'Call request',
  body: [c.preferred_time ? `Best time: ${c.preferred_time}` : '', c.additional_notes ?? ''].filter(Boolean).join('\n'),
  open: (c.status ?? 'pending') === 'pending',
  ref: { type: 'call', id: c.id },
})

export const escalationItems = (e: EscRow): ThreadItem[] => {
  const out: ThreadItem[] = [{
    key: `esc-${e.id}`, at: e.created_at, from: 'client', kind: 'escalation',
    label: `Asked for you in chat${e.urgency ? ` (${e.urgency})` : ''}`,
    body: e.user_note || 'No note added.',
    open: (e.status ?? 'pending') === 'pending',
    ref: { type: 'escalation', id: e.id },
  }]
  if (e.admin_reply && e.replied_at) out.push({ key: `escr-${e.id}`, at: e.replied_at, from: 'eugene', kind: 'reply', label: 'Your reply', body: e.admin_reply, open: false })
  return out
}

export const messageItem = (m: MsgRow): ThreadItem => m.direction === 'in'
  ? { key: `msg-${m.id}`, at: m.created_at, from: 'client', kind: m.kind === 'note_reply' ? 'note_reply' : 'message', label: m.kind === 'note_reply' ? 'Replied to your note' : 'Message', body: m.body, open: !m.handled_at, ref: { type: 'message', id: m.id } }
  : { key: `msg-${m.id}`, at: m.created_at, from: 'eugene', kind: 'reply', label: 'Your message', body: m.body, open: false }

export const noteItem = (n: NoteRow): ThreadItem => ({
  key: `note-${n.id}`, at: n.sent_at ?? '', from: 'eugene', kind: 'note', label: 'Monthly note', body: n.body, open: false,
})

export async function clientThread(supabase: SupabaseClient, user: { id: string; email: string }): Promise<ThreadItem[]> {
  const [calls, escs, msgs, notes] = await Promise.all([
    supabase.from('session_requests').select('id, user_email, session_format, preferred_time, additional_notes, status, created_at').eq('user_email', user.email).order('created_at', { ascending: false }).limit(30),
    supabase.from('escalations').select('id, user_id, urgency, user_note, status, admin_reply, replied_at, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    supabase.from('client_messages').select('id, user_id, direction, kind, body, created_at, handled_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(60),
    supabase.from('buyer_notes').select('id, user_id, body, sent_at, status').eq('user_id', user.id).eq('status', 'sent').order('sent_at', { ascending: false }).limit(12),
  ])
  return [
    ...((calls.data ?? []) as CallRow[]).map(callItem),
    ...((escs.data ?? []) as EscRow[]).flatMap(escalationItems),
    ...((msgs.data ?? []) as MsgRow[]).map(messageItem),
    ...((notes.data ?? []) as NoteRow[]).map(noteItem),
  ].filter(i => i.at).sort((a, b) => a.at.localeCompare(b.at))
}
