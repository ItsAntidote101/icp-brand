import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Anthropic from '@anthropic-ai/sdk'
import { sendPersonalisedWeeklyIntelligenceEmail } from '@/lib/email'
import { generateMarketBriefing, loadOwnNumbers } from '@/lib/market-briefing'

export const dynamic     = 'force-dynamic'
export const maxDuration = 120

const supabase  = supabaseAdmin()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function weekStart(): string {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - d.getUTCDay() + 1)
  return d.toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: users, error: usersErr } = await supabase
    .from('users')
    .select('id, email, full_name, company_name, subscription_tier')
    .eq('billing_status', 'active')
    .not('subscription_tier', 'eq', 'free')

  if (usersErr) {
    console.error('[weekly-intel] fetch users error:', JSON.stringify(usersErr))
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  const week = weekStart()
  let processed = 0; let failed = 0

  for (const user of users ?? []) {
    try {
      const { data: existing } = await supabase
        .from('intelligence_briefings')
        .select('id')
        .eq('user_id', user.id)
        .eq('week_of', week)
        .eq('briefing_type', 'scheduled')
        .limit(1)
        .maybeSingle()

      if (existing) continue

      // Load named questionnaire data
      const { data: qData } = await supabase
        .from('questionnaire_responses')
        .select('data')
        .eq('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const qd: Record<string, string> = (qData?.data as Record<string, string>) ?? {}

      // Load full numeric questionnaire as fallback
      const { data: rawQ } = await supabase
        .from('questionnaires')
        .select('responses')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const r: Record<string, unknown> = (rawQ?.responses as Record<string, unknown>) ?? {}

      // Build profile with fallbacks
      const industry     = qd.industry ?? qd.business_type ?? (r[2] as string) ?? 'digital marketing'
      const region       = qd.region   ?? qd.country       ?? (r[11] as string) ?? 'Kenya'
      const rawChannels  = qd.ad_channels ?? (Array.isArray(r[9]) ? (r[9] as string[]).join(',') : (r[9] as string) ?? '')
      const channels     = rawChannels ? rawChannels.split(',').map((s: string) => s.trim()).filter(Boolean) : ['Meta', 'Google']
      const budget       = qd.monthly_budget ?? qd.budget ?? (r[13] as string) ?? ''
      const product      = qd.product_service ?? qd.offer ?? (r[1] as string) ?? ''
      const businessModel = qd.business_model ?? (r[23] as string) ?? ''
      const targetAudience = qd.target_audience ?? (r[8] as string) ?? ''
      const ltv           = (r[22] as string) ?? (r[6] as string) ?? ''
      const monthlyLeads  = (r[14] as string) ?? ''

      const budgetNum  = parseFloat(budget.replace(/[^0-9.]/g, ''))
      const leadsNum   = parseFloat(monthlyLeads.replace(/[^0-9.]/g, ''))
      const ltvNum     = parseFloat(ltv.replace(/[^0-9.]/g, ''))
      const estimatedCpa  = budgetNum > 0 && leadsNum > 0 ? (budgetNum / leadsNum).toFixed(0) : ''
      const ltvCacRatio   = estimatedCpa && ltvNum > 0 ? (ltvNum / parseFloat(estimatedCpa)).toFixed(1) : ''

      // Fetch latest two ICP reports for score trend
      const { data: recentReports } = await supabase
        .from('reports')
        .select('report_summary')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(2)

      const getScore = (s: string) => { try { const p = JSON.parse(s); return p.overall_score ?? p.health_score ?? null } catch { return null } }
      const latestReport = recentReports?.[0]
      const prevReport   = recentReports?.[1]

      let icpScore: number | null = null
      let prevScore: number | null = null
      let topQuickWin: string | undefined
      let predictedGain: number | undefined

      if (latestReport?.report_summary) {
        icpScore = getScore(latestReport.report_summary as string)
        // Extract top quick win + prediction
        try {
          const d = JSON.parse(latestReport.report_summary as string) as Record<string, unknown>
          const preds = d.score_predictions as Array<{ action: string; predictedDelta: number }> | undefined
          if (preds?.[0]) {
            topQuickWin  = preds[0].action
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
      if (prevReport?.report_summary) {
        prevScore = getScore(prevReport.report_summary as string)
      }

      const own  = await loadOwnNumbers(supabase, user.id)
      const data = await generateMarketBriefing(anthropic, {
        companyName: user.company_name ?? '', product, industry, businessModel, region, targetAudience, channels, budget,
      }, own)
      const now = new Date().toISOString()

      await supabase.from('intelligence_briefings').insert({
        user_id:       user.id,
        briefing_data: data,
        research_date: now,
        week_of:       week,
        briefing_type: 'scheduled',
      })

      // A quiet week is saved, so the dashboard can say so, but it is not worth an email
      if (data.quiet) { processed++; continue }

      type BriefingInsight   = { title: string; body: string }
      type BriefingBenchmark = { name: string; userValue: number | null; industryAvg: number; unit: string }
      const insights: BriefingInsight[] = data.insights
      const benchmarks: BriefingBenchmark[] = []
      const opportunity    = data.topOpportunity
      const recommendation = data.topRecommendation

      await sendPersonalisedWeeklyIntelligenceEmail({
        to: user.email,
        name: user.full_name ?? '',
        weekOf: week,
        insights,
        benchmarks,
        opportunity,
        recommendation,
        region,
        generatedAt: now,
        scoreTrend: icpScore !== null ? {
          current: icpScore, prev: prevScore, topQuickWin, predictedGain,
        } : undefined,
      })

      processed++
    } catch (err) {
      console.error('[weekly-intel] error processing user:', user.email, err)
      failed++
    }
  }

  return NextResponse.json({ ok: true, processed, failed, week })
}
