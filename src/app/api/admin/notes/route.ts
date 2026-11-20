import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { clientSnapshot } from '@/lib/client-snapshot'
import { sendBuyerNoteEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'
const DAY_MS = 86_400_000

// Every paid client with what the buyer needs to write their monthly note.
export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = supabaseAdmin()

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, full_name, company_name, subscription_tier, renewal_date, cancelled_at, total_fixes_completed')
    .eq('billing_status', 'active')
    .neq('subscription_tier', 'free')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (users ?? []).map(u => u.id)
  const { data: notes } = ids.length
    ? await supabase.from('buyer_notes').select('id, user_id, body, media_url, status, sent_at, read_at, updated_at').in('user_id', ids).order('updated_at', { ascending: false })
    : { data: [] }

  const clients = await Promise.all((users ?? []).map(async u => {
    const mine     = (notes ?? []).filter(n => n.user_id === u.id)
    const lastSent = mine.filter(n => n.status === 'sent').sort((a, b) => (b.sent_at ?? '').localeCompare(a.sent_at ?? ''))[0] ?? null
    const draft    = mine.find(n => n.status === 'draft') ?? null
    const renewsIn = u.renewal_date ? Math.ceil((new Date(u.renewal_date).getTime() - Date.now()) / DAY_MS) : null
    return {
      id: u.id, email: u.email, name: u.full_name, company: u.company_name, tier: u.subscription_tier,
      renewsIn, cancelled: !!u.cancelled_at,
      snapshot: await clientSnapshot(supabase, u.id, u.total_fixes_completed ?? 0),
      lastSent: lastSent ? { sent_at: lastSent.sent_at, read_at: lastSent.read_at, body: lastSent.body } : null,
      draft: draft ? { body: draft.body, media_url: draft.media_url } : null,
      due: !lastSent || Date.now() - new Date(lastSent.sent_at ?? 0).getTime() > 28 * DAY_MS,
    }
  }))

  // Due first, then whoever renews soonest: a note the week before renewal matters most.
  clients.sort((a, b) => Number(b.due) - Number(a.due) || (a.renewsIn ?? 999) - (b.renewsIn ?? 999))
  return NextResponse.json({ clients })
}

// Save a draft, or send the note to the client.
export async function POST(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = supabaseAdmin()

  let b: { userId?: string; body?: string; mediaUrl?: string; action?: string }
  try { b = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
  const body = (b.body ?? '').trim()
  if (!b.userId || !/^[0-9a-f-]{36}$/i.test(b.userId)) return NextResponse.json({ error: 'Pick a client' }, { status: 400 })
  if (body.length < 20)   return NextResponse.json({ error: 'The note is too short to send' }, { status: 400 })
  if (body.length > 2000) return NextResponse.json({ error: 'Keep the note under 2,000 characters' }, { status: 400 })

  let media_url: string | null = null
  if (b.mediaUrl?.trim()) {
    try {
      const u = new URL(b.mediaUrl.trim())
      if (u.protocol !== 'https:') throw new Error()
      media_url = u.toString()
    } catch { return NextResponse.json({ error: 'The video or voice link must start with https://' }, { status: 400 }) }
  }

  const { data: user } = await supabase.from('users').select('id, email, full_name, subscription_tier').eq('id', b.userId).maybeSingle()
  if (!user) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const send = b.action === 'send'
  const now  = new Date().toISOString()
  const { data: existing } = await supabase.from('buyer_notes').select('id').eq('user_id', user.id).eq('status', 'draft').order('updated_at', { ascending: false }).limit(1).maybeSingle()
  const row = { user_id: user.id, body, media_url, status: send ? 'sent' : 'draft', sent_at: send ? now : null, updated_at: now }
  const { error } = existing
    ? await supabase.from('buyer_notes').update(row).eq('id', existing.id)
    : await supabase.from('buyer_notes').insert(row)
  if (error) {
    console.error('[admin/notes] save error:', error.message)
    return NextResponse.json({ error: 'Could not save the note' }, { status: 500 })
  }

  let emailed = false
  if (send) {
    const r = await sendBuyerNoteEmail({ to: user.email, name: user.full_name ?? undefined, body, hasMedia: !!media_url, baseUrl: process.env.NEXT_PUBLIC_APP_URL })
    emailed = !r.error
  }
  return NextResponse.json({ success: true, sent: send, emailed })
}
