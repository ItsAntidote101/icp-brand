import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user, error } = await supabase
    .from('users')
    .select(`
      id, email, full_name, company_name, subscription_tier, billing_status,
      renewal_date, created_at, paused_until, has_unread_reply,
      current_streak, longest_streak, total_fixes_completed,
      last_seen_intelligence_at, last_seen_overview_at,
      scheduled_tier, scheduled_tier_date
    `)
    .eq('email', session.email)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (user.billing_status !== 'active') {
    return NextResponse.json({ error: 'Inactive' }, { status: 403 })
  }

  return NextResponse.json({ status: 'active', user }, { status: 200 })
}
