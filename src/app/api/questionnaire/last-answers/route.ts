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
const STABLE_IDS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 16, 17, 19, 22])

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ prefill: null })

  const { data: user } = await supabase
    .from('users')
    .select('full_name, email, company_name')
    .eq('email', session.email)
    .single()

  if (!user) return NextResponse.json({ prefill: null })

  const profile = {
    name: user.full_name ?? '',
    email: user.email ?? session.email,
    company: user.company_name ?? '',
  }

  const { data: lastQ } = await supabase
    .from('questionnaire_responses')
    .select('data')
    .eq('email', session.email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!lastQ?.data) {
    return NextResponse.json({ prefill: { profile, answers: {} } })
  }

  const raw = lastQ.data as Record<string, unknown>
  const stableAnswers: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(raw)) {
    if (STABLE_IDS.has(Number(key))) stableAnswers[key] = val
  }

  return NextResponse.json({ prefill: { profile, answers: stableAnswers } })
}
