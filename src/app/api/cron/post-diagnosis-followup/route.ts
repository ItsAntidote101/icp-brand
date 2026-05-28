import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPostDiagnosis48hEmail, sendPostDiagnosis7dEmail } from '@/lib/email'

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

  // All users who have ever run a diagnosis (any tier)
  const { data: users, error: usersErr } = await supabase
    .from('users')
    .select('id, email, full_name, subscription_tier, billing_status, user_badges')

  if (usersErr) {
    console.error('[post-diag-followup] fetch users error:', JSON.stringify(usersErr))
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  const results = { sent48h: 0, sent7d: 0, errors: 0 }

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
