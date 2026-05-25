'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  FileSearch, CreditCard, AlertCircle, TrendingUp, BarChart2, X,
} from 'lucide-react'

interface SocialProofEvent {
  id: string
  type: 'diagnosis' | 'subscription' | 'waste_found' | 'score_improved' | 'weekly_stat'
  message: string
  subtext: string
  iconColor: string
}

const ICON_MAP = {
  diagnosis:     { Icon: FileSearch,   color: '#e8330a' },
  subscription:  { Icon: CreditCard,   color: '#22c55e' },
  waste_found:   { Icon: AlertCircle,  color: '#ef4444' },
  score_improved:{ Icon: TrendingUp,   color: '#e8330a' },
  weekly_stat:   { Icon: BarChart2,    color: '#201515' },
} as const

const font  = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontB = "'PolySans Neutral', -apple-system, system-ui, sans-serif"

export default function SocialProofToast() {
  const [events, setEvents] = useState<SocialProofEvent[]>([])
  const [currentEvent, setCurrentEvent] = useState<SocialProofEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const indexRef     = useRef(0)
  const shownIds     = useRef<Set<string>>(new Set())
  const cycleTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch events on mount and every 30s
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/social-proof')
        if (!res.ok) return
        const data = await res.json() as { events: SocialProofEvent[] }
        setEvents(prev => {
          // Merge without duplication
          const ids = new Set(prev.map(e => e.id))
          const fresh = data.events.filter(e => !ids.has(e.id))
          return [...prev, ...fresh]
        })
      } catch {
        // Non-fatal, silently skip
      }
    }
    load()
    const poll = setInterval(load, 30_000)
    return () => clearInterval(poll)
  }, [])

  // Notification cycle
  useEffect(() => {
    if (events.length === 0) return

    const showNext = () => {
      // Find next un-shown event
      let attempts = 0
      let ev: SocialProofEvent | undefined
      while (attempts < events.length) {
        const candidate = events[indexRef.current % events.length]
        indexRef.current++
        if (!shownIds.current.has(candidate.id)) {
          ev = candidate
          break
        }
        attempts++
      }

      // All shown in session, reset and pick first
      if (!ev) {
        shownIds.current.clear()
        ev = events[0]
        indexRef.current = 1
      }

      shownIds.current.add(ev.id)
      setCurrentEvent(ev)
      setIsExiting(false)
      setIsVisible(true)

      // Start exit after 6s
      cycleTimer.current = setTimeout(() => {
        setIsExiting(true)
        // Hide after exit animation (400ms), then wait 15s before next
        cycleTimer.current = setTimeout(() => {
          setIsVisible(false)
          cycleTimer.current = setTimeout(showNext, 15_000)
        }, 400)
      }, 6_000)
    }

    // Wait 8s on first load
    cycleTimer.current = setTimeout(showNext, 8_000)

    return () => {
      if (cycleTimer.current) clearTimeout(cycleTimer.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length > 0])

  const dismiss = () => {
    setDismissed(true)
    setIsVisible(false)
    if (cycleTimer.current) clearTimeout(cycleTimer.current)
  }

  if (!isVisible || dismissed || !currentEvent) return null

  const { Icon, color } = ICON_MAP[currentEvent.type] ?? ICON_MAP.diagnosis

  return (
    <>
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-120%); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        @keyframes slideOutLeft {
          from { transform: translateX(0);     opacity: 1; }
          to   { transform: translateX(-120%); opacity: 0; }
        }
        @keyframes progressShrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
        @media (max-width: 479px) {
          .social-proof-toast { display: none !important; }
        }
      `}</style>

      <div
        className="social-proof-toast"
        onClick={dismiss}
        style={{
          position: 'fixed',
          bottom: 80,
          left: 24,
          zIndex: 998,
          width: 300,
          background: '#f8f4f0',
          borderRadius: 12,
          padding: '14px 28px 14px 16px',
          boxShadow: '0 4px 24px rgba(32,21,21,0.12), 0 1px 4px rgba(32,21,21,0.08)',
          borderLeft: `3px solid ${color}`,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          cursor: 'pointer',
          animation: `${isExiting ? 'slideOutLeft' : 'slideInLeft'} 400ms ease-${isExiting ? 'in' : 'out'} both`,
          overflow: 'hidden',
        }}
      >
        {/* Icon circle */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: color + '1a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} strokeWidth={1.75} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: font, fontSize: 13, color: '#201515', fontWeight: 600,
            lineHeight: 1.4, margin: '0 0 3px',
          }}>
            {currentEvent.message}
          </p>
          <p style={{ fontFamily: fontB, fontSize: 12, color: 'rgba(32,21,21,0.5)', margin: 0 }}>
            {currentEvent.subtext}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={e => { e.stopPropagation(); dismiss() }}
          aria-label="Dismiss"
          style={{
            position: 'absolute', top: 8, right: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 2, display: 'flex', alignItems: 'center',
          }}
        >
          <X size={12} color="rgba(32,21,21,0.3)" />
        </button>

        {/* Progress bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, width: '100%',
          height: 2, background: 'rgba(32,21,21,0.08)',
          borderRadius: '0 0 12px 12px',
        }}>
          {!isExiting && (
            <div style={{
              height: '100%',
              background: color,
              borderRadius: 'inherit',
              animation: 'progressShrink 6000ms linear both',
            }} />
          )}
        </div>
      </div>
    </>
  )
}
