import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sendUpgradeToUser, sendUpgradeToFounder,
  sendDowngradeScheduledToUser, sendDowngradeScheduledToFounder,
} from '@/lib/email'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const TIER_PRICE_KES: Record<string, number> = { starter: 6500, pro: 13000, agency: 26000, free: 0 }
const TIER_ORDER = ['free', 'starter', 'pro', 'agency']
const TIER_LABEL: Record<string, string> = { free: 'Free', starter: 'Starter', pro: 'Pro', agency: 'Agency' }

function daysRemaining(renewalDate: string | null): number {
  if (!renewalDate) return 0
  const ms = new Date(renewalDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}

function proratedKes(oldTier: string, newTier: string, days: number): number {
  const diff = (TIER_PRICE_KES[newTier] ?? 0) - (TIER_PRICE_KES[oldTier] ?? 0)
  const raw  = (diff / 30) * days
  // Round to nearest KES 100
  return Math.round(raw / 100) * 100
}

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
      .select('id, full_name, company_name, renewal_date, subscription_tier')
      .eq('email', userEmail)
      .single()

    const currentTier = userData?.subscription_tier ?? oldTier ?? 'free'
    if (currentTier === newTier) {
      return NextResponse.json({ error: 'Already on this plan' }, { status: 400 })
    }

    const currentIdx = TIER_ORDER.indexOf(currentTier)
    const newIdx     = TIER_ORDER.indexOf(newTier)
    const isUpgrade  = newIdx > currentIdx
    const days       = daysRemaining(userData?.renewal_date ?? null)
    const topUpKes   = isUpgrade ? proratedKes(currentTier, newTier, days) : 0
    const renewalIso = userData?.renewal_date ?? null

    if (isUpgrade) {
      // Activate new tier immediately
      const { error: userErr } = await supabase
        .from('users')
        .update({ subscription_tier: newTier, scheduled_tier: null, scheduled_tier_date: null })
        .eq('email', userEmail)
      if (userErr) console.error('[change-plan] users upgrade error:', JSON.stringify(userErr))

      const { error: subErr } = await supabase
        .from('subscriptions')
        .update({ tier: newTier })
        .eq('user_id', userData?.id)
      if (subErr) console.error('[change-plan] subscriptions upgrade error:', JSON.stringify(subErr))

      // Log prorated amount owed in billing history
      if (topUpKes > 0 && userData?.id) {
        const { error: bhErr } = await supabase
          .from('billing_history')
          .insert({
            user_id:    userData.id,
            date:       new Date().toISOString(),
            plan:       newTier,
            amount_kes: topUpKes,
            status:     'proration_due',
          })
        if (bhErr) console.error('[change-plan] billing_history proration error:', JSON.stringify(bhErr))
      }

      await Promise.allSettled([
        sendUpgradeToUser({
          to: userEmail,
          name: userData?.full_name ?? '',
          oldTier: currentTier,
          newTier,
          topUpKes,
          renewalDate: renewalIso,
        }),
        sendUpgradeToFounder({
          userName: userData?.full_name ?? userEmail,
          userEmail,
          companyName: userData?.company_name,
          oldTier: currentTier,
          newTier,
          topUpKes,
          daysRemaining: days,
          renewalDate: renewalIso,
        }),
      ])

      return NextResponse.json({
        success: true,
        direction: 'upgrade',
        newTier,
        topUpKes,
        daysRemaining: days,
        renewalDate: renewalIso,
      })
    } else {
      // Downgrade: schedule for end of current billing period
      const effectiveDate = renewalIso ?? new Date(Date.now() + 30 * 86_400_000).toISOString()

      const { error: userErr } = await supabase
        .from('users')
        .update({ scheduled_tier: newTier, scheduled_tier_date: effectiveDate })
        .eq('email', userEmail)
      if (userErr) console.error('[change-plan] users downgrade error:', JSON.stringify(userErr))

      await Promise.allSettled([
        sendDowngradeScheduledToUser({
          to: userEmail,
          name: userData?.full_name ?? '',
          currentTier,
          newTier,
          effectiveDate,
        }),
        sendDowngradeScheduledToFounder({
          userName: userData?.full_name ?? userEmail,
          userEmail,
          companyName: userData?.company_name,
          currentTier,
          newTier,
          effectiveDate,
        }),
      ])

      return NextResponse.json({
        success: true,
        direction: 'downgrade',
        currentTier,
        newTier,
        effectiveDate,
      })
    }
  } catch (err) {
    console.error('[change-plan] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
