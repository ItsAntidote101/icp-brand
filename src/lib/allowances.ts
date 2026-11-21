// What a plan includes each month, what has been used, and the history.
// Everything is counted live from the tables that record the activity
// (session_requests, reports, fix_drafts, ready_files): there is no separate
// ledger to drift out of step. Months run on Nairobi time (UTC+3).
import type { SupabaseClient } from '@supabase/supabase-js'
import { FORMAT_PREFIX, monthlyLimit } from '@/lib/hands-on'

const NBO = 3 * 3600 * 1000
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const DIAGNOSIS_LIMITS: Record<string, number | null> = { free: null, starter: 3, pro: 20, agency: null }  // null: not a monthly allowance

export type Allowance = { key: 'sessions' | 'diagnoses'; label: string; used: number; limit: number | null; left: number | null }
export type Allowances = {
  month: string                 // "November"
  resetsOn: string              // "1 December"
  daysLeft: number              // days left in this month, today included
  items: Allowance[]
  extras: { key: string; label: string; done: boolean; at: string | null }[]   // included, no monthly reset
  history: { month: string; sessions: number; diagnoses: number }[]            // newest first, this month first
}

/** Year and month (0 to 11) in Nairobi for a moment in time. */
const ym = (d: Date) => { const n = new Date(d.getTime() + NBO); return { y: n.getUTCFullYear(), m: n.getUTCMonth(), day: n.getUTCDate() } }
/** The instant a Nairobi month begins. */
const startOf = (y: number, m: number) => new Date(Date.UTC(y, m, 1) - NBO)
const keyOf = (iso: string) => { const { y, m } = ym(new Date(iso)); return `${y}-${m}` }

export function buildAllowances(input: {
  tier: string; active: boolean; now?: Date
  sessions: { created_at: string; status: string }[]     // hands-on requests, any month
  reports: { created_at: string }[]                      // diagnoses, any month
  drafts: { created_at: string }[]
  keywordList: { created_at: string } | null
}): Allowances {
  const now = input.now ?? new Date()
  const { y, m, day } = ym(now)
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  const next = new Date(Date.UTC(y, m + 1, 1))
  const sessions = input.sessions.filter(s => s.status !== 'cancelled')

  const count = (rows: { created_at: string }[], key: string) => rows.filter(r => keyOf(r.created_at) === key).length
  const history = [0, 1, 2, 3].map(back => {
    const d = new Date(Date.UTC(y, m - back, 1))
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
    return { month: `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`, sessions: count(sessions, key), diagnoses: count(input.reports, key) }
  })

  const items: Allowance[] = []
  const sLimit = input.active ? monthlyLimit(input.tier) : 0
  if (sLimit > 0) items.push({ key: 'sessions', label: 'Hands-on sessions with Eugene', used: Math.min(history[0].sessions, sLimit), limit: sLimit, left: Math.max(0, sLimit - history[0].sessions) })
  const dLimit = input.active ? DIAGNOSIS_LIMITS[input.tier] ?? null : null
  if (input.active && input.tier !== 'free') items.push({ key: 'diagnoses', label: 'Diagnoses', used: history[0].diagnoses, limit: dLimit, left: dLimit === null ? null : Math.max(0, dLimit - history[0].diagnoses) })

  const paid = input.active && input.tier !== 'free'
  const lastDraft = input.drafts.map(d => d.created_at).sort().pop() ?? null
  const extras = paid ? [
    { key: 'keywords', label: 'Google keywords and words to block', done: !!input.keywordList, at: input.keywordList?.created_at ?? null },
    { key: 'drafts', label: input.drafts.length > 0 ? `Wording written for ${input.drafts.length} ${input.drafts.length === 1 ? 'fix' : 'fixes'}` : 'Wording written for your fixes', done: input.drafts.length > 0, at: lastDraft },
  ] : []

  return {
    month: MONTHS[m], resetsOn: `1 ${MONTHS[next.getUTCMonth()]}`, daysLeft: daysInMonth - day + 1,
    items, extras, history,
  }
}

/** Load everything for one client and build the summary. */
export async function loadAllowances(supabase: SupabaseClient, user: { id: string; email: string; subscription_tier: string; billing_status: string }, now: Date = new Date()): Promise<Allowances> {
  const { y, m } = ym(now)
  const since = startOf(y, m - 3).toISOString()
  const { data: qs } = await supabase.from('questionnaires').select('id').eq('user_id', user.id).limit(500)
  const qIds = (qs ?? []).map(q => q.id as string)
  const [sQ, rQ, dQ, kQ] = await Promise.all([
    supabase.from('session_requests').select('created_at, status').eq('user_email', user.email).like('session_format', `${FORMAT_PREFIX}%`).gte('created_at', since),
    qIds.length > 0
      ? supabase.from('reports').select('id, created_at').or(`user_id.eq.${user.id},questionnaire_id.in.(${qIds.join(',')})`).gte('created_at', since)
      : supabase.from('reports').select('id, created_at').eq('user_id', user.id).gte('created_at', since),
    supabase.from('fix_drafts').select('created_at').eq('user_id', user.id),
    supabase.from('ready_files').select('created_at').eq('user_id', user.id).eq('kind', 'google_keywords').order('created_at', { ascending: false }).limit(1),
  ])
  return buildAllowances({
    tier: user.subscription_tier, active: user.billing_status === 'active', now,
    sessions: (sQ.data ?? []) as { created_at: string; status: string }[],
    reports: (rQ.data ?? []) as { created_at: string }[],
    drafts: (dQ.data ?? []) as { created_at: string }[],
    keywordList: ((kQ.data ?? [])[0] as { created_at: string } | undefined) ?? null,
  })
}
