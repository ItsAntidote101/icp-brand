import crypto from 'node:crypto'

// Weeks run Monday to Sunday in Nairobi time (UTC+3, no daylight saving).
const NAIROBI_OFFSET_MS = 3 * 60 * 60 * 1000
const DAY_MS = 86_400_000

const ymd = (d: Date) => d.toISOString().slice(0, 10)

/** Monday (YYYY-MM-DD) of the most recent week that has fully ended. */
export function lastCompletedWeekStart(now: Date = new Date()): string {
  const local = new Date(now.getTime() + NAIROBI_OFFSET_MS)
  const dow = (local.getUTCDay() + 6) % 7                      // Monday = 0
  const thisMonday = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - dow * DAY_MS
  return ymd(new Date(thisMonday - 7 * DAY_MS))
}

/** "10 to 16 Nov" or "28 Oct to 3 Nov". */
export function weekLabel(weekStart: string): string {
  const a = new Date(`${weekStart}T00:00:00Z`)
  const b = new Date(a.getTime() + 6 * DAY_MS)
  const mon = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })
  return a.getUTCMonth() === b.getUTCMonth()
    ? `${a.getUTCDate()} to ${b.getUTCDate()} ${mon(b)}`
    : `${a.getUTCDate()} ${mon(a)} to ${b.getUTCDate()} ${mon(b)}`
}

export const previousWeek = (weekStart: string) =>
  ymd(new Date(new Date(`${weekStart}T00:00:00Z`).getTime() - 7 * DAY_MS))

/** Signed token for the one-click unsubscribe link in the Monday email. */
export function unsubscribeToken(userId: string): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is required')
  return crypto.createHmac('sha256', secret).update(`weekly-numbers:${userId}`).digest('hex').slice(0, 32)
}

export function validUnsubscribeToken(userId: string, token: string): boolean {
  try {
    const expected = Buffer.from(unsubscribeToken(userId))
    const given = Buffer.from(token ?? '')
    return expected.length === given.length && crypto.timingSafeEqual(expected, given)
  } catch { return false }
}
