import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side ledger of Paystack payments (table: paystack_payments).
 *
 * Every payment we start is recorded here as `pending` with the amount and tier
 * WE decided on. When Paystack reports the payment, we "claim" the row exactly
 * once. This blocks:
 *  - replaying /api/paystack/verify?reference=X to extend a subscription for free
 *  - payments started client-side with the public key for a tiny amount but a
 *    big tier in metadata (Paystack metadata is never trusted)
 */

export type PaymentKind = 'new_subscription' | 'proration'

export interface PaymentRow {
  reference: string
  email: string
  tier: string
  kind: PaymentKind
  expected_amount: number // in Paystack subunits (KES cents)
  status: 'pending' | 'paid' | 'rejected'
  meta: Record<string, string> | null
}

export async function recordPendingPayment(
  db: SupabaseClient,
  p: { reference: string; email: string; tier: string; kind: PaymentKind; expectedAmount: number; meta?: Record<string, string> },
): Promise<boolean> {
  const { error } = await db.from('paystack_payments').insert({
    reference:       p.reference,
    email:           p.email.trim().toLowerCase(),
    tier:            p.tier.toLowerCase(),
    kind:            p.kind,
    expected_amount: p.expectedAmount,
    status:          'pending',
    meta:            p.meta ?? null,
  })
  if (error) console.error('[payments] recordPendingPayment failed:', error.message)
  return !error
}

export type ClaimResult =
  | { ok: true; row: PaymentRow }
  | { ok: false; reason: 'unknown_reference' | 'already_processed' | 'amount_mismatch' | 'email_mismatch' | 'currency_mismatch' | 'db_error' }

/**
 * Validates a Paystack-confirmed transaction against our ledger and marks it paid.
 * Only one caller can ever succeed for a given reference.
 */
export async function claimPayment(
  db: SupabaseClient,
  tx: { reference: string; amount: number; currency: string; email: string },
): Promise<ClaimResult> {
  const { data: row, error } = await db
    .from('paystack_payments')
    .select('reference, email, tier, kind, expected_amount, status, meta')
    .eq('reference', tx.reference)
    .maybeSingle()

  if (error) return { ok: false, reason: 'db_error' }
  if (!row) return { ok: false, reason: 'unknown_reference' }
  if (row.status !== 'pending') return { ok: false, reason: 'already_processed' }

  const reject = async (reason: 'amount_mismatch' | 'email_mismatch' | 'currency_mismatch') => {
    await db.from('paystack_payments').update({ status: 'rejected', reject_reason: reason }).eq('reference', tx.reference).eq('status', 'pending')
    return { ok: false as const, reason }
  }
  if ((tx.currency ?? '').toUpperCase() !== 'KES') return reject('currency_mismatch')
  if (typeof tx.amount !== 'number' || tx.amount < row.expected_amount) return reject('amount_mismatch')
  if ((tx.email ?? '').trim().toLowerCase() !== row.email) return reject('email_mismatch')

  // Atomic claim: only succeeds if the row is still pending
  const { data: claimed, error: claimErr } = await db
    .from('paystack_payments')
    .update({ status: 'paid', paid_amount: tx.amount, paid_at: new Date().toISOString() })
    .eq('reference', tx.reference)
    .eq('status', 'pending')
    .select('reference')
  if (claimErr) return { ok: false, reason: 'db_error' }
  if (!claimed || claimed.length === 0) return { ok: false, reason: 'already_processed' }

  return { ok: true, row: row as PaymentRow }
}
