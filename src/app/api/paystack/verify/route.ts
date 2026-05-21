import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSubscriptionEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('reference') ?? req.nextUrl.searchParams.get('trxref')

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://icpbrand.co'

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

  const data = verifyData.data as Record<string, unknown>
  const customer = data.customer as { email: string }
  const metadata = data.metadata as Record<string, string> | undefined
  const email = customer.email
  const tier  = metadata?.tier ?? 'Starter'

  // Update Supabase
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    serviceKey
  )

  // Fetch existing user to preserve name and get id
  const { data: existingUser, error: lookupError } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('email', email)
    .single()

  if (lookupError && lookupError.code !== 'PGRST116') {
    console.warn('[verify] users lookup error:', lookupError)
  }

  const renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
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

  // ── Write to subscriptions table ───────────────────────────────────────
  const userId = upsertData?.id ?? existingUser?.id ?? null

  if (userId) {
    const subscriptionPayload = {
      user_id:        userId,
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
  }

  // ── Fire subscription confirmation email (non-blocking) ──────────────────
  if (renewalDate) {
    sendSubscriptionEmail({
      to: email,
      name: existingUser?.full_name ?? undefined,
      tier,
      renewalDate,
      baseUrl: base,
    }).catch(e => console.error('[verify] subscription email failed:', e))
  }

  const tierParam  = encodeURIComponent(tier)
  const emailParam = encodeURIComponent(email)
  return NextResponse.redirect(`${base}/success?email=${emailParam}&tier=${tierParam}&ref=${reference}`)
}
