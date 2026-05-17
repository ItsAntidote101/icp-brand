import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Verify Paystack HMAC signature
  const signature = req.headers.get('x-paystack-signature') ?? ''
  const expected  = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY ?? '')
    .update(rawBody)
    .digest('hex')

  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody) as {
    event: string
    data: Record<string, unknown>
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )

  if (event.event === 'charge.success') {
    const data = event.data as {
      reference: string
      metadata?: { tier?: string; currency?: string }
      customer: { email: string }
    }

    const email = data.customer.email
    const tier  = data.metadata?.tier ?? 'starter'
    const renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    await supabase.from('users').upsert(
      {
        email,
        subscription_tier: tier.toLowerCase(),
        billing_status: 'active',
        renewal_date: renewalDate,
        paystack_reference: data.reference,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    )
  }

  if (event.event === 'subscription.disable') {
    const data = event.data as {
      customer: { email: string }
    }

    await supabase
      .from('users')
      .update({ billing_status: 'inactive', updated_at: new Date().toISOString() })
      .eq('email', data.customer.email)
  }

  return NextResponse.json({ received: true })
}
