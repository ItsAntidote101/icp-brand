// One place that knows how questionnaire answers are stored and read.
//
// Answers are saved by question id. Ids never get reused for a different
// meaning, so reports written from older questionnaires keep working:
//   1 what they sell            2 kind of business       27 running ads now?
//   9 where they advertise     13 monthly ad spend       14 inquiries a month
//  28 buyers out of 10         21 the same as a percent   6 what one sale is worth
//  15 do inquiries look like best customers              29 reply speed
//  24 best customer            8 copy of 24 (older readers)
//   4 problem                  26 why they buy now       23 individuals or businesses
//  12 who the ads are aimed at 30 where ads send people  10 website link
//  31 first reply              17 steps before paying    19 proof shown
//   5 how customers find them  32 customers a month      33 planned ad budget
//  34 when they want to start  11 region (Kenya)
// Retired (still read if present on old answers): 3, 7, 16, 18, 20, 22, 25.

export type AnswerMap = Record<string | number, unknown>

export const RUNNING_ADS_ID = 27

function str(v: unknown): string {
  if (Array.isArray(v)) return v.filter(x => typeof x === 'string').join(', ')
  if (typeof v === 'number') return String(v)
  return typeof v === 'string' ? v.trim() : ''
}

/** True when they told us they have not started advertising yet. */
export function isPreLaunch(a: AnswerMap | null | undefined): boolean {
  return str(a?.[RUNNING_ADS_ID]).toLowerCase().startsWith('not yet')
}

/**
 * A working number from a range answer such as "KES 20,000 to 50,000".
 * Two figures: the middle. "Under X": 60% of X. "Over X" or "X+": 125% of X.
 * A plain number comes back as it is. Anything else: null.
 * Old answers used a dash between the figures; those still parse.
 */
export function rangeNumber(v: unknown): number | null {
  const s = str(v)
  if (!s) return null
  const nums = (s.match(/\d[\d,]*(?:\.\d+)?/g) ?? [])
    .map(n => parseFloat(n.replace(/,/g, '')))
    .filter(n => Number.isFinite(n))
  if (nums.length === 0) return null
  const lower = s.toLowerCase()
  if (nums.length >= 2) return (nums[0] + nums[1]) / 2
  if (/under|less than|below/.test(lower)) return nums[0] * 0.6
  if (/over|more than|above|\+/.test(lower)) return nums[0] * 1.25
  return nums[0]
}

/** "3" out of ten -> 30. "Less than 1" -> 5. "5 or more" -> 50. */
export function outOfTenToPercent(v: unknown): number | null {
  const s = str(v).toLowerCase()
  if (!s) return null
  if (s.startsWith('less than') || s.startsWith('fewer than') || s.startsWith('none')) return 5
  const n = parseFloat(s.replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.min(100, n * 10))
}

/**
 * Fill in the ids older code still reads, without touching what the person typed.
 * Safe to run more than once.
 */
export function withCompat<T extends AnswerMap>(answers: T): T {
  const out: AnswerMap = { ...answers }
  if (!str(out[11])) out[11] = 'Kenya'
  const pct = outOfTenToPercent(out[28])
  if (pct !== null) out[21] = String(pct)
  if (str(out[24]) && !str(out[8])) out[8] = out[24]
  return out as T
}

export interface Derived {
  preLaunch: boolean
  spend: number | null          // monthly, real (running) or planned (pre-launch)
  inquiries: number | null      // a month
  closePct: number | null
  saleValue: number | null
  costPerInquiry: number | null
  costPerSale: number | null
  salesPerMonth: number | null
}

/** Figures worked out only from what the person told us. Nothing is assumed. */
export function derive(a: AnswerMap): Derived {
  const preLaunch = isPreLaunch(a)
  const spend     = rangeNumber(preLaunch ? a[33] : a[13])
  const inquiries = rangeNumber(preLaunch ? a[32] : a[14])
  const closeRaw  = rangeNumber(a[21])
  const closePct  = outOfTenToPercent(a[28]) ?? (closeRaw !== null && closeRaw <= 100 ? closeRaw : null)
  const saleValue = rangeNumber(a[6] ?? a[25] ?? a[22])

  const has = (n: number | null): n is number => n !== null && n > 0
  const costPerInquiry = !preLaunch && has(spend) && has(inquiries) ? spend / inquiries : null
  const salesPerMonth  = has(inquiries) && has(closePct) ? inquiries * closePct / 100 : null
  const costPerSale    = !preLaunch && has(spend) && has(salesPerMonth) ? spend / salesPerMonth : null
  return { preLaunch, spend, inquiries, closePct, saleValue, costPerInquiry, costPerSale, salesPerMonth }
}

const LABELS: Array<[number, string]> = [
  [1,  'What they sell'],
  [2,  'Kind of business'],
  [27, 'Running paid ads right now'],
  [9,  'Where they advertise'],
  [13, 'Monthly ad spend'],
  [14, 'Inquiries from ads in a month'],
  [28, 'Out of 10 inquiries, how many buy'],
  [6,  'What one sale is worth'],
  [15, 'Do the people who inquire look like their best customers'],
  [29, 'How quickly a new inquiry gets a reply'],
  [5,  'How customers find them today'],
  [32, 'Customers in a month'],
  [33, 'Amount they could put into ads each month'],
  [34, 'When they want to start advertising'],
  [24, 'Their best customer, in their words'],
  [4,  'The problem that customer was trying to solve'],
  [26, 'What makes that customer decide to buy now'],
  [23, 'Sells to individuals, businesses or both'],
  [12, 'Who their ads are aimed at'],
  [30, 'Where their ads send people'],
  [10, 'Website link'],
  [31, 'What they say in their first reply'],
  [17, 'What someone must do before they can pay or book'],
  [19, 'Proof they show'],
  // Retired questions, still passed through for older answers
  [3,  'Typical customer company size'],
  [7,  'Who makes the buying decision'],
  [25, 'Average order value'],
  [22, 'Customer lifetime value'],
  [16, 'Main call to action'],
  [18, 'Mobile usability, self rated out of 10'],
  [20, 'How clearly the page shows what is different, self rated out of 10'],
]

/** The answers as labelled lines for a prompt. Unanswered questions are left out. */
export function answersBlock(a: AnswerMap): string {
  const lines: string[] = []
  for (const [id, label] of LABELS) {
    if (id === 21) continue
    const v = str(a[id])
    if (!v) continue
    // id 8 is only a copy of 24 on new answers
    lines.push(`- ${label}: ${v}`)
  }
  if (!str(a[28]) && str(a[21])) lines.push(`- Share of inquiries that buy: ${str(a[21])}%`)
  if (!str(a[24]) && str(a[8])) lines.push(`- Who they believe their ideal customer is: ${str(a[8])}`)
  lines.push(`- Market: ${str(a[11]) || 'Kenya'}`)
  return lines.join('\n')
}

const kes = (n: number) => `KES ${Math.round(n).toLocaleString('en-US')}`

/** Arithmetic on their own answers, written out so the report can quote it. */
export function figuresBlock(a: AnswerMap): string {
  const d = derive(a)
  const out: string[] = []
  if (d.preLaunch) {
    if (d.spend) out.push(`- Planned monthly ad budget: about ${kes(d.spend)} (estimated from the range they chose)`)
    if (d.inquiries) out.push(`- Customers a month today, without ads: ${Math.round(d.inquiries)}`)
    if (d.closePct !== null) out.push(`- People who ask and then buy: about ${d.closePct}%`)
    if (d.saleValue) out.push(`- One sale is worth: about ${kes(d.saleValue)} (estimated from the range they chose)`)
    if (d.spend && d.saleValue) out.push(`- Sales needed each month to cover the planned budget: ${Math.max(1, Math.ceil(d.spend / d.saleValue))}`)
    if (d.spend && d.saleValue && d.closePct) {
      const sales = Math.max(1, Math.ceil(d.spend / d.saleValue))
      out.push(`- Inquiries needed for those sales at their current rate: about ${Math.ceil(sales / (d.closePct / 100))}`)
    }
  } else {
    if (d.spend) out.push(`- Monthly ad spend: about ${kes(d.spend)} (estimated from the range they chose)`)
    if (d.inquiries) out.push(`- Inquiries a month: ${Math.round(d.inquiries)}`)
    if (d.costPerInquiry) out.push(`- Cost per inquiry: about ${kes(d.costPerInquiry)} (spend divided by inquiries)`)
    if (d.closePct !== null) out.push(`- Inquiries that buy: about ${d.closePct}%`)
    if (d.salesPerMonth) out.push(`- Sales a month from ads: about ${d.salesPerMonth < 10 ? d.salesPerMonth.toFixed(1) : Math.round(d.salesPerMonth)}`)
    if (d.costPerSale) out.push(`- Ad cost per sale: about ${kes(d.costPerSale)}`)
    if (d.saleValue) out.push(`- One sale is worth: about ${kes(d.saleValue)} (estimated from the range they chose)`)
    if (d.inquiries && d.saleValue) {
      out.push(`- If one more inquiry in every ten bought: about ${kes(d.inquiries * 0.1 * d.saleValue)} more in sales a month (inquiries times one tenth times what a sale is worth). Quote it only in those words, as a what-if, never as money being lost.`)
    }
  }
  if (out.length === 0) return 'FIGURES FROM THEIR ANSWERS: not enough numbers were given to work anything out. Do not state any figure.'
  return `FIGURES FROM THEIR ANSWERS (plain arithmetic on what they told us; these are the only numbers about this business you may state):\n${out.join('\n')}`
}

export interface KeyNumbers {
  pre_launch: boolean
  cost_per_inquiry: number | null
  cost_per_sale: number | null
  sale_value: number | null
  one_more_in_ten: number | null     // extra sales value a month if one more inquiry in ten bought
  sales_to_cover_budget: number | null
}

/** Worked out on the server and stored with the report, so screens never rely on the model for sums. */
export function keyNumbers(a: AnswerMap): KeyNumbers {
  const d = derive(a)
  const r = (n: number | null) => (n !== null && Number.isFinite(n) && n > 0 ? Math.round(n) : null)
  return {
    pre_launch: d.preLaunch,
    cost_per_inquiry: r(d.costPerInquiry),
    cost_per_sale: r(d.costPerSale),
    sale_value: r(d.saleValue),
    one_more_in_ten: !d.preLaunch && d.inquiries && d.saleValue ? r(d.inquiries * 0.1 * d.saleValue) : null,
    sales_to_cover_budget: d.preLaunch && d.spend && d.saleValue ? Math.max(1, Math.ceil(d.spend / d.saleValue)) : null,
  }
}
