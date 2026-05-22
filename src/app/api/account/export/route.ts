import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [userRes, reportsRes] = await Promise.all([
    db.from('users')
      .select('id, email, full_name, company_name, subscription_tier, billing_status, created_at, renewal_date, current_streak, total_fixes_completed')
      .eq('email', session.email)
      .single(),
    db.from('reports')
      .select('id, created_at, score, summary')
      .eq('user_email', session.email)
      .order('created_at', { ascending: false }),
  ])

  const payload = {
    exportedAt: new Date().toISOString(),
    account: userRes.data ?? {},
    reports: reportsRes.data ?? [],
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="icp-diagnostic-data-${session.email.replace(/[^a-z0-9]/gi, '-')}.json"`,
    },
  })
}
