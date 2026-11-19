'use client'

// The dashboard overview. One screen that answers, in order:
//   1. Where do I stand?          (score and estimated waste)
//   2. What do I do this week?    (three fixes, most important first)
//   3. What did you find?         (top findings, one line each)
//   4. Who can help me?           (Eugene)
// Everything else lives in Diagnosis, Market and Progress.

import React, { useEffect, useState } from 'react'
import { Check, ChevronRight, ChevronDown, Lock } from 'lucide-react'

// ─── Design tokens (shared with page.tsx by value) ───────────────────────────
// Brand fonts and colours are unchanged. The calmer feel comes from structure:
// one canvas colour, white grouped surfaces, hairlines and soft depth.
export const T = {
  bg:        '#f8f4f0',
  surface:   '#ffffff',
  ink:       '#201515',
  ink2:      '#605d52',
  muted:     '#605d52',
  faint:     '#939084',
  hairline:  'rgba(201,192,177,0.45)',
  fill:      'rgba(201,192,177,0.18)',
  accent:    '#e8330a',
  good:      '#15803d',
  warn:      '#b45309',
  bad:       '#dc2626',
  head:      "'PolySans Median', -apple-system, system-ui, sans-serif",
  font:      "'PolySans Neutral', -apple-system, system-ui, sans-serif",
  radius:    20,
  // Soft bevel: a light top edge, a hairline, and a low warm shadow
  shadow:    'inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 1px rgba(201,192,177,0.28), 0 1px 2px rgba(32,21,21,0.04), 0 8px 24px rgba(201,192,177,0.22)',
}

export const statusOf = (score: number) =>
  score >= 71 ? { label: 'Healthy',  color: T.good, ring: '#22c55e' }
  : score >= 41 ? { label: 'At risk',  color: T.warn, ring: '#f59e0b' }
  :               { label: 'Critical', color: T.bad,  ring: '#ef4444' }

const sevColor = (s: string) => s === 'Critical' ? '#ef4444' : s === 'Warning' ? '#f59e0b' : '#22c55e'

// ─── Types (structural; page.tsx passes its own richer objects) ──────────────
type Finding  = { title: string; severity: string; explanation: string }
type QuickWin = { action: string; impact: string; platform?: string; where?: string; expectedImpact?: string; effort?: string }

export type OverviewProps = {
  firstName:    string
  email:        string
  tier:         string
  score:        number | null
  scoreDelta:   number | null
  prevDate:     string | null          // formatted date of the previous report
  reportDate:   string                 // formatted date of the latest report
  reportId:     string
  wasteLabel:   string | null          // already converted, e.g. "KES 36,000"
  findings:     Finding[]
  totalFindings: number                // before any plan limit
  wins:         QuickWin[]
  buyer:        { firstName: string; initials: string; calLink: string }
  onOpenDiagnosis: () => void
  onUpgrade:    () => void
  onRequestCall: () => void
  onFixDone:    (streak: number) => void
}

// ─── Shared styles ───────────────────────────────────────────────────────────
export function DashStyles() {
  return (
    <style>{`
      .ov-wrap   { max-width: 1040px; margin: 0 auto; }
      .ov-card   { background: ${T.surface}; border-radius: ${T.radius}px; box-shadow: ${T.shadow}; }
      .ov-h2     { font: 700 20px/1.2 ${T.head}; letter-spacing: -0.015em; color: ${T.ink}; margin: 0; }
      .ov-row    { width: 100%; display: flex; align-items: center; gap: 14px; padding: 16px 20px; background: none; border: 0; text-align: left; cursor: pointer; font: 400 16px/1.35 ${T.font}; color: ${T.ink}; min-height: 56px; }
      .ov-row:hover { background: ${T.fill}; }
      .ov-sep    { height: 1px; background: ${T.hairline}; margin-left: 20px; }
      .ov-btn    { display: inline-flex; align-items: center; justify-content: center; gap: 6px; font: 600 15px/1 ${T.head}; border-radius: 980px; padding: 12px 20px; border: 0; cursor: pointer; text-decoration: none; white-space: nowrap; min-height: 44px; }
      .ov-btn-primary   { background: ${T.ink}; color: #fff; }
      .ov-btn-primary:hover { background: #3a2a2a; }
      .ov-btn-quiet     { background: ${T.fill}; color: ${T.ink}; }
      .ov-btn-quiet:hover { background: rgba(201,192,177,0.32); }
      .ov-link   { font: 400 15px/1.2 ${T.font}; color: ${T.accent}; background: none; border: 0; padding: 0; cursor: pointer; text-decoration: none; }
      .ov-link:hover { text-decoration: underline; }
      .ov-wrap :focus-visible, .seg :focus-visible { outline: 2px solid ${T.accent}; outline-offset: 2px; border-radius: 8px; }
      .ov-hero   { display: grid; grid-template-columns: 1fr 1fr; }
      .ov-hero > div + div { border-left: 1px solid ${T.hairline}; }
      .ov-two    { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
      .ov-help   { display: flex; align-items: center; gap: 18px; padding: 22px 24px; }
      @media (max-width: 860px) {
        .ov-two  { grid-template-columns: 1fr; }
      }
      @media (max-width: 640px) {
        .ov-hero { grid-template-columns: 1fr; }
        .ov-hero > div + div { border-left: 0; border-top: 1px solid ${T.hairline}; }
        .ov-help { flex-direction: column; align-items: flex-start; }
        .ov-help .ov-btn { width: 100%; }
      }
      .seg       { display: inline-flex; background: rgba(201,192,177,0.3); border-radius: 10px; padding: 2px; max-width: 100%; overflow-x: auto; }
      .seg button { font: 500 14px/1 ${T.font}; color: ${T.ink}; background: none; border: 0; border-radius: 8px; padding: 9px 16px; cursor: pointer; white-space: nowrap; min-height: 36px; }
      .seg button[aria-selected="true"] { background: #fff; font-weight: 600; box-shadow: 0 1px 3px rgba(32,21,21,0.12); }
    `}</style>
  )
}

// ─── Score ring ──────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const size = 132, stroke = 11, r = (size - stroke) / 2, c = 2 * Math.PI * r
  const st = statusOf(score)
  const [shown, setShown] = useState(0)
  useEffect(() => { const t = setTimeout(() => setShown(score), 60); return () => clearTimeout(t) }, [score])
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }} role="img" aria-label={`ICP score ${score} out of 100, ${st.label}`}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(201,192,177,0.35)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={st.ring} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - shown / 100)} style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ font: `700 44px/1 ${T.head}`, letterSpacing: '-0.03em', color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{score}</span>
        <span style={{ font: `400 12px/1 ${T.font}`, color: T.faint, marginTop: 4 }}>out of 100</span>
      </div>
    </div>
  )
}

// ─── Greeting ────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function statusLine(p: OverviewProps, done: number): string {
  const total = p.wins.length
  if (total > 0 && done >= total) return 'All fixes done. Run a new diagnosis to see your new score.'
  if (p.scoreDelta !== null && p.scoreDelta > 0) return `Up ${p.scoreDelta} points since your last diagnosis. Keep going with the next fix.`
  if (p.scoreDelta !== null && p.scoreDelta < 0) return `Down ${Math.abs(p.scoreDelta)} points since last time. The fixes below are where to start.`
  if (total > 0 && done > 0) return `${done} of ${total} fixes done. ${total - done} to go.`
  if (total > 0) return `${total === 1 ? 'One fix' : `${total} fixes`} for this week, most important first.`
  return 'Your diagnosis is ready.'
}

// ─── This week: the fixes ────────────────────────────────────────────────────
function useFixes(p: OverviewProps) {
  const key = `qw_${p.reportId}`
  const [checked, setChecked] = useState<boolean[]>(() => p.wins.map(() => false))
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(key) ?? '[]') as boolean[]
      setChecked(p.wins.map((_, i) => !!stored[i]))
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, p.wins.length])
  const [saving, setSaving] = useState<number | null>(null)
  const [error, setError]   = useState('')

  async function complete(i: number) {
    if (checked[i] || saving !== null) return
    setSaving(i); setError('')
    try {
      const res = await fetch('/api/quick-wins/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: p.email, win_index: i, win_text: p.wins[i]?.action }),
      })
      if (!res.ok) throw new Error()
      const d = await res.json() as { streak?: number }
      setChecked(prev => {
        const next = [...prev]; next[i] = true
        try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* ignore */ }
        return next
      })
      if (typeof d.streak === 'number') p.onFixDone(d.streak)
    } catch {
      setError('Could not save that. Check your connection and try again.')
    } finally { setSaving(null) }
  }
  return { checked, saving, error, complete }
}

function FixList({ p, fx }: { p: OverviewProps; fx: ReturnType<typeof useFixes> }) {
  const [open, setOpen] = useState<number | null>(null)
  const done = fx.checked.filter(Boolean).length
  return (
    <section aria-labelledby="ov-week">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 4px 12px' }}>
        <h2 id="ov-week" className="ov-h2">This week</h2>
        {p.wins.length > 0 && <span style={{ font: `400 15px/1 ${T.font}`, color: T.muted }}>{done} of {p.wins.length} done</span>}
      </div>
      <div className="ov-card" style={{ overflow: 'hidden' }}>
        {p.wins.length === 0 && (
          <p style={{ font: `400 15px/1.5 ${T.font}`, color: T.muted, margin: 0, padding: '20px' }}>
            This report has no fixes listed. Run a new diagnosis to get this week&apos;s three.
          </p>
        )}
        {p.wins.map((w, i) => {
          const isDone = fx.checked[i], isOpen = open === i
          const details = [w.platform, w.where].filter(Boolean).join(', ')
          return (
            <div key={i}>
              {i > 0 && <div className="ov-sep" style={{ marginLeft: 62 }} />}
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <button
                  onClick={() => fx.complete(i)} disabled={isDone || fx.saving !== null}
                  aria-label={isDone ? 'Done' : `Mark as done: ${w.action}`}
                  style={{ width: 62, minHeight: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 0, cursor: isDone ? 'default' : 'pointer', paddingTop: 2 }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', border: isDone ? 'none' : `2px solid ${fx.saving === i ? T.muted : 'rgba(147,144,132,0.6)'}`, background: isDone ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                    {isDone && <Check size={15} color="#fff" strokeWidth={3} />}
                  </span>
                </button>
                <button className="ov-row" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}
                  style={{ paddingLeft: 0, alignItems: 'flex-start', flexDirection: 'column', gap: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%' }}>
                    <span style={{ flex: 1, color: isDone ? T.muted : T.ink, textDecoration: isDone ? 'line-through' : 'none',
                      ...(isOpen ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }) }}>
                      {w.action}
                    </span>
                    <ChevronDown size={18} color={T.muted} style={{ flexShrink: 0, marginTop: 2, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </span>
                  {isOpen && (
                    <span style={{ display: 'block', marginTop: 10, font: `400 14px/1.5 ${T.font}`, color: T.ink2 }}>
                      {details && <span style={{ display: 'block' }}>Where: {details}</span>}
                      {w.effort && <span style={{ display: 'block' }}>Effort: {w.effort}</span>}
                      {w.expectedImpact && <span style={{ display: 'block' }}>Expected result: {w.expectedImpact}</span>}
                      {!details && !w.effort && !w.expectedImpact && <span style={{ color: T.muted }}>No extra detail for this one.</span>}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
      {fx.error && <p role="alert" style={{ font: `400 14px/1.4 ${T.font}`, color: T.bad, margin: '10px 4px 0' }}>{fx.error}</p>}
    </section>
  )
}

// ─── What we found ───────────────────────────────────────────────────────────
function FindingList({ p }: { p: OverviewProps }) {
  const [open, setOpen] = useState<number | null>(null)
  const shown  = p.findings.slice(0, 3)
  const locked = p.tier === 'free' ? Math.max(0, p.totalFindings - p.findings.length) : 0
  return (
    <section aria-labelledby="ov-found">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 4px 12px' }}>
        <h2 id="ov-found" className="ov-h2">What we found</h2>
        <button className="ov-link" onClick={p.onOpenDiagnosis}>Full diagnosis</button>
      </div>
      <div className="ov-card" style={{ overflow: 'hidden' }}>
        {shown.length === 0 && (
          <p style={{ font: `400 15px/1.5 ${T.font}`, color: T.muted, margin: 0, padding: '20px' }}>No findings in this report.</p>
        )}
        {shown.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={i}>
              {i > 0 && <div className="ov-sep" style={{ marginLeft: 44 }} />}
              <button className="ov-row" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 0 }}>
                <span style={{ display: 'flex', alignItems: 'flex-start', gap: 14, width: '100%' }}>
                  <span aria-hidden style={{ width: 10, height: 10, borderRadius: '50%', background: sevColor(f.severity), flexShrink: 0, marginTop: 6 }} />
                  <span style={{ flex: 1, fontWeight: 500 }}>
                    {f.title}
                    <span style={{ display: 'block', font: `400 13px/1.3 ${T.font}`, color: T.muted, marginTop: 3 }}>{f.severity}</span>
                  </span>
                  <ChevronDown size={18} color={T.muted} style={{ flexShrink: 0, marginTop: 2, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </span>
                {isOpen && (
                  <span style={{ display: 'block', margin: '10px 0 0 24px', font: `400 14px/1.55 ${T.font}`, color: T.ink2, maxWidth: '62ch' }}>{f.explanation}</span>
                )}
              </button>
            </div>
          )
        })}
        {locked > 0 && (
          <>
            <div className="ov-sep" style={{ marginLeft: 44 }} />
            <button className="ov-row" onClick={p.onUpgrade}>
              <Lock size={16} color={T.muted} style={{ flexShrink: 0, marginLeft: -3 }} />
              <span style={{ flex: 1, color: T.ink2 }}>{locked} more {locked === 1 ? 'finding' : 'findings'} on Starter</span>
              <ChevronRight size={18} color={T.muted} />
            </button>
          </>
        )}
      </div>
    </section>
  )
}

// ─── Eugene ──────────────────────────────────────────────────────────────────
function HelpCard({ p }: { p: OverviewProps }) {
  const b = p.buyer
  const byTier: Record<string, { title: string; body: string; cta: React.ReactNode }> = {
    free: {
      title: `Talk it through with ${b.firstName}`,
      body:  'A free 20-minute call to go over these results and what to fix first.',
      cta:   <a className="ov-btn ov-btn-primary" href={`/report/${p.reportId}#book-call`}>Request your free call</a>,
    },
    starter: {
      title: `Want ${b.firstName} to run this with you?`,
      body:  'Tell him what you need help with and he will reply by email.',
      cta:   <button className="ov-btn ov-btn-primary" onClick={p.onRequestCall}>Message {b.firstName}</button>,
    },
    pro: {
      title: `Your onboarding call with ${b.firstName}`,
      body:  'Included in Pro. He reads your diagnosis first, so the call goes straight to priorities.',
      cta:   <a className="ov-btn ov-btn-primary" href={b.calLink} target="_blank" rel="noopener noreferrer">Book your call</a>,
    },
    agency: {
      title: `Your monthly call with ${b.firstName}`,
      body:  'Included in Agency. Bring the accounts you want to go through.',
      cta:   <a className="ov-btn ov-btn-primary" href={b.calLink} target="_blank" rel="noopener noreferrer">Book this month&apos;s call</a>,
    },
  }
  const c = byTier[p.tier] ?? byTier.free
  return (
    <section className="ov-card ov-help" aria-label={`Work with ${b.firstName}`}>
      <span aria-hidden style={{ width: 52, height: 52, borderRadius: '50%', background: T.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: `700 18px/1 ${T.head}`, flexShrink: 0 }}>{b.initials}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ font: `700 17px/1.3 ${T.head}`, color: T.ink, margin: '0 0 3px', letterSpacing: '-0.01em' }}>{c.title}</p>
        <p style={{ font: `400 15px/1.45 ${T.font}`, color: T.muted, margin: 0, maxWidth: '58ch' }}>{c.body}</p>
      </div>
      {c.cta}
    </section>
  )
}

// ─── Overview ────────────────────────────────────────────────────────────────
export default function Overview(p: OverviewProps) {
  const fx   = useFixes(p)
  const done = fx.checked.filter(Boolean).length
  const st   = p.score !== null ? statusOf(p.score) : null

  return (
    <div className="ov-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 32, fontFamily: T.font }}>

      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ font: `700 clamp(28px,4.5vw,34px)/1.1 ${T.head}`, letterSpacing: '-0.025em', color: T.ink, margin: '0 0 8px' }}>
            {greeting()}, {p.firstName}
          </h1>
          <p style={{ font: `400 17px/1.4 ${T.font}`, color: T.muted, margin: 0 }}>{statusLine(p, done)}</p>
        </div>
      </header>

      {/* Where you stand */}
      <section className="ov-card ov-hero" aria-label="Where you stand">
        <div style={{ padding: '28px', display: 'flex', alignItems: 'center', gap: 24 }}>
          {p.score !== null ? <ScoreRing score={p.score} /> : null}
          <div style={{ minWidth: 0 }}>
            <p style={{ font: `400 15px/1.2 ${T.font}`, color: T.muted, margin: '0 0 6px' }}>ICP score</p>
            {st
              ? <p style={{ font: `700 24px/1.15 ${T.head}`, letterSpacing: '-0.02em', color: st.color, margin: '0 0 8px' }}>{st.label}</p>
              : <p style={{ font: `700 20px/1.2 ${T.head}`, color: T.ink, margin: '0 0 8px' }}>No score in this report</p>}
            <p style={{ font: `400 14px/1.45 ${T.font}`, color: T.muted, margin: 0 }}>
              {p.scoreDelta !== null && p.scoreDelta !== 0 && p.prevDate
                ? <><span style={{ color: p.scoreDelta > 0 ? T.good : T.bad, fontWeight: 600 }}>{p.scoreDelta > 0 ? '+' : ''}{p.scoreDelta}</span> since {p.prevDate}</>
                : p.scoreDelta === 0 && p.prevDate
                  ? <>No change since {p.prevDate}</>
                  : <>Diagnosed {p.reportDate}</>}
            </p>
          </div>
        </div>
        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ font: `400 15px/1.2 ${T.font}`, color: T.muted, margin: '0 0 6px' }}>Estimated monthly waste</p>
          <p style={{ font: `700 clamp(28px,4vw,36px)/1.1 ${T.head}`, letterSpacing: '-0.025em', color: T.ink, margin: '0 0 8px', fontVariantNumeric: 'tabular-nums' }}>
            {p.wasteLabel ?? 'Not estimated'}
          </p>
          <p style={{ font: `400 14px/1.45 ${T.font}`, color: T.muted, margin: 0, maxWidth: '40ch' }}>
            {p.wasteLabel
              ? 'An estimate from your answers, not a measured figure.'
              : 'Add your monthly ad spend in a new diagnosis to get an estimate.'}
          </p>
        </div>
      </section>

      <div className="ov-two">
        <FixList p={p} fx={fx} />
        <FindingList p={p} />
      </div>

      <HelpCard p={p} />
    </div>
  )
}

// ─── Notice: the one message allowed above the overview ─────────────────────
export function Notice({ title, body, action }: { title: string; body: string; action: React.ReactNode }) {
  return (
    <div className="ov-card ov-help" style={{ padding: '18px 22px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ font: `700 16px/1.3 ${T.head}`, color: T.ink, margin: '0 0 3px' }}>{title}</p>
        <p style={{ font: `400 14px/1.45 ${T.font}`, color: T.muted, margin: 0, maxWidth: '70ch' }}>{body}</p>
      </div>
      {action}
    </div>
  )
}

// ─── Segmented control (used by Diagnosis) ───────────────────────────────────
export function Segmented<V extends string>({ value, options, onChange, label }: {
  value: V; options: { value: V; label: string }[]; onChange: (v: V) => void; label: string
}) {
  return (
    <div className="seg" role="tablist" aria-label={label}>
      {options.map(o => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  )
}
