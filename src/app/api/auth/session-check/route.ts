import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ loggedIn: false })

  const { data: user } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('email', session.email)
    .single()

  return NextResponse.json({
    loggedIn: true,
    email: session.email,
    name: user?.full_name ?? null,
  })
}
