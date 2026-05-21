import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPlanChangedToUser, sendPlanChangedToFounder } from '@/lib/email'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const TIER_PRICE_KES: Record<string, number> = { starter: 6500, pro: 13000, agency: 26000, free: 0 }

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { userEmail, newTier, oldTier } = await req.json()

    if (!userEmail || !newTier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (session.email !== userEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const VALID_TIERS = ['starter', 'pro', 'agency', 'free'] as const
    if (!VALID_TIERS.includes(newTier as typeof VALID_TIERS[number])) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id, full_name, company_name, renewal_date')
      .eq('email', userEmail)
      .single()

    const { error: userErr } = await supabase
      .from('users')
      .update({ subscription_tier: newTier })
      .eq('email', userEmail)

    if (userErr) console.error('[change-plan] users error:', JSON.stringify(userErr))

    const { error: subErr } = await supabase
      .from('subscriptions')
      .update({ tier: newTier })
      .eq('user_id', userData?.id)

    if (subErr) console.error('[change-plan] subscriptions error:', JSON.stringify(subErr))

    await Promise.allSettled([
      sendPlanChangedToUser({
        to: userEmail,
        name: userData?.full_name ?? '',
        newTier,
        newPriceKES: TIER_PRICE_KES[newTier] ?? 0,
        renewalDate: userData?.renewal_date,
      }),
      sendPlanChangedToFounder({
        userName: userData?.full_name ?? userEmail,
        userEmail,
        companyName: userData?.company_name,
        oldTier: oldTier ?? '—',
        newTier,
      }),
    ])

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('[change-plan] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
