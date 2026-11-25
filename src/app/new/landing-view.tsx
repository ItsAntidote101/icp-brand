'use client'

import { useEffect } from 'react'
import { track } from '@/lib/track'

// Counts a visit once per browser session, on whichever public page the
// visitor lands on first (an ad can point at any of them). Sends the
// `landing_view` funnel step, the same one the old home page sent.
const KEY = 'icp_landed'

export default function LandingView() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) return
      sessionStorage.setItem(KEY, '1')
    } catch { /* private mode: count the visit anyway */ }
    track('landing_view')
  }, [])
  return null
}
