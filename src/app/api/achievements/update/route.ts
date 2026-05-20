import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateAchievements, getNewlyEarned } from '@/lib/achievements'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const { data: user } = await supabase
      .from('users')
      .select('id, user_badges, briefings_viewed, csv_uploads')
      .eq('email', email)
      .single()

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { count: reportCount } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: winsCount } = await supabase
      .from('quick_win_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { data: reports } = await supabase
      .from('reports')
      .select('report_summary')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: true })
      .limit(10)

    let scoreImprovement = 0
    if (reports && reports.length >= 2) {
      const getScore = (s: string) => {
        try { const p = JSON.parse(s); return p.overall_score ?? p.health_score ?? null } catch { return null }
      }
      const first  = getScore(reports[0].report_summary as string)
      const latest = getScore(reports[reports.length - 1].report_summary as string)
      if (first !== null && latest !== null) scoreImprovement = latest - first
    }

    const stored  = (user.user_badges ?? {}) as Record<string, boolean>
    const current = calculateAchievements({
      reportCount:      reportCount ?? 0,
      completedWins:    winsCount ?? 0,
      scoreImprovement,
      briefingsViewed:  user.briefings_viewed ?? 0,
      csvUploads:       user.csv_uploads ?? 0,
    })

    const newlyEarned = getNewlyEarned(stored, current)

    if (newlyEarned.length > 0) {
      const updated: Record<string, boolean> = { ...stored }
      newlyEarned.forEach(id => { updated[id] = true })
      await supabase.from('users').update({ user_badges: updated }).eq('id', user.id)
    }

    return NextResponse.json({ earned: current, newlyEarned })
  } catch (err) {
    console.error('[achievements/update] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
