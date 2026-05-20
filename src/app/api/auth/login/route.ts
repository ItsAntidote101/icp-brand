import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email: string }
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, company_name, subscription_tier, billing_status, renewal_date, created_at')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !user) {
      return NextResponse.json({ notFound: true }, { status: 404 })
    }

    if (user.billing_status !== 'active') {
      return NextResponse.json({ inactive: true }, { status: 200 })
    }

    return NextResponse.json({ success: true, user })
  } catch (err) {
    console.error('[auth/login] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
