import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
  })

  const body = await req.json()
  const { questionnaireId, responses } = body

  // Extract the two new signals for prompt injection
  const landingPageUrl: string = (responses[16] as string) ?? ''
  const geographicRegion: string = (responses[17] as string) ?? 'Global/Multiple Regions'
  const regionContext = buildRegionContext(geographicRegion)

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are an expert ICP (Ideal Customer Profile) diagnostic analyst specialising in paid acquisition, funnel optimisation, and regional market strategy.

Analyse the following questionnaire responses and produce a structured ICP diagnostic report. Every finding and recommendation MUST be specific to the target region and account for the landing page URL provided.
${regionContext}
${landingPageUrl ? `\nLANDING PAGE URL: ${landingPageUrl}\nAnalyse the URL structure (path, subdomain, query params) for clues about the funnel type, offer, and positioning. Reference it in relevant findings.` : ''}

QUESTIONNAIRE RESPONSES:
${JSON.stringify(responses, null, 2)}

Return ONLY a valid JSON object with this exact structure (no markdown, no prose outside JSON):
{
  "health_score": <integer 0-100 representing overall ICP health>,
  "findings": [
    {
      "title": "<short finding title>",
      "severity": "<Critical|Warning|Opportunity>",
      "explanation": "<one sentence, region-specific where relevant>"
    }
  ],
  "breakdown": [
    {
      "label": "<one of: ICP Alignment | Targeting Accuracy | Channel Efficiency | Funnel Friction Index | Message to Market Fit | Budget Reallocation Opportunity>",
      "score": <integer 0-100>,
      "found": "<one sentence of what was diagnosed, region-aware>",
      "why": "<one sentence on revenue impact, region-aware>"
    }
  ],
  "quick_wins": [
    {
      "action": "<specific, actionable step — reference regional platforms/tools where relevant>",
      "impact": "<High|Medium|Low>"
    }
  ]
}

Rules:
- findings: exactly 3 items, ranked by revenue impact
- breakdown: exactly 6 items, one per label above
- quick_wins: exactly 3 items
- All scores must reflect the actual responses — do not return generic numbers
- Reference the target region (${geographicRegion}) explicitly in at least 2 findings or quick_wins
- If a landing page URL was provided, reference it in at least one finding`,
      },
    ],
  })

  const diagnosisText = message.content[0].type === 'text' ? message.content[0].text : ''

  let diagnosis: unknown
  try {
    // Strip any accidental markdown fences before parsing
    const cleaned = diagnosisText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    diagnosis = JSON.parse(cleaned)
  } catch {
    diagnosis = { raw: diagnosisText }
  }

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

  return NextResponse.json({ id: data.id, diagnosis }, { status: 201 })
}
