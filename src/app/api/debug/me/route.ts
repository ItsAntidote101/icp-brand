import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

  if (!session) {
    return NextResponse.json({ error: 'No session cookie found' }, { status: 401 })
  }

  // 1. What user is in the DB for this session email?
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id, email, billing_status, subscription_tier, created_at')
    .eq('email', session.email)
    .maybeSingle()

  // 2. What questionnaires exist for this user?
  const { data: questionnaires } = user
    ? await supabase
        .from('questionnaires')
        .select('id, user_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
    : { data: [] }

  // 3. What reports exist directly linked to this user?
  const { data: directReports } = user
    ? await supabase
        .from('reports')
        .select('id, questionnaire_id, user_id, generated_at')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(5)
    : { data: [] }

  // 4. What reports exist via questionnaire fallback?
  const qIds = (questionnaires ?? []).map((q: { id: string }) => q.id)
  const { data: indirectReports } = qIds.length > 0
    ? await supabase
        .from('reports')
        .select('id, questionnaire_id, user_id, generated_at')
        .in('questionnaire_id', qIds)
        .order('generated_at', { ascending: false })
        .limit(5)
    : { data: [] }

  // 5. Any reports with null user_id (orphaned)?
  const { data: orphanReports } = await supabase
    .from('reports')
    .select('id, questionnaire_id, user_id, generated_at')
    .is('user_id', null)
    .order('generated_at', { ascending: false })
    .limit(5)

  return NextResponse.json({
    session: {
      email: session.email,
      userId: session.userId,
    },
    userInDB: user ?? null,
    userLookupError: userErr?.message ?? null,
    emailMatch: user ? user.email === session.email : false,
    questionnaires: questionnaires ?? [],
    directReports: directReports ?? [],
    indirectReports: indirectReports ?? [],
    orphanedReports: orphanReports ?? [],
  })
}
