import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder',
)

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('users').update({ has_unread_reply: false }).eq('email', session.email)
  return NextResponse.json({ ok: true })
}
