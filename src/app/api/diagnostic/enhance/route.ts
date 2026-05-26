import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

function stripDashes(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .replace(/ — /g, ', ').replace(/— /g, ', ').replace(/—/g, '-')
      .replace(/ – /g, ', ').replace(/–/g, '-')
  }
  if (Array.isArray(value)) return value.map(stripDashes)
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = stripDashes(v)
    return out
  }
  return value
}

function extractJSON(text: string): Record<string, unknown> | null {
  try { return JSON.parse(text) as Record<string, unknown> } catch { /* continue */ }
  const codeBlock = text.match(/```json\s*([\s\S]*?)```/)
  if (codeBlock) { try { return JSON.parse(codeBlock[1].trim()) as Record<string, unknown> } catch { /* continue */ } }
  const anyBlock = text.match(/```\s*([\s\S]*?)```/)
  if (anyBlock) { try { return JSON.parse(anyBlock[1].trim()) as Record<string, unknown> } catch { /* continue */ } }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && start < end) {
    try { return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown> } catch { /* continue */ }
    let partial = text.slice(start)
    let braces = 0; let brackets = 0
    for (const char of partial) {
      if (char === '{') braces++; if (char === '}') braces--
      if (char === '[') brackets++; if (char === ']') brackets--
    }
    partial += ']'.repeat(Math.max(0, brackets))
    partial += '}'.repeat(Math.max(0, braces))
    try { return JSON.parse(partial) as Record<string, unknown> } catch { /* continue */ }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', serviceKey)
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })

    const { diagnosticId } = await req.json()
    if (!diagnosticId) return NextResponse.json({ error: 'diagnosticId required' }, { status: 400 })

    // Fetch diagnostic with questionnaire
    const { data: diagnostic } = await supabase
      .from('diagnostics')
      .select('*, questionnaires(*)')
      .eq('id', diagnosticId)
      .maybeSingle()

    if (!diagnostic) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Resolve existing diagnosis
    const existingDiag: Record<string, unknown> =
      typeof diagnostic.diagnosis === 'string'
        ? (() => { try { return JSON.parse(diagnostic.diagnosis) } catch { return {} } })()
        : (diagnostic.diagnosis as Record<string, unknown>) ?? {}

    // Skip if already enhanced or not a subscriber report
    if (existingDiag.is_enhanced === true) return NextResponse.json({ status: 'already_enhanced' })
    if (existingDiag.is_deep_research !== true) return NextResponse.json({ error: 'Not a subscriber report' }, { status: 403 })

    const questionnaire = diagnostic.questionnaires as Record<string, unknown>
    const responses = (questionnaire?.responses ?? {}) as Record<string, unknown>

    const landingPageUrl = (responses[10] as string) ?? ''
    const geographicRegion = (responses[11] as string) ?? 'Global/Multiple Regions'
    const industry = (responses[2] as string) ?? ''
    const adChannels = Array.isArray(responses[9])
      ? (responses[9] as string[]).join(', ')
      : ((responses[9] as string) ?? '')
    const monthYear = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

    const systemPrompt = `You are an expert ICP diagnostic analyst. You have an existing diagnostic report generated from questionnaire data. Your task is to enhance it with real-time market research.

The business operates in ${industry} targeting ${geographicRegion}. Use web_search to find live data, then return a complete updated JSON report.

Return ONLY a valid JSON object. No markdown, no prose outside JSON. Do not use em dashes or en dashes anywhere in your output. Use commas, colons, or full stops instead.`

    const existingDiagStr = JSON.stringify(existingDiag)

    const prompt = `Enhance this ICP diagnostic report with live web research.

EXISTING REPORT (from initial analysis):
${existingDiagStr}

CONTEXT:
- Industry: ${industry}
- Region: ${geographicRegion}
- Ad channels: ${adChannels || 'not specified'}
- Landing page: ${landingPageUrl || 'not provided'}

REQUIRED SEARCHES (perform all 3 before writing):
1. "${industry} advertising benchmarks CPC CPA ${geographicRegion} ${monthYear}" - use results to update regional_benchmarks and economics.business_outcomes
2. "${industry} competitors ${geographicRegion} digital marketing 2025" - use results to update competitor_insights and relevant findings
3. "${landingPageUrl ? landingPageUrl + ' landing page review' : geographicRegion + ' digital marketing trends ' + monthYear}" - use results to update landing_page_assessment

After all 3 searches, return the COMPLETE updated JSON object. Update these fields with real data from searches:
- regional_benchmarks: replace with actual CPC/CPA figures from search results, cite the source
- competitor_insights: replace with real named competitors from search results
- landing_page_assessment (in funnel section): update with real observations if URL was provided
- executive_summary: incorporate any key real-world data points
- is_enhanced: true
- is_deep_research: true

Keep scores, structure, and all other fields from the existing report. Only update fields where web data provides genuinely better information than the initial analysis.`

    console.log(`[enhance] starting enhancement for diagnostic ${diagnosticId}`)

    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: systemPrompt,
      tools: [{ type: 'web_search_20250305' as const, name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }],
    })

    const diagnosisText = res.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    console.log(`[enhance] diagnosisText length=${diagnosisText.length}`)

    const rawParsed = extractJSON(diagnosisText)

    // If parsing failed, mark enhanced anyway to prevent retry loops, preserve existing data
    if (!rawParsed) {
      console.error('[enhance] failed to parse enhanced diagnosis, preserving existing')
      const fallback = { ...existingDiag, is_enhanced: true, is_deep_research: true }
      await Promise.all([
        supabase.from('diagnostics').update({ diagnosis: fallback }).eq('id', diagnosticId),
        supabase.from('reports').update({ report_summary: JSON.stringify(fallback) })
          .eq('questionnaire_id', diagnostic.questionnaire_id),
      ])
      return NextResponse.json({ status: 'complete', note: 'preserved_existing' })
    }

    const enhancedDiagnosis = stripDashes({
      ...(rawParsed as Record<string, unknown>),
      is_deep_research: true,
      is_enhanced: true,
    })

    await Promise.all([
      supabase.from('diagnostics').update({ diagnosis: enhancedDiagnosis }).eq('id', diagnosticId),
      supabase.from('reports').update({ report_summary: JSON.stringify(enhancedDiagnosis) })
        .eq('questionnaire_id', diagnostic.questionnaire_id),
    ])

    console.log(`[enhance] enhancement complete for diagnostic ${diagnosticId}`)
    return NextResponse.json({ status: 'complete' })

  } catch (err) {
    console.error('[enhance] unhandled error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
