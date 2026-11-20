import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// The buyer's private notes about a client. Clients never see these.
export async function POST(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let b: { userId?: string; body?: string }
  try { b = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
  if (!b.userId || !/^[0-9a-f-]{36}$/i.test(b.userId)) return NextResponse.json({ error: 'Pick a client' }, { status: 400 })
  const body = (b.body ?? '').slice(0, 5000)
  const { error } = await supabaseAdmin().from('admin_client_notes').upsert({ user_id: b.userId, body, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) return NextResponse.json({ error: 'Could not save' }, { status: 500 })
  return NextResponse.json({ success: true })
}
