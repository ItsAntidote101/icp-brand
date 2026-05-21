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

  let event: { event: string; data: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody) as { event: string; data: Record<string, unknown> }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    serviceKey
  )

  if (event.event === 'charge.success') {
    const data = event.data as {
      reference: string
      metadata?: { tier?: string }
      customer: { email: string }
    }

    const email = data.customer.email
    const tier  = data.metadata?.tier ?? 'starter'
    const renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const upsertPayload = {
      email,
      subscription_tier:  tier.toLowerCase(),
      billing_status:     'active',
      renewal_date:       renewalDate,
      paystack_reference: data.reference,
      updated_at:         new Date().toISOString(),
    }

    const { error: upsertError } = await supabase
      .from('users')
      .upsert(upsertPayload, { onConflict: 'email' })
      .select()

    if (upsertError) {
      console.error('[webhook] charge.success Supabase upsert error:', upsertError)
    }
  }

  if (event.event === 'subscription.disable') {
    const data = event.data as {
      customer: { email: string }
    }

    const email = data.customer.email

    const { error: updateError } = await supabase
      .from('users')
      .update({ billing_status: 'inactive', updated_at: new Date().toISOString() })
      .eq('email', email)
      .select()

    if (updateError) {
      console.error('[webhook] subscription.disable Supabase update error:', updateError)
    }
  }

  return NextResponse.json({ received: true })
}
