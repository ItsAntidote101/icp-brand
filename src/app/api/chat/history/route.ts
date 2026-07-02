import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'
import { getBuyerById } from '@/lib/buyers'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder',
)

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', session.email)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('id, role, content, buyer_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) {
    console.error('[chat/history] fetch error:', error.message)
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 })
  }

  const items = (messages ?? []).map(m => ({
    id: m.id,
    role: m.role,
    content: m.content,
    buyerName: getBuyerById(m.buyer_id)?.name ?? null,
    createdAt: m.created_at,
  }))

  return NextResponse.json({ messages: items })
}
