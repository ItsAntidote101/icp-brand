import { NextRequest, NextResponse } from 'next/server'

type Tier = 'Starter' | 'Pro' | 'Agency'
type Currency = 'USD' | 'KES'

// Amounts in smallest currency unit (cents / Paystack kobo-equivalent)
const PRICES: Record<Tier, Record<Currency, number>> = {
  Starter: { USD: 4900,   KES: 650000  },
  Pro:     { USD: 9900,   KES: 1300000 },
  Agency:  { USD: 19900,  KES: 2600000 },
}

export async function POST(req: NextRequest) {
  const { email, tier, currency } = (await req.json()) as {
    email: string
    tier: Tier
    currency: Currency
  }

  if (!email || !tier || !currency) {
    return NextResponse.json({ error: 'email, tier, and currency are required' }, { status: 400 })
  }

  if (!PRICES[tier]) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  const amount = PRICES[tier][currency]

  // Build absolute callback URL from request host
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  const host  = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000'
  const callbackUrl = `${proto}://${host}/api/paystack/verify`

  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY ?? ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount,
      currency,
      callback_url: callbackUrl,
      metadata: { tier, currency },
    }),
  })

  const paystackData = await paystackRes.json()

  if (!paystackRes.ok || !paystackData.status) {
    return NextResponse.json(
      { error: paystackData.message ?? 'Paystack initialization failed' },
      { status: 502 }
    )
  }

  return NextResponse.json({
    authorization_url: paystackData.data.authorization_url,
    reference: paystackData.data.reference,
  })
}
