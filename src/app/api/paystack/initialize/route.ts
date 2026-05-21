import { NextRequest, NextResponse } from 'next/server'

type Tier = 'Starter' | 'Pro' | 'Agency'

// Amounts in KES cents (100 cents = 1 KES)
const PRICES: Record<Tier, number> = {
  Starter: 650000,
  Pro:     1300000,
  Agency:  2600000,
}

export async function POST(req: NextRequest) {
  const { email, tier } = (await req.json()) as {
    email: string
    tier: Tier
  }

  if (!email || !tier) {
    return NextResponse.json({ error: 'email and tier are required' }, { status: 400 })
  }

  if (!PRICES[tier]) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  const amount = PRICES[tier]

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://idealicp.com'
  const callbackUrl = `${appUrl}/api/paystack/verify`

  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY ?? ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount,
      currency: 'KES',
      callback_url: callbackUrl,
      metadata: { tier },
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
