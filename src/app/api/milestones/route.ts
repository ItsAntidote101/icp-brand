import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder',
)

const ALL_MILESTONES = [
  { key: 'first_diagnosis',     name: 'First Diagnosis',      description: 'Complete your first ICP diagnostic',         unlock_hint: 'Run your first diagnosis' },
  { key: 'quick_win',           name: 'Quick Win',            description: 'Mark your first fix as complete',            unlock_hint: 'Mark a quick win as done' },
  { key: 'score_climber',       name: 'Score Climber',        description: 'Improve your ICP score by 10+ points',       unlock_hint: 'Improve your score by 10 points' },
  { key: 'intelligence_reader', name: 'Intelligence Reader',  description: 'Read 5 intelligence briefings',              unlock_hint: 'Open the Intelligence tab 5 times' },
  { key: 'consistent',          name: 'Consistent',           description: 'Run 3 or more diagnoses',                    unlock_hint: 'Complete 3 diagnoses' },
  { key: 'power_user',          name: 'Power User',           description: 'Earn all other badges',                      unlock_hint: 'Earn all other badges first' },
]

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  if (session.email !== email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: user } = await supabase.from('users').select('id').eq('email', email).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: earned } = await supabase
    .from('user_milestones')
    .select('milestone_key, earned_at')
    .eq('user_id', user.id)

  const earnedMap = new Map((earned ?? []).map(m => [m.milestone_key, m.earned_at]))

  const milestones = ALL_MILESTONES.map(m => ({
    ...m,
    earned:    earnedMap.has(m.key),
    earned_at: earnedMap.get(m.key) ?? null,
  }))

  return NextResponse.json({ milestones })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    if (session.email !== email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: user } = await supabase
      .from('users')
      .select('id, current_streak, total_fixes_completed')
      .eq('email', email)
      .single()

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { data: existing } = await supabase
      .from('user_milestones')
      .select('milestone_key')
      .eq('user_id', user.id)

    const earned = new Set((existing ?? []).map(m => m.milestone_key))
    const toAward: string[] = []

    // first_diagnosis: has any report
    const { count: diagCount } = await supabase
      .from('reports').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
    if ((diagCount ?? 0) >= 1 && !earned.has('first_diagnosis')) toAward.push('first_diagnosis')

    // consistent: 3+ diagnoses
    if ((diagCount ?? 0) >= 3 && !earned.has('consistent')) toAward.push('consistent')

    // score_climber: check if score improved 10+ points across two reports
    const { data: reports } = await supabase
      .from('reports').select('report_summary').eq('user_id', user.id)
      .order('generated_at', { ascending: true }).limit(10)
    if (reports && reports.length >= 2) {
      const getScore = (s: string) => { try { const p = JSON.parse(s); return p.overall_score ?? p.health_score ?? null } catch { return null } }
      const first = getScore(reports[0].report_summary as string)
      const latest = getScore(reports[reports.length - 1].report_summary as string)
      if (first !== null && latest !== null && latest - first >= 10 && !earned.has('score_climber')) {
        toAward.push('score_climber')
      }
    }

    // quick_win: has any completion
    const { count: winCount } = await supabase
      .from('quick_win_completions').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
    if ((winCount ?? 0) >= 1 && !earned.has('quick_win')) toAward.push('quick_win')

    // intelligence_reader: 5+ briefings viewed, approximate from last_seen_intelligence_at existing
    const { count: briefCount } = await supabase
      .from('intelligence_briefings').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
    if ((briefCount ?? 0) >= 5 && !earned.has('intelligence_reader')) toAward.push('intelligence_reader')

    // power_user: all others
    const others = ['first_diagnosis', 'quick_win', 'score_climber', 'intelligence_reader', 'consistent']
    const allDone = others.every(k => earned.has(k) || toAward.includes(k))
    if (allDone && !earned.has('power_user')) toAward.push('power_user')

    if (toAward.length > 0) {
      await supabase.from('user_milestones').insert(
        toAward.map(key => ({ user_id: user.id, milestone_key: key, earned_at: new Date().toISOString() }))
      )
    }

    return NextResponse.json({ awarded: toAward })
  } catch (err) {
    console.error('[milestones] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
