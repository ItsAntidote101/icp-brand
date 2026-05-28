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

function getScore(s: string): number | null {
  try { const p = JSON.parse(s); return p.overall_score ?? p.health_score ?? null } catch { return null }
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  if (session.email !== email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: user } = await supabase.from('users').select('id, user_badges').eq('email', email).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const [
    { data: earned },
    { count: diagCount },
    { count: winCount },
    { count: briefCount },
    { data: reports },
  ] = await Promise.all([
    supabase.from('user_milestones').select('milestone_key, earned_at').eq('user_id', user.id),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('quick_win_completions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('intelligence_briefings').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('reports').select('report_summary').eq('user_id', user.id).order('generated_at', { ascending: true }).limit(10),
  ])

  const earnedMap = new Map((earned ?? []).map(m => [m.milestone_key, m.earned_at]))

  let scoreImprovement = 0
  if (reports && reports.length >= 2) {
    const first  = getScore(reports[0].report_summary as string)
    const latest = getScore(reports[reports.length - 1].report_summary as string)
    if (first !== null && latest !== null) scoreImprovement = latest - first
  }

  const earnedCount = earnedMap.size
  const otherKeys = ['first_diagnosis', 'quick_win', 'score_climber', 'intelligence_reader', 'consistent']
  const otherEarned = otherKeys.filter(k => earnedMap.has(k)).length

  const progress: Record<string, { current: number; target: number; label: string }> = {
    first_diagnosis:     { current: Math.min(diagCount ?? 0, 1),        target: 1,  label: `${Math.min(diagCount ?? 0, 1)}/1 diagnoses` },
    consistent:          { current: Math.min(diagCount ?? 0, 3),        target: 3,  label: `${Math.min(diagCount ?? 0, 3)}/3 diagnoses` },
    quick_win:           { current: Math.min(winCount ?? 0, 1),         target: 1,  label: `${Math.min(winCount ?? 0, 1)}/1 quick wins` },
    score_climber:       { current: Math.max(0, Math.round(scoreImprovement)), target: 10, label: `+${Math.max(0, Math.round(scoreImprovement))} pts improvement` },
    intelligence_reader: { current: Math.min(briefCount ?? 0, 5),       target: 5,  label: `${Math.min(briefCount ?? 0, 5)}/5 briefings` },
    power_user:          { current: otherEarned,                         target: 5,  label: `${otherEarned}/5 badges earned` },
  }

  const badges = (user.user_badges ?? {}) as Record<string, unknown>
  const bonusDiagnoses = (badges.power_user_bonus_diagnoses as number) ?? 0

  const milestones = ALL_MILESTONES.map(m => ({
    ...m,
    earned:    earnedMap.has(m.key),
    earned_at: earnedMap.get(m.key) ?? null,
    progress:  progress[m.key],
  }))

  return NextResponse.json({ milestones, earnedCount, bonusDiagnoses })
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
      .select('id, current_streak, total_fixes_completed, user_badges')
      .eq('email', email)
      .single()

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { data: existing } = await supabase
      .from('user_milestones')
      .select('milestone_key')
      .eq('user_id', user.id)

    const earned = new Set((existing ?? []).map(m => m.milestone_key))
    const toAward: string[] = []

    const [
      { count: diagCount },
      { count: winCount },
      { count: briefCount },
      { data: reports },
    ] = await Promise.all([
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('quick_win_completions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('intelligence_briefings').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('reports').select('report_summary').eq('user_id', user.id).order('generated_at', { ascending: true }).limit(10),
    ])

    if ((diagCount ?? 0) >= 1 && !earned.has('first_diagnosis')) toAward.push('first_diagnosis')
    if ((diagCount ?? 0) >= 3 && !earned.has('consistent'))      toAward.push('consistent')
    if ((winCount  ?? 0) >= 1 && !earned.has('quick_win'))       toAward.push('quick_win')
    if ((briefCount ?? 0) >= 5 && !earned.has('intelligence_reader')) toAward.push('intelligence_reader')

    if (reports && reports.length >= 2) {
      const first  = getScore(reports[0].report_summary as string)
      const latest = getScore(reports[reports.length - 1].report_summary as string)
      if (first !== null && latest !== null && latest - first >= 10 && !earned.has('score_climber')) {
        toAward.push('score_climber')
      }
    }

    const others = ['first_diagnosis', 'quick_win', 'score_climber', 'intelligence_reader', 'consistent']
    const allDone = others.every(k => earned.has(k) || toAward.includes(k))
    if (allDone && !earned.has('power_user')) toAward.push('power_user')

    if (toAward.length > 0) {
      await supabase.from('user_milestones').insert(
        toAward.map(key => ({ user_id: user.id, milestone_key: key, earned_at: new Date().toISOString() }))
      )
    }

    // Power User reward: grant 2 bonus diagnoses (stored in user_badges JSON)
    let reward: { type: string; count: number } | null = null
    if (toAward.includes('power_user')) {
      const existing_badges = (user.user_badges ?? {}) as Record<string, unknown>
      if (!existing_badges.power_user_bonus_granted) {
        const BONUS = 2
        await supabase.from('users').update({
          user_badges: {
            ...existing_badges,
            power_user_bonus_granted: true,
            power_user_bonus_diagnoses: BONUS,
          },
        }).eq('id', user.id)
        reward = { type: 'bonus_diagnoses', count: BONUS }
      }
    }

    return NextResponse.json({ awarded: toAward, reward })
  } catch (err) {
    console.error('[milestones] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
