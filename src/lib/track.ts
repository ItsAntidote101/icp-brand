'use client'

// Client-side funnel tracking. Stores an anonymous visitor ID and the ad that
// brought them (utm_* / fbclid / gclid from their first visit) in localStorage,
// and sends each step to /api/track. Never throws.

type Utm = Record<string, string>
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid']

declare global {
  interface Window { dataLayer?: Record<string, unknown>[] }
}

function store(): Storage | null {
  try { return window.localStorage } catch { return null }
}

export function getAnonId(): string {
  const s = store()
  let id = s?.getItem('icp_anon') ?? ''
  if (!id) {
    id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    s?.setItem('icp_anon', id)
  }
  return id
}

export function captureUtm(): Utm {
  const s = store()
  let saved: Utm = {}
  try { saved = JSON.parse(s?.getItem('icp_utm') ?? '{}') } catch { saved = {} }
  try {
    const params = new URLSearchParams(window.location.search)
    const fresh: Utm = {}
    for (const k of UTM_KEYS) {
      const v = params.get(k)
      if (v) fresh[k] = v.slice(0, 200)
    }
    if (Object.keys(fresh).length) {
      saved = fresh // latest ad click wins
      s?.setItem('icp_utm', JSON.stringify(saved))
    }
  } catch { /* ignore */ }
  return saved
}

// Push an event to Google Tag Manager. GTM decides which pixels fire on it.
export function pushDataLayer(data: Record<string, unknown>): void {
  try {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push(data)
  } catch { /* ignore */ }
}

// ---- Enhanced conversions (Google Ads) ----
// Email and phone are normalised and SHA-256 hashed in the browser before they
// reach the dataLayer, so GTM and the pixels never see them in plain text.
type Contact = { email?: string | null; phone?: string | null }

async function sha256(text: string): Promise<string | null> {
  try {
    if (!text || typeof crypto === 'undefined' || !crypto.subtle) return null
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  } catch { return null }
}

// Kenyan numbers to E.164 (+2547...), the format Google requires before hashing.
function toE164(raw: string): string | null {
  let d = raw.replace(/[^0-9+]/g, '')
  if (d.startsWith('+')) return d.length >= 10 ? d : null
  d = d.replace(/\D/g, '')
  if (d.startsWith('254')) return `+${d}`
  if (d.startsWith('0') && d.length === 10) return `+254${d.slice(1)}`
  if ((d.startsWith('7') || d.startsWith('1')) && d.length === 9) return `+254${d}`
  return null
}

function storedEmail(): string | null {
  return store()?.getItem('dashboard_email') ?? null
}

export async function hashedUserData(contact?: Contact): Promise<Record<string, string> | null> {
  const email = (contact?.email || storedEmail() || '').trim().toLowerCase()
  const phone = contact?.phone ? toE164(contact.phone) : null
  const out: Record<string, string> = {}
  const he = email.includes('@') ? await sha256(email) : null
  const hp = phone ? await sha256(phone) : null
  if (he) out.sha256_email_address = he
  if (hp) out.sha256_phone_number = hp
  return Object.keys(out).length ? out : null
}

// Push an event with hashed user data attached (when we know who the visitor is).
export async function pushWithUserData(data: Record<string, unknown>, contact?: Contact): Promise<void> {
  const user_data = await hashedUserData(contact)
  // Reset first so an older visitor's hash never sticks to this event.
  pushDataLayer({ user_data: undefined })
  pushDataLayer(user_data ? { ...data, user_data } : data)
}

export function track(event: string, meta?: Record<string, unknown>, contact?: Contact): void {
  try {
    const body = JSON.stringify({
      event,
      anonId: getAnonId(),
      path: window.location.pathname,
      utm: captureUtm(),
      meta: meta ?? null,
    })
    fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
    // Same step to GTM, e.g. event: 'questionnaire_completed'
    void pushWithUserData({ event, ...(meta ?? {}) }, contact)
  } catch { /* tracking must never break the page */ }
}
