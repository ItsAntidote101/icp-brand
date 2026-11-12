import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const supabase = supabaseAdmin()

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user, error } = await supabase
    .from('users')
    .select(`
      id, email, full_name, company_name, subscription_tier, billing_status,
      renewal_date, created_at, paused_until, cancelled_at, has_unread_reply, avatar_url,
      current_streak, longest_streak, total_fixes_completed,
      last_seen_intelligence_at, last_seen_overview_at,
      scheduled_tier, scheduled_tier_date
    `)
    .eq('email', session.email)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // 'paused' accounts keep dashboard access (pause is no longer offered, but
  // older paused rows must not be locked out). Only closed accounts are blocked.
  if (user.billing_status !== 'active' && user.billing_status !== 'paused') {
    return NextResponse.json({ error: 'Inactive' }, { status: 403 })
  }

  return NextResponse.json({ status: 'active', user }, { status: 200 })
}
