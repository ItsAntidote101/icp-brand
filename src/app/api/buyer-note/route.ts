import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
const DAY_MS = 86_400_000

// The client's most recent note from their media buyer (sent in the last 35 days).
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = supabaseAdmin()

  const { data: note } = await supabase
    .from('buyer_notes')
    .select('id, body, media_url, sent_at, read_at')
    .eq('user_id', session.userId)
    .eq('status', 'sent')
    .gte('sent_at', new Date(Date.now() - 35 * DAY_MS).toISOString())
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (note && !note.read_at) {
    await supabase.from('buyer_notes').update({ read_at: new Date().toISOString() }).eq('id', note.id)
  }
  return NextResponse.json({ note: note ? { id: note.id, body: note.body, media_url: note.media_url, sent_at: note.sent_at } : null })
}
