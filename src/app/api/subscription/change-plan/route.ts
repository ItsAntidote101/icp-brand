import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sendDowngradeScheduledToUser, sendDowngradeScheduledToFounder,
} from '@/lib/email'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder',
)

const TIER_PRICE_KES: Record<string, number> = { starter: 6500, pro: 13000, agency: 26000, free: 0 }
const TIER_ORDER = ['free', 'starter', 'pro', 'agency']
const TIER_LABEL: Record<string, string> = { free: 'Free', starter: 'Starter', pro: 'Pro', agency: 'Agency' }

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function daysRemaining(renewalDate: string | null): number {
  if (!renewalDate) return 0
  const ms = new Date(renewalDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}

function proratedKes(oldTier: string, newTier: string, days: number): number {
  const diff = (TIER_PRICE_KES[newTier] ?? 0) - (TIER_PRICE_KES[oldTier] ?? 0)
  const raw  = (diff / 30) * days
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
    const renewalIso = userData?.renewal_date ?? null

    if (isUpgrade) {
      // Determine how much to charge
      let chargeKes: number
      let upgradeType: 'new_subscription' | 'proration'

      if (currentTier === 'free') {
        // No existing billing period: charge the full plan price
        chargeKes   = TIER_PRICE_KES[newTier] ?? 0
        upgradeType = 'new_subscription'
      } else {
        const topUp = proratedKes(currentTier, newTier, days)
        chargeKes   = topUp
        upgradeType = 'proration'
      }

      // If there is a charge, gate the upgrade behind a Paystack payment
      if (chargeKes > 0) {
        const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? 'https://idealicp.com'
        const callbackUrl = `${appUrl}/api/paystack/verify`

        const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY ?? ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email:        userEmail,
            amount:       chargeKes * 100, // Paystack expects amount in cents
            currency:     'KES',
            callback_url: callbackUrl,
            metadata: {
              tier:                    capitalize(newTier),
              is_upgrade:              'true',
              upgrade_from:            currentTier,
              upgrade_to:              newTier,
              upgrade_type:            upgradeType,
              existing_renewal_date:   upgradeType === 'proration' ? (renewalIso ?? '') : '',
            },
          }),
        })

        const paystackData = await paystackRes.json() as {
          status: boolean
          message?: string
          data?: { authorization_url: string; reference: string }
        }

        if (!paystackRes.ok || !paystackData.status || !paystackData.data) {
          console.error('[change-plan] Paystack init failed:', JSON.stringify(paystackData))
          return NextResponse.json({ error: 'Payment initialization failed. Please try again.' }, { status: 502 })
        }

        return NextResponse.json({
          requiresPayment:   true,
          authorization_url: paystackData.data.authorization_url,
          reference:         paystackData.data.reference,
          direction:         'upgrade',
          newTier,
          chargeKes,
        })
      }

      // chargeKes === 0: upgrade on exact renewal day, activate immediately, no charge
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

      return NextResponse.json({
        success:       true,
        direction:     'upgrade',
        newTier,
        topUpKes:      0,
        daysRemaining: days,
        renewalDate:   renewalIso,
      })
    } else {
      // Downgrade: schedule for end of current billing period, no payment needed
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
        success:       true,
        direction:     'downgrade',
        currentTier,
        newTier,
        effectiveDate,
        tierLabel:     TIER_LABEL,
      })
    }
  } catch (err) {
    console.error('[change-plan] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
