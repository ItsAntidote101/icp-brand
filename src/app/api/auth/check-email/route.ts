import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let { email } = body as { email?: unknown }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    email = email.trim().toLowerCase()

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      serviceKey
    )

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, company_name, subscription_tier, billing_status, renewal_date, created_at')
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ status: 'not_found' }, { status: 404 })
      }
      console.error('[check-email] error looking up user')
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }

    if (user.billing_status !== 'active') {
      return NextResponse.json({ status: 'inactive' }, { status: 200 })
    }

    return NextResponse.json({ status: 'active', user }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
