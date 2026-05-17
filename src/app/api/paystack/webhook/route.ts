import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  console.log('[webhook] received event — body length:', rawBody.length)

  // Verify Paystack HMAC signature
  const signature = req.headers.get('x-paystack-signature') ?? ''
  const expected  = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY ?? '')
    .update(rawBody)
    .digest('hex')

  if (signature !== expected) {
    console.warn('[webhook] invalid signature — received:', signature, '| expected:', expected)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  console.log('[webhook] signature verified')

  const event = JSON.parse(rawBody) as {
    event: string
    data: Record<string, unknown>
  }

  console.log('[webhook] event type:', event.event)
  console.log('[webhook] event data:', JSON.stringify(event.data, null, 2))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const supabase = createClient(supabaseUrl, supabaseKey)

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

    console.log('[webhook] charge.success — upserting users table:', JSON.stringify(upsertPayload, null, 2))

    const { data: upsertData, error: upsertError } = await supabase
      .from('users')
      .upsert(upsertPayload, { onConflict: 'email' })
      .select()

    if (upsertError) {
      console.error('[webhook] charge.success Supabase upsert error:', upsertError)
    } else {
      console.log('[webhook] charge.success Supabase upsert success:', JSON.stringify(upsertData, null, 2))
    }
  }

  if (event.event === 'subscription.disable') {
    const data = event.data as {
      customer: { email: string }
    }

    const email = data.customer.email
    console.log('[webhook] subscription.disable — setting billing_status=inactive for:', email)

    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ billing_status: 'inactive', updated_at: new Date().toISOString() })
      .eq('email', email)
      .select()

    if (updateError) {
      console.error('[webhook] subscription.disable Supabase update error:', updateError)
    } else {
      console.log('[webhook] subscription.disable Supabase update success:', JSON.stringify(updateData, null, 2))
    }
  }

  console.log('[webhook] done — returning 200')
  return NextResponse.json({ received: true })
}
