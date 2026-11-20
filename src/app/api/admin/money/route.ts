import { NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildMoney } from '@/lib/admin-business'

export const dynamic = 'force-dynamic'
const DAY_MS = 86_400_000

// What came in, what is due, and who slipped away. Read only.
export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = supabaseAdmin()
  const now = Date.now()

  const [payQ, usersQ] = await Promise.all([
    supabase.from('paystack_payments')
      .select('reference, email, tier, kind, status, paid_amount, expected_amount, created_at, paid_at')
      .gte('created_at', new Date(now - 400 * DAY_MS).toISOString())
      .order('created_at', { ascending: false }).limit(3000),
    supabase.from('users')
      .select('id, email, full_name, company_name, subscription_tier, billing_status, renewal_date, cancelled_at')
      .limit(2000),
  ])
  if (payQ.error) return NextResponse.json({ error: payQ.error.message }, { status: 500 })

  return NextResponse.json({
    testMode: (process.env.PAYSTACK_SECRET_KEY ?? '').startsWith('sk_test'),
    ...buildMoney(payQ.data ?? [], usersQ.data ?? [], now),
  })
}
