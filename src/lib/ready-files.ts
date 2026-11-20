// "Ready to upload": files a client can load straight into an ad platform.
// Formats were checked against Google's and Meta's help pages (Nov 2026):
//   Google Ads Editor CSV: columns Campaign, Ad Group, Keyword, Criterion Type;
//     type values Phrase, Exact, Negative Phrase.
//   Meta customer list: columns email, phone, fn, ln, ct, country; phone with
//     country code; country as a two-letter code, always present.
import { answersBlock, type AnswerMap } from '@/lib/answers'

export type Match = 'phrase' | 'exact'
export type KeywordSet = {
  campaign: string
  groups: { name: string; keywords: { text: string; match: Match }[] }[]
  negatives: string[]
}

export const KEYWORD_SYSTEM = `You build a starter keyword list for one small business in Kenya to use in Google Search ads. You are handing over a working list, not advice.

Rules you must not break:
- Use only what the business told us. Do not invent products, services, branches or locations they did not mention.
- Keywords are what a buyer would type when they are ready to ask or buy: the thing, plus words like price, near me, the area they serve, buy, book, apply. Two to five words each.
- No competitor or brand names. No search volumes, costs or scores: we do not have them.
- Two to four ad groups, each on one theme, five to eight keywords each. Match is "phrase" for most and "exact" for the two or three most direct ones in each group.
- "negatives": 15 to 25 single words or short phrases that bring the wrong people for THIS business, for example job seekers, free, how to do it yourself, courses, second hand, wholesale, or products they do not sell. Never block a word that appears in your own keywords.
- Lowercase. Letters, numbers and spaces only. No punctuation.

Return ONLY this JSON, no markdown:
{ "campaign": "<short campaign name>", "groups": [ { "name": "<ad group name>", "keywords": [ { "text": "<keyword>", "match": "phrase" } ] } ], "negatives": ["<word>"] }`

export function keywordPrompt(answers: AnswerMap, company: string): string {
  return `THE BUSINESS${company ? ` (${company})` : ''}
${answersBlock(answers)}

Build the list now.`
}

const tidy = (v: unknown, maxWords: number) => {
  if (typeof v !== 'string') return ''
  const t = v.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
  return t && t.length <= 80 && t.split(' ').length <= maxWords ? t : ''
}
const name = (v: unknown, fallback: string) =>
  (typeof v === 'string' ? v.replace(/[–—]/g, ' ').replace(/[",\r\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) : '') || fallback

/** Keep only what is safe to hand to Google. Returns null when too little survives. */
export function cleanKeywordSet(raw: unknown): KeywordSet | null {
  const d = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const seen = new Set<string>()
  const groups: KeywordSet['groups'] = []
  for (const g of (Array.isArray(d.groups) ? d.groups : []).slice(0, 4) as Record<string, unknown>[]) {
    const keywords: { text: string; match: Match }[] = []
    for (const k of (Array.isArray(g?.keywords) ? g.keywords : []) as Record<string, unknown>[]) {
      const text = tidy(k?.text, 8)
      if (!text || seen.has(text) || keywords.length >= 10) continue
      seen.add(text)
      keywords.push({ text, match: k?.match === 'exact' ? 'exact' : 'phrase' })
    }
    if (keywords.length >= 2) groups.push({ name: name(g?.name, `Ad group ${groups.length + 1}`), keywords })
  }
  if (groups.length === 0) return null

  // A blocked word that also sits inside one of our own keywords would switch that keyword off
  const used = new Set(Array.from(seen).flatMap(k => k.split(' ')))
  const negatives: string[] = []
  for (const n of (Array.isArray(d.negatives) ? d.negatives : []) as unknown[]) {
    const text = tidy(n, 4)
    if (!text || negatives.includes(text) || seen.has(text) || negatives.length >= 30) continue
    if (text.split(' ').length === 1 && used.has(text)) continue
    if (Array.from(seen).some(k => ` ${k} `.includes(` ${text} `))) continue
    negatives.push(text)
  }
  return { campaign: name(d.campaign, 'Search campaign'), groups, negatives }
}

const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
const csv  = (rows: string[][]) => rows.map(r => r.map(cell).join(',')).join('\r\n') + '\r\n'

/** Google Ads Editor import file. Blocked words are added to every ad group. */
export function keywordsCsv(set: KeywordSet): string {
  const rows: string[][] = [['Campaign', 'Ad Group', 'Keyword', 'Criterion Type']]
  for (const g of set.groups) {
    for (const k of g.keywords) rows.push([set.campaign, g.name, k.text, k.match === 'exact' ? 'Exact' : 'Phrase'])
    for (const n of set.negatives) rows.push([set.campaign, g.name, n, 'Negative Phrase'])
  }
  return csv(rows)
}

/** The same keywords as plain lines to paste into Google Ads on the web. */
export function keywordsText(g: KeywordSet['groups'][number]): string {
  return g.keywords.map(k => (k.match === 'exact' ? `[${k.text}]` : `"${k.text}"`)).join('\n')
}

// Templates the client fills with their own customers and uploads to Meta
// themselves. The example rows show the format; we never see the real lists.
export const META_CUSTOMER_LIST_CSV = csv([
  ['email', 'phone', 'fn', 'ln', 'ct', 'country'],
  ['jane@example.com', '254712345678', 'Jane', 'Wanjiru', 'Nairobi', 'KE'],
  ['', '254733000111', 'Peter', 'Otieno', 'Kisumu', 'KE'],
])

export const META_OFFLINE_EVENTS_CSV = csv([
  ['event_name', 'event_time', 'value', 'currency', 'email', 'phone', 'fn', 'ln', 'ct', 'country'],
  ['Purchase', '2026-11-18T14:30:00+03:00', '45000', 'KES', 'jane@example.com', '254712345678', 'Jane', 'Wanjiru', 'Nairobi', 'KE'],
  ['Lead', '2026-11-19T09:05:00+03:00', '', '', '', '254733000111', 'Peter', 'Otieno', 'Kisumu', 'KE'],
])
