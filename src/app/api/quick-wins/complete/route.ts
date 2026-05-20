import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function weekOf(date = new Date()): string {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - d.getUTCDay() + 1)
  return d.toISOString().split('T')[0]
}

const MILESTONE_CONDITIONS: Record<string, string> = {
  first_diagnosis:     'First Diagnosis',
  quick_win:           'Quick Win',
  score_climber:       'Score Climber',
  intelligence_reader: 'Intelligence Reader',
  consistent:          'Consistent',
  power_user:          'Power User',
}

export async function POST(req: NextRequest) {
  try {
    const { email, win_index, win_text } = await req.json()
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const { data: user } = await supabase
      .from('users')
      .select('id, current_streak, longest_streak, total_fixes_completed')
      .eq('email', email)
      .single()

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const today   = new Date().toISOString().split('T')[0]
    const thisWk  = weekOf()
    const prevWk  = weekOf(new Date(Date.now() - 7 * 86_400_000))

    // Save the completion
    const { error: insertErr } = await supabase.from('quick_win_completions').insert({
      user_id:      user.id,
      win_index,
      win_text,
      completed_at: new Date().toISOString(),
      week_of:      thisWk,
    })
    if (insertErr) console.error('[quick-wins] insert error:', insertErr)

    // Calculate streak: check if there was a completion in the previous week
    const { count: prevWkCount } = await supabase
      .from('quick_win_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('week_of', prevWk)

    const newStreak   = (prevWkCount ?? 0) > 0 ? (user.current_streak ?? 0) + 1 : 1
    const newLongest  = Math.max(user.longest_streak ?? 0, newStreak)
    const totalFixes  = (user.total_fixes_completed ?? 0) + 1

    await supabase.from('users').update({
      current_streak:       newStreak,
      longest_streak:       newLongest,
      total_fixes_completed: totalFixes,
    }).eq('id', user.id)

    // Badge checks
    const { data: existingMilestones } = await supabase
      .from('user_milestones')
      .select('milestone_key')
      .eq('user_id', user.id)

    const earned = new Set((existingMilestones ?? []).map(m => m.milestone_key))
    const toAward: string[] = []

    if (!earned.has('quick_win')) toAward.push('quick_win')

    // consistent badge: 3 diagnoses
    const { count: diagCount } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if ((diagCount ?? 0) >= 3 && !earned.has('consistent')) toAward.push('consistent')

    // power_user: all other badges earned
    const otherKeys = ['first_diagnosis', 'quick_win', 'score_climber', 'intelligence_reader', 'consistent']
    const allEarned = otherKeys.every(k => earned.has(k) || toAward.includes(k))
    if (allEarned && !earned.has('power_user')) toAward.push('power_user')

    if (toAward.length > 0) {
      await supabase.from('user_milestones').insert(
        toAward.map(key => ({ user_id: user.id, milestone_key: key, earned_at: new Date().toISOString() }))
      )
    }

    return NextResponse.json({
      streak:          newStreak,
      longest_streak:  newLongest,
      total_fixes:     totalFixes,
      badges_unlocked: toAward.map(k => ({ key: k, name: MILESTONE_CONDITIONS[k] ?? k })),
    })
  } catch (err) {
    console.error('[quick-wins/complete] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
