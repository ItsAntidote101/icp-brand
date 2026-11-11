import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const supabase = supabaseAdmin()

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const email = req.nextUrl.searchParams.get('email')
    if (!email) return NextResponse.json({ payments: [] }, { status: 200 })
    if (session.email !== email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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
