import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email')
    if (!email) return NextResponse.json({ payments: [] }, { status: 200 })

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (!userData?.id) return NextResponse.json({ payments: [] }, { status: 200 })

    const { data: payments, error } = await supabase
      .from('billing_history')
      .select('id, date, plan, amount_kes, status, invoice_url')
      .eq('user_id', userData.id)
      .order('date', { ascending: false })

    if (error) {
      console.error('[billing-history] query error:', JSON.stringify(error))
      return NextResponse.json({ payments: [] }, { status: 200 })
    }

    return NextResponse.json({ payments: payments ?? [] }, { status: 200 })
  } catch (err) {
    console.error('[billing-history] unexpected error:', err)
    return NextResponse.json({ payments: [] }, { status: 200 })
  }
}
