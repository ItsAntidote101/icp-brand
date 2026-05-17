import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })

  const body = await req.json()
  const { csvText, fileName } = body as { csvText: string; fileName?: string }

  console.log('[csv-analysis] file:', fileName, '| chars:', csvText?.length)

  if (!csvText) {
    return NextResponse.json({ error: 'csvText is required' }, { status: 400 })
  }

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are an expert digital advertising analyst. Analyse the following advertising campaign CSV data.

FILE: ${fileName ?? 'campaign_data.csv'}

CSV DATA:
${csvText.slice(0, 8000)}

Return ONLY a valid JSON object with this exact structure (no markdown, no prose outside JSON):
{
  "summary": "<2-3 sentence overview of what you found>",
  "top_performers": [
    { "name": "<campaign or ad set name>", "metric": "<key metric>", "insight": "<why it's working>" }
  ],
  "underperformers": [
    { "name": "<campaign or ad set name>", "metric": "<key metric>", "insight": "<what's wrong>" }
  ],
  "budget_waste": {
    "estimated_waste_pct": <integer 0-100>,
    "explanation": "<where budget is being wasted>"
  },
  "audience_insights": [
    "<insight string>"
  ],
  "recommendations": [
    { "action": "<specific recommendation>", "impact": "<High|Medium|Low>", "effort": "<High|Medium|Low>" }
  ]
}

Rules:
- top_performers: 1-3 items
- underperformers: 1-3 items
- audience_insights: 2-4 items
- recommendations: exactly 3 items ranked by impact
- Be specific — reference actual campaign names, numbers, and percentages from the data`,
      },
    ],
  })

  const block = message.content[0]
  const text = block.type === 'text' ? block.text : ''

  // Strip markdown fences if present
  const stripped = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

  let analysis: unknown
  try {
    analysis = JSON.parse(stripped)
  } catch {
    analysis = { raw: text }
  }

  console.log('[csv-analysis] analysis complete')

  return NextResponse.json({ analysis }, { status: 200 })
}
