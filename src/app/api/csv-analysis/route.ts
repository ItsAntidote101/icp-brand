import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { getSession } from '@/lib/session'
import { sendCsvScoreUpdateEmail } from '@/lib/email'

type CsvAnalysis = {
  summary: string
  top_performers: Array<{ name: string; metric: string; why: string }>
  underperformers: Array<{ name: string; metric: string; why: string }>
  budget_waste: { estimated_amount: string; explanation: string }
  audience_insights: string[]
  recommendations: Array<{ action: string; impact: string; revenue_upside: string }>
  score_delta?: number
}

function stripDashes(value: unknown): unknown {
  if (typeof value === 'string') return value.replace(/ — /g, ', ').replace(/— /g, ', ').replace(/—/g, '-').replace(/ – /g, ', ').replace(/–/g, '-')
  if (Array.isArray(value)) return value.map(stripDashes)
  if (value !== null && typeof value === 'object') {
    const o: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) o[k] = stripDashes(v)
    return o
  }
  return value
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', serviceKey)
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

  // ── Resolve user ──────────────────────────────────────────────────────────
  const email = userEmail || session.email
  const { data: user } = await supabase
    .from('users')
    .select('id, full_name, company_name')
    .eq('email', email)
    .single()

  const userId: string | null = user?.id ?? null

  // ── Load business profile from questionnaire ──────────────────────────────
  let industry = ''
  let product = ''
  let targetAudience = ''
  let channels = ''
  let region = ''
  let companyName = user?.company_name ?? ''

  const { data: qData } = await supabase
    .from('questionnaire_responses')
    .select('data')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const qd: Record<string, string> = (qData?.data as Record<string, string>) ?? {}

  if (Object.keys(qd).length > 0) {
    industry       = qd.industry ?? qd.business_type ?? ''
    product        = qd.product_service ?? qd.offer ?? ''
    targetAudience = qd.target_audience ?? ''
    channels       = qd.ad_channels ?? ''
    region         = qd.region ?? qd.country ?? ''
    companyName    = companyName || qd.company_name ?? ''
  } else if (userId) {
    const { data: rawQ } = await supabase
      .from('questionnaires')
      .select('responses')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const r: Record<string, unknown> = (rawQ?.responses as Record<string, unknown>) ?? {}
    industry       = (r[2] as string) ?? ''
    product        = (r[1] as string) ?? ''
    targetAudience = (r[8] as string) ?? ''
    channels       = Array.isArray(r[9]) ? (r[9] as string[]).join(', ') : ((r[9] as string) ?? '')
    region         = (r[11] as string) ?? ''
  }

  // ── Extract CSV sample (headers + first 3 data rows) for validation ───────
  const csvLines = csvText.split('\n').filter(l => l.trim())
  const sampleLines = csvLines.slice(0, 4)
  const csvSample = sampleLines.join('\n')

  // ── Step 1: Fast validation (Haiku) ───────────────────────────────────────
  const profileContext = [
    industry       && `Industry: ${industry}`,
    product        && `Product/service: ${product}`,
    targetAudience && `Target audience: ${targetAudience}`,
    channels       && `Ad channels: ${channels}`,
    region         && `Region: ${region}`,
  ].filter(Boolean).join('\n') || 'Profile not yet completed.'

  const validationMsg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `You are a strict data validator for an ad campaign analytics tool.

BUSINESS PROFILE:
${profileContext}

CSV SAMPLE (headers + first rows):
${csvSample}

Decide: Is this CSV file advertising/marketing campaign data from this business or a related campaign?

Rules for VALID:
- Headers contain ad metrics (impressions, clicks, CTR, CPC, CPA, spend, conversions, ROAS, reach, etc.) OR campaign/ad set/ad group names
- Data relates to paid advertising (Google Ads, Meta, TikTok, LinkedIn, etc.)
- Does NOT need to match the business perfectly — any legitimate ad campaign CSV is valid

Rules for INVALID (reject):
- Random non-advertising data (sales CRM exports, inventory, HR data, financial statements, etc.)
- Completely unrelated to advertising or marketing
- Empty or meaningless data

Return ONLY valid JSON, no prose:
{"valid": true|false, "reason": "<one sentence explaining why>", "suggestion": "<if invalid: one specific sentence telling them exactly what to upload instead>"}`
    }],
  })

  const validationText = validationMsg.content[0]?.type === 'text' ? validationMsg.content[0].text.trim() : ''
  let validationResult: { valid: boolean; reason: string; suggestion: string } = { valid: true, reason: '', suggestion: '' }

  try {
    const stripped = validationText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    validationResult = JSON.parse(stripped)
  } catch {
    // If validation JSON parse fails, allow through (fail open)
    console.warn('[csv-analysis] validation parse failed, allowing through')
  }

  if (!validationResult.valid) {
    return NextResponse.json({
      rejected: true,
      reason: validationResult.reason || 'This file does not appear to be advertising campaign data.',
      suggestion: validationResult.suggestion || 'Please upload a CSV exported from Google Ads, Meta Ads Manager, or another ad platform.',
    }, { status: 422 })
  }

  // ── Step 2: Full analysis (Opus) with profile context ─────────────────────
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `You are an expert media buyer analyzing advertising campaign data.

BUSINESS PROFILE:
${profileContext}

File: ${fileName ?? 'campaign_data.csv'}

CSV DATA:
${csvText.slice(0, 10000)}

Analyze this data and provide:
1. Top 3 performing campaigns/ad sets and why
2. Bottom 3 underperforming campaigns/ad sets and why
3. Estimated budget being wasted and where
4. Audience insights from the data
5. Three specific optimization recommendations ranked by revenue impact
6. A score_delta: an integer from -10 to +20 representing the net positive impact on this business's ICP Health Score if they implement all recommendations. Base this on the size of the opportunity identified. Use 0 if data quality is too low to assess.

Be specific with numbers from the data. Reference the business profile where relevant.

Return ONLY a valid JSON object (no markdown, no prose outside JSON):
{
  "summary": "<2-3 sentences: what this data shows at a glance, reference actual numbers>",
  "top_performers": [
    {
      "name": "<exact campaign/ad set name from the data>",
      "metric": "<key metric, e.g. ROAS 4.2x, CPA $12>",
      "why": "<one sentence explaining why it works>"
    }
  ],
  "underperformers": [
    {
      "name": "<exact campaign/ad set name>",
      "metric": "<key metric showing underperformance>",
      "why": "<one sentence on what's going wrong>"
    }
  ],
  "budget_waste": {
    "estimated_amount": "<specific amount or percentage>",
    "explanation": "<two sentences: where the waste is happening and which campaigns are culprit>"
  },
  "audience_insights": [
    "<specific insight about audience behaviour visible in the data>"
  ],
  "recommendations": [
    {
      "action": "<specific action referencing actual campaign or audience>",
      "impact": "<High|Medium|Low>",
      "revenue_upside": "<estimated revenue or cost saving>"
    }
  ],
  "score_delta": <integer -10 to +20>
}

Rules:
- top_performers: exactly 3 (fewer only if data has less than 3 campaigns)
- underperformers: exactly 3 (fewer only if data has less than 3 campaigns)
- audience_insights: 2-4 items
- recommendations: exactly 3, ranked by revenue impact descending
- Every number must come from the actual data
- No em dashes or en dashes anywhere. Use commas, colons, or full stops instead`,
    }],
  })

  const block = message.content[0]
  const text = block.type === 'text' ? block.text : ''
  const stripped = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

  let analysis: CsvAnalysis | { raw: string }
  let scoreDelta = 0
  try {
    const parsed = stripDashes(JSON.parse(stripped)) as CsvAnalysis
    scoreDelta = typeof parsed.score_delta === 'number' ? Math.max(-10, Math.min(20, parsed.score_delta)) : 0
    analysis = parsed
  } catch {
    analysis = { raw: text }
  }

  // ── Save to diagnostics ───────────────────────────────────────────────────
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
  }

  // ── Update csv_score_delta on users table ─────────────────────────────────
  if (userId && scoreDelta !== 0) {
    const { error: deltaErr } = await supabase
      .from('users')
      .update({ csv_score_delta: scoreDelta })
      .eq('id', userId)

    if (deltaErr) {
      console.error('[csv-analysis] csv_score_delta update error:', deltaErr.message)
    }
  }

  // ── Send score update email (only for significant gains) ─────────────────
  if (userId && 'summary' in analysis && scoreDelta >= 5) {
    const csvAnalysis = analysis as CsvAnalysis
    const topRec = csvAnalysis.recommendations?.[0]
    sendCsvScoreUpdateEmail({
      to: email,
      name: user?.full_name ?? '',
      fileName: fileName ?? 'upload.csv',
      scoreDelta,
      summary: csvAnalysis.summary ?? '',
      topRecommendation: topRec ? `${topRec.action} (${topRec.revenue_upside})` : '',
    }).catch(err => console.error('[csv-analysis] email error:', err))
  }

  return NextResponse.json({ analysis, diagnosticId: saved?.id ?? null, scoreDelta }, { status: 200 })
}
