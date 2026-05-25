import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSubscriptionEmail, sendUpgradeToUser, sendUpgradeToFounder } from '@/lib/email'

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('reference') ?? req.nextUrl.searchParams.get('trxref')

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://idealicp.com'

  if (!reference) {
    return NextResponse.redirect(`${base}/cancel?reason=missing_reference`)
  }

  // Verify with Paystack
  let verifyData: Record<string, unknown>
  try {
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY ?? ''}`,
      },
    })
    verifyData = await verifyRes.json()

    if (!verifyRes.ok || (verifyData.data as Record<string, unknown>)?.status !== 'success') {
      const reason = encodeURIComponent(
        ((verifyData.data as Record<string, unknown>)?.gateway_response as string) ?? 'payment_failed'
      )
      return NextResponse.redirect(`${base}/cancel?reason=${reason}`)
    }
  } catch (err) {
    console.error('[verify] error calling Paystack API:', err)
    return NextResponse.redirect(`${base}/cancel?reason=paystack_unreachable`)
  }

  const txData   = verifyData.data as Record<string, unknown>
  const customer = txData.customer as { email: string }
  const metadata = txData.metadata as Record<string, string> | undefined
  const email    = customer.email
  const tier     = metadata?.tier ?? 'Starter'

  // Amount actually charged (in KES, from Paystack cents)
  const amountKes = Math.round(((txData.amount as number) ?? 0) / 100)

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    serviceKey
  )

  // Fetch existing user
  const { data: existingUser, error: lookupError } = await supabase
    .from('users')
    .select('id, full_name, company_name, renewal_date, subscription_tier')
    .eq('email', email)
    .single()

  if (lookupError && lookupError.code !== 'PGRST116') {
    console.warn('[verify] users lookup error:', lookupError)
  }

  const isUpgrade    = metadata?.is_upgrade === 'true'
  const upgradeType  = metadata?.upgrade_type as 'new_subscription' | 'proration' | undefined
  const upgradeFrom  = metadata?.upgrade_from ?? existingUser?.subscription_tier ?? 'free'

  // For proration upgrades, keep the existing renewal date unchanged.
  // For new subscriptions (including free->paid), set renewal_date = now + 30 days.
  const isProration  = isUpgrade && upgradeType === 'proration'
  const renewalDate  = isProration
    ? (metadata?.existing_renewal_date || existingUser?.renewal_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const userId = existingUser?.id ?? null

  if (isProration) {
    // Paid upgrade: update tier only, keep renewal_date as-is
    const { error: updateErr } = await supabase
      .from('users')
      .update({
        subscription_tier:  tier.toLowerCase(),
        billing_status:     'active',
        scheduled_tier:     null,
        scheduled_tier_date: null,
        paystack_reference: reference,
        updated_at:         new Date().toISOString(),
      })
      .eq('email', email)

    if (updateErr) {
      console.error('[verify] users proration upgrade error:', JSON.stringify(updateErr))
    }

    // Update subscriptions table
    if (userId) {
      await supabase
        .from('subscriptions')
        .update({ tier: tier.toLowerCase(), billing_status: 'active' })
        .eq('user_id', userId)

      // Record the upgrade payment in billing history
      await supabase
        .from('billing_history')
        .insert({
          user_id:    userId,
          date:       new Date().toISOString(),
          plan:       tier.toLowerCase(),
          amount_kes: amountKes,
          status:     'paid',
        })
    }

    // Send upgrade confirmation emails (non-blocking)
    const name = existingUser?.full_name ?? undefined
    const company = existingUser?.company_name ?? undefined
    const daysLeft = Math.max(0, Math.ceil(
      (new Date(renewalDate).getTime() - Date.now()) / 86_400_000
    ))

    Promise.allSettled([
      sendUpgradeToUser({
        to:          email,
        name:        name ?? '',
        oldTier:     upgradeFrom,
        newTier:     tier.toLowerCase(),
        topUpKes:    amountKes,
        renewalDate: renewalDate,
      }),
      sendUpgradeToFounder({
        userName:      name ?? email,
        userEmail:     email,
        companyName:   company,
        oldTier:       upgradeFrom,
        newTier:       tier.toLowerCase(),
        topUpKes:      amountKes,
        daysRemaining: daysLeft,
        renewalDate:   renewalDate,
      }),
    ]).catch(e => console.error('[verify] upgrade emails failed:', e))

    const tierParam = encodeURIComponent(tier)
    return NextResponse.redirect(`${base}/dashboard?upgrade=success&tier=${tierParam}`)
  }

  // New subscription (free->paid or first-time subscriber)
  const upsertPayload = {
    email,
    ...(existingUser?.full_name ? { full_name: existingUser.full_name } : {}),
    subscription_tier:  tier.toLowerCase(),
    billing_status:     'active',
    renewal_date:       renewalDate,
    paystack_reference: reference,
    updated_at:         new Date().toISOString(),
  }

  const { data: upsertData, error: upsertError } = await supabase
    .from('users')
    .upsert(upsertPayload, { onConflict: 'email' })
    .select('id')
    .single()

  if (upsertError) {
    console.error('[verify] users upsert error:', JSON.stringify(upsertError))
  }

  const newUserId = upsertData?.id ?? userId

  if (newUserId) {
    const subscriptionPayload = {
      user_id:        newUserId,
      tier:           tier.toLowerCase(),
      billing_status: 'active',
      renewal_date:   renewalDate,
      created_at:     new Date().toISOString(),
    }

    const { error: subError } = await supabase
      .from('subscriptions')
      .insert([subscriptionPayload])
      .select('id')
      .single()

    if (subError) {
      console.error('[verify] subscriptions insert error:', JSON.stringify(subError))
    }

    // Record in billing_history
    await supabase
      .from('billing_history')
      .insert({
        user_id:    newUserId,
        date:       new Date().toISOString(),
        plan:       tier.toLowerCase(),
        amount_kes: amountKes,
        status:     'paid',
      })
  }

  // Send subscription confirmation email (non-blocking)
  sendSubscriptionEmail({
    to:          email,
    name:        existingUser?.full_name ?? undefined,
    tier,
    renewalDate,
    baseUrl:     base,
  }).catch(e => console.error('[verify] subscription email failed:', e))

  const tierParam  = encodeURIComponent(tier)
  const emailParam = encodeURIComponent(email)
  return NextResponse.redirect(`${base}/success?email=${emailParam}&tier=${tierParam}&ref=${reference}`)
}
