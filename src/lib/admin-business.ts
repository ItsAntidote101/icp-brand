// Pure arithmetic behind the control room's Funnel and Money screens.
// No database access here, so it can be tested with made-up rows.

const DAY_MS = 86_400_000
const SEP = '\u0001'

export type Ev = { event: string; anon_id: string | null; user_id: string | null; utm: Record<string, string> | null; created_at: string }

const STEPS = [
  { event: 'landing_view',            label: 'Visited the site' },
  { event: 'questionnaire_started',   label: 'Started the diagnosis' },
  { event: 'questionnaire_completed', label: 'Finished the diagnosis' },
  { event: 'report_viewed',           label: 'Opened their report' },
] as const

function sourceOf(utm: Record<string, string> | null): { source: string; campaign: string } {
  const u = utm ?? {}
  const raw = (u.utm_source ?? '').trim()
  const source = raw ? raw.charAt(0).toUpperCase() + raw.slice(1)
    : u.gclid ? 'Google Ads' : u.fbclid ? 'Meta Ads' : 'Direct or unknown'
  return { source, campaign: (u.utm_campaign ?? '').trim() }
}

export function buildFunnel(events: Ev[], payments: { email: string; paid_at: string | null; created_at: string }[], users: { id: string; email: string }[], sinceMs: number) {
  // ── People, and the ad that first brought each one ──────────────────────
  type Person = { source: string; campaign: string; did: Set<string> }
  const people   = new Map<string, Person>()
  const keyOfUser = new Map<string, string>()        // user id -> visitor key
  for (const e of events) {
    const key = e.anon_id ?? e.user_id
    if (!key) continue                                // server-side "paid" rows carry no visitor
    let p = people.get(key)
    if (!p) { p = { ...sourceOf(e.utm), did: new Set() }; people.set(key, p) }
    else if (p.source === 'Direct or unknown' && e.utm) Object.assign(p, sourceOf(e.utm))
    p.did.add(e.event)
    if (e.user_id && !keyOfUser.has(e.user_id)) keyOfUser.set(e.user_id, key)
  }

  // ── New paying customers in the period: first ever payment falls inside it
  const firstPaid = new Map<string, number>()
  for (const p of payments) {
    const e = p.email.toLowerCase()
    const at = new Date(p.paid_at ?? p.created_at).getTime()
    firstPaid.set(e, Math.min(firstPaid.get(e) ?? at, at))
  }
  const idByEmail = new Map((users).map(u => [u.email.toLowerCase(), u.id]))
  let paid = 0
  const paidBySource = new Map<string, number>()
  for (const [email, at] of Array.from(firstPaid)) {
    if (at < sinceMs) continue
    paid += 1
    const uid = idByEmail.get(email)
    const person = uid ? people.get(keyOfUser.get(uid) ?? uid) : undefined
    const label = person ? `${person.source}${SEP}${person.campaign}` : `Direct or unknown${SEP}`
    paidBySource.set(label, (paidBySource.get(label) ?? 0) + 1)
  }

  const count = (event: string) => { let n = 0; for (const p of Array.from(people.values())) if (p.did.has(event)) n += 1; return n }
  const steps = STEPS.map(s => ({ label: s.label, people: count(s.event) }))
  const outcomes = { calls: count('call_requested'), checkouts: count('checkout_started'), paid }

  // ── By source and campaign ──────────────────────────────────────────────
  const rows = new Map<string, { source: string; campaign: string; visitors: number; finished: number; calls: number; checkouts: number; paid: number }>()
  const rowFor = (label: string) => {
    let r = rows.get(label)
    if (!r) { const [source, campaign] = label.split(SEP); r = { source, campaign: campaign ?? '', visitors: 0, finished: 0, calls: 0, checkouts: 0, paid: 0 }; rows.set(label, r) }
    return r
  }
  for (const p of Array.from(people.values())) {
    const r = rowFor(`${p.source}${SEP}${p.campaign}`)
    r.visitors += 1
    if (p.did.has('questionnaire_completed')) r.finished += 1
    if (p.did.has('call_requested'))          r.calls += 1
    if (p.did.has('checkout_started'))        r.checkouts += 1
  }
  for (const [label, n] of Array.from(paidBySource)) rowFor(label).paid += n
  const sources = Array.from(rows.values()).sort((a, b) => b.visitors - a.visitors || b.paid - a.paid).slice(0, 12)

  return { steps, outcomes, sources }
}

const NAIROBI_MS = 3 * 3_600_000
const PLAN_PRICE_KES: Record<string, number> = { starter: 6500, pro: 13000, agency: 26000 }

// Calendar month in Nairobi time, as "2026-11"
const monthKey = (ms: number) => new Date(ms + NAIROBI_MS).toISOString().slice(0, 7)

type Pay  = { reference: string; email: string; tier: string; kind: string; status: string; paid_amount: number | null; expected_amount: number | null; created_at: string; paid_at: string | null }
type User = { id: string; email: string; full_name: string | null; company_name: string | null; subscription_tier: string; billing_status: string | null; renewal_date: string | null; cancelled_at: string | null }

export function buildMoney(all: Pay[], users: User[], now: number) {
  const byEmail = new Map(users.map(u => [u.email.toLowerCase(), u]))
  const who     = (email: string) => { const u = byEmail.get(email.toLowerCase()); return { userId: u?.id ?? null, name: u?.full_name || u?.company_name || email, email } }
  // Paystack stores cents; everything below is whole shillings
  const kes     = (cents: number | null) => Math.round((cents ?? 0) / 100)

  const paid = all.filter(p => p.status === 'paid')
  const when = (p: { paid_at: string | null; created_at: string }) => new Date(p.paid_at ?? p.created_at).getTime()

  // ── Last six calendar months ────────────────────────────────────────────
  const months: { key: string; total: number; count: number }[] = []
  const d = new Date(now + NAIROBI_MS)
  for (let i = 5; i >= 0; i--) {
    const key = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1)).toISOString().slice(0, 7)
    months.push({ key, total: 0, count: 0 })
  }
  const monthAt = new Map(months.map(m => [m.key, m]))
  for (const p of paid) {
    const m = monthAt.get(monthKey(when(p)))
    if (m) { m.total += kes(p.paid_amount); m.count += 1 }
  }

  // ── Paying now ──────────────────────────────────────────────────────────
  const paying   = users.filter(u => u.subscription_tier !== 'free' && u.billing_status === 'active')
  const staying  = paying.filter(u => !u.cancelled_at)
  const ifAllRenew = staying.reduce((n, u) => n + (PLAN_PRICE_KES[u.subscription_tier] ?? 0), 0)

  const renewals = paying
    .filter(u => u.renewal_date)
    .map(u => ({ userId: u.id, name: u.full_name || u.company_name || u.email, tier: u.subscription_tier, date: u.renewal_date as string, cancelled: !!u.cancelled_at, amount: PLAN_PRICE_KES[u.subscription_tier] ?? 0, inDays: Math.ceil((new Date(u.renewal_date as string).getTime() - now) / DAY_MS) }))
    .filter(r => r.inDays <= 14)
    .sort((a, b) => a.inDays - b.inDays)

  // ── Started paying but did not finish (last 14 days, never paid since) ──
  const lastPaidAt = new Map<string, number>()
  for (const p of paid) { const e = p.email.toLowerCase(); lastPaidAt.set(e, Math.max(lastPaidAt.get(e) ?? 0, when(p))) }
  const seen = new Set<string>()
  const unfinished = all
    .filter(p => p.status !== 'paid' && now - new Date(p.created_at).getTime() < 14 * DAY_MS)
    .filter(p => (lastPaidAt.get(p.email.toLowerCase()) ?? 0) < new Date(p.created_at).getTime())
    .filter(p => { const e = p.email.toLowerCase(); if (seen.has(e)) return false; seen.add(e); return true })   // newest attempt per person
    .map(p => ({ ...who(p.email), tier: p.tier, amount: kes(p.expected_amount), at: p.created_at }))

  // ── Paid before, on the free plan now (last paid within 120 days) ───────
  const stopped = Array.from(lastPaidAt.entries())
    .map(([email, at]) => ({ email, at, u: byEmail.get(email) }))
    .filter(x => x.u && x.u.subscription_tier === 'free' && now - x.at < 120 * DAY_MS)
    .sort((a, b) => b.at - a.at)
    .map(x => ({ userId: x.u!.id, name: x.u!.full_name || x.u!.company_name || x.email, email: x.email, lastPaid: new Date(x.at).toISOString() }))

  const recent = paid.slice().sort((a, b) => when(b) - when(a)).slice(0, 12)
    .map(p => ({ reference: p.reference, ...who(p.email), tier: p.tier, kind: p.kind, amount: kes(p.paid_amount), at: p.paid_at ?? p.created_at }))

  return {
    months,
    thisMonth: months[5], lastMonth: months[4],
    paying: paying.length, leaving: paying.length - staying.length, ifAllRenew,
    renewals, unfinished, stopped, recent,
  }
}
