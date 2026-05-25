import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { getSession } from '@/lib/session'

type CsvAnalysis = {
  summary: string
  top_performers: Array<{ name: string; metric: string; why: string }>
  underperformers: Array<{ name: string; metric: string; why: string }>
  budget_waste: { estimated_amount: string; explanation: string }
  audience_insights: string[]
  recommendations: Array<{ action: string; impact: string; revenue_upside: string }>
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    serviceKey
  )

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })

  const body = await req.json()
  const { csvText, fileName, userEmail } = body as {
    csvText: string
    fileName?: string
    userEmail?: string
  }

  if (typeof csvText !== 'string') {
    return NextResponse.json({ error: 'csvText is required' }, { status: 400 })
  }
  if (csvText.length > 500_000) {
    return NextResponse.json({ error: 'File too large. Maximum 500KB.' }, { status: 413 })
  }

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: `You are an expert media buyer analyzing advertising campaign data. The file is: ${fileName ?? 'campaign_data.csv'}

Here is the CSV data:
${csvText.slice(0, 10000)}

Analyze this data and provide:
1. Top 3 performing campaigns and why
2. Bottom 3 underperforming campaigns and why
3. Estimated budget being wasted and where
4. Audience insights from the data
5. Three specific optimization recommendations ranked by revenue impact

Be specific with numbers from the data. Speak like a senior media buyer, not a robot.

Return ONLY a valid JSON object with this exact structure (no markdown, no prose outside JSON):
{
  "summary": "<2-3 sentences: what this data shows at a glance, reference actual numbers>",
  "top_performers": [
    {
      "name": "<exact campaign/ad set name from the data>",
      "metric": "<the key metric that makes it a winner, e.g. ROAS 4.2x, CPA $12>",
      "why": "<one sentence explaining why it works, referencing actual data>"
    }
  ],
  "underperformers": [
    {
      "name": "<exact campaign/ad set name from the data>",
      "metric": "<the key metric showing underperformance, e.g. CPA $180, CTR 0.2%>",
      "why": "<one sentence on what's going wrong, referencing actual data>"
    }
  ],
  "budget_waste": {
    "estimated_amount": "<specific amount or percentage, e.g. $2,400/month or 34% of spend>",
    "explanation": "<two sentences: where the waste is happening and which campaigns are the culprit>"
  },
  "audience_insights": [
    "<specific insight about audience behaviour visible in the data>"
  ],
  "recommendations": [
    {
      "action": "<specific action referencing the actual campaign or audience>",
      "impact": "<High|Medium|Low>",
      "revenue_upside": "<estimated revenue or cost saving, e.g. Save KES 15,000/month or +20% ROAS>"
    }
  ]
}

Rules:
- top_performers: exactly 3 (fewer only if data has less than 3 campaigns)
- underperformers: exactly 3 (fewer only if data has less than 3 campaigns)
- audience_insights: 2-4 items
- recommendations: exactly 3, ranked by revenue impact descending
- Every number must come from the actual data, do not invent figures
- Do not use em dashes or en dashes anywhere in your output. Use commas, colons, or full stops instead`,
      },
    ],
  })

  const block = message.content[0]
  const text = block.type === 'text' ? block.text : ''
  const stripped = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

  function stripDashes(value: unknown): unknown {
    if (typeof value === 'string') return value.replace(/ — /g, ', ').replace(/— /g, ', ').replace(/—/g, '-').replace(/ – /g, ', ').replace(/–/g, '-')
    if (Array.isArray(value)) return value.map(stripDashes)
    if (value !== null && typeof value === 'object') { const o: Record<string,unknown>={}; for (const [k,v] of Object.entries(value as Record<string,unknown>)) o[k]=stripDashes(v); return o }
    return value
  }

  let analysis: CsvAnalysis | { raw: string }
  try {
    analysis = stripDashes(JSON.parse(stripped)) as CsvAnalysis
  } catch {
    analysis = { raw: text }
  }

  console.log('[csv-analysis] Claude response parsed, saving to diagnostics')

  // ── Look up user if email provided ────────────────────────────────────────
  let userId: string | null = null
  if (userEmail) {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single()
    userId = user?.id ?? null
    // user resolved
  }

  // ── Save to diagnostics table ─────────────────────────────────────────────
  const { data: saved, error: saveError } = await supabase
    .from('diagnostics')
    .insert([{
      questionnaire_id: null,
      diagnosis: { type: 'csv_analysis', file: fileName ?? 'upload.csv', user_id: userId, ...analysis },
      created_at: new Date().toISOString(),
    }])
    .select('id')
    .single()

  if (saveError) {
    console.error('[csv-analysis] diagnostics insert error:', JSON.stringify(saveError))
  } else {
    console.log('[csv-analysis] diagnostics insert success, id:', saved?.id)
  }

  return NextResponse.json({ analysis, diagnosticId: saved?.id ?? null }, { status: 200 })
}
