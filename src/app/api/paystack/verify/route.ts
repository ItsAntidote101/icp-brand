import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { claimPayment } from '@/lib/payments'
import { activatePayment, paymentReturnPath } from '@/lib/activate-payment'

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('reference') ?? req.nextUrl.searchParams.get('trxref')

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://idealicp.com'

  if (!reference) {
    return NextResponse.redirect(`${base}/cancel?reason=missing_reference`)
  }

  // Verify with Paystack
  let verifyData: Record<string, unknown>
  try {
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
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

  const txData   = verifyData.data as Record<string, unknown>
  const customer = txData.customer as { email: string }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    serviceKey
  )

  // ── Claim the payment exactly once, against what WE expected to be paid ──
  // Never trust Paystack metadata for tier or upgrade type: anyone with the
  // public key can start a transaction with arbitrary metadata.
  const claim = await claimPayment(supabase, {
    reference,
    amount:   (txData.amount as number) ?? 0,
    currency: (txData.currency as string) ?? '',
    email:    customer?.email ?? '',
  })

  if (!claim.ok) {
    if (claim.reason === 'already_processed') {
      // The webhook (or a refresh) got there first and already activated the
      // plan. Still send them to the right page so the purchase is recorded.
      const { data: row } = await supabase
        .from('paystack_payments')
        .select('reference, email, tier, kind, status, paid_amount')
        .eq('reference', reference)
        .maybeSingle()
      if (row && row.status === 'paid') {
        return NextResponse.redirect(`${base}${paymentReturnPath(row, Math.round((row.paid_amount ?? 0) / 100))}`)
      }
      return NextResponse.redirect(`${base}/dashboard`)
    }
    console.error('[verify] payment rejected:', claim.reason, 'reference:', reference)
    return NextResponse.redirect(`${base}/cancel?reason=${encodeURIComponent(claim.reason)}`)
  }

  // Amount actually charged (in KES, from Paystack cents)
  const amountKes = Math.round(((txData.amount as number) ?? 0) / 100)
  await activatePayment(supabase, claim.row, amountKes, base, 'verify')
  return NextResponse.redirect(`${base}${paymentReturnPath(claim.row, amountKes)}`)
}
