import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPausedToUser, sendPausedToFounder } from '@/lib/email'
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
      .select('id, full_name, company_name')
      .eq('email', userEmail)
      .single()

    const resumeDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { error: userErr } = await supabase
      .from('users')
      .update({ billing_status: 'paused', paused_until: resumeDate })
      .eq('email', userEmail)

    if (userErr) console.error('[pause] users error:', JSON.stringify(userErr))

    const { error: subErr } = await supabase
      .from('subscriptions')
      .update({ billing_status: 'paused', paused_until: resumeDate })
      .eq('user_id', userData?.id)

    if (subErr) console.error('[pause] subscriptions error:', JSON.stringify(subErr))

    await Promise.allSettled([
      sendPausedToUser({
        to: userEmail,
        name: userData?.full_name ?? '',
        resumeDate,
      }),
      sendPausedToFounder({
        userName: userData?.full_name ?? userEmail,
        userEmail,
        companyName: userData?.company_name,
        resumeDate,
      }),
    ])

    return NextResponse.json({ success: true, resumeDate }, { status: 200 })
  } catch (err) {
    console.error('[pause] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
