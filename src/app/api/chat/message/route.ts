import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder'
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function parseReport(summary: string): Record<string, unknown> {
  try { return JSON.parse(summary) } catch { return {} }
}

function scoreLabel(s: number): string {
  if (s >= 80) return 'strong'
  if (s >= 60) return 'moderate'
  if (s >= 40) return 'weak'
  return 'critical'
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      email: string
      message: string
      conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
      activeTab?: string
    }
    const { email, message, conversationHistory, activeTab } = body

    if (!email || !message) {
      return NextResponse.json({ error: 'Missing email or message' }, { status: 400 })
    }
    if (session.email !== email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch user with all activity fields
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, company_name, subscription_tier, current_streak, longest_streak, total_fixes_completed, last_seen_intelligence_at, last_seen_overview_at')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parallel fetch: questionnaire + last 5 reports + intelligence
    const [qRes, rRes, iRes] = await Promise.all([
      supabase
        .from('questionnaire_responses')
        .select('data')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('reports')
        .select('report_summary, generated_at')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(5),
      supabase
        .from('intelligence_briefings')
        .select('briefing_data, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    const qd = (qRes.data?.data ?? {}) as Record<string, unknown>
    const allReports = rRes.data ?? []
    const latestReport = allReports[0] ?? null
    const intelligence = iRes.data

    const latest = latestReport ? parseReport(latestReport.report_summary) : {}
    const findings = ((latest.critical_findings ?? latest.findings ?? []) as Array<{ title: string; severity: string; explanation: string }>)
    const quickWins = ((latest.quick_wins ?? []) as Array<{ action: string; impact: string; timeline?: string }>)
    const breakdown = ((latest.breakdown ?? []) as Array<{ label: string; score: number; found: string; why: string }>)
    const currentScore = (latest.overall_score ?? latest.health_score ?? null) as number | null

    // Score trend across all reports
    const scoreTrend = allReports.map(r => {
      const d = parseReport(r.report_summary)
      const s = (d.overall_score ?? d.health_score ?? null) as number | null
      return { date: r.generated_at.slice(0, 10), score: s }
    }).filter(x => x.score !== null)

    const prevScore = scoreTrend.length >= 2 ? scoreTrend[1].score : null
    const scoreDelta = currentScore !== null && prevScore !== null ? currentScore - prevScore : null

    // Days since last diagnosis
    const daysSince = latestReport
      ? Math.floor((Date.now() - new Date(latestReport.generated_at).getTime()) / 86_400_000)
      : null

    // Activity signals: what has this user actually done?
    const hasViewedIntelligence = !!(user.last_seen_intelligence_at)
    const intelligenceLastViewedDaysAgo = user.last_seen_intelligence_at
      ? Math.floor((Date.now() - new Date(user.last_seen_intelligence_at).getTime()) / 86_400_000)
      : null
    const hasNewIntelligence = intelligence && user.last_seen_intelligence_at
      ? new Date(intelligence.created_at) > new Date(user.last_seen_intelligence_at)
      : !!intelligence

    // Build a rich system prompt
    const systemPrompt = `You are a senior performance media buyer and ICP specialist embedded inside the idealicp.com dashboard. Your job is to help ${user.full_name ?? user.email} at ${user.company_name ?? 'their company'} fix their ICP targeting and reduce wasted ad spend. You have full read access to everything on their dashboard.

=== WHO YOU ARE ===
You are not a support agent. You are a practitioner. You think in terms of conversion rates, CPAs, audience overlap, funnel friction, message-to-market fit, and budget allocation. You give the same advice a senior media buyer would give in a strategy call, not a customer service rep reading from a script.

=== THE CLIENT'S PROFILE ===
Name: ${user.full_name ?? 'Unknown'}
Company: ${user.company_name ?? 'Unknown'}
Industry: ${qd.industry ?? qd.business_type ?? 'not specified'}
Region: ${qd.region ?? qd.country ?? 'Kenya'}
Monthly ad budget: KES ${qd.monthly_budget ?? qd.budget ?? 'not specified'}
Ad channels: ${Array.isArray(qd.ad_channels) ? (qd.ad_channels as string[]).join(', ') : (qd.ad_channels ?? 'not specified')}
Target audience: ${qd.target_audience ?? qd.icp_description ?? 'not specified'}
Primary offer: ${qd.product_service ?? qd.offer ?? 'not specified'}
Subscription tier: ${user.subscription_tier}

=== THEIR DIAGNOSTIC NUMBERS ===
Current ICP Health Score: ${currentScore ?? 'no score yet'}/100${currentScore !== null ? ` (${scoreLabel(currentScore)})` : ''}
${scoreDelta !== null ? `Score change since last report: ${scoreDelta > 0 ? '+' : ''}${scoreDelta} points` : 'No previous score to compare'}
${daysSince !== null ? `Days since last diagnosis: ${daysSince}` : ''}
Monthly revenue waste estimate: ${latest.monthly_waste_estimate ?? 'unknown'}
Score history: ${scoreTrend.map(x => `${x.date}: ${x.score}/100`).join(' → ') || 'only one report'}

=== DIMENSION BREAKDOWN ===
${breakdown.length > 0
  ? breakdown.map(b => `${b.label}: ${b.score}/100, ${b.found}. Why it matters: ${b.why}`).join('\n')
  : 'No breakdown available yet'}

=== CRITICAL FINDINGS (unresolved) ===
${findings.length > 0
  ? findings.map((f, i) => `${i + 1}. [${f.severity?.toUpperCase()}] ${f.title}: ${f.explanation}`).join('\n')
  : 'No findings yet'}

=== QUICK WINS AVAILABLE ===
${quickWins.length > 0
  ? quickWins.map((w, i) => `${i + 1}. ${w.action}, Expected impact: ${w.impact}${w.timeline ? ` (${w.timeline})` : ''}`).join('\n')
  : 'No quick wins yet'}

=== USER ACTIVITY ON THE DASHBOARD ===
Total fixes marked complete: ${user.total_fixes_completed ?? 0}
Implementation streak: ${user.current_streak ?? 0} week${(user.current_streak ?? 0) !== 1 ? 's' : ''} (longest: ${user.longest_streak ?? 0})
Total diagnostic reports run: ${allReports.length}
Current dashboard tab: ${activeTab ?? 'overview'}
Has viewed Intelligence tab: ${hasViewedIntelligence ? `yes, ${intelligenceLastViewedDaysAgo === 0 ? 'today' : `${intelligenceLastViewedDaysAgo} days ago`}` : 'never'}
New intelligence available: ${hasNewIntelligence ? 'yes, they have not read this week\'s briefing' : 'no'}

=== MARKET INTELLIGENCE SUMMARY ===
${intelligence ? JSON.stringify(intelligence.briefing_data).slice(0, 500) : 'No intelligence briefing generated yet'}

=== HOW YOU MUST BEHAVE ===
1. Always reference their actual numbers. Never give generic marketing advice.
2. If they are on the Intelligence tab, they are probably looking for competitive context, lean into that.
3. If their score has not moved in 14+ days, open with urgency around the daily KES waste.
4. If they have completed fixes, acknowledge the progress and tell them what to do next.
5. If they have not viewed the Intelligence tab, recommend it when relevant.
6. Be specific about their findings by name. Do not say "your top finding", say what it actually is.
7. When you give recommendations, tie them to a specific score dimension and its impact.
8. If they ask for ad copy, write it specifically for their ICP, region, and offer.
9. Responses should be direct and concise: 3-5 sentences unless they ask for detail.
10. End every response with one specific, actionable next step they can take today.
11. No em dashes, no en dashes. No opening with "Great question!" or "I'd be happy to help!"

=== ESCALATION ===
If the conversation requires access to their actual ad account data, is complex enough to warrant a human strategy session, or the user seems frustrated, say exactly: "This is worth getting our team's eyes on. Want me to request a human review?", then stop.`

    // Sanitize history
    const safeHistory = (Array.isArray(conversationHistory) ? conversationHistory : [])
      .filter((m): m is { role: 'user' | 'assistant'; content: string } =>
        (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
      )
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }))

    // Call Claude Sonnet with adaptive thinking
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      messages: [
        ...safeHistory,
        {
          role: 'user',
          content: `${message}\n\n[Generate 3 follow-up question suggestions the user might want to ask next, based on their specific situation. Return them as a JSON array on the very last line of your response, formatted exactly like: SUGGESTIONS:["question 1","question 2","question 3"], no newline after it, no extra text after it.]`,
        },
      ],
    })
    const msg = await stream.finalMessage()
    const fullText = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')

    // Strip any em/en dashes from AI output
    const sanitizedText = fullText
      .replace(/ — /g, ', ').replace(/— /g, ', ').replace(/—/g, '-')
      .replace(/ – /g, ', ').replace(/–/g, '-')

    // Extract suggestions from the last line
    let reply = sanitizedText
    let suggestedQuestions: string[] = []
    const sugMatch = sanitizedText.match(/SUGGESTIONS:(\[.*?\])\s*$/)
    if (sugMatch) {
      try {
        suggestedQuestions = JSON.parse(sugMatch[1]) as string[]
        reply = fullText.slice(0, sugMatch.index).trimEnd()
      } catch { /* keep reply as-is */ }
    }

    // Fallback suggestions if parsing failed
    if (suggestedQuestions.length === 0) {
      if (findings[0]) suggestedQuestions.push(`How do I fix ${findings[0].title}?`)
      if (quickWins[0]) suggestedQuestions.push(`Walk me through the first quick win`)
      suggestedQuestions.push(`What should I prioritise this week?`)
    }

    // Persist to chat_messages
    await supabase.from('chat_messages').insert([
      { user_id: user.id, role: 'user', content: message },
      { user_id: user.id, role: 'assistant', content: reply },
    ])

    const needsEscalation =
      reply.toLowerCase().includes('human review') ||
      safeHistory.length >= 8

    return NextResponse.json({ reply, needsEscalation, suggestedQuestions })
  } catch (err) {
    console.error('[chat/message] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
