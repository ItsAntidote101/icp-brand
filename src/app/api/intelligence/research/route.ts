import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Anthropic from '@anthropic-ai/sdk'
import { getSession } from '@/lib/session'
import { generateMarketBriefing, loadOwnNumbers } from '@/lib/market-briefing'

export const dynamic    = 'force-dynamic'
export const maxDuration = 120  // web search calls can take 60-90s

const supabase = supabaseAdmin()

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
  buyTrigger:      string
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
    buyTrigger: typeof r[26] === 'string' ? (r[26] as string).slice(0, 300) : '',
    channels, budget, targeting, landingPage,
    monthlyLeads, closeRate, ltv, dealSize,
    primaryCta, trustSignals, mobilityScore,
    icpScore, estimatedCpa, ltvCacRatio,
  }
}

// ─── Ask-your-market question (with live web research) ────────────────────────

async function answerQuestion(
  question: string,
  profile: FullProfile,
): Promise<{ answer: string; sources: string[]; sourceUrls: string[] }> {

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
Sources: [comma-separated list of actual source names you searched]
SourceURLs: [comma-separated list of actual URLs you found, in the same order as Sources, or blank if no URL available]`

  const res = await anthropic.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 1200,
    system:     systemPrompt,
    tools:      [{ type: 'web_search_20250305' as const, name: 'web_search' }],
    messages:   [{ role: 'user', content: userPrompt }],
  }, {
    headers: { 'anthropic-beta': 'web-search-2025-03-05' },
  })

  const text   = res.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
  const partsS = text.split(/\nSources:\s*/i)
  const answer = (partsS[0] ?? text).trim()
  const afterSources = partsS[1] ?? ''
  const partsU = afterSources.split(/\nSourceURLs:\s*/i)
  const sources = partsU[0]
    ? partsU[0].split(',').map(s => s.trim()).filter(Boolean)
    : []
  const sourceUrls = partsU[1]
    ? partsU[1].split(',').map(s => s.trim()).filter(Boolean)
    : []

  return { answer, sources, sourceUrls }
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

      const own  = await loadOwnNumbers(supabase, userData.id)
      const data = await generateMarketBriefing(anthropic, profile, own)
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
      const { answer, sources, sourceUrls } = await answerQuestion(question, profile)

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

      return NextResponse.json({ answer, sources, sourceUrls })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err) {
    console.error('[intelligence/research] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
