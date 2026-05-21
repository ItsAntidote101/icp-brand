import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { field } = await req.json() as { field: 'intelligence' | 'overview' }
  const col = field === 'intelligence' ? 'last_seen_intelligence_at' : 'last_seen_overview_at'

  await supabase.from('users').update({ [col]: new Date().toISOString() }).eq('email', session.email)
  return NextResponse.json({ ok: true })
}
