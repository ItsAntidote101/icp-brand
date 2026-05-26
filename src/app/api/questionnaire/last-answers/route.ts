import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Questions whose answers are stable enough to pre-fill on re-diagnosis.
// Dynamic questions (9, 12, 13, 14, 15, 18, 20, 21) are intentionally excluded
// so the user always re-enters current spend, leads, and performance metrics.
const STABLE_IDS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 16, 17, 19, 22, 23, 24, 25, 26])

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ prefill: null })

  const { data: user } = await supabase
    .from('users')
    .select('id, full_name, email, company_name')
    .eq('email', session.email)
    .single()

  if (!user) return NextResponse.json({ prefill: null })

  const profile = {
    name: user.full_name ?? '',
    email: user.email ?? session.email,
    company: user.company_name ?? '',
  }

  const { data: lastQ } = await supabase
    .from('questionnaires')
    .select('responses')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!lastQ?.responses) {
    return NextResponse.json({ prefill: { profile, answers: {} } })
  }

  const raw = lastQ.responses as Record<string, unknown>
  const stableAnswers: Record<string, unknown> = {}

  // Valid Q11 region options after the EA split (old combined value no longer valid)
  const VALID_REGIONS = new Set([
    'Kenya', 'Tanzania', 'Uganda',
    'West Africa (Nigeria, Ghana)', 'South Africa',
    'North America (US/Canada)', 'UK & Ireland', 'Europe (non-UK)',
    'Middle East', 'Southeast Asia', 'South Asia (India/Pakistan)',
    'Latin America', 'Australia & New Zealand', 'Global/Multiple Regions',
  ])

  for (const [key, val] of Object.entries(raw)) {
    if (!STABLE_IDS.has(Number(key))) continue
    // Drop legacy region value so user picks a specific country on re-diagnosis
    if (Number(key) === 11 && typeof val === 'string' && !VALID_REGIONS.has(val)) continue
    stableAnswers[key] = val
  }

  return NextResponse.json({ prefill: { profile, answers: stableAnswers } })
}
