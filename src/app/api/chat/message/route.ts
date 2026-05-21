import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      email: string
      message: string
      conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
    }
    const { email, message, conversationHistory } = body

    if (!email || !message) {
      return NextResponse.json({ error: 'Missing email or message' }, { status: 400 })
    }

    // 1. Fetch user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 2. Parallel fetch of context data
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
        .limit(3),
      supabase
        .from('intelligence_briefings')
        .select('briefing_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    // 3. Parse data
    const qData = qRes.data
    const qd = qData?.data ?? {}
    const latestReport = rRes.data?.[0] ?? null
    const intelligence = iRes.data

    let reportSummary: Record<string, unknown> = {}
    if (latestReport) {
      try {
        reportSummary = JSON.parse(latestReport.report_summary)
      } catch {
        reportSummary = {}
      }
    }

    // 4. Build system prompt
    const systemPrompt = `You are an expert performance media buyer and ICP specialist with 10+ years experience. You work for ICP Diagnostic and your job is to help ${user.full_name ?? user.email} at ${user.company_name ?? 'their company'} improve their marketing performance.

YOU KNOW EVERYTHING ABOUT THIS CLIENT:

THEIR PROFILE:
- Industry: ${(qd as Record<string, unknown>).industry ?? (qd as Record<string, unknown>).business_type ?? 'not specified'}
- Region: ${(qd as Record<string, unknown>).region ?? (qd as Record<string, unknown>).country ?? 'East Africa'}
- Monthly ad budget: ${(qd as Record<string, unknown>).monthly_budget ?? (qd as Record<string, unknown>).budget ?? 'not specified'}
- Ad channels: ${(qd as Record<string, unknown>).ad_channels ?? 'not specified'}
- Subscription tier: ${user.subscription_tier}

THEIR DIAGNOSTIC RESULTS:
- ICP Health Score: ${(reportSummary as Record<string, unknown>).overall_score ?? (reportSummary as Record<string, unknown>).health_score ?? 'unknown'}/100
- Monthly waste estimate: ${(reportSummary as Record<string, unknown>).monthly_waste_estimate ?? 'unknown'}
- Top finding: ${((reportSummary as Record<string, unknown>).critical_findings as Array<{ title: string; severity: string; explanation: string }> | undefined)?.[0]?.title ?? 'none yet'}

ALL CRITICAL FINDINGS:
${((reportSummary.critical_findings ?? reportSummary.findings ?? []) as Array<{ title: string; severity: string; explanation: string }>)
  .map((f, i) => `${i + 1}. ${f.title} (${f.severity}): ${f.explanation}`)
  .join('\n') || 'No findings available yet'}

QUICK WINS:
${((reportSummary.quick_wins ?? []) as Array<{ action: string; impact: string }>)
  .map((w, i) => `${i + 1}. ${w.action} — ${w.impact}`)
  .join('\n') || 'No quick wins available yet'}

LATEST MARKET INTELLIGENCE:
${intelligence ? JSON.stringify(intelligence.briefing_data).slice(0, 400) : 'No intelligence briefing yet'}

CONVERSATION RULES:
1. Always reference their actual data — never give generic advice
2. Be direct and specific — you are a senior media buyer, not a consultant
3. When giving recommendations always tie them back to their specific findings and scores
4. If they ask for ad copy, write it specifically for their ICP and region
5. Keep responses concise — 3-5 sentences max unless they ask for detail
6. End responses with one specific next action they should take
7. If the question is complex or requires account access, suggest escalating to the human team

ESCALATION TRIGGERS:
If the user seems frustrated after multiple messages, if they ask about something requiring their actual ad account data, or if the situation could cause significant budget waste if handled incorrectly, say: "This is worth getting our team's eyes on. Want me to request a human review?"

TONE: Direct, confident, specific. Like a senior colleague not a chatbot. Never say "Great question!" or "I'd be happy to help!" Just answer.`

    // 5. Sanitize conversation history
    const safeHistory = (Array.isArray(conversationHistory) ? conversationHistory : [])
      .filter((m): m is { role: 'user' | 'assistant'; content: string } =>
        (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
      )
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }))

    // 6. Call Claude
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      messages: [
        ...safeHistory,
        { role: 'user', content: message },
      ],
    })
    const msg = await stream.finalMessage()
    const reply = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')

    // 7. Save messages to chat_messages
    await supabase.from('chat_messages').insert([
      { user_id: user.id, role: 'user', content: message },
      { user_id: user.id, role: 'assistant', content: reply },
    ])

    // 8. Check escalation signals
    const needsEscalation =
      reply.toLowerCase().includes('human review') ||
      reply.toLowerCase().includes('eugene') ||
      safeHistory.length >= 8

    // 9. Suggested follow-ups — keeping simple
    const suggestedQuestions: string[] = []

    // 10. Return
    return NextResponse.json({ reply, needsEscalation, suggestedQuestions })
  } catch (err) {
    console.error('[chat/message] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
