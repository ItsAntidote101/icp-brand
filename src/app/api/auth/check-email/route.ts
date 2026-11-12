import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

// Used by the dashboard to restore a remembered login.
// SECURITY: this endpoint used to issue a session cookie for any email it was
// given, which let anyone log in as any user. It now only confirms an email
// that already matches a verified session and never creates a session itself.
// Sessions are only issued by /api/auth/verify-otp and /api/auth/callback.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body as { email?: unknown }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    const normalised = email.trim().toLowerCase()
    const session = await getSession()
    if (!session || session.email.toLowerCase() !== normalised) {
      return NextResponse.json({ status: 'unauthenticated' }, { status: 401 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', serviceKey)

    const { data: user, error } = await supabase
      .from('users')
      .select(`
      id, email, full_name, company_name, subscription_tier, billing_status,
      renewal_date, created_at, paused_until, cancelled_at, has_unread_reply, avatar_url,
      current_streak, longest_streak, total_fixes_completed,
      last_seen_intelligence_at, last_seen_overview_at,
      scheduled_tier, scheduled_tier_date
    `)
      .eq('id', session.userId)
      .maybeSingle()

    if (error) {
      console.error('[check-email] error looking up user')
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
    if (!user) return NextResponse.json({ status: 'not_found' }, { status: 404 })
    if (user.billing_status !== 'active' && user.billing_status !== 'paused') {
      return NextResponse.json({ status: 'inactive' }, { status: 200 })
    }

    return NextResponse.json({ status: 'active', user }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
