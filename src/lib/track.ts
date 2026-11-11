'use client'

// Client-side funnel tracking. Stores an anonymous visitor ID and the ad that
// brought them (utm_* / fbclid / gclid from their first visit) in localStorage,
// and sends each step to /api/track. Never throws.

type Utm = Record<string, string>
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid']

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
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

// Meta Pixel standard events for the steps that matter to ad optimisation
const PIXEL_EVENTS: Record<string, string> = {
  questionnaire_completed: 'Lead',
  call_requested: 'Schedule',
  checkout_started: 'InitiateCheckout',
}

export function track(event: string, meta?: Record<string, unknown>): void {
  try {
    const body = JSON.stringify({
      event,
      anonId: getAnonId(),
      path: window.location.pathname,
      utm: captureUtm(),
      meta: meta ?? null,
    })
    fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
    const pixelEvent = PIXEL_EVENTS[event]
    if (pixelEvent && typeof window.fbq === 'function') window.fbq('track', pixelEvent)
  } catch { /* tracking must never break the page */ }
}
