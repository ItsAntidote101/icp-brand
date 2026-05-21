const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && EMAIL_RE.test(email.trim())
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

const VALID_TIERS = ['starter', 'pro', 'agency', 'free'] as const
export type ValidTier = (typeof VALID_TIERS)[number]

export function isValidTier(tier: unknown): tier is ValidTier {
  return VALID_TIERS.includes(tier as ValidTier)
}
