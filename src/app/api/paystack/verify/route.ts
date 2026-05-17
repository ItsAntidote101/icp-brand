import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSubscriptionEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('reference') ?? req.nextUrl.searchParams.get('trxref')

  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  const host  = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000'
  const base  = `${proto}://${host}`

  console.log('[verify] received reference:', reference)

  if (!reference) {
    console.log('[verify] no reference found in query params — redirecting to /cancel')
    return NextResponse.redirect(`${base}/cancel?reason=missing_reference`)
  }

  // Verify with Paystack
  console.log('[verify] calling Paystack verify API for reference:', reference)
  let verifyData: Record<string, unknown>
  try {
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY ?? ''}`,
      },
    })
    verifyData = await verifyRes.json()
    console.log('[verify] Paystack response status:', verifyRes.status)
    console.log('[verify] Paystack response body:', JSON.stringify(verifyData, null, 2))

    if (!verifyRes.ok || (verifyData.data as Record<string, unknown>)?.status !== 'success') {
      const reason = encodeURIComponent(
        ((verifyData.data as Record<string, unknown>)?.gateway_response as string) ?? 'payment_failed'
      )
      console.log('[verify] payment not successful — gateway_response:', reason)
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

  console.log('[verify] payment confirmed — email:', email, '| tier:', tier)

  // Update Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )

  // Fetch existing user to preserve name and get id
  const { data: existingUser, error: lookupError } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('email', email)
    .single()

  if (lookupError && lookupError.code !== 'PGRST116') {
    console.warn('[verify] users lookup error:', lookupError)
  } else {
    console.log('[verify] existing user id:', existingUser?.id ?? '(none)', '| full_name:', existingUser?.full_name ?? '(none)')
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

  console.log('[verify] upserting to users table:', JSON.stringify(upsertPayload, null, 2))

  const { data: upsertData, error: upsertError } = await supabase
    .from('users')
    .upsert(upsertPayload, { onConflict: 'email' })
    .select('id')
    .single()

  if (upsertError) {
    console.error('[verify] users upsert error:', JSON.stringify(upsertError))
  } else {
    console.log('[verify] users upsert success — id:', upsertData?.id)
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

    console.log('[verify] inserting to subscriptions table:', JSON.stringify(subscriptionPayload, null, 2))

    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .insert([subscriptionPayload])
      .select('id')
      .single()

    if (subError) {
      console.error('[verify] subscriptions insert error:', JSON.stringify(subError))
    } else {
      console.log('[verify] subscriptions insert success — id:', subData?.id)
    }
  } else {
    console.warn('[verify] no user_id available — skipping subscriptions insert')
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

  const tierParam = encodeURIComponent(tier)
  console.log('[verify] redirecting to /success — tier:', tier, '| ref:', reference)
  return NextResponse.redirect(`${base}/success?tier=${tierParam}&ref=${reference}`)
}
