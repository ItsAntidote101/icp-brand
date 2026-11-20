import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { stripDashes } from '@/lib/strip-dashes'
import { parseModelJson, readStoredReport } from '@/lib/repair-json'
import { leadCostChange, type WeekRow } from '@/lib/progress'

// The weekly market briefing, version 2.
//
// Three things at most, each tied to this client's own business and numbers:
//   change      something that moved in their market, platform or rules
//   competitor  something a named competitor did
//   action      the one thing worth doing about it this week
//
// Nothing is invented. Every item must point at a page the web search really
// returned in this run; items that do not are dropped. Dates come from the
// search result, never from the model. The client's own figures are filled in
// here from what they logged, not by the model. A quiet week is a valid answer.

export type BriefProfile = {
  companyName: string; product: string; industry: string; businessModel: string
  region: string; targetAudience: string; channels: string[]; budget: string
}

export type OwnNumbers = {
  currency: string | null
  costPerLead: number | null          // last logged week
  weekLabel: string | null
  change: { from: number; to: number; pct: number; weeks: number } | null
  spend: number | null; leads: number | null
  findings: string[]                  // headings from their latest diagnosis
  nextFix: string | null
}

export type BriefItem = {
  kind: 'change' | 'competitor' | 'action'
  title: string
  body: string
  forYou: string                      // why it matters to this business
  action: string | null
  source: string | null
  sourceUrl: string | null
  published: string | null            // as reported by the search result
}

export type BriefComparison = {
  metric: string
  yours: number | null
  low: number; high: number
  currency: string
  scope: string                       // "Kenya", "East Africa", "Global" ...
  local: boolean
  source: string; sourceUrl: string; published: string | null
} | null

export type MarketBriefing = {
  version: 2
  items: BriefItem[]
  comparison: BriefComparison
  quiet: boolean
  sources: { title: string; url: string }[]
  // Older readers (emails, alerts, chat) still expect these
  insights: { id: string; type: string; title: string; body: string; source: string | null; sourceUrl: string | null; timeLabel: string; implication: string | null; recommendation: string | null }[]
  benchmarks: never[]
  competitorPositions: never[]
  userPosition: { x: number; y: number }
  researchSources: { title: string; url: string; query: string }[]
  topOpportunity: string
  topRecommendation: string
}

type Found = { url: string; title: string; age: string | null }

// ─── The client's own side ───────────────────────────────────────────────────
export async function loadOwnNumbers(supabase: SupabaseClient, userId: string): Promise<OwnNumbers> {
  const [weeksQ, reportQ] = await Promise.all([
    supabase.from('weekly_checkins').select('week_start, spend, leads, currency').eq('user_id', userId).order('week_start', { ascending: false }).limit(12),
    supabase.from('reports').select('report_summary').eq('user_id', userId).order('generated_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  const weeks = (weeksQ.data ?? []) as WeekRow[]
  const last  = weeks[0]
  const c     = leadCostChange(weeks)
  const diag  = readStoredReport<{ critical_findings?: { title?: string }[]; quick_wins?: { action?: string }[] }>(reportQ.data?.report_summary as string | undefined)
  return {
    currency:    last?.currency ?? null,
    costPerLead: last && Number(last.leads) > 0 ? Number(last.spend) / Number(last.leads) : null,
    weekLabel:   last?.week_start ?? null,
    change:      c ? { from: c.from, to: c.to, pct: c.pct, weeks: c.weeks } : null,
    spend:       last ? Number(last.spend) : null,
    leads:       last ? Number(last.leads) : null,
    findings:    (diag.critical_findings ?? []).map(f => f.title ?? '').filter(Boolean).slice(0, 3),
    nextFix:     diag.quick_wins?.[0]?.action ?? null,
  }
}

// ─── Checking what the model says against what the search returned ───────────
const norm = (u: string) => {
  try {
    const x = new URL(u.trim())
    return `${x.hostname.replace(/^www\./, '')}${x.pathname.replace(/\/+$/, '')}`.toLowerCase()
  } catch { return '' }
}

export function collectFound(content: unknown[]): Found[] {
  const out: Found[] = []
  for (const block of content as { type?: string; content?: unknown }[]) {
    if (block?.type !== 'web_search_tool_result' || !Array.isArray(block.content)) continue
    for (const r of block.content as { type?: string; url?: string; title?: string; page_age?: string | null }[]) {
      if (r?.type === 'web_search_result' && r.url) out.push({ url: r.url, title: r.title ?? r.url, age: r.page_age ?? null })
    }
  }
  return out
}

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const num  = (v: unknown) => { const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[^0-9.]/g, '')); return isFinite(n) && n > 0 ? n : null }

/** Turn the model's draft into a briefing, keeping only what the search backs up. */
export function buildBriefing(draft: unknown, found: Found[], own: OwnNumbers): MarketBriefing {
  const d       = (draft && typeof draft === 'object' ? draft : {}) as Record<string, unknown>
  const byUrl   = new Map(found.map(f => [norm(f.url), f]))
  const match   = (u: unknown) => (typeof u === 'string' && norm(u) ? byUrl.get(norm(u)) ?? null : null)

  const items: BriefItem[] = []
  for (const raw of (Array.isArray(d.items) ? d.items : []) as Record<string, unknown>[]) {
    const kind = raw?.kind === 'competitor' ? 'competitor' : raw?.kind === 'action' ? 'action' : 'change'
    const hit  = match(raw?.sourceUrl)
    const title = text(raw?.title, 140), body = text(raw?.body, 420), forYou = text(raw?.forYou, 320)
    if (!title || !body || !forYou) continue
    // A claim about the market or a competitor has to come from a page we really fetched
    if (kind !== 'action' && !hit) continue
    if (items.some(i => i.kind === kind)) continue
    items.push({
      kind, title, body, forYou,
      action:    text(raw?.action, 240) || null,
      source:    hit ? (text(raw?.source, 80) || hit.title) : null,
      sourceUrl: hit ? hit.url : null,
      published: hit ? hit.age : null,
    })
  }
  const order = { change: 0, competitor: 1, action: 2 } as const
  items.sort((a, b) => order[a.kind] - order[b.kind])
  // Advice with no market news behind it is not a market briefing
  const kept = items.some(i => i.kind !== 'action') ? items.slice(0, 3) : []

  let comparison: BriefComparison = null
  const c    = (d.comparison && typeof d.comparison === 'object' ? d.comparison : null) as Record<string, unknown> | null
  const cHit = c ? match(c.sourceUrl) : null
  const low  = c ? num(c.low) : null, high = c ? num(c.high) : null
  const cur  = c ? text(c.currency, 6).toUpperCase() : ''
  if (c && cHit && low && high && high >= low && cur) {
    const scope = text(c.scope, 40) || 'Global'
    comparison = {
      metric: 'Cost per lead',
      // Only set the client's own figure when it is in the same currency as the published range
      yours: own.costPerLead !== null && own.currency === cur ? Math.round(own.costPerLead) : null,
      low, high, currency: cur, scope, local: c.local === true,
      source: text(c.source, 80) || cHit.title, sourceUrl: cHit.url, published: cHit.age,
    }
  }

  const sources = [...kept.map(i => i.sourceUrl), comparison?.sourceUrl].filter((u): u is string => !!u)
    .filter((u, i, a) => a.indexOf(u) === i)
    .map(u => ({ title: byUrl.get(norm(u))?.title ?? u, url: u }))
  const act = kept.find(i => i.action)

  return stripDashes({
    version: 2,
    items: kept,
    comparison,
    quiet: kept.length === 0,
    sources,
    insights: kept.map((i, n) => ({
      id: `i${n + 1}`,
      type: i.kind === 'competitor' ? 'competitor_strategy' : i.kind === 'action' ? 'opportunity' : 'market_movement',
      title: i.title, body: i.body, source: i.source, sourceUrl: i.sourceUrl,
      timeLabel: i.published ?? '', implication: i.forYou, recommendation: i.action,
    })),
    benchmarks: [], competitorPositions: [], userPosition: { x: 50, y: 50 },
    researchSources: sources.map(s => ({ ...s, query: '' })),
    topOpportunity: kept[0]?.title ?? '',
    topRecommendation: act?.action ?? '',
  }) as MarketBriefing
}

// ─── Research ────────────────────────────────────────────────────────────────
const money = (n: number, cur: string | null) => `${cur ?? ''} ${Math.round(n).toLocaleString('en-US')}`.trim()

export async function generateMarketBriefing(anthropic: Anthropic, profile: BriefProfile, own: OwnNumbers): Promise<MarketBriefing> {
  const now      = new Date()
  const today    = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const month    = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const channels = profile.channels.length ? profile.channels : ['Meta', 'Google']
  const what     = profile.product || profile.industry

  const system = `You research one small business's market for its owner and report only what you can back with a page you found today. You write plainly, for a business owner, not a marketer. No em dashes or en dashes.

Run these searches first (${today}):
1. News from the last 30 days that affects businesses selling ${what} in ${profile.region}: government policy, tax, regulation, import or licensing rules, prices, currency, consumer spending.
2. "${profile.industry} ${profile.region}" news ${month}, to find what named competitors or large players have done recently.
3. Changes announced in the last 30 days on ${channels.slice(0, 2).join(' and ')} that affect advertisers.
4. A published cost per lead or cost per click range for ${profile.industry} advertisers, in ${profile.region} if one exists, otherwise the closest region you can find.

Rules you must not break:
- Use only facts that appear in pages returned by your searches. Never fill a gap from memory. Never estimate a figure.
- Every item needs sourceUrl set to the exact URL of the page it came from, copied from the search results.
- Prefer the last 30 days. Do not present older material as new.
- If you find nothing that really bears on this business, return an empty items list. A quiet week is a correct answer and is better than a weak item.
- Name a competitor only if a page you found names them doing the thing you describe.`

  const ownLines = [
    own.costPerLead !== null ? `Cost per lead last logged week: ${money(own.costPerLead, own.currency)}` : 'Cost per lead: not logged yet',
    own.spend !== null && own.leads !== null ? `That week: ${money(own.spend, own.currency)} spent, ${own.leads} leads` : '',
    own.change ? `Cost per lead over ${own.change.weeks} weeks: ${money(own.change.from, own.currency)} to ${money(own.change.to, own.currency)} (${own.change.pct}%)` : '',
    own.findings.length ? `Problems found in their diagnosis: ${own.findings.join('; ')}` : '',
    own.nextFix ? `Fix they are working on now: ${own.nextFix}` : '',
  ].filter(Boolean).join('\n')

  const user = `THE BUSINESS
Company: ${profile.companyName || 'not given'}
Sells: ${what}
Industry: ${profile.industry}
Business model: ${profile.businessModel || 'not given'}
Region: ${profile.region}
Customers: ${profile.targetAudience || 'not given'}
Advertises on: ${channels.join(', ')}
Monthly ad budget: ${profile.budget || 'not given'}

WHAT THEIR DASHBOARD SHOWS
${ownLines}

Write at most three items, one of each kind:
- "change": one thing that changed in their market, their platform or the rules, from your searches.
- "competitor": one thing a named competitor did, from your searches. Leave it out if you found none.
- "action": the one thing worth doing this week because of the items above. It must follow from them and from the dashboard facts.

For every item, "forYou" must connect it to THIS business using the facts above: what they sell, who buys, where they advertise, their cost per lead, their open problems. If you cannot make an honest, specific connection, drop the item. Do not repeat their numbers back without a reason.

"comparison": only if search 4 found a published range. Give low and high as plain numbers in the currency the source uses, the currency code, the region the source covers in "scope", and "local": true only if the source is about ${profile.region}. Otherwise set comparison to null. Do not convert currencies and do not include the client's own figure.

Return ONLY this JSON, no markdown:
{
  "items": [
    { "kind": "change", "title": "<max 12 words, plain, sentence case>", "body": "<max 2 sentences: what happened, with the figure or date from the source>", "forYou": "<max 2 sentences: what it means for this business>", "action": "<max 1 sentence, or null>", "source": "<publication name>", "sourceUrl": "<exact URL from your search results>" }
  ],
  "comparison": { "low": 0, "high": 0, "currency": "KES", "scope": "<region the source covers>", "local": true, "source": "<publication name>", "sourceUrl": "<exact URL from your search results>" }
}`

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    system,
    tools: [{ type: 'web_search_20250305' as const, name: 'web_search', max_uses: 6 }],
    messages: [{ role: 'user', content: user }],
  }, { headers: { 'anthropic-beta': 'web-search-2025-03-05' } })

  const found = collectFound(res.content as unknown[])
  const raw   = res.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
  // The reply can contain notes before the JSON; take the last object that opens with "items"
  const opens = Array.from(raw.matchAll(/\{\s*"items"/g))
  const start = opens.length ? (opens[opens.length - 1].index ?? -1) : raw.indexOf('{')
  const draft = start >= 0 ? parseModelJson(raw.slice(start)) : null
  if (!draft) {
    console.error('[market-briefing] no JSON in model reply:', raw.slice(0, 300))
    throw new Error('No briefing in model reply')
  }
  if (found.length === 0) console.warn('[market-briefing] the search returned no pages, so the briefing will be empty')
  return buildBriefing(draft, found, own)
}
