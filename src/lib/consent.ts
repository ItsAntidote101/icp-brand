// The visitor's cookie choices, kept in their own browser.
//
// Four groups, as shown in the "Cookie settings" panel:
//   necessary  always on (login cookie, this choice)
//   analytics  our own count of steps completed (visitor number, first ad)
//   functional saved progress, so someone can leave and carry on
//   marketing  Google and Meta tags, loaded through Google Tag Manager
//
// Everything is on until someone switches a group off in "Cookie settings".
// Ignoring the bar or closing it keeps everything on (the founder's decision,
// 25 Nov 2026). The bar and the privacy policy say so in plain words.

export type Consent = { decided: boolean; analytics: boolean; functional: boolean; marketing: boolean }
const KEY = 'icp_consent'
export const CONSENT_CHANGED = 'icp-consent-changed'
const DEFAULTS: Consent = { decided: false, analytics: true, functional: true, marketing: true }

export function getConsent(): Consent {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    if (raw === 'yes') return { decided: true, analytics: true, functional: true, marketing: true }   // earlier simple notice
    if (raw === 'no') return { decided: true, analytics: true, functional: true, marketing: false }
    const c = JSON.parse(raw)
    return { decided: true, analytics: c.a !== false, functional: c.f !== false, marketing: c.m !== false }
  } catch { return DEFAULTS }
}

export function setConsent(c: { analytics: boolean; functional: boolean; marketing: boolean }) {
  try { window.localStorage.setItem(KEY, JSON.stringify({ v: 2, a: c.analytics, f: c.functional, m: c.marketing, at: Date.now() })) } catch { /* asked again next visit */ }
  if (!c.analytics) { try { window.localStorage.removeItem('icp_anon'); window.localStorage.removeItem('icp_utm') } catch { /* nothing to clear */ } }
  if (!c.functional) { try { window.localStorage.removeItem('icp_opener_answers'); window.localStorage.removeItem('icp_q_progress') } catch { /* nothing to clear */ } }
  window.dispatchEvent(new Event(CONSENT_CHANGED))
}
