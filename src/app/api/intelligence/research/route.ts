import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

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
  d.setUTCDate(d.getUTCDate() - d.getUTCDay() + 1) // Monday
  return d.toISOString().split('T')[0]
}

// ─── Claude prompt ────────────────────────────────────────────────────────────

async function generateBriefing(profile: {
  industry: string; region: string; channels: string[]; budget: string; icpScore: number | null
}): Promise<Record<string, unknown>> {

  const prompt = `You are a competitive intelligence analyst for digital advertising. Generate a weekly intelligence briefing for this marketer:

Industry: ${profile.industry}
Region: ${profile.region}
Ad channels: ${profile.channels.join(', ') || 'not specified'}
Monthly budget: ${profile.budget || 'not specified'}
ICP Health Score: ${profile.icpScore ?? 'unknown'}/100

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "insights": [
    {
      "id": "i1",
      "type": "market_movement",
      "title": "specific insight title with numbers if possible",
      "body": "2-3 sentence insight with specific details relevant to their industry and region",
      "source": "source name e.g. Google Trends",
      "timeLabel": "This week",
      "implication": null,
      "recommendation": null
    },
    {
      "id": "i2",
      "type": "competitor_strategy",
      "title": "what competitors are doing",
      "body": "specific observation about competitor behavior in their market",
      "source": "Market Data",
      "timeLabel": "This week",
      "implication": "specific implication for this marketer",
      "recommendation": null
    },
    {
      "id": "i3",
      "type": "opportunity",
      "title": "specific opportunity in their market",
      "body": "actionable opportunity with specifics",
      "source": null,
      "timeLabel": "Now",
      "implication": null,
      "recommendation": "specific action they should take"
    },
    {
      "id": "i4",
      "type": "platform_update",
      "title": "relevant platform or algorithm update",
      "body": "what changed and how it affects campaigns in their industry",
      "source": "Platform Update",
      "timeLabel": "This week",
      "implication": null,
      "recommendation": "specific action to take"
    },
    {
      "id": "i5",
      "type": "market_movement",
      "title": "second market movement insight",
      "body": "another relevant market shift",
      "source": "Industry Data",
      "timeLabel": "This week",
      "implication": "what this means for their campaigns",
      "recommendation": null
    }
  ],
  "benchmarks": [
    { "name": "Click-Through Rate (CTR)", "userValue": null, "industryAvg": 2.1, "top10": 5.8, "unit": "%", "higherIsBetter": true },
    { "name": "Cost Per Acquisition (CPA)", "userValue": null, "industryAvg": 45, "top10": 18, "unit": "$", "higherIsBetter": false },
    { "name": "Landing Page Conversion Rate", "userValue": null, "industryAvg": 3.2, "top10": 8.5, "unit": "%", "higherIsBetter": true },
    { "name": "Lead Quality Score", "userValue": ${profile.icpScore ?? 'null'}, "industryAvg": 52, "top10": 78, "unit": "", "higherIsBetter": true },
    { "name": "Ad Spend Efficiency", "userValue": null, "industryAvg": 3.1, "top10": 6.8, "unit": "x", "higherIsBetter": true },
    { "name": "ICP Health Score", "userValue": ${profile.icpScore ?? 'null'}, "industryAvg": 55, "top10": 82, "unit": "", "higherIsBetter": true }
  ],
  "competitorPositions": [
    { "label": "Competitor A", "x": 72, "y": 68 },
    { "label": "Competitor B", "x": 45, "y": 75 },
    { "label": "Competitor C", "x": 60, "y": 38 },
    { "label": "Competitor D", "x": 30, "y": 55 }
  ],
  "userPosition": { "x": ${Math.min(95, Math.max(10, (profile.icpScore ?? 50) * 0.85))}, "y": ${Math.min(95, Math.max(10, profile.icpScore ?? 50))} }
}

Make benchmarks realistic for the ${profile.industry} industry in ${profile.region}. Adjust CTR, CPA, conversion rates to match industry norms. Insights must be specific to their industry and region — no generic advice.`

  const stream = anthropic.messages.stream({
    model: 'claude-opus-4-7',
    max_tokens: 2000,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: prompt }],
  })

  const msg = await stream.finalMessage()
  const raw = msg.content.find(b => b.type === 'text')?.text ?? ''

  // Strip markdown code fences if present
  const clean = raw.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim()
  return JSON.parse(clean)
}

async function answerQuestion(
  question: string,
  profile: { industry: string; region: string; channels: string[] }
): Promise<{ answer: string; sources: string[] }> {

  const prompt = `You are a competitive intelligence analyst specializing in digital advertising.

Marketer context:
- Industry: ${profile.industry}
- Region: ${profile.region}
- Ad channels: ${profile.channels.join(', ') || 'not specified'}

Question: ${question}

Answer specifically for their industry and region. Include:
1. A direct answer with numbers/benchmarks where relevant
2. 2-3 specific insights
3. One clear recommendation

Keep it under 300 words. Be specific — no generic advice. End with a list of data sources you referenced.

Format:
[Your answer here]

Sources: [comma-separated list of sources]`

  const stream = anthropic.messages.stream({
    model: 'claude-opus-4-7',
    max_tokens: 800,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: prompt }],
  })

  const msg    = await stream.finalMessage()
  const text   = msg.content.find(b => b.type === 'text')?.text ?? ''
  const parts  = text.split(/\nSources:\s*/i)
  const answer = parts[0].trim()
  const sources = parts[1]
    ? parts[1].split(',').map(s => s.trim()).filter(Boolean)
    : ['Industry research', 'Platform data']

  return { answer, sources }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { email, type, question } = await req.json()

    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    // Fetch user record
    const { data: userData } = await supabase
      .from('users')
      .select('id, full_name, subscription_tier, last_refresh_at, refresh_count_today, refresh_count_reset_date, questions_today, questions_reset_date')
      .eq('email', email)
      .single()

    if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // ── FETCH: just return latest stored briefing ─────────────────────────────
    if (type === 'fetch') {
      const { data: latest } = await supabase
        .from('intelligence_briefings')
        .select('briefing_data, research_date')
        .eq('user_id', userData.id)
        .order('research_date', { ascending: false })
        .limit(1)
        .single()

      const tier = (userData.subscription_tier ?? 'free') as Tier
      const intervalHours = REFRESH_INTERVALS_HOURS[tier] ?? REFRESH_INTERVALS_HOURS.pro

      const nextRefreshAvailable = userData.last_refresh_at && intervalHours && hoursAgo(userData.last_refresh_at) < intervalHours
        ? new Date(new Date(userData.last_refresh_at).getTime() + intervalHours * 3_600_000).toISOString()
        : null

      return NextResponse.json({
        briefing: latest ? { ...(latest.briefing_data as Record<string, unknown>), updatedAt: latest.research_date } : null,
        nextRefreshAvailable,
        tier,
      })
    }

    // ── REFRESH: tier-aware rate limiting ─────────────────────────────────────
    if (type === 'refresh') {
      const tier = (userData.subscription_tier ?? 'free') as Tier
      const intervalHours = REFRESH_INTERVALS_HOURS[tier]

      // Free users cannot refresh on-demand
      if (!intervalHours) {
        return NextResponse.json({
          error: 'upgrade_required',
          message: 'On-demand intelligence refresh requires a paid subscription.',
          upgradeUrl: '/#pricing',
        }, { status: 403 })
      }

      const lastRefresh = userData.last_refresh_at ? new Date(userData.last_refresh_at) : null
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

      // Agency daily count check
      if (tier === 'agency') {
        const today      = new Date().toISOString().split('T')[0]
        const resetDate  = userData.refresh_count_reset_date
        const countToday = resetDate === today ? (userData.refresh_count_today ?? 0) : 0

        if (countToday >= REFRESH_LIMITS.agency) {
          const midnight = new Date(); midnight.setUTCHours(24, 0, 0, 0)
          return NextResponse.json({
            error:         'rate_limited',
            message:       `You have used all ${REFRESH_LIMITS.agency} refreshes today. Your next refresh is available at midnight.`,
            nextRefreshAt: midnight.toISOString(),
            hoursRemaining: Math.ceil((midnight.getTime() - Date.now()) / 3_600_000),
            minutesRemaining: Math.ceil((midnight.getTime() - Date.now()) / 60_000),
            tier,
            upgradeAvailable: false,
          }, { status: 429 })
        }

        // Atomic optimistic-concurrency increment for agency tier
        const today2     = new Date().toISOString().split('T')[0]
        const { data: updatedRows } = await supabase
          .from('users')
          .update({ refresh_count_today: countToday + 1, refresh_count_reset_date: today2 })
          .eq('id', userData.id)
          .eq('refresh_count_today', countToday) // only update if count hasn't changed
          .select('id')

        if (!updatedRows || updatedRows.length === 0) {
          // Another request already incremented — treat as limit reached
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

      // Fetch questionnaire context
      const { data: qData } = await supabase
        .from('questionnaire_responses')
        .select('data')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const qd: Record<string, string> = (qData?.data as Record<string, string>) ?? {}
      const profile = {
        industry: qd.industry ?? qd.business_type ?? 'digital marketing',
        region:   qd.region ?? qd.country ?? qd.location ?? 'East Africa',
        channels: qd.ad_channels ? String(qd.ad_channels).split(',') : ['Meta', 'Google'],
        budget:   qd.monthly_budget ?? qd.budget ?? '',
        icpScore: null as number | null,
      }

      // Get latest ICP score from reports
      const { data: latestReport } = await supabase
        .from('reports')
        .select('report_summary')
        .eq('user_id', userData.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()

      if (latestReport?.report_summary) {
        try {
          const parsed = JSON.parse(latestReport.report_summary as string)
          profile.icpScore = parsed.overall_score ?? parsed.health_score ?? null
        } catch { /* noop */ }
      }

      const data = await generateBriefing(profile)
      const now  = new Date().toISOString()

      // Save briefing
      await supabase.from('intelligence_briefings').insert({
        user_id:      userData.id,
        briefing_data: data,
        research_date: now,
        week_of:       weekStart(),
        briefing_type: 'on_demand',
      })

      // Update refresh tracking (agency count was already atomically incremented above)
      const today      = now.split('T')[0]
      const resetDate  = userData.refresh_count_reset_date
      const countToday = resetDate === today ? (userData.refresh_count_today ?? 0) : 0
      const refreshCountUpdate = tier === 'agency'
        ? { last_refresh_at: now }
        : { last_refresh_at: now, refresh_count_today: countToday + 1, refresh_count_reset_date: today }
      await supabase.from('users').update(refreshCountUpdate).eq('id', userData.id)

      const nextAt = new Date(Date.now() + intervalHours * 3_600_000).toISOString()
      return NextResponse.json({ briefing: { ...data, updatedAt: now }, nextRefreshAvailable: nextAt, tier })
    }

    // ── QUESTION: rate-limit 5/day ─────────────────────────────────────────────
    if (type === 'question') {
      if (!question) return NextResponse.json({ error: 'Missing question' }, { status: 400 })

      const today      = new Date().toISOString().split('T')[0]
      const resetDate  = userData.questions_reset_date
      const qToday     = resetDate === today ? (userData.questions_today ?? 0) : 0

      if (qToday >= 5) {
        return NextResponse.json({ error: 'Daily question limit reached (5/day)' }, { status: 429 })
      }

      const { data: qData } = await supabase
        .from('questionnaire_responses')
        .select('data')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const qd: Record<string, string> = (qData?.data as Record<string, string>) ?? {}
      const profile = {
        industry: qd.industry ?? qd.business_type ?? 'digital marketing',
        region:   qd.region ?? qd.country ?? 'East Africa',
        channels: qd.ad_channels ? String(qd.ad_channels).split(',') : ['Meta', 'Google'],
      }

      const { answer, sources } = await answerQuestion(question, profile)

      // Save question + answer
      await supabase.from('intelligence_questions').insert({
        user_id: userData.id,
        question,
        answer,
        sources: JSON.stringify(sources),
        asked_at: new Date().toISOString(),
      })

      // Update question count
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
