import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    score: number | null
    prevScore: number | null
    topFinding: string | null
    secondFinding: string | null
    daysSinceDiagnosis: number
    monthlyWasteKES: number
    fixesCompleted: number
    streak: number
    hasNewIntelligence: boolean
    companyName: string | null
  }

  const {
    score, prevScore, topFinding, secondFinding,
    daysSinceDiagnosis, monthlyWasteKES,
    fixesCompleted, streak, hasNewIntelligence, companyName,
  } = body

  const delta = score !== null && prevScore !== null ? score - prevScore : null
  const dailyWasteKES = Math.round(monthlyWasteKES / 30)
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const context = [
    `Date: ${today}`,
    `Company: ${companyName ?? 'the business'}`,
    `Current ICP health score: ${score ?? 'unknown'}/100`,
    delta !== null ? `Score change since last report: ${delta > 0 ? '+' : ''}${delta} points` : 'No previous score for comparison',
    `Days since last diagnosis: ${daysSinceDiagnosis}`,
    `Estimated daily revenue waste from ICP misalignment: KES ${dailyWasteKES.toLocaleString()}`,
    topFinding ? `Top unresolved finding: ${topFinding}` : 'No findings on record',
    secondFinding ? `Second priority: ${secondFinding}` : null,
    `Total fixes completed to date: ${fixesCompleted}`,
    streak > 0 ? `Current implementation streak: ${streak} week${streak !== 1 ? 's' : ''}` : 'No active streak',
    hasNewIntelligence ? 'New competitive intelligence is available this week' : null,
  ].filter(Boolean).join('\n')

  const prompt = `You are a B2B growth advisor writing a short daily briefing for a SaaS dashboard.

Context about this user today:
${context}

Write 2-3 sentences as their daily brief. Rules:
- Be specific and data-driven using the numbers above
- Acknowledge any improvement or inaction honestly but constructively
- If score improved, credit their effort and name the next priority
- If score has not changed in 14+ days, create urgency around the daily KES waste
- If fixes completed > 0, acknowledge momentum
- If new intelligence is available, mention it as a competitive edge opportunity
- Tone: direct, expert, encouraging, like a good advisor, not a chatbot
- No em dashes, no en dashes, no bullet points, no headers, no emojis
- Output only the 2-3 sentences, nothing else`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (message.content[0] as { type: string; text: string }).text?.trim() ?? ''
    return NextResponse.json({ brief: text, generatedAt: new Date().toISOString() })
  } catch (err) {
    console.error('[daily-brief] Haiku error:', err)
    return NextResponse.json({ error: 'generation_failed' }, { status: 500 })
  }
}
