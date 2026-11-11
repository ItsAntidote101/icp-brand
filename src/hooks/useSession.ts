'use client'

import { useState, useEffect } from 'react'

type SessionState =
  | { status: 'loading' }
  | { status: 'authenticated'; email: string; name: string | null; tier: string }
  | { status: 'unauthenticated' }

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: 'loading' })

  useEffect(() => {
    fetch('/api/auth/session-check')
      .then(r => r.ok ? r.json() : { loggedIn: false })
      .then((d: { loggedIn: boolean; email?: string; name?: string | null; tier?: string }) => {
        if (d.loggedIn && d.email) {
          setState({ status: 'authenticated', email: d.email, name: d.name ?? null, tier: d.tier ?? 'free' })
        } else {
          setState({ status: 'unauthenticated' })
        }
      })
      .catch(() => setState({ status: 'unauthenticated' }))
  }, [])

  return state
}
