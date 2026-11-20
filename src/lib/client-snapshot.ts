import type { SupabaseClient } from '@supabase/supabase-js'
import { readStoredReport } from '@/lib/repair-json'

// What the media buyer needs to see about one client before writing to them.
export type ClientSnapshot = {
  score: number | null
  scoreDelta: number | null
  lastDiagnosis: string | null
  topFindings: string[]
  openFixes: string[]
  fixesDone: number
  weeks: { week_start: string; spend: number; currency: string; leads: number; sales: number; cpl: number | null }[]
}

type Diag = {
  overall_score?: number | string; health_score?: number | string
  critical_findings?: { title?: string }[]; findings?: { title?: string }[]
  quick_wins?: { action?: string }[]
}

const scoreOf = (d: Diag): number | null => {
  const s = d.overall_score ?? d.health_score
  const n = typeof s === 'string' ? parseInt(s, 10) : s
  return typeof n === 'number' && !isNaN(n) ? n : null
}

export async function clientSnapshot(supabase: SupabaseClient, userId: string, fixesDone: number): Promise<ClientSnapshot> {
  const [{ data: reports }, { data: weeks }] = await Promise.all([
    supabase.from('reports').select('report_summary, generated_at').eq('user_id', userId).order('generated_at', { ascending: false }).limit(2),
    supabase.from('weekly_checkins').select('week_start, spend, currency, leads, sales').eq('user_id', userId).order('week_start', { ascending: false }).limit(6),
  ])
  const latest = reports?.[0] ? readStoredReport<Diag>(reports[0].report_summary) : {}
  const prev   = reports?.[1] ? readStoredReport<Diag>(reports[1].report_summary) : null
  const score = scoreOf(latest), prevScore = prev ? scoreOf(prev) : null
  return {
    score,
    scoreDelta: score !== null && prevScore !== null ? score - prevScore : null,
    lastDiagnosis: reports?.[0]?.generated_at ?? null,
    topFindings: (latest.critical_findings ?? latest.findings ?? []).map(f => f.title ?? '').filter(Boolean).slice(0, 3),
    openFixes: (latest.quick_wins ?? []).map(w => w.action ?? '').filter(Boolean).slice(0, 3),
    fixesDone,
    weeks: (weeks ?? []).map(w => {
      const spend = Number(w.spend)
      return { ...w, spend, cpl: w.leads > 0 ? Math.round(spend / w.leads) : null }
    }),
  }
}
