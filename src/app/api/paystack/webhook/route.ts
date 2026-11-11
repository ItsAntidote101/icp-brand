import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { claimPayment } from '@/lib/payments'
import { activatePayment } from '@/lib/activate-payment'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Verify Paystack HMAC signature
  const signature = req.headers.get('x-paystack-signature') ?? ''
  const expected  = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY ?? '')
    .update(rawBody)
    .digest('hex')

  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)
  if (!process.env.PAYSTACK_SECRET_KEY || sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
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
    // Backup path for when the customer closes the tab before /verify runs.
    // claimPayment makes sure each payment is applied once, at the amount and
    // tier we recorded, whichever of /verify or this webhook arrives first.
    const data = event.data as {
      reference: string
      amount: number
      currency: string
      customer: { email: string }
    }

    const claim = await claimPayment(supabase, {
      reference: data.reference,
      amount:    data.amount,
      currency:  data.currency,
      email:     data.customer?.email ?? '',
    })

    if (claim.ok) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://idealicp.com'
      await activatePayment(supabase, claim.row, Math.round(data.amount / 100), appUrl, 'webhook')
    } else if (claim.reason !== 'already_processed') {
      console.error('[webhook] charge.success rejected:', claim.reason, 'reference:', data.reference)
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
