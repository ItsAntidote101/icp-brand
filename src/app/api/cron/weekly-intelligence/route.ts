import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { sendWeeklyIntelligenceEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const supabase  = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function weekStart(): string {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - d.getUTCDay() + 1)
  return d.toISOString().split('T')[0]
}

async function generateBriefingForUser(profile: {
  industry: string; region: string; channels: string[]; budget: string; icpScore: number | null
}) {
  const prompt = `You are a competitive intelligence analyst. Generate a weekly briefing for:
Industry: ${profile.industry}, Region: ${profile.region}, Channels: ${profile.channels.join(', ')}, Budget: ${profile.budget}, ICP Score: ${profile.icpScore ?? 'unknown'}/100

Return ONLY valid JSON:
{
  "insights": [
    {"id":"i1","type":"market_movement","title":"...","body":"...","source":"...","timeLabel":"This week","implication":null,"recommendation":null},
    {"id":"i2","type":"competitor_strategy","title":"...","body":"...","source":"Market Data","timeLabel":"This week","implication":"...","recommendation":null},
    {"id":"i3","type":"opportunity","title":"...","body":"...","source":null,"timeLabel":"Now","implication":null,"recommendation":"..."},
    {"id":"i4","type":"platform_update","title":"...","body":"...","source":"Platform Update","timeLabel":"This week","implication":null,"recommendation":"..."},
    {"id":"i5","type":"market_movement","title":"...","body":"...","source":"Industry Data","timeLabel":"This week","implication":"...","recommendation":null}
  ],
  "benchmarks": [
    {"name":"Click-Through Rate (CTR)","userValue":null,"industryAvg":2.1,"top10":5.8,"unit":"%","higherIsBetter":true},
    {"name":"Cost Per Acquisition (CPA)","userValue":null,"industryAvg":45,"top10":18,"unit":"$","higherIsBetter":false},
    {"name":"Landing Page Conversion Rate","userValue":null,"industryAvg":3.2,"top10":8.5,"unit":"%","higherIsBetter":true},
    {"name":"Lead Quality Score","userValue":${profile.icpScore ?? 'null'},"industryAvg":52,"top10":78,"unit":"","higherIsBetter":true},
    {"name":"Ad Spend Efficiency","userValue":null,"industryAvg":3.1,"top10":6.8,"unit":"x","higherIsBetter":true},
    {"name":"ICP Health Score","userValue":${profile.icpScore ?? 'null'},"industryAvg":55,"top10":82,"unit":"","higherIsBetter":true}
  ],
  "competitorPositions":[{"label":"Competitor A","x":72,"y":68},{"label":"Competitor B","x":45,"y":75},{"label":"Competitor C","x":60,"y":38},{"label":"Competitor D","x":30,"y":55}],
  "userPosition":{"x":${Math.min(95, Math.max(10, (profile.icpScore ?? 50) * 0.85))},"y":${Math.min(95, Math.max(10, profile.icpScore ?? 50))}},
  "topOpportunity": "one specific opportunity sentence",
  "topRecommendation": "one specific action sentence"
}
Make benchmarks realistic for ${profile.industry} in ${profile.region}.`

  const stream = anthropic.messages.stream({
    model: 'claude-opus-4-7',
    max_tokens: 2000,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: prompt }],
  })

  const msg  = await stream.finalMessage()
  const raw  = msg.content.find(b => b.type === 'text')?.text ?? ''
  const clean = raw.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim()
  return JSON.parse(clean) as Record<string, unknown>
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: users, error: usersErr } = await supabase
    .from('users')
    .select('id, email, full_name')
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
      // Skip if briefing already generated this week
      const { data: existing } = await supabase
        .from('intelligence_briefings')
        .select('id')
        .eq('user_id', user.id)
        .eq('week_of', week)
        .eq('briefing_type', 'scheduled')
        .limit(1)
        .single()

      if (existing) { continue }

      // Fetch questionnaire context
      const { data: qData } = await supabase
        .from('questionnaire_responses')
        .select('data')
        .eq('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const qd: Record<string, string> = (qData?.data as Record<string, string>) ?? {}

      // Fetch latest ICP score
      const { data: latestReport } = await supabase
        .from('reports')
        .select('report_summary')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()

      let icpScore: number | null = null
      if (latestReport?.report_summary) {
        try {
          const parsed = JSON.parse(latestReport.report_summary as string)
          icpScore = parsed.overall_score ?? parsed.health_score ?? null
        } catch { /* noop */ }
      }

      const profile = {
        industry: qd.industry ?? qd.business_type ?? 'digital marketing',
        region:   qd.region   ?? qd.country       ?? 'East Africa',
        channels: qd.ad_channels ? String(qd.ad_channels).split(',') : ['Meta', 'Google'],
        budget:   qd.monthly_budget ?? qd.budget  ?? '',
        icpScore,
      }

      const data    = await generateBriefingForUser(profile)
      const now     = new Date().toISOString()

      // Save briefing
      await supabase.from('intelligence_briefings').insert({
        user_id:       user.id,
        briefing_data: data,
        research_date: now,
        week_of:       week,
        briefing_type: 'scheduled',
      })

      // Send weekly email
      type BriefingInsight = { title: string; body: string }
      type BriefingBenchmark = { name: string; userValue: number | null; industryAvg: number; unit: string }
      const insights    = (data.insights as BriefingInsight[] | undefined) ?? []
      const benchmarks  = (data.benchmarks as BriefingBenchmark[] | undefined) ?? []
      const opportunity = (data.topOpportunity as string | undefined) ?? ''
      const recommendation = (data.topRecommendation as string | undefined) ?? ''

      await sendWeeklyIntelligenceEmail({
        to: user.email,
        name: user.full_name ?? '',
        weekOf: week,
        insights,
        benchmarks,
        opportunity,
        recommendation,
      })

      processed++
    } catch (err) {
      console.error('[weekly-intel] error processing user:', err)
      failed++
    }
  }

  return NextResponse.json({ ok: true, processed, failed, week })
}
