import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { email } = await req.json() as { email: string }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )

  console.log('[check-email] looking up email:', email)

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, full_name, company_name, subscription_tier, billing_status, renewal_date, created_at')
    .eq('email', email)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ status: 'not_found' }, { status: 404 })
    }
    console.error('[check-email] error looking up user:', JSON.stringify(error))
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('[check-email] found user — billing_status:', user.billing_status)

  if (user.billing_status !== 'active') {
    return NextResponse.json({ status: 'inactive' }, { status: 200 })
  }

  return NextResponse.json({ status: 'active', user }, { status: 200 })
}
