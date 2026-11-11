import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const supabase = supabaseAdmin()

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ loggedIn: false })

  const { data: user } = await supabase
    .from('users')
    .select('full_name, email, subscription_tier')
    .eq('email', session.email)
    .single()

  return NextResponse.json({
    loggedIn: true,
    email: session.email,
    name: user?.full_name ?? null,
    tier: user?.subscription_tier ?? 'free',
  })
}
