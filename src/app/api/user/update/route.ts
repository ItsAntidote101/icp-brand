import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    full_name?: string
    company_name?: string
    avatar_url?: string
  }

  const allowed: Record<string, string | null> = {}
  if ('full_name'    in body) allowed.full_name    = body.full_name    ?? null
  if ('company_name' in body) allowed.company_name = body.company_name ?? null
  if ('avatar_url'   in body) allowed.avatar_url   = body.avatar_url   ?? null

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('users')
    .update(allowed)
    .eq('email', session.email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
