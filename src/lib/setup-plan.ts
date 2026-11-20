// Campaign setup plan (Pro and Agency). The dashboard works out which stage a
// client is in from their own numbers and shows a starting point. It is a
// starting point only: campaign structure depends on the account, so the
// media buyer confirms it after reviewing their data.
import { derive, isPreLaunch, type AnswerMap } from '@/lib/answers'

export type Week = { week_start: string; spend: number | null; leads: number | null }
export type Stage = 'launch' | 'testing' | 'scaling'

export type SetupPlan = {
  stage: Stage
  stageName: string
  why: string
  inquiriesMonth: number | null
  weeksLogged: number
  costPerInquiry: number | null
  meta:   { title: string; body: string } | null
  google: { steps: { name: string; when: string; here: boolean }[]; note: string } | null
  reviewMessage: string
}

const kes = (n: number) => `KES ${Math.round(n).toLocaleString('en-US')}`
export const SCALE_AT = 30          // inquiries a month
export const STEADY_WEEKS = 3
const STEADY_SPREAD = 1.25          // highest weekly cost per inquiry within 25% of the lowest

export function buildSetupPlan(answers: AnswerMap, weeks: Week[]): SetupPlan {
  const pre = isPreLaunch(answers)
  const d   = derive(answers)
  const logged = weeks
    .filter(w => (w.spend ?? 0) > 0 && (w.leads ?? 0) > 0)
    .sort((a, b) => (a.week_start < b.week_start ? 1 : -1))
  const recent = logged.slice(0, 4)

  // Logged weeks beat the questionnaire: they are newer and measured week by week
  let inquiriesMonth: number | null = null
  let costPerInquiry: number | null = null
  if (recent.length >= STEADY_WEEKS) {
    const leads = recent.reduce((n, w) => n + (w.leads ?? 0), 0)
    const spend = recent.reduce((n, w) => n + (w.spend ?? 0), 0)
    inquiriesMonth = Math.round(leads / recent.length * 4.345)
    costPerInquiry = leads > 0 ? spend / leads : null
  } else if (!pre) {
    inquiriesMonth = d.inquiries !== null ? Math.round(d.inquiries) : null
    costPerInquiry = d.costPerInquiry
  }

  const cpls = logged.slice(0, STEADY_WEEKS).map(w => (w.spend as number) / (w.leads as number))
  const steady = cpls.length >= STEADY_WEEKS && Math.max(...cpls) / Math.min(...cpls) <= STEADY_SPREAD

  let stage: Stage, why: string
  if (pre) {
    stage = 'launch'; why = 'You told us you have not started advertising yet.'
  } else if (inquiriesMonth !== null && inquiriesMonth >= SCALE_AT && steady) {
    stage = 'scaling'; why = `About ${inquiriesMonth} inquiries a month, and your cost per inquiry has held steady for ${STEADY_WEEKS} weeks.`
  } else {
    stage = 'testing'
    why = inquiriesMonth === null ? 'We do not have your inquiry numbers yet. Log a few weeks so the plan can move with them.'
      : inquiriesMonth < SCALE_AT ? `About ${inquiriesMonth} inquiries a month. The platforms learn faster once you pass ${SCALE_AT}.`
      : logged.length < STEADY_WEEKS ? `About ${inquiriesMonth} inquiries a month, but fewer than ${STEADY_WEEKS} weeks of numbers logged, so we cannot yet say your costs are steady.`
      : `About ${inquiriesMonth} inquiries a month, but your cost per inquiry is still moving from week to week.`
  }

  const channels = Array.isArray(answers[9]) ? (answers[9] as unknown[]).filter((c): c is string => typeof c === 'string') : []
  const onMeta   = pre || channels.length === 0 || channels.some(c => /meta|facebook|instagram/i.test(c))
  const onGoogle = pre || channels.length === 0 || channels.some(c => /google|youtube/i.test(c))

  const meta = !onMeta ? null : stage === 'scaling'
    ? { title: 'Let Meta move budget to what works', body: 'With steady results, one campaign budget shared across your proven audiences (CBO) usually makes sense. Raise the budget in small steps so the results hold.' }
    : { title: 'Give each audience its own budget', body: 'While you are still finding out who responds, a separate budget for each audience (ABO) gives every one a fair run before you judge it. Keep the number of audiences small so each gets enough spend to tell you something.' }

  const n = inquiriesMonth ?? 0
  const at = stage === 'launch' || n < 10 ? 0 : stage === 'scaling' ? 2 : 1
  const google = !onGoogle ? null : {
    steps: [
      { name: 'Manual CPC', when: 'While Google has few or no counted inquiries to learn from. You set the most you pay for a click.', here: at === 0 },
      { name: 'Maximize conversions', when: 'Once your inquiries are being counted as conversions and coming in regularly.', here: at === 1 },
      { name: 'Target CPA', when: `Once you pass about ${SCALE_AT} counted inquiries a month and the cost is steady${costPerInquiry && at === 2 ? `. Start at your real cost per inquiry, about ${kes(costPerInquiry)}, not lower` : ''}.`, here: at === 2 },
    ],
    note: 'This only works if Google is counting your inquiries. If you are not sure it is, that is the first thing to fix.',
  }

  const lines = [
    'Please review my campaign setup.',
    `Stage shown on my dashboard: ${stage === 'launch' ? 'Launch' : stage === 'testing' ? 'Testing' : 'Scaling'}.`,
    inquiriesMonth !== null ? `Inquiries a month: about ${inquiriesMonth}.` : '',
    costPerInquiry ? `Cost per inquiry: about ${kes(costPerInquiry)}.` : '',
    `Weeks of numbers logged: ${logged.length}.`,
    channels.length ? `I advertise on: ${channels.join(', ')}.` : pre ? 'I have not started advertising yet.' : '',
  ].filter(Boolean)

  return {
    stage, stageName: stage === 'launch' ? 'Launch' : stage === 'testing' ? 'Testing' : 'Scaling', why,
    inquiriesMonth, weeksLogged: logged.length, costPerInquiry: costPerInquiry ? Math.round(costPerInquiry) : null,
    meta, google, reviewMessage: lines.join('\n'),
  }
}
