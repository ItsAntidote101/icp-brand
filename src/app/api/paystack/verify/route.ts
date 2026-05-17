import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('reference') ?? req.nextUrl.searchParams.get('trxref')

  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  const host  = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000'
  const base  = `${proto}://${host}`

  if (!reference) {
    return NextResponse.redirect(`${base}/cancel?reason=missing_reference`)
  }

  // Verify with Paystack
  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY ?? ''}`,
    },
  })

  const verifyData = await verifyRes.json()

  if (!verifyRes.ok || verifyData.data?.status !== 'success') {
    const reason = encodeURIComponent(verifyData.data?.gateway_response ?? 'payment_failed')
    return NextResponse.redirect(`${base}/cancel?reason=${reason}`)
  }

  const { email } = verifyData.data.customer
  const tier: string = verifyData.data.metadata?.tier ?? 'Starter'

  // Update Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )

  const renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  await supabase.from('users').upsert(
    {
      email,
      subscription_tier: tier.toLowerCase(),
      billing_status: 'active',
      renewal_date: renewalDate,
      paystack_reference: reference,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'email' }
  )

  const tierParam = encodeURIComponent(tier)
  return NextResponse.redirect(`${base}/success?tier=${tierParam}&ref=${reference}`)
}
