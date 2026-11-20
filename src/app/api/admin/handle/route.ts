import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// Mark something as dealt with, without sending anything (for example a call
// request you handled on WhatsApp).
export async function POST(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let b: { type?: string; id?: string }
  try { b = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
  if (!b.id || !/^[0-9a-f-]{36}$/i.test(b.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const supabase = supabaseAdmin()
  const now = new Date().toISOString()
  const q = b.type === 'call'       ? supabase.from('session_requests').update({ status: 'handled' }).eq('id', b.id)
          : b.type === 'message'    ? supabase.from('client_messages').update({ handled_at: now }).eq('id', b.id)
          : b.type === 'escalation' ? supabase.from('escalations').update({ status: 'closed' }).eq('id', b.id)
          : null
  if (!q) return NextResponse.json({ error: 'Unknown item' }, { status: 400 })
  const { error } = await q
  if (error) return NextResponse.json({ error: 'Could not update that' }, { status: 500 })
  return NextResponse.json({ success: true })
}
