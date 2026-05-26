import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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

    const { userEmail } = await req.json()

    if (!userEmail) {
      return NextResponse.json({ error: 'Missing userEmail' }, { status: 400 })
    }
    if (session.email !== userEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single()

    if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Verify there is an actual paused subscription before resuming — prevents
    // free or inactive users from calling this endpoint to gain active status
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('billing_status, subscription_tier')
      .eq('user_id', userData.id)
      .maybeSingle()

    if (!sub || sub.billing_status !== 'paused') {
      return NextResponse.json({ error: 'No paused subscription found' }, { status: 400 })
    }

    const { error: userErr } = await supabase
      .from('users')
      .update({ billing_status: 'active', paused_until: null })
      .eq('email', userEmail)

    if (userErr) console.error('[resume] users error:', JSON.stringify(userErr))

    const { error: subErr } = await supabase
      .from('subscriptions')
      .update({ billing_status: 'active', paused_until: null })
      .eq('user_id', userData.id)

    if (subErr) console.error('[resume] subscriptions error:', JSON.stringify(subErr))

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('[resume] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
