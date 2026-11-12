import { SupabaseClient } from '@supabase/supabase-js'
import { sendSubscriptionEmail, sendUpgradeToUser, sendUpgradeToFounder } from '@/lib/email'
import { recordFunnelEvent } from '@/lib/funnel'
import type { PaymentRow } from '@/lib/payments'

/**
 * Applies a claimed payment: updates the user, subscription and billing
 * history, and sends the confirmation emails. Called by whichever of
 * /api/paystack/verify or the Paystack webhook claims the payment first,
 * so the customer gets the same result either way.
 */
export async function activatePayment(
  supabase: SupabaseClient,
  payment: PaymentRow,
  amountKes: number,
  baseUrl: string,
  via: 'verify' | 'webhook',
): Promise<void> {
  const email     = payment.email
  const tier      = payment.tier.charAt(0).toUpperCase() + payment.tier.slice(1)
  const metadata  = payment.meta ?? {}
  const reference = payment.reference

  await recordFunnelEvent(supabase, { event: 'paid', meta: { tier: payment.tier, kind: payment.kind, amountKes, reference, via } })

  const { data: existingUser, error: lookupError } = await supabase
    .from('users')
    .select('id, full_name, company_name, renewal_date, subscription_tier')
    .eq('email', email)
    .maybeSingle()
  if (lookupError) console.warn('[activate] users lookup error:', lookupError.message)

  const upgradeFrom = metadata.upgrade_from || existingUser?.subscription_tier || 'free'
  const isProration = payment.kind === 'proration'
  // Renewing early adds 30 days to the current paid period instead of
  // throwing away the days the customer already paid for.
  const MONTH_MS = 30 * 24 * 60 * 60 * 1000
  const currentEnd = existingUser?.renewal_date && existingUser.subscription_tier && existingUser.subscription_tier !== 'free'
    ? new Date(existingUser.renewal_date).getTime()
    : 0
  const renewalDate = isProration
    ? (metadata.existing_renewal_date || existingUser?.renewal_date || new Date(Date.now() + MONTH_MS).toISOString())
    : new Date(Math.max(Date.now(), currentEnd) + MONTH_MS).toISOString()

  if (isProration) {
    // Paid upgrade: change tier only, keep the renewal date
    const { error: updateErr } = await supabase
      .from('users')
      .update({
        subscription_tier:   tier.toLowerCase(),
        billing_status:      'active',
        scheduled_tier:      null,
        scheduled_tier_date: null,
        paystack_reference:  reference,
        updated_at:          new Date().toISOString(),
      })
      .eq('email', email)
    if (updateErr) console.error('[activate] proration update error:', JSON.stringify(updateErr))

    if (existingUser?.id) {
      await supabase.from('subscriptions').update({ tier: tier.toLowerCase(), billing_status: 'active' }).eq('user_id', existingUser.id)
      await supabase.from('billing_history').insert({
        user_id: existingUser.id, date: new Date().toISOString(), plan: tier.toLowerCase(), amount_kes: amountKes, status: 'paid',
      })
    }

    const name = existingUser?.full_name ?? ''
    const daysLeft = Math.max(0, Math.ceil((new Date(renewalDate).getTime() - Date.now()) / 86_400_000))
    const results = await Promise.allSettled([
      sendUpgradeToUser({ to: email, name, oldTier: upgradeFrom, newTier: tier.toLowerCase(), topUpKes: amountKes, renewalDate }),
      sendUpgradeToFounder({
        userName: name || email, userEmail: email, companyName: existingUser?.company_name ?? undefined,
        oldTier: upgradeFrom, newTier: tier.toLowerCase(), topUpKes: amountKes, daysRemaining: daysLeft, renewalDate,
      }),
    ])
    results.forEach(r => { if (r.status === 'rejected') console.error('[activate] upgrade email failed:', r.reason) })
    return
  }

  // New subscription (free -> paid or first-time subscriber)
  const { data: upsertData, error: upsertError } = await supabase
    .from('users')
    .upsert({
      email,
      ...(existingUser?.full_name ? { full_name: existingUser.full_name } : {}),
      subscription_tier:  tier.toLowerCase(),
      billing_status:     'active',
      renewal_date:       renewalDate,
      cancelled_at:       null,
      paused_until:       null,
      paystack_reference: reference,
      updated_at:         new Date().toISOString(),
    }, { onConflict: 'email' })
    .select('id')
    .single()
  if (upsertError) console.error('[activate] users upsert error:', JSON.stringify(upsertError))

  const userId = upsertData?.id ?? existingUser?.id ?? null
  if (userId) {
    const { error: subError } = await supabase.from('subscriptions').insert({
      user_id: userId, tier: tier.toLowerCase(), billing_status: 'active', renewal_date: renewalDate, created_at: new Date().toISOString(),
    })
    if (subError) console.error('[activate] subscriptions insert error:', JSON.stringify(subError))
    await supabase.from('billing_history').insert({
      user_id: userId, date: new Date().toISOString(), plan: tier.toLowerCase(), amount_kes: amountKes, status: 'paid',
    })
  }

  try {
    await sendSubscriptionEmail({ to: email, name: existingUser?.full_name ?? undefined, tier, renewalDate, baseUrl })
  } catch (e) {
    console.error('[activate] subscription email failed:', e)
  }
}

/** Where to send the customer after payment, with what the purchase event needs. */
export function paymentReturnPath(payment: Pick<PaymentRow, 'reference' | 'email' | 'tier' | 'kind'>, amountKes: number): string {
  const tier = payment.tier.charAt(0).toUpperCase() + payment.tier.slice(1)
  const ref  = encodeURIComponent(payment.reference)
  if (payment.kind === 'proration') {
    return `/dashboard?upgrade=success&tier=${encodeURIComponent(tier)}&ref=${ref}&amount=${amountKes}`
  }
  return `/success?email=${encodeURIComponent(payment.email)}&tier=${encodeURIComponent(tier)}&ref=${ref}`
}
