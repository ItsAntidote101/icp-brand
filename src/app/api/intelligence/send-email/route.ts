import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'
import { sendPersonalisedWeeklyIntelligenceEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder',
)

const RATE_LIMIT_HOURS = 4

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { email } = await req.json()
    if (!email || session.email !== email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, full_name, company_name, subscription_tier, billing_status, last_intel_email_at')
      .eq('email', email)
      .single()

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Free tier cannot use on-demand email
    if (!user.subscription_tier || user.subscription_tier === 'free') {
      return NextResponse.json({ error: 'upgrade_required', message: 'On-demand email requires a paid subscription.' }, { status: 403 })
    }

    // Rate limit: once per RATE_LIMIT_HOURS
    if (user.last_intel_email_at) {
      const hoursSince = (Date.now() - new Date(user.last_intel_email_at).getTime()) / 3_600_000
      if (hoursSince < RATE_LIMIT_HOURS) {
        const nextAt = new Date(new Date(user.last_intel_email_at).getTime() + RATE_LIMIT_HOURS * 3_600_000)
        const hRemaining = Math.ceil((nextAt.getTime() - Date.now()) / 3_600_000)
        return NextResponse.json({
          error: 'rate_limited',
          message: `Briefing already sent recently. You can send again in ${hRemaining}h.`,
          nextAvailableAt: nextAt.toISOString(),
        }, { status: 429 })
      }
    }

    // Load latest briefing
    const { data: latest } = await supabase
      .from('intelligence_briefings')
      .select('briefing_data, research_date, week_of')
      .eq('user_id', user.id)
      .order('research_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!latest?.briefing_data) {
      return NextResponse.json({ error: 'No briefing available. Generate one first.' }, { status: 404 })
    }

    type Insight   = { title: string; body: string; type?: string; source?: string | null; timeLabel?: string; implication?: string | null; recommendation?: string | null }
    type Benchmark = { name: string; userValue: number | null; industryAvg: number; top10?: number | null; unit: string; higherIsBetter?: boolean }

    const bd        = latest.briefing_data as Record<string, unknown>
    const insights  = (bd.insights  as Insight[]   | undefined) ?? []
    const benchmarks = (bd.benchmarks as Benchmark[] | undefined) ?? []
    const opportunity    = (bd.topOpportunity    as string | undefined) ?? ''
    const recommendation = (bd.topRecommendation as string | undefined) ?? ''
    const weekOf         = latest.week_of ?? new Date().toISOString().split('T')[0]

    // Load ICP score trend
    let icpScore: number | null = null
    let prevScore: number | null = null
    let topQuickWin: string | undefined
    let predictedGain: number | undefined

    const { data: reports } = await supabase
      .from('reports')
      .select('report_summary')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(2)

    const getScore = (s: string) => { try { const p = JSON.parse(s); return p.overall_score ?? p.health_score ?? null } catch { return null } }

    if (reports?.[0]?.report_summary) {
      icpScore = getScore(reports[0].report_summary as string)
      try {
        const d = JSON.parse(reports[0].report_summary as string) as Record<string, unknown>
        const preds = d.score_predictions as Array<{ action: string; predictedDelta: number }> | undefined
        if (preds?.[0]) {
          topQuickWin   = preds[0].action
          predictedGain = preds[0].predictedDelta
        } else {
          const wins = d.quick_wins as Array<{ action: string; impact: string }> | undefined
          if (wins?.[0]) {
            topQuickWin = wins[0].action
            const base = wins[0].impact === 'High' ? 8 : wins[0].impact === 'Medium' ? 5 : 3
            const sf   = (icpScore ?? 50) < 40 ? 1.2 : (icpScore ?? 50) < 60 ? 1.0 : 0.7
            predictedGain = Math.max(1, Math.round(base * sf))
          }
        }
      } catch { /* noop */ }
    }
    if (reports?.[1]?.report_summary) {
      prevScore = getScore(reports[1].report_summary as string)
    }

    await sendPersonalisedWeeklyIntelligenceEmail({
      to: email,
      name: user.full_name ?? '',
      weekOf,
      insights,
      benchmarks,
      opportunity,
      recommendation,
      scoreTrend: icpScore !== null ? { current: icpScore, prev: prevScore, topQuickWin, predictedGain } : undefined,
    })

    // Record send timestamp for rate limiting
    await supabase.from('users').update({ last_intel_email_at: new Date().toISOString() }).eq('id', user.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[intelligence/send-email] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
