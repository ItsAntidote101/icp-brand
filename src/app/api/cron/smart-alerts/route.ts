import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sendStaleDiagnosisEmail,
  sendScoreDropAlertEmail,
  sendIntelligenceNudgeEmail,
} from '@/lib/email'

export const dynamic     = 'force-dynamic'
export const maxDuration = 120

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder',
)

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://idealicp.com'

function getScore(summary: string): number | null {
  try { const p = JSON.parse(summary); return p.overall_score ?? p.health_score ?? null } catch { return null }
}

function weekStart(): string {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - d.getUTCDay() + 1)
  return d.toISOString().split('T')[0]
}

function daysBetween(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: users, error: usersErr } = await supabase
    .from('users')
    .select('id, email, full_name, subscription_tier, billing_status, last_seen_intelligence_at, user_badges')
    .eq('billing_status', 'active')
    .not('subscription_tier', 'eq', 'free')

  if (usersErr) {
    console.error('[smart-alerts] fetch users error:', JSON.stringify(usersErr))
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  const week = weekStart()
  const results = { stale: 0, scoreDrop: 0, intelNudge: 0, errors: 0 }

  for (const user of users ?? []) {
    const badges = (user.user_badges ?? {}) as Record<string, unknown>

    try {
      // ── Load last two reports ────────────────────────────────────────────
      const { data: reports } = await supabase
        .from('reports')
        .select('id, report_summary, generated_at')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(2)

      const latest = reports?.[0]
      const prev   = reports?.[1]

      // ─────────────────────────────────────────────────────────────────────
      // ALERT 1: Stale diagnosis
      // ─────────────────────────────────────────────────────────────────────
      if (latest) {
        const tier      = user.subscription_tier as string
        const threshold = tier === 'agency' ? 7 : tier === 'pro' ? 14 : 30
        const days      = daysBetween(latest.generated_at as string)

        const lastSentAt  = badges.notif_stale_sent_at as string | undefined
        const lastReportId = badges.notif_stale_report_id as string | undefined
        const alreadySent = lastReportId === latest.id ||
          (lastSentAt && daysBetween(lastSentAt) < threshold)

        if (days > threshold && !alreadySent) {
          const score = getScore(latest.report_summary as string)
          await sendStaleDiagnosisEmail({
            to: user.email, name: user.full_name ?? undefined,
            daysSince: days, tier, lastScore: score ?? undefined, baseUrl: BASE_URL,
          })
          await supabase.from('users').update({
            user_badges: { ...badges, notif_stale_sent_at: new Date().toISOString(), notif_stale_report_id: latest.id },
          }).eq('id', user.id)
          results.stale++
        }
      }

      // ─────────────────────────────────────────────────────────────────────
      // ALERT 2: Score drop
      // ─────────────────────────────────────────────────────────────────────
      if (latest && prev) {
        const currentScore  = getScore(latest.report_summary as string)
        const previousScore = getScore(prev.report_summary as string)
        const alreadySent   = badges.notif_score_drop_report_id === latest.id

        if (
          currentScore !== null && previousScore !== null &&
          previousScore - currentScore >= 5 && !alreadySent
        ) {
          // Extract top critical finding
          let topFinding: string | undefined
          try {
            const d = JSON.parse(latest.report_summary as string) as Record<string, unknown>
            const findings = [
              ...((d.audience as Record<string, unknown>)?.findings as Array<{severity: string; title: string; explanation: string}> ?? []),
              ...((d.search   as Record<string, unknown>)?.findings as Array<{severity: string; title: string; explanation: string}> ?? []),
            ]
            const critical = findings.find(f => f.severity === 'Critical')
            if (critical) topFinding = `${critical.title} — ${critical.explanation}`
          } catch { /* noop */ }

          await sendScoreDropAlertEmail({
            to: user.email, name: user.full_name ?? undefined,
            previousScore, currentScore, topFinding, baseUrl: BASE_URL,
          })
          await supabase.from('users').update({
            user_badges: { ...badges, notif_score_drop_report_id: latest.id },
          }).eq('id', user.id)
          results.scoreDrop++
        }
      }

      // ─────────────────────────────────────────────────────────────────────
      // ALERT 3: Intelligence briefing unseen nudge
      // ─────────────────────────────────────────────────────────────────────
      const { data: thisBriefing } = await supabase
        .from('intelligence_briefings')
        .select('id, briefing_data, created_at')
        .eq('user_id', user.id)
        .eq('week_of', week)
        .eq('briefing_type', 'scheduled')
        .limit(1)
        .maybeSingle()

      if (thisBriefing) {
        const briefingCreatedAt = thisBriefing.created_at as string
        const hoursSinceBriefing = (Date.now() - new Date(briefingCreatedAt).getTime()) / (1000 * 60 * 60)

        const lastSeen = user.last_seen_intelligence_at
          ? new Date(user.last_seen_intelligence_at as string)
          : null
        const hasSeenThisWeek = lastSeen && new Date(briefingCreatedAt) <= lastSeen
        const nudgeAlreadySent = badges.notif_intel_nudge_week === week

        // Send nudge if: briefing is 24h+ old, user hasn't seen it, not nudged yet this week
        if (hoursSinceBriefing >= 24 && !hasSeenThisWeek && !nudgeAlreadySent) {
          let topInsight: string | undefined
          try {
            const bd = thisBriefing.briefing_data as Record<string, unknown>
            const insights = bd.insights as Array<{ title: string; body: string }> | undefined
            if (insights?.[0]) topInsight = `${insights[0].title}: ${insights[0].body}`
          } catch { /* noop */ }

          await sendIntelligenceNudgeEmail({
            to: user.email, name: user.full_name ?? undefined,
            weekOf: week, topInsight, baseUrl: BASE_URL,
          })
          await supabase.from('users').update({
            user_badges: { ...badges, notif_intel_nudge_week: week },
          }).eq('id', user.id)
          results.intelNudge++
        }
      }
    } catch (err) {
      console.error('[smart-alerts] error for user:', user.email, err)
      results.errors++
    }
  }

  console.log('[smart-alerts] done:', JSON.stringify(results))
  return NextResponse.json({ ok: true, ...results })
}
