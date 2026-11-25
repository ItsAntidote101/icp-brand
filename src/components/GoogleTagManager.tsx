'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// Google Tag Manager carries the ad tags (Meta pixel, Google Ads). It is
// loaded only after the visitor allows it. Until then nothing from Google or
// Meta runs on the page. The choice is kept in their browser and can be
// changed from "Cookie settings" in the footer. Funnel steps are still pushed
// to window.dataLayer by src/lib/track.ts, so if someone allows it later on
// the same page, the tags see what already happened.
//
// NEXT_PUBLIC_GTM_ID (e.g. GTM-ABC1234) is set in Vercel.

const KEY = 'icp_consent'            // 'yes' | 'no'
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

export default function GoogleTagManager() {
  const id = process.env.NEXT_PUBLIC_GTM_ID
  const valid = Boolean(id && /^GTM-[A-Z0-9]+$/.test(id))
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!valid) return
    let choice: string | null = null
    try { choice = window.localStorage.getItem(KEY) } catch { /* no storage: ask each visit, load nothing until asked */ }
    if (choice === 'yes') loadGtm(id as string)
    else if (choice !== 'no') setOpen(true)
    const reopen = () => setOpen(true)
    window.addEventListener(CONSENT_OPEN_EVENT, reopen)
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen)
  }, [valid, id])

  useEffect(() => {
    if (open) document.documentElement.setAttribute('data-consent-open', '')
    else document.documentElement.removeAttribute('data-consent-open')
  }, [open])

  if (!valid || !open) return null

  const decide = (yes: boolean) => {
    try { window.localStorage.setItem(KEY, yes ? 'yes' : 'no') } catch { /* asked again next visit */ }
    setOpen(false)
    if (yes) { loadGtm(id as string); return }
    clearAdCookies()
    if (window.__icpGtm) window.location.reload()   // tags were already running on this page: stop them
  }

  return (
    <div className="cc" role="dialog" aria-label="Ad measurement" aria-describedby="cc-text">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <p className="cc-title">Can we measure our ads?</p>
      <p id="cc-text" className="cc-text">
        We keep a few things in your browser to sign you in and save your progress. With your OK we also load Google and Meta tags that show us which ads work. <Link href="/privacy">Privacy policy</Link>
      </p>
      <div className="cc-acts">
        <button type="button" className="cc-yes" onClick={() => decide(true)}>Allow</button>
        <button type="button" className="cc-no" onClick={() => decide(false)}>No thanks</button>
      </div>
    </div>
  )
}

/** A footer link that reopens the choice. */
export function CookieSettings({ className }: { className?: string }) {
  return (
    <button type="button" className={className} style={{ background: 'none', border: 0, padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}
      onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}>
      Cookie settings
    </button>
  )
}

const css = `
.cc{position:fixed;z-index:80;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));max-width:400px;padding:20px;border-radius:16px;background:#fff;color:#201515;border:1px solid rgba(201,192,177,.7);box-shadow:0 24px 60px -20px rgba(32,21,21,.45);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}
.cc p{margin:0}
.cc-title{font-size:17px;font-weight:700;line-height:1.3;letter-spacing:-.01em}
.cc-text{margin-top:8px!important;font-size:14.5px;line-height:1.55;color:#36342e}
.cc-text a{color:#201515;text-decoration:underline;text-underline-offset:3px}
.cc-acts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
.cc-acts button{min-height:46px;border-radius:8px;font:600 15px/1 inherit;font-family:inherit;cursor:pointer}
.cc-yes{background:#e8330a;border:1.5px solid #e8330a;color:#fff}
.cc-no{background:#fff;border:1.5px solid #201515;color:#201515}
.cc-yes:hover{background:#c92a06;border-color:#c92a06}
.cc-no:hover{background:#201515;color:#fff}
.cc button:focus-visible,.cc a:focus-visible{outline:3px solid #e8330a;outline-offset:2px}
html[data-consent-open] .ab{display:none}
`
