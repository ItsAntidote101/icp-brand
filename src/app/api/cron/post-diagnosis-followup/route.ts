import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { sendPostDiagnosis48hEmail, sendPostDiagnosis7dEmail } from '@/lib/email'

export const dynamic     = 'force-dynamic'
export const maxDuration = 120

const supabase  = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder',
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://idealicp.com'

const BUYERS: Record<string, { name: string; initials: string; title: string; tone: string }> = {
  EK: { name: 'Eugene Kariuki',  initials: 'EK', title: 'Senior Media Buyer, East Africa',     tone: 'direct and practical, references Nairobi/Kenya market specifics' },
  AM: { name: 'Aisha Mensah',    initials: 'AM', title: 'Senior Media Buyer, West Africa',     tone: 'energetic and data-focused, references Lagos/Accra market context' },
  DO: { name: 'David Osei',      initials: 'DO', title: 'Performance Strategist, South Africa', tone: 'analytical and precise, references Johannesburg/Cape Town context' },
  GN: { name: 'Grace Nakato',    initials: 'GN', title: 'Paid Social Lead, East Africa',       tone: 'warm but results-focused, strong on Meta/social commerce' },
  MW: { name: 'Marcus Webb',     initials: 'MW', title: 'Global Performance Lead',             tone: 'strategic and senior, references global patterns' },
}

function assignBuyer(region: string, industry: string, tier: string) {
  const r = region.toLowerCase(); const i = industry.toLowerCase()
  if (tier === 'agency') return BUYERS.MW
  if (r.includes('west') || r.includes('ghana') || r.includes('nigeria') || r.includes('lagos') || r.includes('accra')) return BUYERS.AM
  if (r.includes('south') || r.includes('johannesburg') || r.includes('cape') || r.includes('durban')) return BUYERS.DO
  if (i.includes('ecommerce') || i.includes('e-commerce') || i.includes('retail')) return BUYERS.GN
  return BUYERS.EK
}

function getScore(summary: string): number | null {
  try { const p = JSON.parse(summary); return p.overall_score ?? p.health_score ?? null } catch { return null }
}

function hoursBetween(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60)
}

function daysBetween(iso: string): number {
  return hoursBetween(iso) / 24
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only active accounts — cancelled users should not receive follow-up emails
  const { data: users, error: usersErr } = await supabase
    .from('users')
    .select('id, email, full_name, subscription_tier, billing_status, user_badges')
    .eq('billing_status', 'active')

  if (usersErr) {
    console.error('[post-diag-followup] fetch users error:', JSON.stringify(usersErr))
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  const results = { buyerIntro: 0, sent48h: 0, sent7d: 0, errors: 0 }

  for (const user of users ?? []) {
    const badges = (user.user_badges ?? {}) as Record<string, unknown>

    try {
      const { data: reports } = await supabase
        .from('reports')
        .select('id, report_summary, generated_at')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(1)

      const latest = reports?.[0]
      if (!latest) continue

      const hours = hoursBetween(latest.generated_at as string)
      const days  = daysBetween(latest.generated_at as string)
      const score = getScore(latest.report_summary as string)

      // ──────────────────────────────────────────────────────────────────
      // BUYER INTRO: 2h after first-ever diagnosis or any new diagnosis
      // ──────────────────────────────────────────────────────────────────
      const alreadyIntro = badges.notif_buyer_intro_report === latest.id
      if (hours >= 2 && hours <= 6 && !alreadyIntro) {
        try {
          // Load questionnaire context
          const { data: rawQ } = await supabase
            .from('questionnaires')
            .select('responses')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          const r = (rawQ?.responses as Record<string, unknown>) ?? {}
          const region   = (r[11] as string) ?? 'Kenya'
          const industry = (r[2]  as string) ?? 'business'
          const tier     = (user.subscription_tier as string) ?? 'free'
          const buyer    = assignBuyer(region, industry, tier)

          // Parse findings and top quick win
          let topFinding = ''; let topAction = ''; let execSummary = ''
          try {
            const d = JSON.parse(latest.report_summary as string) as Record<string, unknown>
            execSummary = (d.executive_summary as string) ?? ''
            const findings = [
              ...((d.audience as Record<string, unknown>)?.findings as Array<{severity: string; title: string; explanation: string}> ?? []),
              ...((d.search   as Record<string, unknown>)?.findings as Array<{severity: string; title: string; explanation: string}> ?? []),
            ]
            const critical = findings.find(f => f.severity === 'Critical') ?? findings[0]
            if (critical) topFinding = `${critical.title}: ${critical.explanation}`
            const wins = d.quick_wins as Array<{ action: string }> | undefined
            if (wins?.[0]) topAction = wins[0].action
          } catch { /* noop */ }

          const firstName = user.full_name?.split(' ')[0] ?? 'there'
          const prompt = `You are ${buyer.name}, ${buyer.title} at Ideal ICP. Your tone is ${buyer.tone}.

Write a short, personal first message to ${firstName} (${user.email}) who just completed their ICP diagnostic${score !== null ? ` and scored ${score}/100` : ''}.

Their context:
- Executive summary: ${execSummary || 'Not available'}
- Top finding: ${topFinding || 'Not available'}
- Top quick win: ${topAction || 'Not available'}
- Industry: ${industry}
- Region: ${region}

Rules:
- 3-4 sentences maximum. Do not exceed this.
- Address them by first name (${firstName})
- Reference ONE specific finding or insight from their report
- Give ONE concrete suggestion or observation
- End with an open question to invite a reply
- Sound like a real human expert, not an AI
- Do NOT mention that you are an AI
- Do NOT use em dashes or en dashes
- Do NOT be generic. Reference their specific situation.`

          const res = await anthropic.messages.create({
            model:      'claude-haiku-4-5-20251001',
            max_tokens: 200,
            messages:   [{ role: 'user', content: prompt }],
          })
          const message = (res.content[0] as { type: string; text: string }).text
            .replace(/ — /g, ', ').replace(/— /g, ', ').replace(/—/g, '-')
            .trim()

          // Store in monthly_checkins as buyer intro (month_key = 'intro')
          await supabase.from('monthly_checkins').upsert({
            user_id:         user.id,
            month_key:       'intro',
            message,
            buyer_name:      buyer.name,
            buyer_initials:  buyer.initials,
            created_at:      new Date().toISOString(),
          }, { onConflict: 'user_id,month_key' })

          // Mark user as having an unread reply
          await supabase.from('users')
            .update({ has_unread_reply: true })
            .eq('id', user.id)

          // Track so we don't re-send for same report
          await supabase.from('users').update({
            user_badges: { ...badges, notif_buyer_intro_report: latest.id },
          }).eq('id', user.id)

          results.buyerIntro++
        } catch (introErr) {
          console.error('[post-diag-followup] buyer intro error for:', user.email, introErr)
        }
      }

      // Parse quick wins + findings once
      let topFinding: string | undefined
      let topAction:  string | undefined
      let predictedGain: number | undefined

      try {
        const d = JSON.parse(latest.report_summary as string) as Record<string, unknown>

        // Top critical/warning finding
        const allFindings = [
          ...((d.audience as Record<string, unknown>)?.findings as Array<{severity: string; title: string; explanation: string}> ?? []),
          ...((d.search   as Record<string, unknown>)?.findings as Array<{severity: string; title: string; explanation: string}> ?? []),
          ...((d.funnel   as Record<string, unknown>)?.findings as Array<{severity: string; title: string; explanation: string}> ?? []),
        ]
        const critical = allFindings.find(f => f.severity === 'Critical') ?? allFindings[0]
        if (critical) topFinding = `${critical.title} — ${critical.explanation}`

        // Top quick win from score_predictions if available, else top-level quick_wins
        const preds = d.score_predictions as Array<{ action: string; predictedDelta: number; impact: string }> | undefined
        if (preds?.[0]) {
          topAction    = preds[0].action
          predictedGain = preds[0].predictedDelta
        } else {
          const wins = d.quick_wins as Array<{ action: string; impact: string; expectedImpact: string }> | undefined
          if (wins?.[0]) {
            topAction = wins[0].action
            // Estimate gain heuristically if no predictions stored
            const base = wins[0].impact === 'High' ? 8 : wins[0].impact === 'Medium' ? 5 : 3
            const scaleFactor = (score ?? 50) < 40 ? 1.2 : (score ?? 50) < 60 ? 1.0 : 0.7
            predictedGain = Math.max(1, Math.round(base * scaleFactor))
          }
        }
      } catch { /* noop */ }

      // ──────────────────────────────────────────────────────────────────
      // 48-hour follow-up: send between 46h and 52h after report
      // ──────────────────────────────────────────────────────────────────
      const already48h = badges.notif_48h_report_id === latest.id
      if (hours >= 46 && hours <= 52 && !already48h) {
        await sendPostDiagnosis48hEmail({
          to: user.email, name: user.full_name ?? undefined,
          score: score ?? undefined, topFinding, topAction, baseUrl: BASE_URL,
        })
        await supabase.from('users').update({
          user_badges: { ...badges, notif_48h_report_id: latest.id },
        }).eq('id', user.id)
        results.sent48h++
      }

      // ──────────────────────────────────────────────────────────────────
      // 7-day follow-up: send between 6.5 and 8 days after report
      // ──────────────────────────────────────────────────────────────────
      const already7d = badges.notif_7d_report_id === latest.id
      if (days >= 6.5 && days <= 8 && !already7d) {
        // Count completed quick wins
        const { count: completedCount } = await supabase
          .from('quick_win_completions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)

        await sendPostDiagnosis7dEmail({
          to: user.email, name: user.full_name ?? undefined,
          score: score ?? undefined, topQuickWin: topAction, predictedGain,
          completedCount: completedCount ?? 0, baseUrl: BASE_URL,
        })
        await supabase.from('users').update({
          user_badges: { ...badges, notif_7d_report_id: latest.id },
        }).eq('id', user.id)
        results.sent7d++
      }
    } catch (err) {
      console.error('[post-diag-followup] error for user:', user.email, err)
      results.errors++
    }
  }

  console.log('[post-diag-followup] done:', JSON.stringify(results))
  return NextResponse.json({ ok: true, ...results })
}
