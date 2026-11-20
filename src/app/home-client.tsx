'use client'

// The few parts of the home page that need the browser: the nav (which knows
// whether you are logged in) and the page-view event for ad tracking.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useSession } from '@/hooks/useSession'
import { track } from '@/lib/track'

const LINKS: [string, string][] = [['How it works', '/#how'], ['Pricing', '/pricing'], ['Guides', '/guides'], ['About', '/about']]

export function LandingTracker() {
  useEffect(() => { track('landing_view') }, [])
  return null
}

export function HomeNav() {
  const session  = useSession()
  const loggedIn = session.status === 'authenticated'
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <header className="hp-nav">
      <div className="hp-nav-in">
        <Link href="/" className="hp-brand" aria-label="Ideal ICP, home">
          <span className="hp-mark" aria-hidden="true" />Ideal ICP
        </Link>
        <nav className="hp-links" aria-label="Main">
          {LINKS.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className="hp-nav-cta">
          {loggedIn
            ? <Link href="/dashboard" className="hp-btn hp-btn-sm">Open my dashboard</Link>
            : <>
                <Link href="/auth?tab=login" className="hp-login">Log in</Link>
                <Link href="/questionnaire" className="hp-btn hp-btn-sm">Get my free diagnosis</Link>
              </>}
          <button className="hp-burger" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls="hp-menu" aria-label={open ? 'Close menu' : 'Open menu'}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <div id="hp-menu" className="hp-menu">
          {LINKS.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
          <Link href={loggedIn ? '/dashboard' : '/auth?tab=login'} onClick={() => setOpen(false)}>{loggedIn ? 'Open my dashboard' : 'Log in'}</Link>
          {!loggedIn && <Link href="/questionnaire" className="hp-btn" onClick={() => setOpen(false)} style={{ marginTop: 20 }}>Get my free diagnosis</Link>}
        </div>
      )}
    </header>
  )
}
