import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendCancellationToUser, sendCancellationToFounder } from '@/lib/email'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

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
        billing_status: 'cancelled',
        subscription_tier: 'free',
        cancelled_at: now,
        cancellation_reason: reason ?? null,
      })
      .eq('email', userEmail)

    if (userError) console.error('[cancel] users update error:', JSON.stringify(userError))

    // Update subscriptions table (non-fatal if missing)
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({ billing_status: 'cancelled', cancelled_at: now })
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
