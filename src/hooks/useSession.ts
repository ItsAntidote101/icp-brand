'use client'

import { useState, useEffect } from 'react'

type SessionState =
  | { status: 'loading' }
  | { status: 'authenticated'; email: string; name: string | null }
  | { status: 'unauthenticated' }

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: 'loading' })

  useEffect(() => {
    fetch('/api/auth/session-check')
      .then(r => r.ok ? r.json() : { loggedIn: false })
      .then((d: { loggedIn: boolean; email?: string; name?: string | null }) => {
        if (d.loggedIn && d.email) {
          setState({ status: 'authenticated', email: d.email, name: d.name ?? null })
        } else {
          setState({ status: 'unauthenticated' })
        }
      })
      .catch(() => setState({ status: 'unauthenticated' }))
  }, [])

  return state
}
