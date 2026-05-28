import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { sendPersonalisedWeeklyIntelligenceEmail } from '@/lib/email'

export const dynamic     = 'force-dynamic'
export const maxDuration = 120

const supabase  = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost', process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder')
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function weekStart(): string {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - d.getUTCDay() + 1)
  return d.toISOString().split('T')[0]
}

function stripDashes(v: unknown): unknown {
  if (typeof v === 'string') return v.replace(/ — /g, ', ').replace(/— /g, ', ').replace(/—/g, '-').replace(/ – /g, ', ').replace(/–/g, '-')
  if (Array.isArray(v)) return v.map(stripDashes)
  if (v !== null && typeof v === 'object') {
    const o: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) o[k] = stripDashes(val)
    return o
  }
  return v
}

async function generateBriefingForUser(profile: {
  industry:      string
  region:        string
  channels:      string[]
  budget:        string
  icpScore:      number | null
  product:       string
  businessModel: string
  targetAudience: string
  estimatedCpa:  string
  ltvCacRatio:   string
  companyName:   string
}) {
  const now       = new Date()
  const monthYear = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const dateStr   = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const primaryChannel = profile.channels[0] ?? 'Meta'

  const systemPrompt = `You are a senior competitive intelligence analyst for digital advertising.

You MUST perform the following web searches before writing any output:
1. Search "${profile.industry} advertising benchmarks CPC CPA ${profile.region} ${monthYear}"
2. Search "${profile.industry} competitors ${profile.region} digital marketing 2025"
3. Search "${primaryChannel} algorithm update ${monthYear}"
4. Search "${profile.region} digital advertising market trends ${monthYear}"

Use real search results. Cite actual source names. No generic "Competitor A/B/C/D" labels. No em dashes or en dashes.`

  const userPrompt = `Generate a weekly market intelligence briefing as of ${dateStr} for this marketer.

MARKETER PROFILE:
- Company: ${profile.companyName || 'Not provided'}
- Product/Service: ${profile.product || profile.industry}
- Industry: ${profile.industry}
- Business model: ${profile.businessModel || 'Not specified'}
- Region: ${profile.region}
- Target audience: ${profile.targetAudience || 'Not specified'}
- Ad channels: ${profile.channels.join(', ')}
- Monthly budget: ${profile.budget || 'Not specified'}
- Estimated CPA: ${profile.estimatedCpa || 'Not computed'}
- LTV:CAC ratio: ${profile.ltvCacRatio || 'Not computed'}
- ICP Health Score: ${profile.icpScore ?? 'Not scored'}/100

Use web search results for all benchmarks and competitor names. Vary timeLabel across insights using realistic relative timestamps ("3 days ago", "Earlier this week", "Yesterday", "Last week"). Never use "Now" or "This week" for every item.

Return ONLY valid JSON, no markdown:
{
  "insights": [
    {"id":"i1","type":"market_movement","title":"<specific title with numbers from search>","body":"<2-3 sentences with real data>","source":"<actual source name>","timeLabel":"<realistic relative timestamp>","implication":null,"recommendation":null},
    {"id":"i2","type":"competitor_strategy","title":"<named real competitor in ${profile.region}>","body":"<specific finding from web research>","source":"<actual source>","timeLabel":"<realistic relative timestamp>","implication":"<implication for this marketer>","recommendation":null},
    {"id":"i3","type":"opportunity","title":"<specific opportunity in ${profile.industry} in ${profile.region}>","body":"<actionable with platform and audience specifics>","source":null,"timeLabel":"<realistic relative timestamp>","implication":null,"recommendation":"<specific action>"},
    {"id":"i4","type":"platform_update","title":"<actual ${primaryChannel} or Google update>","body":"<what changed and how it affects ${profile.industry} campaigns>","source":"<platform blog or trade publication>","timeLabel":"<realistic relative timestamp>","implication":null,"recommendation":"<campaign adjustment>"},
    {"id":"i5","type":"market_movement","title":"<second market movement for ${profile.industry} in ${profile.region}>","body":"<specific data point from search>","source":"<actual source>","timeLabel":"<realistic relative timestamp>","implication":"<campaign implication>","recommendation":null}
  ],
  "benchmarks": [
    {"name":"Click-Through Rate (CTR)","userValue":null,"industryAvg":<from search for ${profile.industry} ${profile.region}>,"top10":<from search>,"unit":"%","higherIsBetter":true},
    {"name":"Cost Per Acquisition (CPA)","userValue":${profile.estimatedCpa ? `<numeric value of ${profile.estimatedCpa}>` : 'null'},"industryAvg":<from search>,"top10":<from search>,"unit":"<local currency>","higherIsBetter":false},
    {"name":"Landing Page Conversion Rate","userValue":null,"industryAvg":<from search>,"top10":<from search>,"unit":"%","higherIsBetter":true},
    {"name":"Lead Quality Score","userValue":${profile.icpScore ?? 'null'},"industryAvg":52,"top10":78,"unit":"","higherIsBetter":true},
    {"name":"LTV:CAC Ratio","userValue":${profile.ltvCacRatio ? `"${profile.ltvCacRatio}"` : 'null'},"industryAvg":<typical for ${profile.industry}>,"top10":<top performers>,"unit":":1","higherIsBetter":true},
    {"name":"ICP Health Score","userValue":${profile.icpScore ?? 'null'},"industryAvg":55,"top10":82,"unit":"","higherIsBetter":true}
  ],
  "competitorPositions":[
    {"label":"<real competitor name from search>","x":<market presence 0-100>,"y":<ICP quality 0-100>},
    {"label":"<real competitor name>","x":<integer>,"y":<integer>},
    {"label":"<real competitor name>","x":<integer>,"y":<integer>},
    {"label":"<real competitor name>","x":<integer>,"y":<integer>}
  ],
  "userPosition":{"x":${Math.min(95, Math.max(10, (profile.icpScore ?? 50) * 0.85))},"y":${Math.min(95, Math.max(10, profile.icpScore ?? 50))}},
  "topOpportunity": "<one specific opportunity sentence referencing ${profile.region} and ${profile.industry}>",
  "topRecommendation": "<one specific action sentence>"
}`

  const res = await anthropic.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 3000,
    system:     systemPrompt,
    tools:      [{ type: 'web_search_20250305' as const, name: 'web_search' }],
    messages:   [{ role: 'user', content: userPrompt }],
  })

  const raw   = res.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
  const clean = raw.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim()
  const parsed = JSON.parse(clean)
  return stripDashes(parsed) as Record<string, unknown>
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

      const data = await generateBriefingForUser({
        industry, region, channels, budget, icpScore,
        product, businessModel, targetAudience, estimatedCpa, ltvCacRatio,
        companyName: user.company_name ?? '',
      })
      const now = new Date().toISOString()

      await supabase.from('intelligence_briefings').insert({
        user_id:       user.id,
        briefing_data: data,
        research_date: now,
        week_of:       week,
        briefing_type: 'scheduled',
      })

      type BriefingInsight   = { title: string; body: string }
      type BriefingBenchmark = { name: string; userValue: number | null; industryAvg: number; unit: string }
      const insights       = (data.insights as BriefingInsight[] | undefined) ?? []
      const benchmarks     = (data.benchmarks as BriefingBenchmark[] | undefined) ?? []
      const opportunity    = (data.topOpportunity as string | undefined) ?? ''
      const recommendation = (data.topRecommendation as string | undefined) ?? ''

      await sendPersonalisedWeeklyIntelligenceEmail({
        to: user.email,
        name: user.full_name ?? '',
        weekOf: week,
        insights,
        benchmarks,
        opportunity,
        recommendation,
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
