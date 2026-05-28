import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession, clearSessionCookie } from '@/lib/session'

export const dynamic = 'force-dynamic'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder',
)

export async function DELETE() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Delete reports first (FK constraint), then the user row
  await db.from('reports').delete().eq('user_email', session.email)
  const { error } = await db.from('users').delete().eq('email', session.email)

  if (error) {
    console.error('[account/delete] error:', error.message)
    return NextResponse.json({ error: 'Could not delete account. Please contact support@idealicp.com.' }, { status: 500 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set(clearSessionCookie())
  return res
}
