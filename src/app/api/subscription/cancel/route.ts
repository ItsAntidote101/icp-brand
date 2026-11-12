import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendCancellationToUser, sendCancellationToFounder } from '@/lib/email'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const supabase = supabaseAdmin()

// Undo a cancellation while the paid period is still running.
export async function DELETE() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { error } = await supabase
    .from('users')
    .update({ cancelled_at: null, cancellation_reason: null })
    .eq('id', session.userId)
  if (error) return NextResponse.json({ error: 'Could not update your plan' }, { status: 500 })
  await supabase.from('subscriptions').update({ cancelled_at: null }).eq('user_id', session.userId)
  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { userEmail, reason } = await req.json()

    if (!userEmail || typeof userEmail !== 'string') {
      return NextResponse.json({ error: 'Missing userEmail' }, { status: 400 })
    }
    if (session.email !== userEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch user record for context
    const { data: userData } = await supabase
      .from('users')
      .select('id, full_name, company_name, renewal_date')
      .eq('email', userEmail)
      .single()

    const now = new Date().toISOString()

    // Update users table
    const { error: userError } = await supabase
      .from('users')
      .update({
        // Plans are paid month by month (no automatic charge), so cancelling
        // means "don't ask me to renew". The customer keeps what they paid for
        // until renewal_date; the daily cron then moves them to free. Setting
        // billing_status to 'cancelled' here used to lock them out instantly.
        cancelled_at: now,
        cancellation_reason: reason ?? null,
      })
      .eq('email', userEmail)

    if (userError) console.error('[cancel] users update error:', JSON.stringify(userError))

    // Update subscriptions table (non-fatal if missing)
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({ cancelled_at: now })
      .eq('user_id', userData?.id)

    if (subError) console.error('[cancel] subscriptions update error:', JSON.stringify(subError))

    // Send emails (both, non-fatal)
    await Promise.allSettled([
      sendCancellationToUser({
        to: userEmail,
        name: userData?.full_name ?? '',
        renewalDate: userData?.renewal_date,
      }),
      sendCancellationToFounder({
        userName: userData?.full_name ?? userEmail,
        userEmail,
        companyName: userData?.company_name,
        reason,
        renewalDate: userData?.renewal_date,
      }),
    ])

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('[cancel] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
