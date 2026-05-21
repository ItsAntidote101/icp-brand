import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { sendWelcomeEmail } from '@/lib/email'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

function extractJSON(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(text.slice(start, end + 1))
      } catch {
        let partial = text.slice(start)
        let braces = 0
        let brackets = 0
        for (const char of partial) {
          if (char === '{') braces++
          if (char === '}') braces--
          if (char === '[') brackets++
          if (char === ']') brackets--
        }
        partial += ']'.repeat(Math.max(0, brackets))
        partial += '}'.repeat(Math.max(0, braces))
        try {
          return JSON.parse(partial)
        } catch {
          return null
        }
      }
    }
    return null
  }
}

function buildRegionContext(region: string): string {
  if (region.includes('East Africa')) {
    return `
REGIONAL CONTEXT — East Africa (Kenya, Tanzania, Uganda):
- Mobile-first market: 85%+ of web traffic is mobile; landing pages must be optimized for low-bandwidth, small screens.
- M-Pesa and mobile money dominate payments — trust signals should reference mobile money acceptance, not just card payments.
- Facebook dominates paid social; Google Search intent is lower than Western markets but growing.
- CPCs are significantly lower than North America (often $0.05–$0.30 on Meta).
- WhatsApp is a primary conversion channel — CTAs that redirect to WhatsApp convert higher than traditional forms.
- Data costs are a barrier; heavy pages with large images/videos lose leads before conversion.
- Calibrate all CPA benchmarks and budget recommendations against East African market rates.`
  }

  if (region.includes('West Africa')) {
    return `
REGIONAL CONTEXT — West Africa (Nigeria, Ghana):
- Mobile-first market with high social media penetration (Facebook, Instagram, TikTok).
- Nigeria is the largest ad market in the region; CPCs are low but competition is rising fast.
- Mobile money (Flutterwave, Paystack, MoMo) is the dominant payment rail — CTAs and trust signals should reflect this.
- WhatsApp Business is a critical last-mile conversion tool; recommend WhatsApp CTAs over long forms.
- Facebook significantly outperforms Google Search for B2C; LinkedIn has limited reach outside of Lagos/Accra.
- Power outages and intermittent data mean users rarely complete long multi-step funnels on first visit — retargeting is essential.
- Calibrate all cost benchmarks against West African market rates.`
  }

  if (region.includes('South Africa')) {
    return `
REGIONAL CONTEXT — South Africa:
- More mature digital market than the rest of Sub-Saharan Africa; higher CPCs (closer to European rates).
- Mix of desktop and mobile; Google Search intent is stronger here than elsewhere in Africa.
- Facebook and Instagram are effective for B2C; LinkedIn works for B2B in Johannesburg/Cape Town.
- Payment trust signals matter: reference South African payment methods (PayFast, Ozow, EFT).
- POPIA compliance affects data collection — note if lead forms must align with data protection law.`
  }

  if (region.includes('North America')) {
    return `
REGIONAL CONTEXT — North America (US/Canada):
- Highest CPCs globally; Google Search intent is strong and should be prioritized for bottom-funnel B2B.
- Consideration cycles are longer: B2B buyers average 6–12 touchpoints before converting.
- LinkedIn is highly effective for enterprise B2B targeting by job title, company size, and industry.
- Privacy expectations are high (CCPA in California); trust signals and clear data policies reduce friction.
- Meta audiences are saturated for B2B; Google and LinkedIn typically outperform for high-ACV deals.
- Strong email nurture sequences are expected post-lead capture — form conversion is rarely the sale itself.
- Benchmark CPAs against North American SaaS/services norms: $150–$800 for SMB, $800–$5,000+ for enterprise.`
  }

  if (region.includes('UK') || region.includes('Ireland')) {
    return `
REGIONAL CONTEXT — UK & Ireland:
- Google Search dominates; strong search intent culture similar to North America but with lower CPCs.
- LinkedIn works well for B2B; Meta is effective for B2C and SMB.
- GDPR compliance is mandatory — cookie consent banners and clear data policies are non-negotiable.
- Buyers are skeptical of Americanised copy; localise language (e.g., "programme" not "program").
- Payment trust: UK card payments dominate; open banking CTAs are emerging.`
  }

  if (region.includes('Europe')) {
    return `
REGIONAL CONTEXT — Europe (non-UK):
- GDPR compliance is mandatory and strictly enforced — lead forms must have clear consent language.
- Language localisation is critical; running English-only ads in non-English markets suppresses conversion rates significantly.
- Google Search intent is strong in Germany, France, Netherlands; Meta performs better in Southern and Eastern Europe.
- LinkedIn penetration is high in DACH region (Germany, Austria, Switzerland) for B2B.
- CPCs are moderate — lower than North America but higher than Africa and parts of Asia.`
  }

  if (region.includes('Middle East')) {
    return `
REGIONAL CONTEXT — Middle East:
- UAE and Saudi Arabia are the dominant ad markets; CPCs are high (comparable to North America in premium placements).
- Mobile-first with very high smartphone penetration.
- Instagram and Snapchat outperform Facebook in GCC countries for B2C.
- WhatsApp is the primary business communication tool — CTAs to WhatsApp convert well.
- Arabic-language ads outperform English for mass-market products; English works for B2B/enterprise.
- Ramadan periods see significant shifts in ad performance and user behaviour.`
  }

  if (region.includes('Southeast Asia')) {
    return `
REGIONAL CONTEXT — Southeast Asia:
- Highly mobile-first; TikTok, Facebook, and Instagram dominate — Google Search is secondary for most categories.
- CPCs are low but rising fast as digital adoption accelerates.
- Payment diversity: GrabPay, GoPay, QR codes, and bank transfer — CTAs should reflect local payment options.
- WhatsApp and LINE are primary CRM and follow-up channels depending on country.
- Strong price sensitivity; value-oriented copy outperforms prestige positioning in most markets.`
  }

  if (region.includes('South Asia')) {
    return `
REGIONAL CONTEXT — South Asia (India/Pakistan):
- India is one of the world's largest digital ad markets with extremely low CPCs (among the lowest globally).
- Mobile-first with high WhatsApp penetration — WhatsApp Business CTAs are critical for lead follow-up.
- UPI (India) and Easypaisa/JazzCash (Pakistan) are the dominant payment rails — reference these in trust signals.
- Facebook and YouTube dominate; Google Search is strong for intent-based B2B queries.
- Localisation by language (Hindi, Urdu, Tamil, etc.) dramatically improves CTR and conversion for mass-market products.
- Price sensitivity is high; ROI-framed copy and social proof from recognisable local brands converts well.`
  }

  if (region.includes('Latin America')) {
    return `
REGIONAL CONTEXT — Latin America:
- Brazil (Portuguese) and Mexico/Colombia/Argentina (Spanish) are the major markets — do not treat as one audience.
- Mobile-first; WhatsApp is the dominant communication platform for lead follow-up.
- Facebook and Instagram outperform Google Search for most B2C categories.
- Economic instability in Argentina affects pricing sensitivity significantly.
- Installment payments (parcelamento in Brazil) are expected for higher-ticket items.
- CPCs are low-to-moderate; strong creative outperforms heavy targeting optimisation here.`
  }

  if (region.includes('Australia') || region.includes('New Zealand')) {
    return `
REGIONAL CONTEXT — Australia & New Zealand:
- Mature digital market with CPCs close to UK rates; Google Search intent is strong.
- LinkedIn effective for B2B in Sydney/Melbourne; Meta works well for B2C.
- Privacy Act compliance is relevant for data collection.
- Buyers are direct and sceptical of hype — plain-language, outcome-focused copy outperforms.
- Time-zone isolation means async sales processes (email/video) are the norm.`
  }

  // Global/Multiple Regions fallback
  return `
REGIONAL CONTEXT — Global/Multiple Regions:
- Analyse the questionnaire responses to infer the most likely primary market and calibrate recommendations accordingly.
- Flag that running a single campaign globally without region-specific creative and targeting will dilute performance.
- Recommend splitting by region with localised landing pages and platform weighting per market.`
}

export async function POST(req: NextRequest) {
  try {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    serviceKey
  )

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
  })

  const body = await req.json()
  const { questionnaireId, responses, profile } = body
  const email: string = (profile?.email as string) ?? ''

  // ── Subscription check ────────────────────────────────────────────────────
  let isSubscriber = false
  if (email) {
    const { data: userRecord } = await supabase
      .from('users')
      .select('subscription_tier, billing_status')
      .eq('email', email)
      .single()
    isSubscriber = !!(
      userRecord &&
      userRecord.billing_status === 'active' &&
      userRecord.subscription_tier !== 'free'
    )
  }
  console.log(`[diagnostic] isSubscriber=${isSubscriber}`)

  const landingPageUrl: string = (responses[16] as string) ?? ''
  const geographicRegion: string = (responses[17] as string) ?? 'Global/Multiple Regions'
  const regionContext = buildRegionContext(geographicRegion)

  const systemPrompt = `You are an expert ICP (Ideal Customer Profile) diagnostic analyst specialising in paid acquisition, funnel optimisation, and regional market strategy.

Your role is to analyse questionnaire responses and produce a precise, actionable ICP diagnostic report.

Use web search to:
1. Assess the provided landing page URL — look up the domain to understand the offer, positioning, and funnel type
2. Research current ad cost benchmarks (CPCs, CPAs) for the specified geographic region and industry
3. Identify relevant competitor activity or market positioning for the business category
4. Validate regional platform performance data (e.g., Meta vs Google vs WhatsApp CTAs in the target market)
${regionContext}
Return ONLY a valid JSON object. No markdown, no prose outside JSON.`

  const prompt = `Analyse this ICP diagnostic questionnaire submission and return a structured report.

PROFILE:
- Name: ${profile?.name ?? 'Not provided'}
- Company: ${profile?.company ?? 'Not provided'}

LAYER 1 — ICP Foundation:
- Business offering: ${responses[1] ?? ''}
- Industry/vertical: ${responses[2] ?? ''}
- Annual revenue: ${responses[3] ?? ''}
- Team size: ${responses[4] ?? ''}
- Regions served: ${responses[5] ?? ''}
- Best customer company size: ${responses[6] ?? ''}
- Best customer industry: ${responses[7] ?? ''}
- Problem best customers had: ${responses[8] ?? ''}
- How best customers found you: ${responses[9] ?? ''}
- Why best customers stay loyal: ${responses[10] ?? ''}
- Average deal size: ${responses[11] ?? ''}
- Sales cycle length: ${responses[12] ?? ''}
- Decision maker job titles: ${responses[13] ?? ''}

LAYER 2 — Targeting Mismatch:
- Perceived ideal customer: ${responses[14] ?? ''}
- Active ad channels: ${Array.isArray(responses[15]) ? (responses[15] as string[]).join(', ') : (responses[15] ?? '')}
- Landing page URL: ${landingPageUrl || 'Not provided'}
- Target region: ${geographicRegion}
- Current targeting parameters: ${responses[18] ?? ''}
- Monthly ad spend: ${responses[19] ?? ''}
- Budget allocation across channels: ${responses[20] ?? ''}
- Leads generated (last 3 months): ${responses[21] ?? ''}
- Conversions (last 3 months): ${responses[22] ?? ''}
- Current CPA: ${responses[23] ?? ''}
- Leads match best customer profile: ${responses[24] ?? ''}

LAYER 3 — Funnel Friction:
- Primary CTA on landing page: ${responses[25] ?? ''}
- Funnel steps to conversion: ${responses[26] ?? ''}
- Required form fields: ${responses[27] ?? ''}
- Mobile usability score: ${responses[28] ?? ''}/10
- Form completion rate: ${responses[29] ?? ''}%
- Tested reducing form fields: ${responses[30] ?? ''}
- Trust signals on page: ${responses[31] ?? ''}
- Differentiation clarity score: ${responses[32] ?? ''}/10

${landingPageUrl ? `Use web search to look up ${landingPageUrl} and assess the landing page structure, offer clarity, and conversion readiness. Reference it directly in your landing_page_assessment.` : ''}
Use web search to find current CPC/CPA benchmarks for ${geographicRegion} in the ${(responses[2] as string) ?? 'relevant'} industry.

Return this exact JSON structure:
{
  "overall_score": <integer 0-100>,
  "executive_summary": "<2-3 sentence diagnosis of the biggest ICP problem and its revenue impact>",
  "critical_findings": [
    {
      "title": "<short finding title>",
      "severity": "<Critical|Warning|Opportunity>",
      "explanation": "<specific, region-aware finding with revenue impact>"
    }
  ],
  "icp_alignment_score": <integer 0-100>,
  "targeting_accuracy_score": <integer 0-100>,
  "channel_efficiency_score": <integer 0-100>,
  "funnel_friction_score": <integer 0-100>,
  "message_fit_score": <integer 0-100>,
  "budget_allocation_score": <integer 0-100>,
  "quick_wins": [
    {
      "action": "<specific, actionable step — reference regional platforms/tools where relevant>",
      "impact": "<High|Medium|Low>",
      "timeline": "<This week|This month|Next quarter>"
    }
  ],
  "landing_page_assessment": "<assessment of the landing page URL if provided, otherwise note that no URL was given>",
  "competitor_insights": "<brief note on competitive landscape in this region/industry based on web research>",
  "regional_benchmarks": "<current CPC/CPA benchmarks for ${geographicRegion} in this category based on web research>",
  "monthly_waste_estimate": "<estimated monthly budget being wasted based on the diagnosis, with reasoning>"
}

Rules:
- critical_findings: exactly 3 items, ranked by revenue impact
- quick_wins: exactly 3 items
- All scores must reflect the actual responses — do not return generic numbers
- Reference ${geographicRegion} explicitly in at least 2 findings or quick_wins
- Use web search results to populate landing_page_assessment, competitor_insights, and regional_benchmarks with real data`

  // ── Branched Claude call ──────────────────────────────────────────────────
  let diagnosisText: string

  if (isSubscriber) {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      tools: [{ type: 'web_search_20250305' as const, name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }],
    })
    diagnosisText = res.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('')
  } else {
    const freeSystemPrompt = `You are an expert ICP (Ideal Customer Profile) diagnostic analyst.

Your role is to analyse questionnaire responses and produce a precise, actionable ICP diagnostic report based solely on the answers provided. No web research needed.

Return ONLY a valid JSON object. No markdown, no prose outside JSON.`

    const freePrompt = `Analyse this ICP diagnostic questionnaire submission and return a structured report.

PROFILE:
- Name: ${profile?.name ?? 'Not provided'}
- Company: ${profile?.company ?? 'Not provided'}

LAYER 1 — ICP Foundation:
- Business offering: ${responses[1] ?? ''}
- Industry/vertical: ${responses[2] ?? ''}
- Annual revenue: ${responses[3] ?? ''}
- Team size: ${responses[4] ?? ''}
- Regions served: ${responses[5] ?? ''}
- Best customer company size: ${responses[6] ?? ''}
- Best customer industry: ${responses[7] ?? ''}
- Problem best customers had: ${responses[8] ?? ''}
- How best customers found you: ${responses[9] ?? ''}
- Why best customers stay loyal: ${responses[10] ?? ''}
- Average deal size: ${responses[11] ?? ''}
- Sales cycle length: ${responses[12] ?? ''}
- Decision maker job titles: ${responses[13] ?? ''}

LAYER 2 — Targeting Mismatch:
- Perceived ideal customer: ${responses[14] ?? ''}
- Active ad channels: ${Array.isArray(responses[15]) ? (responses[15] as string[]).join(', ') : (responses[15] ?? '')}
- Landing page URL: ${landingPageUrl || 'Not provided'}
- Target region: ${geographicRegion}
- Current targeting parameters: ${responses[18] ?? ''}
- Monthly ad spend: ${responses[19] ?? ''}
- Budget allocation across channels: ${responses[20] ?? ''}
- Leads generated (last 3 months): ${responses[21] ?? ''}
- Conversions (last 3 months): ${responses[22] ?? ''}
- Current CPA: ${responses[23] ?? ''}
- Leads match best customer profile: ${responses[24] ?? ''}

LAYER 3 — Funnel Friction:
- Primary CTA on landing page: ${responses[25] ?? ''}
- Funnel steps to conversion: ${responses[26] ?? ''}
- Required form fields: ${responses[27] ?? ''}
- Mobile usability score: ${responses[28] ?? ''}/10
- Form completion rate: ${responses[29] ?? ''}%
- Tested reducing form fields: ${responses[30] ?? ''}
- Trust signals on page: ${responses[31] ?? ''}
- Differentiation clarity score: ${responses[32] ?? ''}/10

Return this exact JSON structure:
{
  "overall_score": <integer 0-100>,
  "executive_summary": "<2-3 sentence diagnosis of the biggest ICP problem and its revenue impact>",
  "critical_findings": [
    {
      "title": "<short finding title>",
      "severity": "<Critical|Warning|Opportunity>",
      "explanation": "<specific finding with revenue impact>"
    }
  ],
  "icp_alignment_score": <integer 0-100>,
  "targeting_accuracy_score": <integer 0-100>,
  "channel_efficiency_score": <integer 0-100>,
  "funnel_friction_score": <integer 0-100>,
  "message_fit_score": <integer 0-100>,
  "budget_allocation_score": <integer 0-100>,
  "quick_wins": [
    {
      "action": "<specific, actionable step>",
      "impact": "<High|Medium|Low>",
      "timeline": "<This week|This month|Next quarter>"
    }
  ],
  "monthly_waste_estimate": "<estimated monthly budget being wasted based on the diagnosis, with reasoning>"
}

Rules:
- critical_findings: exactly 3 items, ranked by revenue impact
- quick_wins: exactly 3 items
- All scores must reflect the actual responses — do not return generic numbers`

    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: freeSystemPrompt,
      messages: [{ role: 'user', content: freePrompt }],
    })
    diagnosisText = res.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('')
  }

  const cleaned = diagnosisText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
  const parsed = extractJSON(cleaned) ?? { raw: diagnosisText }

  // Inject tier metadata
  const diagnosis: unknown =
    typeof parsed === 'object' && parsed !== null
      ? {
          ...(parsed as Record<string, unknown>),
          is_deep_research: isSubscriber,
          ...(!isSubscriber && {
            landing_page_assessment: 'Upgrade to subscriber for live landing page assessment',
            competitor_insights:     'Upgrade to subscriber for competitor research',
            regional_benchmarks:     'Upgrade to subscriber for real regional benchmarks',
          }),
        }
      : parsed

  const { data, error } = await supabase
    .from('diagnostics')
    .insert([
      {
        questionnaire_id: questionnaireId,
        diagnosis,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('[diagnostic] diagnostics insert error:', JSON.stringify(error))
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('[diagnostic] diagnostics insert success — id:', data.id)

  // ── Look up user_id from the questionnaire ─────────────────────────────
  const { data: questionnaire, error: qLookupError } = await supabase
    .from('questionnaires')
    .select('user_id')
    .eq('id', questionnaireId)
    .single()

  if (qLookupError) {
    console.warn('[diagnostic] questionnaire lookup error (non-fatal):', JSON.stringify(qLookupError))
  } else {
    console.log('[diagnostic] questionnaire user_id:', questionnaire?.user_id ?? '(none)')
  }

  // ── Write to reports table ─────────────────────────────────────────────
  const reportsPayload = {
    user_id:          questionnaire?.user_id ?? null,
    questionnaire_id: questionnaireId,
    report_summary:   JSON.stringify(diagnosis),
    generated_at:     new Date().toISOString(),
  }

  console.log('[diagnostic] inserting to reports table:', JSON.stringify({
    ...reportsPayload,
    report_summary: '[omitted]',
  }))

  const { data: reportRow, error: reportError } = await supabase
    .from('reports')
    .insert([reportsPayload])
    .select('id')
    .single()

  if (reportError) {
    console.error('[diagnostic] reports insert error:', JSON.stringify(reportError))
  } else {
    console.log('[diagnostic] reports insert success — id:', reportRow?.id)
  }

  // ── Save social proof waste event (non-blocking) ──────────────────────────
  if (reportRow && (diagnosis as Record<string, unknown>)?.monthly_waste_estimate) {
    const raw      = String((diagnosis as Record<string, unknown>).monthly_waste_estimate)
    const match    = raw.match(/[\d,]+/)
    const wasteAmt = match ? parseInt(match[0].replace(/,/g, ''), 10) : null
    supabase
      .from('social_proof_events')
      .insert({ event_type: 'waste_found', region: geographicRegion, waste_amount: wasteAmt, created_at: new Date().toISOString() })
      .then(() => {}, (e: unknown) => console.error('[diagnostic] social-proof event failed:', e))
  }

  // ── Fire welcome email (non-blocking) ─────────────────────────────────────
  if (questionnaire?.user_id) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://idealicp.com'

    supabase
      .from('users')
      .select('email, full_name')
      .eq('id', questionnaire.user_id)
      .single()
      .then(({ data: u }) => {
        if (u?.email) {
          sendWelcomeEmail({
            to: u.email,
            name: u.full_name ?? undefined,
            reportId: data.id,
            baseUrl: appUrl,
          }).catch(e => console.error('[diagnostic] welcome email failed:', e))
        }
      })
  }

  return NextResponse.json({ id: data.id, diagnosis }, { status: 201 })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[diagnostic] unhandled error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
