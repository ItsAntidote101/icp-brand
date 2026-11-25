// "Done with you": hands-on jobs the media buyer does together with a client.
// Pro includes one a month, Agency up to four. Requests are saved as
// session_requests so they land in the control room's Today queue.

export const JOBS = [
  { id: 'crm',       title: 'Connect my CRM or lead sheet',        sub: 'Every inquiry lands in one place, so none are lost' },
  { id: 'tracking',  title: 'Fix my conversion tracking',          sub: 'So Google and Meta count your inquiries properly' },
  { id: 'campaigns', title: 'Set up or restructure my campaigns',  sub: 'Built together, inside your own ad account' },
  { id: 'other',     title: 'Something else',                      sub: 'Tell your media buyer what you need a hand with' },
] as const
export type JobId = typeof JOBS[number]['id']

export const FORMAT_PREFIX = 'Hands-on: '
export const formatFor = (id: JobId) => `${FORMAT_PREFIX}${JOBS.find(j => j.id === id)?.title ?? 'Something else'}`

/** Sessions a plan includes each calendar month. 0 means not included. */
export function monthlyLimit(tier: string): number {
  return tier === 'agency' ? 4 : tier === 'pro' ? 1 : 0
}

/** First moment of the current month in Nairobi (UTC+3), as an ISO string. */
export function monthStart(now: Date = new Date()): string {
  const nbo = new Date(now.getTime() + 3 * 3600 * 1000)
  return new Date(Date.UTC(nbo.getUTCFullYear(), nbo.getUTCMonth(), 1) - 3 * 3600 * 1000).toISOString()
}
