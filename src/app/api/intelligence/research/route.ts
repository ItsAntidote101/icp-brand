import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { getSession } from '@/lib/session'

export const dynamic    = 'force-dynamic'
export const maxDuration = 120  // web search calls can take 60-90s

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ─── Refresh limits by tier ───────────────────────────────────────────────────

type Tier = 'free' | 'starter' | 'pro' | 'agency'

const REFRESH_INTERVALS_HOURS: Record<Tier, number | null> = {
  free:    null,
  starter: 168,  // 7 days
  pro:     24,
  agency:  8,
}

const REFRESH_LIMITS: Record<Tier, number> = {
  free:    0,
  starter: 1,
  pro:     1,
  agency:  3,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hoursAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000
}

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

// ─── Full questionnaire profile ───────────────────────────────────────────────

type FullProfile = {
  // Identity
  companyName:     string
  product:         string
  industry:        string
  businessModel:   string
  region:          string
  // Audience
  targetAudience:  string
  decisionMaker:   string
  coreProblem:     string
  discovery:       string
  // Channels & spend
  channels:        string[]
  budget:          string
  targeting:       string
  landingPage:     string
  // Performance (raw)
  monthlyLeads:    string
  closeRate:       string
  ltv:             string
  dealSize:        string
  // Funnel
  primaryCta:      string
  trustSignals:    string
  mobilityScore:   string
  // Computed
  icpScore:        number | null
  estimatedCpa:    string   // budget / leads if both present
  ltvCacRatio:     string   // ltv / estimatedCpa if both present
}

function buildProfile(
  qd: Record<string, string>,
  r: Record<string, unknown>,
  icpScore: number | null,
): FullProfile {
  // Named columns first, fall back to numeric questionnaire keys
  const industry      = qd.industry ?? qd.business_type ?? (r[2] as string) ?? ''
  const region        = qd.region   ?? qd.country       ?? (r[11] as string) ?? ''
  const rawChannels   = qd.ad_channels ?? (Array.isArray(r[9]) ? (r[9] as string[]).join(',') : (r[9] as string) ?? '')
  const channels      = rawChannels ? rawChannels.split(',').map(s => s.trim()).filter(Boolean) : ['Meta', 'Google']
  const budget        = qd.monthly_budget ?? qd.budget ?? (r[13] as string) ?? ''
  const product       = qd.product_service ?? qd.offer ?? (r[1] as string) ?? ''
  const businessModel = qd.business_model ?? (r[23] as string) ?? ''
  const targetAudience = qd.target_audience ?? qd.icp_description ?? (r[8] as string) ?? ''
  const decisionMaker  = (r[7] as string) ?? (r[26] as string) ?? ''
  const coreProblem    = (r[4] as string) ?? ''
  const discovery      = (r[5] as string) ?? ''
  const targeting      = (r[12] as string) ?? ''
  const landingPage    = (r[10] as string) ?? ''
  const monthlyLeads   = (r[14] as string) ?? ''
  const closeRate      = (r[21] as string) ?? ''
  const ltv            = (r[22] as string) ?? (r[6] as string) ?? (r[25] as string) ?? ''
  const dealSize       = (r[6] as string) ?? (r[25] as string) ?? ''
  const primaryCta     = (r[16] as string) ?? ''
  const trustSignals   = (r[19] as string) ?? ''
  const mobilityScore  = (r[18] as string) ?? ''

  // Derived metrics
  let estimatedCpa = ''
  let ltvCacRatio  = ''
  const budgetNum = parseFloat(budget.replace(/[^0-9.]/g, ''))
  const leadsNum  = parseFloat(monthlyLeads.replace(/[^0-9.]/g, ''))
  const ltvNum    = parseFloat(ltv.replace(/[^0-9.]/g, ''))
  if (budgetNum > 0 && leadsNum > 0) {
    const cpa = budgetNum / leadsNum
    estimatedCpa = `${cpa.toFixed(0)} (computed: budget / leads)`
    if (ltvNum > 0) {
      ltvCacRatio = `${(ltvNum / cpa).toFixed(1)}:1`
    }
  }

  return {
    companyName: '',  // populated by caller
    product: product || industry,
    industry:       industry || 'digital marketing',
    businessModel:  businessModel || 'Not specified',
    region:         region || 'Kenya',
    targetAudience, decisionMaker, coreProblem, discovery,
    channels, budget, targeting, landingPage,
    monthlyLeads, closeRate, ltv, dealSize,
    primaryCta, trustSignals, mobilityScore,
    icpScore, estimatedCpa, ltvCacRatio,
  }
}

// ─── Intelligence Briefing (with live web research) ──────────────────────────

async function generateBriefing(profile: FullProfile & { companyName: string }): Promise<Record<string, unknown>> {

  const now        = new Date()
  const dayOfWeek  = now.toLocaleDateString('en-GB', { weekday: 'long' })
  const dateStr    = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const monthYear  = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const systemPrompt = `You are a senior competitive intelligence analyst specialising in digital advertising and paid acquisition.

Your job is to produce a highly specific, data-backed market intelligence briefing for a paying subscriber. Generic advice is unacceptable. Every insight must reference actual numbers, named platforms, or real trends specific to this exact industry and region.

You have access to web_search. You MUST perform the following searches before writing any part of your output:
1. Search "${profile.industry} digital advertising benchmarks ${profile.region} ${monthYear}"
2. Search "${profile.channels.slice(0, 2).join(' ')} CPC CPM ${profile.region} ${profile.industry} 2025"
3. Search "${profile.industry} competitors ${profile.region} digital marketing"
4. Search "${profile.channels[0] ?? 'Meta'} algorithm update ${monthYear}"
${profile.landingPage ? `5. Search "${profile.landingPage}" to understand their offer and landing page positioning` : ''}

Use the search results as your primary data source. Only fall back to training knowledge for context you cannot find via search. Cite real sources in the "source" field. Do not use em dashes or en dashes. Use commas, colons, or full stops instead.`

  const userPrompt = `Generate a market intelligence briefing as of ${dayOfWeek}, ${dateStr} for this marketer.

MARKETER PROFILE:
- Company: ${profile.companyName || 'Not provided'}
- Product/Service: ${profile.product}
- Industry: ${profile.industry}
- Business model: ${profile.businessModel}
- Target region: ${profile.region}
- Target audience: ${profile.targetAudience || 'Not specified'}
- Decision maker/buyer: ${profile.decisionMaker || 'Not specified'}
- Core problem they solve: ${profile.coreProblem || 'Not specified'}
- Ad channels active: ${profile.channels.join(', ')}
- Monthly ad budget: ${profile.budget || 'Not specified'}
- Current targeting approach: ${profile.targeting || 'Not specified'}
${profile.landingPage ? `- Landing page: ${profile.landingPage}` : ''}
- Monthly leads generated: ${profile.monthlyLeads || 'Not specified'}
- Close/conversion rate: ${profile.closeRate || 'Not specified'}%
- Customer LTV: ${profile.ltv || 'Not specified'}
- Estimated CPA: ${profile.estimatedCpa || 'Not computed (missing budget or leads data)'}
- LTV:CAC ratio: ${profile.ltvCacRatio || 'Not computed'}
- ICP Health Score: ${profile.icpScore ?? 'Not yet scored'}/100

REQUIRED: Use your web search results to populate all fields. Every insight must reference specific numbers or named entities. The "source" field must name the actual publication, platform, or dataset you found the data in.

For "timeLabel", use realistic relative timestamps reflecting when each underlying event/data point was published: "2 days ago", "3 days ago", "Earlier this week", "Yesterday", "Last week". Vary them. Never use "Now" or "This week" for every item.

For "competitorPositions", research actual competitor names in the ${profile.industry} space in ${profile.region}. Use the real company names, not "Competitor A". Position them on a 0-100 x/y grid where x = market presence and y = ICP targeting quality.

For "benchmarks", populate industryAvg and top10 from your web search results for the ${profile.industry} industry in ${profile.region}. If the user's own metrics can be computed (see profile above), populate userValue. Otherwise null.

Return ONLY valid JSON with no markdown fences:
{
  "insights": [
    {
      "id": "i1",
      "type": "market_movement",
      "title": "<specific title with numbers from web research>",
      "body": "<2-3 sentences with specific data from search results, no generic statements>",
      "source": "<actual publication or dataset name from search>",
      "timeLabel": "<realistic relative timestamp>",
      "implication": null,
      "recommendation": null
    },
    {
      "id": "i2",
      "type": "competitor_strategy",
      "title": "<what named competitor(s) in ${profile.region} are doing>",
      "body": "<specific observation with real company or campaign details from web research>",
      "source": "<actual source>",
      "timeLabel": "<realistic relative timestamp>",
      "implication": "<specific implication for this marketer given their product and audience>",
      "recommendation": null
    },
    {
      "id": "i3",
      "type": "opportunity",
      "title": "<specific, named opportunity in the ${profile.industry} market in ${profile.region}>",
      "body": "<actionable opportunity with specifics: platform, audience segment, estimated cost or reach>",
      "source": "<actual source or null>",
      "timeLabel": "<realistic relative timestamp>",
      "implication": null,
      "recommendation": "<specific action: what to do, where, targeting parameters>"
    },
    {
      "id": "i4",
      "type": "platform_update",
      "title": "<specific algorithm or policy update on ${profile.channels[0] ?? 'Meta'} or Google>",
      "body": "<what changed, when it was announced, how it affects ${profile.industry} campaigns>",
      "source": "<platform blog, press release, or trade publication>",
      "timeLabel": "<realistic relative timestamp>",
      "implication": null,
      "recommendation": "<specific campaign adjustment to make>"
    },
    {
      "id": "i5",
      "type": "market_movement",
      "title": "<second market movement specific to ${profile.industry} in ${profile.region}>",
      "body": "<another market shift with specific numbers or named entities>",
      "source": "<actual source>",
      "timeLabel": "<realistic relative timestamp>",
      "implication": "<what this means for their campaigns given their budget and channels>",
      "recommendation": null
    }
  ],
  "benchmarks": [
    { "name": "Click-Through Rate (CTR)", "userValue": null, "industryAvg": <from web research for ${profile.industry} in ${profile.region}>, "top10": <from web research>, "unit": "%", "higherIsBetter": true },
    { "name": "Cost Per Acquisition (CPA)", "userValue": ${profile.estimatedCpa ? `<compute from profile: ${profile.estimatedCpa}>` : 'null'}, "industryAvg": <from web research>, "top10": <from web research>, "unit": "<currency for ${profile.region}>", "higherIsBetter": false },
    { "name": "Landing Page Conversion Rate", "userValue": null, "industryAvg": <from web research>, "top10": <from web research>, "unit": "%", "higherIsBetter": true },
    { "name": "Lead Quality Score", "userValue": ${profile.icpScore ?? 'null'}, "industryAvg": <typical for ${profile.industry}>, "top10": <typical top 10%>, "unit": "", "higherIsBetter": true },
    { "name": "LTV:CAC Ratio", "userValue": ${profile.ltvCacRatio ? `"${profile.ltvCacRatio}"` : 'null'}, "industryAvg": <typical for ${profile.industry}>, "top10": <top performers>, "unit": ":1", "higherIsBetter": true },
    { "name": "ICP Health Score", "userValue": ${profile.icpScore ?? 'null'}, "industryAvg": 55, "top10": 82, "unit": "", "higherIsBetter": true }
  ],
  "competitorPositions": [
    { "label": "<real competitor name from web search>", "x": <market presence 0-100>, "y": <ICP quality 0-100> },
    { "label": "<real competitor name>", "x": <integer>, "y": <integer> },
    { "label": "<real competitor name>", "x": <integer>, "y": <integer> },
    { "label": "<real competitor name>", "x": <integer>, "y": <integer> }
  ],
  "userPosition": { "x": ${Math.min(95, Math.max(10, (profile.icpScore ?? 50) * 0.85))}, "y": ${Math.min(95, Math.max(10, profile.icpScore ?? 50))} }
}`

  const res = await anthropic.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 4000,
    system:     systemPrompt,
    tools:      [{ type: 'web_search_20250305' as const, name: 'web_search' }],
    messages:   [{ role: 'user', content: userPrompt }],
  })

  const raw   = res.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
  const clean = raw.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim()
  const parsed = JSON.parse(clean)
  return stripDashes(parsed) as Record<string, unknown>
}

// ─── Ask-your-market question (with live web research) ────────────────────────

async function answerQuestion(
  question: string,
  profile: FullProfile,
): Promise<{ answer: string; sources: string[] }> {

  const systemPrompt = `You are a competitive intelligence analyst specialising in digital advertising in ${profile.region}.

Use web_search to find current, specific data before answering. You MUST search for at least two relevant queries before composing your answer. Cite real sources. No generic advice. Do not use em dashes or en dashes.`

  const userPrompt = `Marketer context:
- Product/service: ${profile.product}
- Industry: ${profile.industry}
- Business model: ${profile.businessModel}
- Region: ${profile.region}
- Ad channels: ${profile.channels.join(', ')}
- Monthly budget: ${profile.budget || 'not specified'}
- Target audience: ${profile.targetAudience || 'not specified'}
- Estimated CPA: ${profile.estimatedCpa || 'not computed'}
- LTV:CAC: ${profile.ltvCacRatio || 'not computed'}

Question: ${question}

Search for current data specific to their industry and region. Answer with:
1. A direct answer with real numbers from your search
2. 2-3 specific insights referencing actual platforms, campaigns, or market data
3. One clear, actionable recommendation

Keep under 350 words. End with:
Sources: [comma-separated list of actual sources you searched]`

  const res = await anthropic.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 1200,
    system:     systemPrompt,
    tools:      [{ type: 'web_search_20250305' as const, name: 'web_search' }],
    messages:   [{ role: 'user', content: userPrompt }],
  })

  const text   = res.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
  const parts  = text.split(/\nSources:\s*/i)
  const answer = (parts[0] ?? text).trim()
  const sources = parts[1]
    ? parts[1].split(',').map(s => s.trim()).filter(Boolean)
    : []

  return { answer, sources }
}

// ─── Shared questionnaire data loader ────────────────────────────────────────

async function loadFullProfile(
  userId: string,
  email: string,
  icpScore: number | null,
  companyName: string,
): Promise<FullProfile & { companyName: string }> {

  const { data: qData } = await supabase
    .from('questionnaire_responses')
    .select('data')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const qd: Record<string, string> = (qData?.data as Record<string, string>) ?? {}

  // Always load raw numeric questionnaire for full context
  const { data: rawQ } = await supabase
    .from('questionnaires')
    .select('responses')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const r: Record<string, unknown> = (rawQ?.responses as Record<string, unknown>) ?? {}

  const profile = buildProfile(qd, r, icpScore)
  return { ...profile, companyName }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { email, type, question } = await req.json()
    if (email && session.email !== email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const { data: userData } = await supabase
      .from('users')
      .select('id, full_name, company_name, subscription_tier, last_refresh_at, refresh_count_today, refresh_count_reset_date, questions_today, questions_reset_date')
      .eq('email', email)
      .single()

    if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // ── FETCH: return latest stored briefing ──────────────────────────────────
    if (type === 'fetch') {
      const { data: latest } = await supabase
        .from('intelligence_briefings')
        .select('briefing_data, research_date')
        .eq('user_id', userData.id)
        .order('research_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      const tier = (userData.subscription_tier ?? 'free') as Tier
      const intervalHours = REFRESH_INTERVALS_HOURS[tier] ?? REFRESH_INTERVALS_HOURS.pro

      const nextRefreshAvailable = userData.last_refresh_at && intervalHours && hoursAgo(userData.last_refresh_at) < intervalHours
        ? new Date(new Date(userData.last_refresh_at).getTime() + intervalHours * 3_600_000).toISOString()
        : null

      const today = new Date().toISOString().split('T')[0]
      const refreshCountToday = tier === 'agency' && userData.refresh_count_reset_date === today
        ? (userData.refresh_count_today ?? 0)
        : 0

      return NextResponse.json({
        briefing: latest ? { ...(latest.briefing_data as Record<string, unknown>), updatedAt: latest.research_date } : null,
        nextRefreshAvailable,
        tier,
        refreshCountToday,
      })
    }

    // ── REFRESH: tier-aware rate limiting ─────────────────────────────────────
    if (type === 'refresh') {
      const tier = (userData.subscription_tier ?? 'free') as Tier
      const intervalHours = REFRESH_INTERVALS_HOURS[tier]

      if (!intervalHours) {
        return NextResponse.json({
          error: 'upgrade_required',
          message: 'On-demand intelligence refresh requires a paid subscription.',
          upgradeUrl: '/pricing',
        }, { status: 403 })
      }

      const lastRefresh    = userData.last_refresh_at ? new Date(userData.last_refresh_at) : null
      const hoursSinceLast = lastRefresh ? (Date.now() - lastRefresh.getTime()) / 3_600_000 : Infinity

      if (hoursSinceLast < intervalHours) {
        const nextRefreshAt = new Date(lastRefresh!.getTime() + intervalHours * 3_600_000)
        const msRemaining   = nextRefreshAt.getTime() - Date.now()
        return NextResponse.json({
          error:            'rate_limited',
          message:          'Refresh not available yet.',
          nextRefreshAt:    nextRefreshAt.toISOString(),
          hoursRemaining:   Math.ceil(msRemaining / 3_600_000),
          minutesRemaining: Math.ceil(msRemaining / 60_000),
          tier,
          upgradeAvailable: tier !== 'agency',
        }, { status: 429 })
      }

      if (tier === 'agency') {
        const today      = new Date().toISOString().split('T')[0]
        const resetDate  = userData.refresh_count_reset_date
        const countToday = resetDate === today ? (userData.refresh_count_today ?? 0) : 0

        if (countToday >= REFRESH_LIMITS.agency) {
          const midnight = new Date(); midnight.setUTCHours(24, 0, 0, 0)
          return NextResponse.json({
            error:            'rate_limited',
            message:          `You have used all ${REFRESH_LIMITS.agency} refreshes today.`,
            nextRefreshAt:    midnight.toISOString(),
            hoursRemaining:   Math.ceil((midnight.getTime() - Date.now()) / 3_600_000),
            minutesRemaining: Math.ceil((midnight.getTime() - Date.now()) / 60_000),
            tier,
            upgradeAvailable: false,
          }, { status: 429 })
        }

        const today2 = new Date().toISOString().split('T')[0]
        const { data: updatedRows } = await supabase
          .from('users')
          .update({ refresh_count_today: countToday + 1, refresh_count_reset_date: today2 })
          .eq('id', userData.id)
          .eq('refresh_count_today', countToday)
          .select('id')

        if (!updatedRows || updatedRows.length === 0) {
          const midnight = new Date(); midnight.setUTCHours(24, 0, 0, 0)
          return NextResponse.json({
            error:            'rate_limited',
            message:          'Refresh limit reached.',
            nextRefreshAt:    midnight.toISOString(),
            hoursRemaining:   Math.ceil((midnight.getTime() - Date.now()) / 3_600_000),
            minutesRemaining: Math.ceil((midnight.getTime() - Date.now()) / 60_000),
            tier,
            upgradeAvailable: false,
          }, { status: 429 })
        }
      }

      // Fetch ICP score from latest report
      let icpScore: number | null = null
      const { data: latestReport } = await supabase
        .from('reports')
        .select('report_summary')
        .eq('user_id', userData.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (latestReport?.report_summary) {
        try {
          const parsed = JSON.parse(latestReport.report_summary as string)
          icpScore = parsed.overall_score ?? parsed.health_score ?? null
        } catch { /* noop */ }
      }

      const profile = await loadFullProfile(
        userData.id,
        email,
        icpScore,
        userData.company_name ?? '',
      )

      const data = await generateBriefing(profile)
      const now  = new Date().toISOString()

      await supabase.from('intelligence_briefings').insert({
        user_id:       userData.id,
        briefing_data: data,
        research_date: now,
        week_of:       weekStart(),
        briefing_type: 'on_demand',
      })

      const today      = now.split('T')[0]
      const resetDate  = userData.refresh_count_reset_date
      const countToday = resetDate === today ? (userData.refresh_count_today ?? 0) : 0
      const refreshCountUpdate = tier === 'agency'
        ? { last_refresh_at: now }
        : { last_refresh_at: now, refresh_count_today: countToday + 1, refresh_count_reset_date: today }
      await supabase.from('users').update(refreshCountUpdate).eq('id', userData.id)

      const nextAt = new Date(Date.now() + intervalHours * 3_600_000).toISOString()
      const todayStr2    = now.split('T')[0]
      const newCountToday = tier === 'agency'
        ? (userData.refresh_count_reset_date === todayStr2 ? (userData.refresh_count_today ?? 0) + 1 : 1)
        : 0
      return NextResponse.json({
        briefing: { ...data, updatedAt: now },
        nextRefreshAvailable: nextAt,
        tier,
        refreshCountToday: newCountToday,
      })
    }

    // ── QUESTION: rate-limit 5/day ─────────────────────────────────────────────
    if (type === 'question') {
      if (!question) return NextResponse.json({ error: 'Missing question' }, { status: 400 })

      const today  = new Date().toISOString().split('T')[0]
      const qToday = userData.questions_reset_date === today ? (userData.questions_today ?? 0) : 0
      if (qToday >= 5) {
        return NextResponse.json({ error: 'Daily question limit reached (5/day)' }, { status: 429 })
      }

      let icpScore: number | null = null
      const { data: latestReport } = await supabase
        .from('reports')
        .select('report_summary')
        .eq('user_id', userData.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (latestReport?.report_summary) {
        try {
          const parsed = JSON.parse(latestReport.report_summary as string)
          icpScore = parsed.overall_score ?? parsed.health_score ?? null
        } catch { /* noop */ }
      }

      const profile = await loadFullProfile(userData.id, email, icpScore, userData.company_name ?? '')
      const { answer, sources } = await answerQuestion(question, profile)

      await supabase.from('intelligence_questions').insert({
        user_id:  userData.id,
        question,
        answer,
        sources:  JSON.stringify(sources),
        asked_at: new Date().toISOString(),
      })

      await supabase.from('users').update({
        questions_today:      qToday + 1,
        questions_reset_date: today,
      }).eq('id', userData.id)

      return NextResponse.json({ answer, sources })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err) {
    console.error('[intelligence/research] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
