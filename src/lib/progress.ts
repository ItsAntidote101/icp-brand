// Proof of value: how a client's cost per lead has moved since they started
// logging weekly numbers. Pure arithmetic, shared by the dashboard and emails.

export type WeekRow = { week_start: string; spend: number; leads: number; currency: string }
export type LeadCostChange = {
  from: number; to: number        // cost per lead at the start and now
  pct: number                     // negative is cheaper, which is good
  currency: string
  weeks: number                   // weeks logged in this currency
  leads: number                   // leads across those weeks
  averaged: boolean               // true when each end is a two-week average
}

export function leadCostChange(rows: WeekRow[]): LeadCostChange | null {
  if (!rows.length) return null
  const sorted   = [...rows].sort((a, b) => a.week_start.localeCompare(b.week_start))
  const currency = sorted[sorted.length - 1].currency
  const same     = sorted.filter(w => w.currency === currency)
  const usable   = same.filter(w => w.leads > 0 && w.spend > 0)
  if (usable.length < 2) return null
  // With a month or more of data, compare two-week averages so one odd week does not decide it
  const span = usable.length >= 4 ? 2 : 1
  const cpl  = (ws: WeekRow[]) => ws.reduce((n, w) => n + Number(w.spend), 0) / ws.reduce((n, w) => n + Number(w.leads), 0)
  const from = cpl(usable.slice(0, span)), to = cpl(usable.slice(-span))
  if (!isFinite(from) || !isFinite(to) || from <= 0) return null
  return { from, to, pct: Math.round(((to - from) / from) * 100), currency, weeks: same.length, averaged: span === 2, leads: same.reduce((n, w) => n + Number(w.leads), 0) }
}

const money = (n: number, cur: string) => `${cur} ${Math.round(n).toLocaleString('en-US')}`

/** One plain sentence for emails. Empty when there is nothing honest to say. */
export function leadCostSentence(c: LeadCostChange | null): string {
  if (!c) return ''
  const span = `over ${c.weeks} ${c.weeks === 1 ? 'week' : 'weeks'} of tracking`
  if (c.pct <= -3) return `Your cost per lead has come down from ${money(c.from, c.currency)} to ${money(c.to, c.currency)} ${span}, ${Math.abs(c.pct)}% lower.`
  if (c.pct >= 3)  return `Your cost per lead has gone from ${money(c.from, c.currency)} to ${money(c.to, c.currency)} ${span}. The fixes on your dashboard are aimed at bringing that back down.`
  return `Your cost per lead has held at about ${money(c.to, c.currency)} ${span}.`
}
