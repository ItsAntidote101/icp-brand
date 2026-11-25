'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getConsent, setConsent } from '@/lib/consent'

// The cookie notice, the "Cookie settings" panel, and the loader for Google
// Tag Manager, which carries the ad tags (Meta pixel, Google Ads).
//
// Google Tag Manager loads only when the visitor has switched Marketing on.
// Until then nothing from Google or Meta runs on the page. Funnel steps are
// still pushed to window.dataLayer by src/lib/track.ts, so if someone allows
// it later on the same page the tags see what already happened.
//
// NEXT_PUBLIC_GTM_ID (e.g. GTM-ABC1234) is set in Vercel.

export const CONSENT_OPEN_EVENT = 'icp-consent-open'

declare global { interface Window { __icpGtm?: boolean } }

function loadGtm(id: string) {
  if (window.__icpGtm) return
  window.__icpGtm = true
  const dl = (window.dataLayer = window.dataLayer || []) as unknown[]
  // Google's consent signal has to be pushed as an arguments object.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, prefer-rest-params
  function gtag(..._args: unknown[]) { dl.push(arguments) }
  gtag('consent', 'default', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' })
  dl.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtm.js?id=${id}`
  document.head.appendChild(s)
}

// Best effort: remove the ad cookies the tags set on this site.
function clearAdCookies() {
  const host = window.location.hostname.replace(/^www\./, '')
  for (const part of document.cookie.split(';')) {
    const name = part.split('=')[0].trim()
    if (/^(_ga|_gcl|_gid|_fbp|_fbc|_gat)/.test(name)) {
      for (const d of [`.${host}`, host, `www.${host}`]) document.cookie = `${name}=; Max-Age=0; path=/; domain=${d}`
      document.cookie = `${name}=; Max-Age=0; path=/`
    }
  }
}

const GROUPS = [
  { key: 'necessary', title: 'Strictly necessary', text: 'Keep you signed in and remember the choice you make here. The site cannot work without them, so they are always on.' },
  { key: 'analytics', title: 'Analytics', text: 'A random visitor number and the ad you first came from, sent to our own servers with the steps you complete. It shows us which pages and ads lead to a finished diagnosis. No other company receives it.' },
  { key: 'functional', title: 'Functional', text: 'Saves the answers you have given so far in your browser for up to 14 days, so you can leave and carry on where you stopped.' },
  { key: 'marketing', title: 'Marketing', text: 'Loads Google and Meta tags. They set their own cookies and tell those companies which steps you complete here, so we can measure our ads and reach businesses like yours. When you finish a diagnosis, ask for a call or pay, a scrambled form of your email and phone number is shared with them to match that result to an ad.' },
] as const
type Key = 'analytics' | 'functional' | 'marketing'

export default function GoogleTagManager() {
  const id = process.env.NEXT_PUBLIC_GTM_ID
  const valid = Boolean(id && /^GTM-[A-Z0-9]+$/.test(id))
  const [bar, setBar] = useState(false)
  const [panel, setPanel] = useState(false)
  const [pick, setPick] = useState<Record<Key, boolean>>({ analytics: true, functional: true, marketing: false })
  const panelRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  // Always open on what is saved, so switches flipped and then abandoned do not linger.
  const openPanel = () => { const now = getConsent(); setPick({ analytics: now.analytics, functional: now.functional, marketing: now.marketing }); setPanel(true) }

  useEffect(() => {
    const c = getConsent()
    setPick({ analytics: c.analytics, functional: c.functional, marketing: c.marketing })
    if (valid && c.marketing) loadGtm(id as string)
    if (!c.decided) setBar(true)
    window.addEventListener(CONSENT_OPEN_EVENT, openPanel)
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, openPanel)
  }, [valid, id])

  useEffect(() => {
    if (bar || panel) document.documentElement.setAttribute('data-consent-open', '')
    else document.documentElement.removeAttribute('data-consent-open')
  }, [bar, panel])

  // While the bar is up, leave room under the page so nothing sits behind it for good.
  useEffect(() => {
    const el = barRef.current
    if (!bar || panel || !el) return
    const prev = document.body.style.paddingBottom
    const fit = () => { document.body.style.paddingBottom = `${el.offsetHeight}px` }
    fit()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null
    ro?.observe(el)
    return () => { ro?.disconnect(); document.body.style.paddingBottom = prev }
  }, [bar, panel])

  useEffect(() => {
    if (!panel) return
    panelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPanel(false) }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [panel])

  const save = (c: Record<Key, boolean>) => {
    const had = Boolean(window.__icpGtm)
    setConsent(c)
    setPick(c); setBar(false); setPanel(false)
    if (c.marketing) { if (valid) loadGtm(id as string); return }
    clearAdCookies()
    if (had) window.location.reload()   // the tags were already running on this page: stop them
  }
  const acceptAll = () => save({ analytics: true, functional: true, marketing: true })

  if (!bar && !panel) return null

  return (
    <div className="cc">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {bar && !panel && (
        <div className="cc-bar" role="region" aria-label="Cookies" ref={barRef}>
          <div className="cc-bar-text">
            <p className="cc-title">We use cookies and similar technologies</p>
            <p>Some are needed to make the site work. The rest are optional and you choose which we use. <span className="cc-wide">They show us how the site is used, remember where you stopped, and measure our ads. </span>More in our <Link href="/privacy">Privacy policy</Link>.</p>
          </div>
          <div className="cc-bar-acts">
            <button type="button" className="cc-dark" onClick={openPanel}>Cookie settings</button>
            <button type="button" className="cc-main" onClick={acceptAll}>Accept all</button>
          </div>
          <button type="button" className="cc-x" aria-label="Close and keep optional marketing off" onClick={() => save({ analytics: true, functional: true, marketing: false })}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {panel && (
        <div className="cc-shade" onMouseDown={e => { if (e.target === e.currentTarget) setPanel(false) }}>
          <div className="cc-panel" role="dialog" aria-modal="true" aria-labelledby="cc-h" tabIndex={-1} ref={panelRef}>
            <div className="cc-panel-top">
              <button type="button" className="cc-x" aria-label="Close" onClick={() => setPanel(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="cc-panel-body">
              <h2 id="cc-h">Your privacy choices</h2>
              <p>Like most sites, this one keeps small pieces of information in your browser. Some keep you signed in. The rest are optional, and you decide which of those we may use. You can change this at any time from &quot;Cookie settings&quot; at the bottom of every page.</p>
              <p><Link href="/privacy" onClick={() => setPanel(false)}>More information</Link></p>
              <h3>Manage your choices</h3>
              <div className="cc-rows">
                {GROUPS.map(g => (
                  <details key={g.key} className="cc-row">
                    <summary>
                      <span className="cc-row-title">{g.title}</span>
                      {g.key === 'necessary'
                        ? <span className="cc-always">Always active</span>
                        : (
                          <button type="button" role="switch" aria-checked={pick[g.key as Key]} aria-label={g.title} className={`cc-switch${pick[g.key as Key] ? ' cc-on' : ''}`}
                            onClick={e => { e.preventDefault(); e.stopPropagation(); setPick(p => ({ ...p, [g.key]: !p[g.key as Key] })) }}><i /></button>
                        )}
                      <svg className="cc-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
                    </summary>
                    <p>{g.text}</p>
                  </details>
                ))}
              </div>
            </div>
            <div className="cc-panel-foot">
              <button type="button" className="cc-dark" onClick={acceptAll}>Accept all</button>
              <button type="button" className="cc-main" onClick={() => save(pick)}>Confirm my choices</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** A footer link that reopens the choices. */
export function CookieSettings({ className }: { className?: string }) {
  return (
    <button type="button" className={className} style={{ background: 'none', border: 0, padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}
      onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}>
      Cookie settings
    </button>
  )
}

const css = `
.cc{font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#201515}
.cc p{margin:0}
.cc a{color:#e8330a;font-weight:600;text-decoration:none}
.cc a:hover{text-decoration:underline;text-underline-offset:3px}
.cc button{font-family:inherit;cursor:pointer}
.cc button:focus-visible,.cc a:focus-visible,.cc summary:focus-visible{outline:3px solid #e8330a;outline-offset:2px}
.cc-main,.cc-dark{min-height:48px;padding:0 24px;border-radius:99px;font-size:15.5px;font-weight:600;line-height:1;border:1.5px solid transparent;white-space:nowrap;transition:background .15s,border-color .15s}
.cc-main{background:#e8330a;border-color:#e8330a;color:#fff}
.cc-main:hover{background:#c92a06;border-color:#c92a06}
.cc-dark{background:#3a3536;border-color:#3a3536;color:#fff}
.cc-dark:hover{background:#201515;border-color:#201515}
.cc-x{flex-shrink:0;width:44px;height:44px;display:grid;place-items:center;border:0;border-radius:50%;background:transparent;color:#201515}
.cc-x:hover{background:rgba(32,21,21,.07)}

.cc-bar{position:fixed;z-index:80;left:0;right:0;bottom:0;background:#fff;box-shadow:0 -18px 50px -20px rgba(32,21,21,.35);border-top:1px solid rgba(201,192,177,.7);
  display:grid;grid-template-columns:1fr auto;gap:14px 12px;align-items:start;padding:20px clamp(16px,3.4vw,44px) max(20px,env(safe-area-inset-bottom))}
.cc-bar-text{grid-column:1;display:grid;gap:10px}
.cc-title{font-size:18px;font-weight:700;line-height:1.25;letter-spacing:-.01em}
.cc-bar-text p:not(.cc-title){font-size:15px;line-height:1.55;color:#36342e}
.cc-bar .cc-x{grid-column:2;grid-row:1;margin:-8px -8px 0 0}
.cc-wide{display:none}
.cc-bar-acts{grid-column:1 / -1;display:grid;grid-template-columns:1fr 1fr;gap:10px}

.cc-shade{position:fixed;z-index:90;inset:0;background:rgba(23,15,15,.55);display:grid;place-items:center;padding:16px}
.cc-panel{width:min(640px,100%);max-height:min(720px,calc(100dvh - 32px));display:grid;grid-template-rows:auto 1fr auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 40px 90px -30px rgba(0,0,0,.6);outline:0}
.cc-panel-top{display:flex;justify-content:flex-end;padding:10px 12px;border-bottom:1px solid rgba(201,192,177,.6)}
.cc-panel-body{overflow-y:auto;padding:22px clamp(18px,4vw,34px) 24px;display:grid;gap:12px;overscroll-behavior:contain}
.cc-panel-body h2{margin:0;font-size:20px;font-weight:700;line-height:1.25;letter-spacing:-.01em}
.cc-panel-body h3{margin:14px 0 2px;font-size:17px;font-weight:700;line-height:1.3}
.cc-panel-body>p{font-size:15px;line-height:1.6;color:#36342e}
.cc-rows{display:grid;border:1px solid rgba(201,192,177,.9);border-radius:6px}
.cc-row+.cc-row{border-top:1px solid rgba(201,192,177,.9)}
.cc-row summary{list-style:none;display:flex;align-items:center;gap:14px;min-height:64px;padding:8px 14px 8px 16px;cursor:pointer}
.cc-row summary::-webkit-details-marker{display:none}
.cc-row-title{flex:1;font-size:16.5px;font-weight:700;line-height:1.3}
.cc-always{font-size:15px;font-weight:700;color:#e8330a;white-space:nowrap}
.cc-chev{flex-shrink:0;color:#605d52;transition:transform .15s}
.cc-row[open] .cc-chev{transform:rotate(90deg)}
.cc-row>p{padding:0 16px 16px;font-size:14.5px;line-height:1.6;color:#36342e}
.cc-switch{flex-shrink:0;position:relative;width:54px;height:32px;border-radius:99px;border:0;background:#c9c0b1;transition:background .15s;padding:0}
.cc-switch i{position:absolute;top:4px;left:4px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .15s}
.cc-switch.cc-on{background:#e8330a}
.cc-switch.cc-on i{transform:translateX(22px)}
.cc-panel-foot{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px;padding:16px clamp(18px,4vw,34px);border-top:1px solid rgba(201,192,177,.6);background:#f8f4f0}
.cc-panel-foot button{flex:1 1 160px}
html[data-consent-open] .ab{display:none}
@media (min-width:860px){
  .cc-bar{grid-template-columns:1fr auto auto;gap:28px;align-items:center;padding-top:26px;padding-bottom:26px}
  .cc-bar-acts{grid-column:2;grid-row:1;grid-template-columns:1fr;width:230px}
  .cc-bar .cc-x{grid-column:3;margin:0}
  .cc-wide{display:inline}
  .cc-panel-foot button{flex:0 0 auto}
}
@media (prefers-reduced-motion:reduce){.cc *{transition:none!important}}
`
