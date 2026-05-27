import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { sendWelcomeEmail } from '@/lib/email'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

// Strip em/en dashes from any string recursively so they never appear in stored data
function stripDashes(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .replace(/ — /g, ', ')
      .replace(/— /g, ', ')
      .replace(/—/g, '-')
      .replace(/ – /g, ', ')
      .replace(/–/g, '-')
  }
  if (Array.isArray(value)) return value.map(stripDashes)
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = stripDashes(v)
    return out
  }
  return value
}

function extractJSON(text: string): unknown {
  // 1. Direct parse
  try { return JSON.parse(text) } catch { /* continue */ }

  // 2. ```json ... ``` code block anywhere in the text (most common with web_search responses)
  const codeBlock = text.match(/```json\s*([\s\S]*?)```/)
  if (codeBlock) {
    try { return JSON.parse(codeBlock[1].trim()) } catch { /* continue */ }
  }

  // 3. Any ``` ... ``` block
  const anyBlock = text.match(/```\s*([\s\S]*?)```/)
  if (anyBlock) {
    try { return JSON.parse(anyBlock[1].trim()) } catch { /* continue */ }
  }

  // 4. Find outermost { ... } (skipping preamble text)
  const start = text.indexOf('{')
  const end   = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && start < end) {
    try { return JSON.parse(text.slice(start, end + 1)) } catch { /* continue */ }

    // 5. Truncated JSON — try to close unclosed braces/brackets
    let partial  = text.slice(start)
    let braces   = 0
    let brackets = 0
    for (const char of partial) {
      if (char === '{') braces++
      if (char === '}') braces--
      if (char === '[') brackets++
      if (char === ']') brackets--
    }
    partial += ']'.repeat(Math.max(0, brackets))
    partial += '}'.repeat(Math.max(0, braces))
    try { return JSON.parse(partial) } catch { /* continue */ }
  }

  return null
}

function isEastAfrica(region: string): boolean {
  return region === 'Kenya' || region === 'Tanzania' || region === 'Uganda' || region.includes('East Africa')
}

function buildRegionContext(region: string): string {
  if (isEastAfrica(region)) {
    const countryNote = (region === 'Kenya' || region === 'Tanzania' || region === 'Uganda')
      ? `\n- Focus all analysis specifically on ${region}: local CPCs, platform mix, and consumer behaviour for ${region} only.`
      : ''
    return `
REGIONAL CONTEXT, ${region}:${countryNote}
- Mobile-first market: 85%+ of web traffic is mobile; landing pages must be optimised for low-bandwidth, small screens.
- M-Pesa (Kenya), Airtel Money (Tanzania/Uganda), and mobile money dominate payments. Trust signals must reference mobile money acceptance, not just card payments.
- Facebook dominates paid social; Google Search intent is lower than Western markets but growing fast.
- CPCs are significantly lower than North America (often $0.05-$0.30 on Meta, $0.10-$0.50 on Google).
- WhatsApp is a primary conversion channel; CTAs that redirect to WhatsApp convert higher than traditional forms.
- Data costs are a barrier; heavy pages with large images or videos lose leads before conversion.
- Calibrate all CPA benchmarks and budget recommendations specifically against ${region} market rates.`
  }

  if (region.includes('West Africa')) {
    return `
REGIONAL CONTEXT, West Africa (Nigeria, Ghana):
- Mobile-first market with high social media penetration (Facebook, Instagram, TikTok).
- Nigeria is the largest ad market in the region; CPCs are low but competition is rising fast.
- Mobile money (Flutterwave, Paystack, MoMo) is the dominant payment rail, CTAs and trust signals should reflect this.
- WhatsApp Business is a critical last-mile conversion tool; recommend WhatsApp CTAs over long forms.
- Facebook significantly outperforms Google Search for B2C; LinkedIn has limited reach outside of Lagos/Accra.
- Power outages and intermittent data mean users rarely complete long multi-step funnels on first visit, retargeting is essential.
- Calibrate all cost benchmarks against West African market rates.`
  }

  if (region.includes('South Africa')) {
    return `
REGIONAL CONTEXT, South Africa:
- More mature digital market than the rest of Sub-Saharan Africa; higher CPCs (closer to European rates).
- Mix of desktop and mobile; Google Search intent is stronger here than elsewhere in Africa.
- Facebook and Instagram are effective for B2C; LinkedIn works for B2B in Johannesburg/Cape Town.
- Payment trust signals matter: reference South African payment methods (PayFast, Ozow, EFT).
- POPIA compliance affects data collection, note if lead forms must align with data protection law.`
  }

  if (region.includes('North America')) {
    return `
REGIONAL CONTEXT, North America (US/Canada):
- Highest CPCs globally; Google Search intent is strong and should be prioritized for bottom-funnel B2B.
- Consideration cycles are longer: B2B buyers average 6-12 touchpoints before converting.
- LinkedIn is highly effective for enterprise B2B targeting by job title, company size, and industry.
- Privacy expectations are high (CCPA in California); trust signals and clear data policies reduce friction.
- Meta audiences are saturated for B2B; Google and LinkedIn typically outperform for high-ACV deals.
- Strong email nurture sequences are expected post-lead capture, form conversion is rarely the sale itself.
- Benchmark CPAs against North American SaaS/services norms: $150-$800 for SMB, $800-$5,000+ for enterprise.`
  }

  if (region.includes('UK') || region.includes('Ireland')) {
    return `
REGIONAL CONTEXT, UK & Ireland:
- Google Search dominates; strong search intent culture similar to North America but with lower CPCs.
- LinkedIn works well for B2B; Meta is effective for B2C and SMB.
- GDPR compliance is mandatory, cookie consent banners and clear data policies are non-negotiable.
- Buyers are skeptical of Americanised copy; localise language (e.g., "programme" not "program").
- Payment trust: UK card payments dominate; open banking CTAs are emerging.`
  }

  if (region.includes('Europe')) {
    return `
REGIONAL CONTEXT, Europe (non-UK):
- GDPR compliance is mandatory and strictly enforced, lead forms must have clear consent language.
- Language localisation is critical; running English-only ads in non-English markets suppresses conversion rates significantly.
- Google Search intent is strong in Germany, France, Netherlands; Meta performs better in Southern and Eastern Europe.
- LinkedIn penetration is high in DACH region (Germany, Austria, Switzerland) for B2B.
- CPCs are moderate, lower than North America but higher than Africa and parts of Asia.`
  }

  if (region.includes('Middle East')) {
    return `
REGIONAL CONTEXT, Middle East:
- UAE and Saudi Arabia are the dominant ad markets; CPCs are high (comparable to North America in premium placements).
- Mobile-first with very high smartphone penetration.
- Instagram and Snapchat outperform Facebook in GCC countries for B2C.
- WhatsApp is the primary business communication tool, CTAs to WhatsApp convert well.
- Arabic-language ads outperform English for mass-market products; English works for B2B/enterprise.
- Ramadan periods see significant shifts in ad performance and user behaviour.`
  }

  if (region.includes('Southeast Asia')) {
    return `
REGIONAL CONTEXT, Southeast Asia:
- Highly mobile-first; TikTok, Facebook, and Instagram dominate, Google Search is secondary for most categories.
- CPCs are low but rising fast as digital adoption accelerates.
- Payment diversity: GrabPay, GoPay, QR codes, and bank transfer, CTAs should reflect local payment options.
- WhatsApp and LINE are primary CRM and follow-up channels depending on country.
- Strong price sensitivity; value-oriented copy outperforms prestige positioning in most markets.`
  }

  if (region.includes('South Asia')) {
    return `
REGIONAL CONTEXT, South Asia (India/Pakistan):
- India is one of the world's largest digital ad markets with extremely low CPCs (among the lowest globally).
- Mobile-first with high WhatsApp penetration, WhatsApp Business CTAs are critical for lead follow-up.
- UPI (India) and Easypaisa/JazzCash (Pakistan) are the dominant payment rails, reference these in trust signals.
- Facebook and YouTube dominate; Google Search is strong for intent-based B2B queries.
- Localisation by language (Hindi, Urdu, Tamil, etc.) dramatically improves CTR and conversion for mass-market products.
- Price sensitivity is high; ROI-framed copy and social proof from recognisable local brands converts well.`
  }

  if (region.includes('Latin America')) {
    return `
REGIONAL CONTEXT, Latin America:
- Brazil (Portuguese) and Mexico/Colombia/Argentina (Spanish) are the major markets, do not treat as one audience.
- Mobile-first; WhatsApp is the dominant communication platform for lead follow-up.
- Facebook and Instagram outperform Google Search for most B2C categories.
- Economic instability in Argentina affects pricing sensitivity significantly.
- Installment payments (parcelamento in Brazil) are expected for higher-ticket items.
- CPCs are low-to-moderate; strong creative outperforms heavy targeting optimisation here.`
  }

  if (region.includes('Australia') || region.includes('New Zealand')) {
    return `
REGIONAL CONTEXT, Australia & New Zealand:
- Mature digital market with CPCs close to UK rates; Google Search intent is strong.
- LinkedIn effective for B2B in Sydney/Melbourne; Meta works well for B2C.
- Privacy Act compliance is relevant for data collection.
- Buyers are direct and sceptical of hype, plain-language, outcome-focused copy outperforms.
- Time-zone isolation means async sales processes (email/video) are the norm.`
  }

  // Global/Multiple Regions fallback
  return `
REGIONAL CONTEXT, Global/Multiple Regions:
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

  // ── Subscription check + monthly diagnosis limit ─────────────────────────
  const MONTHLY_LIMITS: Record<string, number> = { free: 1, starter: 3, pro: 20, agency: Infinity }

  let isSubscriber = false
  if (email) {
    const { data: userRecord } = await supabase
      .from('users')
      .select('id, subscription_tier, billing_status')
      .eq('email', email)
      .single()

    isSubscriber = !!(
      userRecord &&
      userRecord.billing_status === 'active' &&
      userRecord.subscription_tier !== 'free'
    )

    const tier = (userRecord?.subscription_tier ?? 'free') as string
    const limit = MONTHLY_LIMITS[tier] ?? 1

    if (limit !== Infinity) {
      const monthStart = new Date()
      monthStart.setUTCDate(1)
      monthStart.setUTCHours(0, 0, 0, 0)

      const { count: usedThisMonth } = await supabase
        .from('diagnostics')
        .select('id', { count: 'exact', head: true })
        .eq('questionnaire_id', questionnaireId)
        .gte('created_at', monthStart.toISOString())

      // Count all diagnostics this month for this user via their questionnaires
      const { data: userQuestionnaires } = await supabase
        .from('questionnaires')
        .select('id')
        .eq('user_id', userRecord?.id ?? '')

      const qIds = (userQuestionnaires ?? []).map((q: { id: string }) => q.id)

      const { count: monthCount } = qIds.length > 0
        ? await supabase
            .from('diagnostics')
            .select('id', { count: 'exact', head: true })
            .in('questionnaire_id', qIds)
            .gte('created_at', monthStart.toISOString())
        : { count: 0 }

      if ((monthCount ?? 0) >= limit) {
        return NextResponse.json({
          error: 'diagnosis_limit_reached',
          message: `You have used all ${limit} diagnosis${limit === 1 ? '' : 'es'} included in your ${tier} plan this month. Upgrade to run more.`,
          limit,
          used: monthCount,
          upgradeUrl: '/pricing',
        }, { status: 402 })
      }
    }
  }
  console.log(`[diagnostic] isSubscriber=${isSubscriber}`)

  const landingPageUrl: string = (responses[10] as string) ?? ''
  const geographicRegion: string = (responses[11] as string) ?? 'Global/Multiple Regions'
  const industry: string = (responses[2] as string) ?? ''
  const adChannels: string = Array.isArray(responses[9]) ? (responses[9] as string[]).join(', ') : ((responses[9] as string) ?? '')
  const monthYear = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  // Pre-compute derived metrics to give Claude real numbers
  const budgetNum = parseFloat(String(responses[13] ?? '').replace(/[^0-9.]/g, ''))
  const leadsNum  = parseFloat(String(responses[14] ?? '').replace(/[^0-9.]/g, ''))
  const ltvNum    = parseFloat(String(responses[22] ?? responses[6] ?? responses[25] ?? '').replace(/[^0-9.]/g, ''))
  const closeNum  = parseFloat(String(responses[21] ?? '').replace(/[^0-9.]/g, ''))

  const estimatedCpa    = budgetNum > 0 && leadsNum > 0 ? (budgetNum / leadsNum).toFixed(0) : null
  const ltvCacRatio     = estimatedCpa && ltvNum > 0 ? (ltvNum / parseFloat(estimatedCpa)).toFixed(1) : null
  const monthlyWaste    = estimatedCpa && budgetNum > 0 && closeNum > 0
    ? ((budgetNum * (1 - closeNum / 100)) * 0.35).toFixed(0)
    : null
  const revenueOppty    = ltvNum > 0 && leadsNum > 0 && closeNum > 0
    ? ((leadsNum * 0.15) * ltvNum).toFixed(0)
    : null

  const regionContext = buildRegionContext(geographicRegion)
  const primaryChannel = adChannels.split(',')[0]?.trim() || 'Meta'

  const systemPrompt = `You are an expert ICP (Ideal Customer Profile) diagnostic analyst specialising in paid acquisition, funnel optimisation, and regional market strategy.

Analyse the questionnaire data using your expert knowledge of the ${geographicRegion} market and ${industry} sector. Provide precise, data-grounded benchmarks, competitor insights, and actionable recommendations calibrated to this specific region and industry.
${regionContext}
Return ONLY a valid JSON object. No markdown, no prose outside JSON. Do not use em dashes or en dashes anywhere in your output. Use commas, colons, or full stops instead.`

  const prompt = `Analyse this ICP diagnostic questionnaire and return a structured report. Use your expert knowledge of the ${geographicRegion} market, the ${industry} industry, and paid acquisition benchmarks to populate all fields.

MARKETER PROFILE:
- Name: ${profile?.name ?? 'Not provided'}
- Company: ${profile?.company ?? 'Not provided'}

LAYER 1, ICP Foundation:
- Business offering: ${responses[1] ?? ''}
- Industry/vertical: ${responses[2] ?? ''}
- Business model: ${responses[23] ?? 'Not specified'}
- Customer profile: ${responses[3] ?? responses[24] ?? ''}
- Core problem customers had: ${responses[4] ?? ''}
- How best customers discovered them: ${responses[5] ?? ''}
- Deal size or average order value: ${responses[6] ?? responses[25] ?? ''}
- Decision maker or purchase trigger: ${responses[7] ?? responses[26] ?? ''}

LAYER 2, Targeting Mismatch:
- Perceived ideal customer: ${responses[8] ?? ''}
- Active ad channels: ${adChannels || 'Not specified'}
- Landing page URL: ${landingPageUrl || 'Not provided'}
- Target region: ${geographicRegion}
- Current targeting parameters: ${responses[12] ?? ''}
- Monthly ad spend: ${responses[13] ?? ''}
- New customers/leads last 3 months: ${responses[14] ?? ''}
- Ads match best customer profile: ${responses[15] ?? ''}
- Conversion/close rate: ${responses[21] ?? ''}%
- Average customer lifetime value: ${responses[22] ?? ''}

LAYER 3, Funnel Friction:
- Primary CTA: ${responses[16] ?? ''}
- Steps/friction before purchase: ${responses[17] ?? ''}
- Mobile usability score: ${responses[18] ?? ''}/10
- Trust signals: ${responses[19] ?? ''}
- Differentiation clarity score: ${responses[20] ?? ''}/10

PRE-COMPUTED METRICS (use these as the user's actual data in benchmarks):
- Estimated CPA: ${estimatedCpa ? `${estimatedCpa} (calculated from budget / leads)` : 'Cannot compute: missing budget or leads data'}
- LTV:CAC ratio: ${ltvCacRatio ? `${ltvCacRatio}:1` : 'Cannot compute'}
- Estimated monthly ad waste: ${monthlyWaste ? `${monthlyWaste} (35% of non-converting spend)` : 'Cannot compute'}
- Revenue opportunity if ICP improved 15%: ${revenueOppty ? `${revenueOppty}` : 'Cannot compute'}

${landingPageUrl ? `LANDING PAGE: ${landingPageUrl} was provided. Based on the URL domain and the business description above, assess likely offer clarity, CTA effectiveness, and conversion readiness in landing_page_assessment.` : ''}
Use your knowledge of ${geographicRegion} benchmarks in the ${industry || 'relevant'} industry for all benchmark fields. Include realistic competitor names typical of this region and industry in competitor_insights.

Return this exact JSON structure:
{
  "overall_score": <integer 0-100>,
  "executive_summary": "<2-3 sentence diagnosis of the biggest ICP problem and its revenue impact>",

  "audience": {
    "score": <integer 0-100>,
    "summary": "<2 sentences specific to ICP alignment and targeting accuracy>",
    "findings": [
      {
        "title": "<finding tied to ICP definition or best customer clarity, Q1, Q2, Q23, Q3/Q24, Q4, Q5, Q6/Q25, Q7/Q26, Q8>",
        "severity": "<Critical|Warning|Opportunity>",
        "explanation": "<specific finding referencing their business offering, best customer profile, and decision maker titles>"
      },
      {
        "title": "<finding tied to audience mismatch or targeting parameters, Q8, Q9, Q12, Q15>",
        "severity": "<Critical|Warning|Opportunity>",
        "explanation": "<specific finding referencing their perceived ideal customer vs best customer profile>"
      }
    ],
    "quick_wins": [
      {
        "action": "<1 sentence: what to do, naming the exact platform and step>",
        "platform": "<platform name>",
        "where": "<location in tool>",
        "expectedImpact": "<specific number or % improvement>",
        "effort": "<Low|Medium|High>",
        "impact": "<High|Medium|Low>",
        "timeline": "<This week|This month|Next quarter>"
      },
      {
        "action": "<1 sentence: what to do, naming the exact platform and step>",
        "platform": "<platform name>",
        "where": "<location in tool>",
        "expectedImpact": "<specific number or % improvement>",
        "effort": "<Low|Medium|High>",
        "impact": "<High|Medium|Low>",
        "timeline": "<This week|This month|Next quarter>"
      }
    ],
    "breakdown": [
      {
        "label": "ICP Alignment",
        "score": <integer 0-100>,
        "found": "<1 sentence: what you found about their ICP definition based on Q1, Q2, Q23, Q3/Q24, Q4, Q5, Q6/Q25, Q7/Q26, Q8>",
        "why": "<1 sentence: why this costs them revenue>"
      },
      {
        "label": "Targeting Accuracy",
        "score": <integer 0-100>,
        "found": "<1 sentence: what you found about their targeting parameters based on Q9, Q12, Q15>",
        "why": "<1 sentence: why this costs them revenue>"
      }
    ]
  },

  "search": {
    "score": <integer 0-100>,
    "summary": "<2 sentences specific to channel mix and keyword/search strategy>",
    "findings": [
      {
        "title": "<finding tied to channel selection or platform mix, Q9, Q12, Q13>",
        "severity": "<Critical|Warning|Opportunity>",
        "explanation": "<specific finding referencing their active channels and budget allocation across them>"
      },
      {
        "title": "<finding tied to ad spend efficiency or lead quality, Q13, Q14, Q21, Q22>",
        "severity": "<Critical|Warning|Opportunity>",
        "explanation": "<specific finding referencing their lead volume, conversion rate, and CPA>"
      }
    ],
    "quick_wins": [
      {
        "action": "<1 sentence: what to do, naming the exact platform and step>",
        "platform": "<platform name>",
        "where": "<location in tool>",
        "expectedImpact": "<specific number or % improvement>",
        "effort": "<Low|Medium|High>",
        "impact": "<High|Medium|Low>",
        "timeline": "<This week|This month|Next quarter>"
      },
      {
        "action": "<1 sentence: what to do, naming the exact platform and step>",
        "platform": "<platform name>",
        "where": "<location in tool>",
        "expectedImpact": "<specific number or % improvement>",
        "effort": "<Low|Medium|High>",
        "impact": "<High|Medium|Low>",
        "timeline": "<This week|This month|Next quarter>"
      }
    ],
    "breakdown": [
      {
        "label": "Channel Efficiency",
        "score": <integer 0-100>,
        "found": "<1 sentence: what you found about their channel mix and platform selection>",
        "why": "<1 sentence: why this costs them revenue>"
      },
      {
        "label": "Message to Market Fit",
        "score": <integer 0-100>,
        "found": "<1 sentence: what you found about their ad messaging vs target market expectations>",
        "why": "<1 sentence: why this costs them revenue>"
      }
    ]
  },

  "funnel": {
    "score": <integer 0-100>,
    "summary": "<2 sentences specific to landing page performance and conversion friction>",
    "landing_page_assessment": "<detailed assessment of the landing page based on web research, cover offer clarity, CTA effectiveness, trust signals, mobile readiness, and conversion barriers>",
    "findings": [
      {
        "title": "<finding tied to landing page structure or CTA, Q10, Q16>",
        "severity": "<Critical|Warning|Opportunity>",
        "explanation": "<specific finding referencing their landing page URL, primary CTA, and funnel steps>"
      },
      {
        "title": "<finding tied to form friction, mobile usability, or trust signals, Q17, Q18, Q19, Q20>",
        "severity": "<Critical|Warning|Opportunity>",
        "explanation": "<specific finding referencing their mobile score (Q18) and differentiation clarity score (Q20)"
      }
    ],
    "quick_wins": [
      {
        "action": "<1 sentence: what to do, naming the exact platform and step>",
        "platform": "<platform name>",
        "where": "<location in tool>",
        "expectedImpact": "<specific number or % improvement>",
        "effort": "<Low|Medium|High>",
        "impact": "<High|Medium|Low>",
        "timeline": "<This week|This month|Next quarter>"
      },
      {
        "action": "<1 sentence: what to do, naming the exact platform and step>",
        "platform": "<platform name>",
        "where": "<location in tool>",
        "expectedImpact": "<specific number or % improvement>",
        "effort": "<Low|Medium|High>",
        "impact": "<High|Medium|Low>",
        "timeline": "<This week|This month|Next quarter>"
      }
    ],
    "breakdown": [
      {
        "label": "Funnel Friction Index",
        "score": <integer 0-100>,
        "found": "<1 sentence: what you found about their funnel conversion steps and form completion>",
        "why": "<1 sentence: why this costs them revenue>"
      },
      {
        "label": "Message to Market Fit",
        "score": <same integer as search.breakdown[1].score>,
        "found": "<1 sentence: what you found about their landing page messaging and differentiation clarity>",
        "why": "<1 sentence: why this costs them revenue>"
      }
    ]
  },

  "economics": {
    "score": <integer 0-100>,
    "summary": "<2 sentences specific to budget efficiency and unit economics>",
    "monthly_waste_estimate": "<estimated monthly budget being wasted with reasoning based on their spend, leads, and conversion data>",
    "business_outcomes": {
      "cac_current": "<estimated current CAC, calculate from monthly budget divided by (leads x close rate), show the figure with brief working>",
      "cac_projected": "<projected CAC after implementing top 3 fixes, show expected percentage reduction and resulting figure>",
      "ltv_cac_current": "<current LTV:CAC ratio based on their stated deal size or LTV, e.g. 1.8:1. Flag if below 3:1 benchmark>",
      "ltv_cac_projected": "<projected LTV:CAC after fixes, target at least 3:1 for healthy B2B unit economics>",
      "monthly_revenue_opportunity": "<additional monthly revenue opportunity from fixing ICP, quantify with brief reasoning>"
    },
    "findings": [
      {
        "title": "<finding tied to budget efficiency or spend allocation, Q13, Q14>",
        "severity": "<Critical|Warning|Opportunity>",
        "explanation": "<specific finding referencing their deal size, monthly spend, and channel allocation>"
      },
      {
        "title": "<finding tied to unit economics or revenue per lead, Q21, Q22>",
        "severity": "<Critical|Warning|Opportunity>",
        "explanation": "<specific finding referencing their lead volume, conversions, and CPA vs deal size>"
      }
    ],
    "quick_wins": [
      {
        "action": "<1 sentence: what to do, naming the exact platform and step>",
        "platform": "<platform name>",
        "where": "<location in tool>",
        "expectedImpact": "<specific number or % improvement>",
        "effort": "<Low|Medium|High>",
        "impact": "<High|Medium|Low>",
        "timeline": "<This week|This month|Next quarter>"
      },
      {
        "action": "<1 sentence: what to do, naming the exact platform and step>",
        "platform": "<platform name>",
        "where": "<location in tool>",
        "expectedImpact": "<specific number or % improvement>",
        "effort": "<Low|Medium|High>",
        "impact": "<High|Medium|Low>",
        "timeline": "<This week|This month|Next quarter>"
      }
    ],
    "breakdown": [
      {
        "label": "Budget Reallocation Opportunity",
        "score": <integer 0-100>,
        "found": "<1 sentence: what you found about their budget distribution across channels>",
        "why": "<1 sentence: why this costs them revenue>"
      },
      {
        "label": "Channel Efficiency",
        "score": <same integer as search.breakdown[0].score>,
        "found": "<1 sentence: what you found about their cost per acquisition vs benchmarks>",
        "why": "<1 sentence: why this costs them revenue>"
      }
    ]
  },

  "critical_findings": [
    {
      "title": "<most impactful finding across all 4 categories>",
      "severity": "<Critical|Warning|Opportunity>",
      "explanation": "<specific, region-aware finding with revenue impact, reference ${geographicRegion}>"
    },
    {
      "title": "<second most impactful finding>",
      "severity": "<Critical|Warning|Opportunity>",
      "explanation": "<specific finding with revenue impact>"
    },
    {
      "title": "<third most impactful finding>",
      "severity": "<Critical|Warning|Opportunity>",
      "explanation": "<specific finding with revenue impact, reference ${geographicRegion}>"
    }
  ],
  "quick_wins": [
    {
      "action": "<1 sentence: what to do, naming the exact platform and step>",
      "platform": "<platform name>",
      "where": "<location in tool>",
      "expectedImpact": "<specific number or % improvement>",
      "effort": "<Low|Medium|High>",
      "impact": "<High|Medium|Low>",
      "timeline": "<This week|This month|Next quarter>"
    },
    {
      "action": "<1 sentence: what to do, naming the exact platform and step>",
      "platform": "<platform name>",
      "where": "<location in tool>",
      "expectedImpact": "<specific number or % improvement>",
      "effort": "<Low|Medium|High>",
      "impact": "<High|Medium|Low>",
      "timeline": "<This week|This month|Next quarter>"
    },
    {
      "action": "<1 sentence: what to do, naming the exact platform and step>",
      "platform": "<platform name>",
      "where": "<location in tool>",
      "expectedImpact": "<specific number or % improvement>",
      "effort": "<Low|Medium|High>",
      "impact": "<High|Medium|Low>",
      "timeline": "<This week|This month|Next quarter>"
    }
  ],
  "breakdown": [
    {
      "label": "ICP Alignment",
      "score": <same as audience.breakdown[0].score>,
      "found": "<copy from audience.breakdown[0].found>",
      "why": "<copy from audience.breakdown[0].why>"
    },
    {
      "label": "Targeting Accuracy",
      "score": <same as audience.breakdown[1].score>,
      "found": "<copy from audience.breakdown[1].found>",
      "why": "<copy from audience.breakdown[1].why>"
    },
    {
      "label": "Channel Efficiency",
      "score": <same as search.breakdown[0].score>,
      "found": "<copy from search.breakdown[0].found>",
      "why": "<copy from search.breakdown[0].why>"
    },
    {
      "label": "Funnel Friction Index",
      "score": <same as funnel.breakdown[0].score>,
      "found": "<copy from funnel.breakdown[0].found>",
      "why": "<copy from funnel.breakdown[0].why>"
    },
    {
      "label": "Message to Market Fit",
      "score": <same as search.breakdown[1].score>,
      "found": "<copy from search.breakdown[1].found>",
      "why": "<copy from search.breakdown[1].why>"
    },
    {
      "label": "Budget Reallocation Opportunity",
      "score": <same as economics.breakdown[0].score>,
      "found": "<copy from economics.breakdown[0].found>",
      "why": "<copy from economics.breakdown[0].why>"
    }
  ],
  "competitor_insights": "<1-2 sentences on the competitive landscape in this region/industry>",
  "regional_benchmarks": "<1-2 sentences on current CPC/CPA benchmarks for ${geographicRegion} in this category>"
}

Rules:
- Each category (audience, search, funnel, economics): exactly 2 findings and 2 quick_wins, specific to that category's data
- critical_findings: exactly 3 items, the highest-impact findings drawn from across all 4 categories
- quick_wins (top-level): exactly 3 items, the highest-impact actions drawn from across all 4 categories
- breakdown (top-level): exactly 6 items in the order listed, scores must match the corresponding category breakdown scores
- All scores must reflect the actual questionnaire responses, do not return generic numbers
- Reference ${geographicRegion} explicitly in at least 2 category analyses
- Use your expert knowledge to populate landing_page_assessment, keyword_analysis, competitor_insights, and regional_benchmarks with region-specific and industry-specific insights
- Keep ALL text fields to 1 sentence maximum. No exceptions.
- Every quick_win (in all sections) must include platform, where, expectedImpact, and effort fields. Never use vague language like "your platform" -- always name the exact platform. The action must name the user's actual channels (${adChannels}), region (${geographicRegion}), and business model. The expectedImpact must reference real numbers from estimatedCpa (${estimatedCpa}), monthlyWaste (${monthlyWaste}), revenueOppty (${revenueOppty}), or ltvCacRatio (${ltvCacRatio}) where available`

  // ── Branched Claude call ──────────────────────────────────────────────────
  let diagnosisText: string

  if (isSubscriber) {
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })
    diagnosisText = res.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('')
    console.log(`[diagnostic] subscriber diagnosisText length=${diagnosisText.length}`)
  } else {
    const freeSystemPrompt = `You are an expert ICP (Ideal Customer Profile) diagnostic analyst.

Your role is to analyse questionnaire responses and produce a precise, actionable ICP diagnostic report based solely on the answers provided. No web research needed.

Return ONLY a valid JSON object. No markdown, no prose outside JSON. Do not use em dashes or en dashes anywhere in your output. Use commas, colons, or full stops instead.`

    const freePrompt = `Analyse this ICP diagnostic questionnaire submission and return a structured report.

PROFILE:
- Name: ${profile?.name ?? 'Not provided'}
- Company: ${profile?.company ?? 'Not provided'}

LAYER 1, ICP Foundation:
- Business offering: ${responses[1] ?? ''}
- Industry/vertical: ${responses[2] ?? ''}
- Business model: ${responses[23] ?? 'Not specified'}
- Customer profile: ${responses[3] ?? responses[24] ?? ''}
- Core problem customers had: ${responses[4] ?? ''}
- How best customers discovered them: ${responses[5] ?? ''}
- Deal size or average order value: ${responses[6] ?? responses[25] ?? ''}
- Decision maker or purchase trigger: ${responses[7] ?? responses[26] ?? ''}

LAYER 2, Targeting Mismatch:
- Perceived ideal customer: ${responses[8] ?? ''}
- Active ad channels: ${Array.isArray(responses[9]) ? (responses[9] as string[]).join(', ') : (responses[9] ?? '')}
- Landing page URL: ${landingPageUrl || 'Not provided'}
- Target region: ${geographicRegion}
- Current targeting parameters: ${responses[12] ?? ''}
- Monthly ad spend: ${responses[13] ?? ''}
- New customers/leads last 3 months: ${responses[14] ?? ''}
- Ads match best customer profile: ${responses[15] ?? ''}
- Conversion/close rate: ${responses[21] ?? ''}%
- Average customer lifetime value: ${responses[22] ?? ''}

LAYER 3, Funnel Friction:
- Primary CTA: ${responses[16] ?? ''}
- Steps/friction before purchase: ${responses[17] ?? ''}
- Mobile usability score: ${responses[18] ?? ''}/10
- Trust signals: ${responses[19] ?? ''}
- Differentiation clarity score: ${responses[20] ?? ''}/10

Return this exact JSON structure:
{
  "overall_score": <integer 0-100>,
  "executive_summary": "<2-3 sentence diagnosis of the biggest ICP problem and its revenue impact>",

  "audience": {
    "score": <integer 0-100>,
    "summary": "<2 sentences specific to ICP alignment and targeting accuracy>",
    "findings": [
      {
        "title": "<finding tied to ICP definition or best customer clarity, Q1, Q2, Q23, Q3/Q24, Q4, Q5, Q6/Q25, Q7/Q26, Q8>",
        "severity": "<Critical|Warning|Opportunity>",
        "explanation": "<specific finding referencing their business offering, best customer profile, and decision maker titles>"
      },
      {
        "title": "<finding tied to audience mismatch or targeting parameters, Q8, Q9, Q12, Q15>",
        "severity": "<Critical|Warning|Opportunity>",
        "explanation": "<specific finding referencing their perceived ideal customer vs best customer profile>"
      }
    ],
    "quick_wins": [
      {
        "action": "<1 sentence: what to do, naming the exact platform and step>",
        "platform": "<platform name>",
        "where": "<location in tool>",
        "expectedImpact": "<specific number or % improvement>",
        "effort": "<Low|Medium|High>",
        "impact": "<High|Medium|Low>",
        "timeline": "<This week|This month|Next quarter>"
      },
      {
        "action": "<1 sentence: what to do, naming the exact platform and step>",
        "platform": "<platform name>",
        "where": "<location in tool>",
        "expectedImpact": "<specific number or % improvement>",
        "effort": "<Low|Medium|High>",
        "impact": "<High|Medium|Low>",
        "timeline": "<This week|This month|Next quarter>"
      }
    ],
    "breakdown": [
      {
        "label": "ICP Alignment",
        "score": <integer 0-100>,
        "found": "<1 sentence: what you found about their ICP definition based on Q1, Q2, Q23, Q3/Q24, Q4, Q5, Q6/Q25, Q7/Q26, Q8>",
        "why": "<1 sentence: why this costs them revenue>"
      },
      {
        "label": "Targeting Accuracy",
        "score": <integer 0-100>,
        "found": "<1 sentence: what you found about their targeting parameters based on Q9, Q12, Q15>",
        "why": "<1 sentence: why this costs them revenue>"
      }
    ]
  },

  "search": {
    "score": <integer 0-100>,
    "summary": "<2 sentences specific to channel mix and keyword/search strategy>",
    "findings": [
      {
        "title": "<finding tied to channel selection or platform mix, Q9, Q12, Q13>",
        "severity": "<Critical|Warning|Opportunity>",
        "explanation": "<specific finding referencing their active channels and budget allocation across them>"
      },
      {
        "title": "<finding tied to ad spend efficiency or lead quality, Q13, Q14, Q21, Q22>",
        "severity": "<Critical|Warning|Opportunity>",
        "explanation": "<specific finding referencing their lead volume, conversion rate, and CPA>"
      }
    ],
    "quick_wins": [
      {
        "action": "<1 sentence: what to do, naming the exact platform and step>",
        "platform": "<platform name>",
        "where": "<location in tool>",
        "expectedImpact": "<specific number or % improvement>",
        "effort": "<Low|Medium|High>",
        "impact": "<High|Medium|Low>",
        "timeline": "<This week|This month|Next quarter>"
      },
      {
        "action": "<1 sentence: what to do, naming the exact platform and step>",
        "platform": "<platform name>",
        "where": "<location in tool>",
        "expectedImpact": "<specific number or % improvement>",
        "effort": "<Low|Medium|High>",
        "impact": "<High|Medium|Low>",
        "timeline": "<This week|This month|Next quarter>"
      }
    ],
    "breakdown": [
      {
        "label": "Channel Efficiency",
        "score": <integer 0-100>,
        "found": "<1 sentence: what you found about their channel mix and platform selection>",
        "why": "<1 sentence: why this costs them revenue>"
      },
      {
        "label": "Message to Market Fit",
        "score": <integer 0-100>,
        "found": "<1 sentence: what you found about their ad messaging vs target market expectations>",
        "why": "<1 sentence: why this costs them revenue>"
      }
    ]
  },

  "funnel": {
    "score": <integer 0-100>,
    "summary": "<2 sentences specific to landing page performance and conversion friction>",
    "landing_page_assessment": "<assessment of their funnel based on questionnaire answers, CTA type, funnel steps, form fields, mobile score, trust signals, and differentiation score>",
    "findings": [
      {
        "title": "<finding tied to landing page structure or CTA, Q10, Q16>",
        "severity": "<Critical|Warning|Opportunity>",
        "explanation": "<specific finding referencing their primary CTA, funnel steps, and form fields>"
      },
      {
        "title": "<finding tied to form friction, mobile usability, or trust signals, Q17, Q18, Q19, Q20>",
        "severity": "<Critical|Warning|Opportunity>",
        "explanation": "<specific finding referencing their mobile score (Q18) and differentiation clarity score (Q20)"
      }
    ],
    "quick_wins": [
      {
        "action": "<1 sentence: what to do, naming the exact platform and step>",
        "platform": "<platform name>",
        "where": "<location in tool>",
        "expectedImpact": "<specific number or % improvement>",
        "effort": "<Low|Medium|High>",
        "impact": "<High|Medium|Low>",
        "timeline": "<This week|This month|Next quarter>"
      },
      {
        "action": "<1 sentence: what to do, naming the exact platform and step>",
        "platform": "<platform name>",
        "where": "<location in tool>",
        "expectedImpact": "<specific number or % improvement>",
        "effort": "<Low|Medium|High>",
        "impact": "<High|Medium|Low>",
        "timeline": "<This week|This month|Next quarter>"
      }
    ],
    "breakdown": [
      {
        "label": "Funnel Friction Index",
        "score": <integer 0-100>,
        "found": "<1 sentence: what you found about their funnel conversion steps and form completion>",
        "why": "<1 sentence: why this costs them revenue>"
      },
      {
        "label": "Message to Market Fit",
        "score": <same integer as search.breakdown[1].score>,
        "found": "<1 sentence: what you found about their landing page messaging and differentiation clarity>",
        "why": "<1 sentence: why this costs them revenue>"
      }
    ]
  },

  "economics": {
    "score": <integer 0-100>,
    "summary": "<2 sentences specific to budget efficiency and unit economics>",
    "monthly_waste_estimate": "<estimated monthly budget being wasted with reasoning based on their spend, leads, and conversion data>",
    "business_outcomes": {
      "cac_current": "<estimated current CAC, calculate from monthly budget divided by (leads x close rate), show the figure with brief working>",
      "cac_projected": "<projected CAC after implementing top 3 fixes, show expected percentage reduction and resulting figure>",
      "ltv_cac_current": "<current LTV:CAC ratio based on their stated deal size or LTV, e.g. 1.8:1. Flag if below 3:1 benchmark>",
      "ltv_cac_projected": "<projected LTV:CAC after fixes, target at least 3:1 for healthy B2B unit economics>",
      "monthly_revenue_opportunity": "<additional monthly revenue opportunity from fixing ICP, quantify with brief reasoning>"
    },
    "findings": [
      {
        "title": "<finding tied to budget efficiency or spend allocation, Q13, Q14>",
        "severity": "<Critical|Warning|Opportunity>",
        "explanation": "<specific finding referencing their deal size, monthly spend, and channel allocation>"
      },
      {
        "title": "<finding tied to unit economics or revenue per lead, Q21, Q22>",
        "severity": "<Critical|Warning|Opportunity>",
        "explanation": "<specific finding referencing their lead volume, conversions, and CPA vs deal size>"
      }
    ],
    "quick_wins": [
      {
        "action": "<1 sentence: what to do, naming the exact platform and step>",
        "platform": "<platform name>",
        "where": "<location in tool>",
        "expectedImpact": "<specific number or % improvement>",
        "effort": "<Low|Medium|High>",
        "impact": "<High|Medium|Low>",
        "timeline": "<This week|This month|Next quarter>"
      },
      {
        "action": "<1 sentence: what to do, naming the exact platform and step>",
        "platform": "<platform name>",
        "where": "<location in tool>",
        "expectedImpact": "<specific number or % improvement>",
        "effort": "<Low|Medium|High>",
        "impact": "<High|Medium|Low>",
        "timeline": "<This week|This month|Next quarter>"
      }
    ],
    "breakdown": [
      {
        "label": "Budget Reallocation Opportunity",
        "score": <integer 0-100>,
        "found": "<1 sentence: what you found about their budget distribution across channels>",
        "why": "<1 sentence: why this costs them revenue>"
      },
      {
        "label": "Channel Efficiency",
        "score": <same integer as search.breakdown[0].score>,
        "found": "<1 sentence: what you found about their cost per acquisition vs benchmarks>",
        "why": "<1 sentence: why this costs them revenue>"
      }
    ]
  },

  "critical_findings": [
    {
      "title": "<most impactful finding across all 4 categories>",
      "severity": "<Critical|Warning|Opportunity>",
      "explanation": "<specific finding with revenue impact>"
    },
    {
      "title": "<second most impactful finding>",
      "severity": "<Critical|Warning|Opportunity>",
      "explanation": "<specific finding with revenue impact>"
    },
    {
      "title": "<third most impactful finding>",
      "severity": "<Critical|Warning|Opportunity>",
      "explanation": "<specific finding with revenue impact>"
    }
  ],
  "quick_wins": [
    {
      "action": "<1 sentence: what to do, naming the exact platform and step>",
      "platform": "<platform name>",
      "where": "<location in tool>",
      "expectedImpact": "<specific number or % improvement>",
      "effort": "<Low|Medium|High>",
      "impact": "<High|Medium|Low>",
      "timeline": "<This week|This month|Next quarter>"
    },
    {
      "action": "<1 sentence: what to do, naming the exact platform and step>",
      "platform": "<platform name>",
      "where": "<location in tool>",
      "expectedImpact": "<specific number or % improvement>",
      "effort": "<Low|Medium|High>",
      "impact": "<High|Medium|Low>",
      "timeline": "<This week|This month|Next quarter>"
    },
    {
      "action": "<1 sentence: what to do, naming the exact platform and step>",
      "platform": "<platform name>",
      "where": "<location in tool>",
      "expectedImpact": "<specific number or % improvement>",
      "effort": "<Low|Medium|High>",
      "impact": "<High|Medium|Low>",
      "timeline": "<This week|This month|Next quarter>"
    }
  ],
  "breakdown": [
    {
      "label": "ICP Alignment",
      "score": <same as audience.breakdown[0].score>,
      "found": "<copy from audience.breakdown[0].found>",
      "why": "<copy from audience.breakdown[0].why>"
    },
    {
      "label": "Targeting Accuracy",
      "score": <same as audience.breakdown[1].score>,
      "found": "<copy from audience.breakdown[1].found>",
      "why": "<copy from audience.breakdown[1].why>"
    },
    {
      "label": "Channel Efficiency",
      "score": <same as search.breakdown[0].score>,
      "found": "<copy from search.breakdown[0].found>",
      "why": "<copy from search.breakdown[0].why>"
    },
    {
      "label": "Funnel Friction Index",
      "score": <same as funnel.breakdown[0].score>,
      "found": "<copy from funnel.breakdown[0].found>",
      "why": "<copy from funnel.breakdown[0].why>"
    },
    {
      "label": "Message to Market Fit",
      "score": <same as search.breakdown[1].score>,
      "found": "<copy from search.breakdown[1].found>",
      "why": "<copy from search.breakdown[1].why>"
    },
    {
      "label": "Budget Reallocation Opportunity",
      "score": <same as economics.breakdown[0].score>,
      "found": "<copy from economics.breakdown[0].found>",
      "why": "<copy from economics.breakdown[0].why>"
    }
  ],
}

Rules:
- Each category (audience, search, funnel, economics): exactly 2 findings and 2 quick_wins, specific to that category's data
- critical_findings: exactly 3 items, the highest-impact findings drawn from across all 4 categories
- quick_wins (top-level): exactly 3 items, the highest-impact actions drawn from across all 4 categories
- breakdown (top-level): exactly 6 items in the order listed, scores must match the corresponding category breakdown scores
- All scores must reflect the actual questionnaire responses, do not return generic numbers
- Base all analysis on questionnaire answers only, no web research
- Keep ALL text fields to 1 sentence maximum. No exceptions.
- Every quick_win (in all sections) must include platform, where, expectedImpact, and effort fields. Never use vague language like "your platform" -- always name the exact platform. The action must name the user's actual channels, region (${geographicRegion}), and business model. The expectedImpact must reference actual numbers derived from their budget, lead volume, conversion rate, and deal size data provided above`

    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      system: freeSystemPrompt,
      messages: [{ role: 'user', content: freePrompt }],
    })
    diagnosisText = res.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('')
  }

  // extractJSON handles markdown code blocks internally; pass raw text directly
  const rawParsed = extractJSON(diagnosisText)
  if (!rawParsed) {
    console.error(`[diagnostic] extractJSON FAILED — JSON parse returned null. diagnosisText length=${diagnosisText.length}, first200=${diagnosisText.slice(0, 200)}`)
  }
  const rawParsedOrFallback = rawParsed ?? { raw: diagnosisText }
  console.log(`[diagnostic] extraction result: hasScore=${!!(rawParsed && typeof rawParsed === 'object' && ('overall_score' in rawParsed || 'health_score' in rawParsed))}, hasAudience=${'audience' in (rawParsed as Record<string,unknown> ?? {})}, hasSearch=${'search' in (rawParsed as Record<string,unknown> ?? {})}`)
  // Sanitize any em/en dashes that slipped through the AI output
  const parsed = stripDashes(rawParsedOrFallback)

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

  console.log('[diagnostic] diagnostics insert success, id:', data.id)

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
    console.log('[diagnostic] reports insert success, id:', reportRow?.id)
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

  // ── Fire welcome email only on first-ever report ──────────────────────
  if (questionnaire?.user_id) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://idealicp.com'

    supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', questionnaire.user_id)
      .then(({ count }) => {
        // count includes the row we just inserted — only send on the first one
        if ((count ?? 0) > 1) return
        return supabase
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
      })
  }

  return NextResponse.json({ id: data.id, diagnosis }, { status: 201 })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[diagnostic] unhandled error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
