import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  try {
    const { userEmail } = await req.json()

    if (!userEmail) {
      return NextResponse.json({ error: 'Missing userEmail' }, { status: 400 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single()

    const { error: userErr } = await supabase
      .from('users')
      .update({ billing_status: 'active', paused_until: null })
      .eq('email', userEmail)

    if (userErr) console.error('[resume] users error:', JSON.stringify(userErr))

    const { error: subErr } = await supabase
      .from('subscriptions')
      .update({ billing_status: 'active', paused_until: null })
      .eq('user_id', userData?.id)

    if (subErr) console.error('[resume] subscriptions error:', JSON.stringify(subErr))

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('[resume] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
