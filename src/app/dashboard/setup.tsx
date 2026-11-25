'use client'

// Campaign setup plan (Pro and Agency): the stage the client is in, worked out
// from their own numbers, with a starting point for Meta and Google. Campaign
// structure depends on the account, so the screen says plainly that the media
// buyer confirms it, and one tap sends him their numbers to review.
import { cap } from '@/lib/buyer'
import { useEffect, useState } from 'react'
import { ChevronRight, Lock } from 'lucide-react'
import { T } from './overview'
import type { SetupPlan } from '@/lib/setup-plan'

export default function SetupPlanCard({ tier, buyerName, onUpgrade }: { tier: string; buyerName: string; onUpgrade: () => void }) {
  const included = tier === 'pro' || tier === 'agency'
  const [plan, setPlan] = useState<SetupPlan | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [sent, setSent] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!included) return
    let live = true
    fetch('/api/setup-plan').then(r => (r.ok ? r.json() : null))
      .then((d: { plan?: SetupPlan | null } | null) => { if (live) { setPlan(d?.plan ?? null); setLoaded(true) } })
      .catch(() => live && setLoaded(true))
    return () => { live = false }
  }, [included])

  async function askReview() {
    if (!plan || sent !== 'idle') return
    setSent('sending'); setError('')
    try {
      const res = await fetch('/api/chat/thread', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: plan.reviewMessage }) })
      const d = await res.json().catch(() => ({})) as { error?: string }
      if (!res.ok) throw new Error(d.error || 'Could not send that. Please try again.')
      setSent('sent')
    } catch (e) {
      setSent('idle'); setError(e instanceof Error ? e.message : 'Could not send that. Please try again.')
    }
  }

  const head = (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 4px 12px' }}>
      <h2 id="ov-setup" className="ov-h2">Your campaign setup</h2>
      {!included && <span style={{ font: `400 15px/1 ${T.font}`, color: T.muted }}>On Pro</span>}
    </div>
  )

  if (!included) {
    return (
      <section aria-labelledby="ov-setup">
        {head}
        <button className="ov-card ov-row ov-item" onClick={onUpgrade} style={{ borderRadius: T.radius, alignItems: 'flex-start', width: '100%' }}>
          <Lock size={15} color={T.faint} style={{ flexShrink: 0, marginTop: 3 }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 500, color: T.ink2 }}>How to structure your campaigns at your stage</span>
            <span style={{ display: 'block', font: `400 13px/1.35 ${T.font}`, color: T.faint, marginTop: 3 }}>Budgets and bidding for Meta and Google, reviewed by {buyerName}</span>
          </span>
          <ChevronRight size={18} color={T.faint} />
        </button>
      </section>
    )
  }
  if (!loaded || !plan) return null

  const p = { font: `400 15px/1.5 ${T.font}`, color: T.ink2, margin: 0, maxWidth: '62ch' } as const
  const label = { font: `600 13px/1.3 ${T.font}`, color: T.muted, margin: '0 0 6px' } as const
  return (
    <section aria-labelledby="ov-setup">
      {head}
      <div className="ov-card" style={{ padding: '22px' }}>
        <p style={{ font: `400 13px/1.3 ${T.font}`, color: T.faint, margin: '0 0 4px' }}>Your stage</p>
        <p style={{ font: `700 24px/1.15 ${T.head}`, letterSpacing: '-0.02em', color: T.ink, margin: '0 0 6px' }}>{plan.stageName}</p>
        <p style={p}>{plan.why}</p>

        {plan.meta && (
          <div style={{ marginTop: 20 }}>
            <p style={label}>Meta</p>
            <p style={{ ...p, color: T.ink, fontWeight: 600, marginBottom: 4 }}>{plan.meta.title}</p>
            <p style={p}>{plan.meta.body}</p>
          </div>
        )}

        {plan.google && (
          <div style={{ marginTop: 20 }}>
            <p style={label}>Google bidding</p>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
              {plan.google.steps.map((s, i) => (
                <li key={i} style={{ background: s.here ? T.fill : 'transparent', border: `1px solid ${s.here ? 'transparent' : T.hairline}`, borderRadius: 14, padding: '12px 14px' }}>
                  <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ font: `600 15px/1.3 ${T.font}`, color: s.here ? T.ink : T.muted }}>{s.name}</span>
                    {s.here && <span style={{ font: `600 13px/1 ${T.font}`, color: T.accent, whiteSpace: 'nowrap' }}>You are here</span>}
                  </span>
                  <span style={{ display: 'block', font: `400 14px/1.45 ${T.font}`, color: s.here ? T.ink2 : T.muted, marginTop: 4 }}>{s.when}</span>
                </li>
              ))}
            </ol>
            <p style={{ font: `400 14px/1.45 ${T.font}`, color: T.muted, margin: '10px 0 0' }}>{plan.google.note}</p>
          </div>
        )}

        <div style={{ borderTop: `1px solid ${T.hairline}`, marginTop: 20, paddingTop: 18 }}>
          <p style={p}>This is a starting point from your numbers. The right setup depends on what is inside your ad account, so {buyerName} confirms it after looking at your data.</p>
          {sent === 'sent'
            ? <p style={{ ...p, color: T.good, fontWeight: 600, marginTop: 12 }}>Sent. {cap(buyerName)} will reply here and by email.</p>
            : <button className="ov-btn ov-btn-primary" onClick={askReview} disabled={sent === 'sending'} style={{ marginTop: 14 }}>{sent === 'sending' ? 'Sending…' : `Ask ${buyerName} to review my setup`}</button>}
          {error && <p role="alert" style={{ font: `400 14px/1.4 ${T.font}`, color: T.bad, margin: '8px 0 0' }}>{error}</p>}
        </div>
      </div>
    </section>
  )
}
