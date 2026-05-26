import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rawEmail = req.nextUrl.searchParams.get('email')
  const email = rawEmail ? rawEmail.trim().toLowerCase() : null
  if (email && session.email.toLowerCase() !== email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!email) {
    return NextResponse.json({ reports: [] }, { status: 200 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    serviceKey
  )

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (userError || !user) {
    return NextResponse.json({ reports: [] }, { status: 200 })
  }

  // Primary: reports directly linked by user_id
  const { data: directReports } = await supabase
    .from('reports')
    .select('id, questionnaire_id, report_summary, generated_at')
    .eq('user_id', user.id)
    .order('generated_at', { ascending: false })

  // Fallback: catch reports where user_id was null at insert time by going via questionnaires
  const { data: userQs } = await supabase
    .from('questionnaires')
    .select('id')
    .eq('user_id', user.id)

  const qIds = (userQs ?? []).map((q: { id: string }) => q.id)
  let indirect: typeof directReports = []
  if (qIds.length > 0) {
    const { data } = await supabase
      .from('reports')
      .select('id, questionnaire_id, report_summary, generated_at')
      .in('questionnaire_id', qIds)
      .order('generated_at', { ascending: false })
    indirect = data ?? []
  }

  // Merge and deduplicate, newest first
  const seen = new Set<string>()
  const reports = [...(directReports ?? []), ...indirect]
    .filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true })
    .sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime())

  return NextResponse.json({ reports }, { status: 200 })
}
