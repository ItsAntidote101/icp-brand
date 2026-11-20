'use client'

// The dashboard overview. One screen that answers, in order:
//   1. Where do I stand?          (score and estimated waste)
//   2. What do I do this week?    (three fixes, most important first)
//   3. What did you find?         (top findings, one line each)
//   4. Who can help me?           (Eugene)
// Everything else lives in Diagnosis, Market and Progress.

import React, { useEffect, useState } from 'react'
import { Check, ChevronRight, Lock } from 'lucide-react'
import { leadCostChange } from '@/lib/progress'

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
  onOpenMarket:    () => void
  onUpgrade:    () => void
  onRequestCall: () => void
  onFixDone:    (streak: number) => void
  currency:     string
  fixesTotal:   number                 // every fix ever marked done, not only this report
  firstScore:   number | null          // score of their very first diagnosis
}

// ─── Shared styles ───────────────────────────────────────────────────────────
export function DashStyles() {
  // Set as raw HTML so quotes in the CSS are identical on server and browser
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      .ov-wrap   { max-width: 1040px; margin: 0 auto; }
      .ov-card   { background: ${T.surface}; border-radius: ${T.radius}px; box-shadow: ${T.shadow}; }
      .ov-h2     { font: 700 20px/1.2 ${T.head}; letter-spacing: -0.015em; color: ${T.ink}; margin: 0; }
      .ov-row    { width: 100%; display: flex; align-items: center; gap: 14px; padding: 16px 20px; background: none; border: 0; text-align: left; cursor: pointer; font: 400 16px/1.35 ${T.font}; color: ${T.ink}; min-height: 56px; }
      .ov-item   { transition: background 0.15s; }
      @media (hover: hover) { .ov-item:hover { background: rgba(201,192,177,0.10); } }
      .ov-item:active { background: rgba(201,192,177,0.16); }
      .ov-item[data-open="true"] { background: none; }
      .ov-chev   { flex-shrink: 0; margin-top: 3px; color: ${T.faint}; transition: transform 0.25s cubic-bezier(0.2,0.8,0.2,1); }
      .ov-item[data-open="true"] .ov-chev { transform: rotate(90deg); }
      .ov-disc   { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.3s cubic-bezier(0.2,0.8,0.2,1); }
      .ov-item[data-open="true"] .ov-disc { grid-template-rows: 1fr; }
      .ov-disc > div { overflow: hidden; min-height: 0; }
      .ov-detail { padding: 0 20px 18px; font: 400 14px/1.55 ${T.font}; color: ${T.ink2}; max-width: 64ch; }
      .ov-detail p { margin: 0 0 10px; }
      .ov-detail dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; }
      .ov-detail dt { color: ${T.faint}; white-space: nowrap; }
      .ov-detail dd { margin: 0; color: ${T.ink}; }
      .num-grid  { display: grid; grid-template-columns: 1.1fr 1fr; }
      .num-grid > div + div { border-left: 1px solid ${T.hairline}; }
      .num-field { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 0 20px; min-height: 56px; }
      .num-field label { font: 400 16px/1.3 ${T.font}; color: ${T.ink}; }
      .num-field input { width: 46%; min-width: 0; text-align: right; font: 400 17px/1.2 ${T.font}; color: ${T.ink}; background: none; border: 0; padding: 10px 0; font-variant-numeric: tabular-nums; }
      .num-field input::placeholder { color: ${T.faint}; }
      .num-field input:focus { outline: none; }
      .num-field:focus-within { background: rgba(201,192,177,0.10); }
      .num-bars  { display: flex; align-items: flex-end; gap: 6px; height: 64px; }
      .num-bars span { flex: 1; min-width: 6px; max-width: 28px; border-radius: 5px 5px 2px 2px; background: rgba(201,192,177,0.55); }
      .num-bars span[data-latest="true"] { background: ${T.ink}; }
      @media (max-width: 640px) {
        .num-grid { grid-template-columns: 1fr; }
        .num-grid > div + div { border-left: 0; border-top: 1px solid ${T.hairline}; }
      }
      .ov-clamp  { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
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
    ` }} />
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

// A long instruction becomes a short row title plus the full text in the detail.
function splitTitle(text: string, max = 84): { title: string; rest: string } {
  const t = (text ?? '').trim()
  if (t.length <= max) return { title: t, rest: '' }
  const stop = t.slice(0, max + 20).search(/[.:;](\s|$)/)
  if (stop > 24) return { title: t.slice(0, stop), rest: t }
  const cutAt = t.lastIndexOf(' ', max)
  return { title: t.slice(0, cutAt > 24 ? cutAt : max) + '…', rest: t }
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
          const { title, rest } = splitTitle(w.action)
          const where = [w.platform, w.where].filter(Boolean).join(', ')
          return (
            <div key={i} className="ov-item" data-open={isOpen}>
              {i > 0 && <div className="ov-sep" style={{ marginLeft: 62 }} />}
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <button
                  onClick={() => fx.complete(i)} disabled={isDone || fx.saving !== null}
                  aria-label={isDone ? 'Done' : `Mark as done: ${title}`}
                  style={{ width: 62, minHeight: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 0, cursor: isDone ? 'default' : 'pointer' }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', border: isDone ? 'none' : `2px solid ${fx.saving === i ? T.muted : 'rgba(147,144,132,0.6)'}`, background: isDone ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                    {isDone && <Check size={15} color="#fff" strokeWidth={3} />}
                  </span>
                </button>
                <button className="ov-row" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} style={{ paddingLeft: 0, alignItems: 'flex-start', gap: 10 }}>
                  <span className="ov-clamp" style={{ flex: 1, color: isDone ? T.faint : T.ink, textDecoration: isDone ? 'line-through' : 'none' }}>{title}</span>
                  <ChevronRight size={18} className="ov-chev" />
                </button>
              </div>
              <div className="ov-disc" aria-hidden={!isOpen}>
                <div>
                  <div className="ov-detail" style={{ paddingLeft: 62 }}>
                    {rest && <p>{rest}</p>}
                    {(where || w.effort || w.expectedImpact) ? (
                      <dl>
                        {where && <><dt>Where</dt><dd>{where}</dd></>}
                        {w.effort && <><dt>Effort</dt><dd>{w.effort}</dd></>}
                        {w.expectedImpact && <><dt>Result</dt><dd>{w.expectedImpact}</dd></>}
                      </dl>
                    ) : !rest ? <p style={{ color: T.faint, margin: 0 }}>No extra detail for this one.</p> : null}
                  </div>
                </div>
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
            <div key={i} className="ov-item" data-open={isOpen}>
              {i > 0 && <div className="ov-sep" style={{ marginLeft: 44 }} />}
              <button className="ov-row" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} style={{ alignItems: 'flex-start' }}>
                <span aria-hidden style={{ width: 10, height: 10, borderRadius: '50%', background: sevColor(f.severity), flexShrink: 0, marginTop: 6 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="ov-clamp" style={{ fontWeight: 500 }}>{f.title}</span>
                  <span style={{ display: 'block', font: `400 13px/1.3 ${T.font}`, color: T.faint, marginTop: 3 }}>{f.severity}</span>
                </span>
                <ChevronRight size={18} className="ov-chev" />
              </button>
              <div className="ov-disc" aria-hidden={!isOpen}>
                <div><div className="ov-detail" style={{ paddingLeft: 44 }}><p style={{ margin: 0 }}>{f.explanation}</p></div></div>
              </div>
            </div>
          )
        })}
        {locked > 0 && (
          <>
            <div className="ov-sep" style={{ marginLeft: 44 }} />
            <button className="ov-row ov-item" onClick={p.onUpgrade}>
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

// ─── A note from the media buyer ─────────────────────────────────────────────
// Written (or edited and approved) by Eugene each month. This is what turns
// numbers into advice, and the reply box is the client's line to him.
type Note = { id: string; body: string; media_url: string | null; sent_at: string }

function NoteCard({ buyer }: { buyer: OverviewProps['buyer'] }) {
  const [note, setNote]     = useState<Note | null>(null)
  const [open, setOpen]     = useState(false)
  const [reply, setReply]   = useState('')
  const [state, setState]   = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError]   = useState('')

  useEffect(() => {
    fetch('/api/buyer-note').then(r => r.ok ? r.json() : null).then((j: { note?: Note } | null) => setNote(j?.note ?? null)).catch(() => {})
  }, [])
  if (!note) return null

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!note || reply.trim().length < 2) return
    setState('sending'); setError('')
    try {
      const res = await fetch('/api/buyer-note/reply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ noteId: note.id, message: reply }) })
      const j = await res.json() as { error?: string }
      if (!res.ok) throw new Error(j.error ?? 'Could not send your reply')
      setState('sent'); setReply('')
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not send your reply'); setState('idle') }
  }

  const date = new Date(note.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
  return (
    <section className="ov-card" aria-label={`A note from ${buyer.firstName}`} style={{ padding: 'clamp(20px,3vw,26px) clamp(20px,3vw,28px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <span aria-hidden style={{ width: 40, height: 40, borderRadius: '50%', background: T.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: `700 14px/1 ${T.head}`, flexShrink: 0 }}>{buyer.initials}</span>
        <div>
          <p style={{ font: `700 16px/1.25 ${T.head}`, color: T.ink, margin: 0 }}>A note from {buyer.firstName}</p>
          <p style={{ font: `400 13px/1.3 ${T.font}`, color: T.faint, margin: '2px 0 0' }}>{date}</p>
        </div>
      </div>
      <p style={{ font: `400 16px/1.6 ${T.font}`, color: T.ink, margin: 0, whiteSpace: 'pre-wrap', maxWidth: '68ch' }}>{note.body}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
        {note.media_url && <a className="ov-btn ov-btn-quiet" href={note.media_url} target="_blank" rel="noopener noreferrer">Play {buyer.firstName}&apos;s recording</a>}
        {state === 'sent'
          ? <p role="status" style={{ font: `400 15px/1.4 ${T.font}`, color: T.good, margin: 0, alignSelf: 'center' }}>Sent. {buyer.firstName} will reply by email.</p>
          : !open && <button className="ov-btn ov-btn-quiet" onClick={() => setOpen(true)}>Reply to {buyer.firstName}</button>}
      </div>

      {open && state !== 'sent' && (
        <form onSubmit={send} style={{ marginTop: 14 }}>
          <textarea aria-label={`Your reply to ${buyer.firstName}`} value={reply} onChange={e => setReply(e.target.value)} maxLength={2000} autoFocus
            placeholder="Ask a question or tell him what happened"
            style={{ width: '100%', minHeight: 96, resize: 'vertical', boxSizing: 'border-box', border: `1px solid ${T.hairline}`, borderRadius: 14, padding: '12px 14px', font: `400 16px/1.5 ${T.font}`, color: T.ink, background: 'rgba(201,192,177,0.10)' }} />
          {error && <p role="alert" style={{ font: `400 14px/1.4 ${T.font}`, color: T.bad, margin: '8px 0 0' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button type="submit" className="ov-btn ov-btn-primary" disabled={state === 'sending' || reply.trim().length < 2}>{state === 'sending' ? 'Sending' : 'Send reply'}</button>
            <button type="button" className="ov-btn ov-btn-quiet" onClick={() => { setOpen(false); setError('') }}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  )
}

// ─── Your numbers: the weekly check-in ───────────────────────────────────────
// The reason to come back each week. The Monday email asks for last week's
// spend, leads and sales; saving them shows cost per lead and how it moved.
type Week = { week_start: string; spend: number; currency: string; leads: number; sales: number }

const money = (n: number, cur: string) => `${cur} ${Math.round(n).toLocaleString()}`
const cplOf = (w?: Week) => w && w.leads > 0 ? w.spend / w.leads : null

function NumbersCard({ currency, onWeeks }: { currency: string; onWeeks: (w: Week[]) => void }) {
  const [weeks, setWeeks]   = useState<Week[] | null>(null)
  const [due, setDue]       = useState<{ week: string; label: string } | null>(null)
  const [editing, setEdit]  = useState(false)
  const [form, setForm]     = useState({ spend: '', leads: '', sales: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const ref = React.useRef<HTMLElement>(null)

  async function load() {
    try {
      const res = await fetch('/api/weekly-checkin')
      if (!res.ok) throw new Error()
      const j = await res.json() as { weeks: Week[]; dueWeek: string; dueLabel: string }
      setWeeks(j.weeks ?? []); setDue({ week: j.dueWeek, label: j.dueLabel }); onWeeks(j.weeks ?? [])
    } catch { setWeeks([]); onWeeks([]) }
  }
  useEffect(() => { load() }, [])

  // The Monday email links here with ?checkin=1
  useEffect(() => {
    if (!weeks || typeof window === 'undefined') return
    if (new URLSearchParams(window.location.search).get('checkin') !== '1') return
    ref.current?.scrollIntoView({ block: 'center' })
    ref.current?.querySelector('input')?.focus()
  }, [weeks])

  if (weeks === null || !due) return <section className="ov-card" aria-busy="true" style={{ minHeight: 148 }} />

  const latest  = weeks[0]
  const logged  = latest?.week_start === due.week
  const showForm = !logged || editing
  const num = (v: string) => Number(v.replace(/[^0-9.]/g, ''))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (form.spend.trim() === '' || form.leads.trim() === '') { setError('Add your ad spend and your leads. Use 0 if there were none.'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/weekly-checkin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spend: num(form.spend), leads: Math.round(num(form.leads)), sales: Math.round(num(form.sales || '0')), currency }),
      })
      const j = await res.json() as { error?: string }
      if (!res.ok) throw new Error(j.error ?? 'Could not save your numbers')
      setEdit(false); await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your numbers')
    } finally { setSaving(false) }
  }

  function startEdit() {
    if (latest && logged) setForm({ spend: String(latest.spend), leads: String(latest.leads), sales: String(latest.sales) })
    setEdit(true)
  }

  if (showForm) {
    const fields: { key: 'spend' | 'leads' | 'sales'; label: string; hint: string; mode: 'decimal' | 'numeric' }[] = [
      { key: 'spend', label: `Ad spend (${currency})`, hint: '0', mode: 'decimal' },
      { key: 'leads', label: 'Leads',                  hint: '0', mode: 'numeric' },
      { key: 'sales', label: 'Sales closed',           hint: 'Optional', mode: 'numeric' },
    ]
    const prev = cplOf(latest && !logged ? latest : weeks[1])
    return (
      <section ref={ref} aria-labelledby="ov-numbers">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, margin: '0 4px 12px' }}>
          <h2 id="ov-numbers" className="ov-h2">Last week&apos;s numbers</h2>
          <span style={{ font: `400 15px/1 ${T.font}`, color: T.muted, whiteSpace: 'nowrap' }}>{due.label}</span>
        </div>
        <form className="ov-card" onSubmit={save} style={{ overflow: 'hidden' }}>
          {fields.map((f, i) => (
            <div key={f.key}>
              {i > 0 && <div className="ov-sep" />}
              <div className="num-field">
                <label htmlFor={`num-${f.key}`}>{f.label}</label>
                <input id={`num-${f.key}`} inputMode={f.mode} autoComplete="off" placeholder={f.hint}
                  value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            </div>
          ))}
          <div className="ov-sep" style={{ marginLeft: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '14px 20px', flexWrap: 'wrap' }}>
            <p style={{ font: `400 14px/1.45 ${T.font}`, color: error ? T.bad : T.muted, margin: 0, flex: '1 1 200px' }} role={error ? 'alert' : undefined}>
              {error || (prev !== null && latest
                ? `Last time: ${money(prev, latest.currency)} per lead. Save to see how last week compares.`
                : 'About 30 seconds. Save to see your cost per lead.')}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {editing && <button type="button" className="ov-btn ov-btn-quiet" onClick={() => { setEdit(false); setError('') }}>Cancel</button>}
              <button type="submit" className="ov-btn ov-btn-primary" disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving' : 'Save numbers'}</button>
            </div>
          </div>
        </form>
      </section>
    )
  }

  // Logged: show the result
  const cpl   = cplOf(latest)
  const prior = weeks[1]?.currency === latest.currency ? cplOf(weeks[1]) : null
  const pct   = cpl !== null && prior !== null && prior > 0 ? Math.round(((cpl - prior) / prior) * 100) : null
  const series = weeks.filter(w => w.currency === latest.currency).slice(0, 8).reverse()
  const maxCpl = Math.max(...series.map(w => cplOf(w) ?? 0), 1)
  const perSale = latest.sales > 0 ? latest.spend / latest.sales : null

  return (
    <section ref={ref} aria-labelledby="ov-numbers">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, margin: '0 4px 12px' }}>
        <h2 id="ov-numbers" className="ov-h2">Last week&apos;s numbers</h2>
        <button className="ov-link" onClick={startEdit}>Edit</button>
      </div>
      <div className="ov-card num-grid">
        <div style={{ padding: '24px 28px' }}>
          <p style={{ font: `400 15px/1.2 ${T.font}`, color: T.muted, margin: '0 0 6px' }}>Cost per lead, {due.label}</p>
          <p style={{ font: `700 clamp(28px,4vw,36px)/1.1 ${T.head}`, letterSpacing: '-0.025em', color: T.ink, margin: '0 0 8px', fontVariantNumeric: 'tabular-nums' }}>
            {cpl !== null ? money(cpl, latest.currency) : 'No leads'}
          </p>
          <p style={{ font: `400 14px/1.45 ${T.font}`, color: T.muted, margin: 0 }}>
            {cpl === null
              ? `${money(latest.spend, latest.currency)} spent with no leads. Start with the first fix below.`
              : pct === null
                ? 'First week logged. Add next week on Monday to see the change.'
                : pct === 0
                  ? 'Same as the week before.'
                  : <><span style={{ color: pct < 0 ? T.good : T.warn, fontWeight: 600 }}>{pct < 0 ? 'Down' : 'Up'} {Math.abs(pct)}%</span> on the week before{pct < 0 ? '. Lower is better.' : '.'}</>}
          </p>
        </div>
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
          <p style={{ font: `400 15px/1.5 ${T.font}`, color: T.ink2, margin: 0 }}>
            {money(latest.spend, latest.currency)} spent, {latest.leads} {latest.leads === 1 ? 'lead' : 'leads'}
            {latest.sales > 0 && <>, {latest.sales} {latest.sales === 1 ? 'sale' : 'sales'}{perSale !== null && <> ({money(perSale, latest.currency)} per sale)</>}</>}
          </p>
          {series.length > 1 && (
            <div>
              <div className="num-bars" role="img" aria-label={`Cost per lead over the last ${series.length} weeks`}>
                {series.map((w, i) => {
                  const v = cplOf(w)
                  return <span key={w.week_start} data-latest={i === series.length - 1} title={v !== null ? money(v, w.currency) : 'No leads'} style={{ height: `${Math.max(6, ((v ?? 0) / maxCpl) * 100)}%` }} />
                })}
              </div>
              <p style={{ font: `400 12px/1.3 ${T.font}`, color: T.faint, margin: '6px 0 0' }}>Cost per lead, last {series.length} weeks</p>
            </div>
          )}
        </div>
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

// ─── This week in your market: one line, the rest lives in the Market tab ────
function MarketRow({ email, onOpen }: { email: string; onOpen: () => void }) {
  const [top, setTop] = useState<{ title: string; kind: string } | null>(null)
  useEffect(() => {
    let live = true
    fetch('/api/intelligence/research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, type: 'fetch' }) })
      .then(r => (r.ok ? r.json() : null))
      .then((d: { briefing?: { version?: number; items?: { title: string; kind: string }[] } } | null) => {
        const b = d?.briefing
        if (live && b?.version === 2 && b.items?.[0]) setTop(b.items[0])
      }).catch(() => {})
    return () => { live = false }
  }, [email])
  if (!top) return null
  return (
    <button className="ov-card ov-row ov-item" onClick={onOpen} style={{ borderRadius: T.radius, alignItems: 'flex-start' }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', font: `400 13px/1.3 ${T.font}`, color: T.faint, marginBottom: 3 }}>This week in your market</span>
        <span className="ov-clamp" style={{ fontWeight: 500 }}>{top.title}</span>
      </span>
      <ChevronRight size={18} color={T.faint} style={{ marginTop: 10 }} />
    </button>
  )
}

// ─── Since you started: the reason to stay ───────────────────────────────────
// Only real movement is shown. With fewer than two usable weeks there is
// nothing honest to say yet, so the card stays hidden.
function ProofCard({ p, weeks, doneNow }: { p: OverviewProps; weeks: Week[]; doneNow: number }) {
  const c = leadCostChange(weeks)
  if (!c) return null
  const fixes  = Math.max(p.fixesTotal, doneNow)
  const points = p.score !== null && p.firstScore !== null ? p.score - p.firstScore : 0
  const better = c.pct <= -3, worse = c.pct >= 3
  return (
    <section aria-labelledby="ov-proof">
      <div style={{ margin: '0 4px 12px' }}><h2 id="ov-proof" className="ov-h2">Since you started tracking</h2></div>
      <div className="ov-card" style={{ padding: '24px 28px' }}>
        <p style={{ font: `400 15px/1.2 ${T.font}`, color: T.muted, margin: '0 0 8px' }}>{c.averaged ? 'Cost per lead, first two weeks against the last two' : 'Cost per lead, first week against the latest'}</p>
        <p style={{ font: `700 clamp(24px,3.6vw,32px)/1.15 ${T.head}`, letterSpacing: '-0.02em', color: T.ink, margin: '0 0 8px', fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ color: T.faint, fontWeight: 500 }}>{money(c.from, c.currency)}</span>
          <span aria-hidden style={{ color: T.faint, fontWeight: 400 }}> to </span>
          <span className="sr-only">now </span>{money(c.to, c.currency)}
        </p>
        <p style={{ font: `400 15px/1.5 ${T.font}`, color: T.ink2, margin: 0, maxWidth: '62ch' }}>
          {better ? <><span style={{ color: T.good, fontWeight: 600 }}>{Math.abs(c.pct)}% cheaper</span> per lead</> : worse ? <><span style={{ color: T.warn, fontWeight: 600 }}>{c.pct}% higher</span> per lead</> : <>Holding steady</>}
          {' '}over {c.weeks} weeks, with {c.leads.toLocaleString()} leads logged
          {fixes > 0 && <> and {fixes} {fixes === 1 ? 'fix' : 'fixes'} done</>}
          {points > 0 && <>. Your ICP score is up {points} {points === 1 ? 'point' : 'points'}</>}.
          {worse && <> The fixes below are aimed at bringing this back down.</>}
        </p>
      </div>
    </section>
  )
}

// ─── Your first week ─────────────────────────────────────────────────────────
// A short guided start for a new paying client. Each step ticks itself off
// from real activity where it can, and the list goes away once all are done.
function FirstWeek({ p, hasNumbers, hasFix }: { p: OverviewProps; hasNumbers: boolean; hasFix: boolean }) {
  const key = `first_week_${p.email}`
  const [local, setLocal] = useState<{ hello?: boolean; call?: boolean; hidden?: boolean } | null>(null)
  useEffect(() => { try { setLocal(JSON.parse(localStorage.getItem(key) ?? '{}')) } catch { setLocal({}) } }, [key])
  if (!local || local.hidden) return null
  const mark = (patch: Partial<NonNullable<typeof local>>) => {
    const next = { ...local, ...patch }
    setLocal(next)
    try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* ignore */ }
  }
  const b = p.buyer.firstName
  const hasCall = p.tier === 'pro' || p.tier === 'agency'
  const steps: { done: boolean; label: string; hint: string; act: React.ReactNode }[] = [
    { done: !!local.hello, label: `Tell ${b} your main goal`, hint: 'One line is enough. It shapes the advice you get.',
      act: <button className="ov-link" onClick={() => { window.dispatchEvent(new Event('icp-chat-eugene')); mark({ hello: true }) }}>Write</button> },
    { done: hasNumbers, label: 'Log last week\u2019s numbers', hint: 'Ad spend and leads. This is how your progress is measured.',
      act: <button className="ov-link" onClick={() => document.getElementById('ov-numbers')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Add</button> },
    { done: hasFix, label: 'Do your first fix', hint: 'Start with the top one under This week.',
      act: <button className="ov-link" onClick={() => document.getElementById('ov-week')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Show me</button> },
    ...(hasCall ? [{ done: !!local.call, label: `Book your call with ${b}`, hint: p.tier === 'pro' ? 'Your onboarding call is included in Pro.' : 'Your monthly call is included in Agency.',
      act: <a className="ov-link" href={p.buyer.calLink} target="_blank" rel="noopener noreferrer" onClick={() => mark({ call: true })}>Book</a> }] : []),
  ]
  const left = steps.filter(s => !s.done).length
  if (left === 0) return null
  return (
    <section aria-labelledby="ov-first">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, margin: '0 4px 12px' }}>
        <h2 id="ov-first" className="ov-h2">Your first week</h2>
        <span style={{ font: `400 15px/1 ${T.font}`, color: T.muted, whiteSpace: 'nowrap' }}>{steps.length - left} of {steps.length} done</span>
      </div>
      <div className="ov-card" style={{ overflow: 'hidden' }}>
        {steps.map((s, i) => (
          <div key={s.label}>
            {i > 0 && <div className="ov-sep" style={{ marginLeft: 62 }} />}
            <div style={{ display: 'flex', alignItems: 'center', minHeight: 60, paddingRight: 20 }}>
              <span aria-hidden style={{ width: 62, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', border: s.done ? 'none' : '2px solid rgba(147,144,132,0.6)', background: s.done ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.done && <Check size={15} color="#fff" strokeWidth={3} />}
                </span>
              </span>
              <span style={{ flex: 1, minWidth: 0, padding: '12px 0' }}>
                <span style={{ display: 'block', font: `400 16px/1.35 ${T.font}`, color: s.done ? T.faint : T.ink, textDecoration: s.done ? 'line-through' : 'none' }}>{s.label}<span className="sr-only">{s.done ? ', done' : ''}</span></span>
                {!s.done && <span style={{ display: 'block', font: `400 13px/1.4 ${T.font}`, color: T.faint, marginTop: 2 }}>{s.hint}</span>}
              </span>
              {!s.done && s.act}
            </div>
          </div>
        ))}
      </div>
      <button className="ov-link" style={{ margin: '10px 4px 0', fontSize: 13, color: T.faint }} onClick={() => mark({ hidden: true })}>Hide this list</button>
    </section>
  )
}

// ─── Overview ────────────────────────────────────────────────────────────────
export default function Overview(p: OverviewProps) {
  const fx   = useFixes(p)
  const done = fx.checked.filter(Boolean).length
  const st   = p.score !== null ? statusOf(p.score) : null
  const [weeks, setWeeks] = useState<Week[] | null>(null)

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

      {p.tier !== 'free' && <NoteCard buyer={p.buyer} />}

      {p.tier !== 'free' && weeks && <FirstWeek p={p} hasNumbers={weeks.length > 0} hasFix={p.fixesTotal + done > 0} />}

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

      <NumbersCard currency={p.currency} onWeeks={setWeeks} />

      {weeks && <ProofCard p={p} weeks={weeks} doneNow={done} />}

      {p.tier !== 'free' && <MarketRow email={p.email} onOpen={p.onOpenMarket} />}

      <div className="ov-two">
        <FixList p={p} fx={fx} />
        <FindingList p={p} />
      </div>

      {p.tier === 'free' && (
        <button className="ov-card ov-row ov-item" onClick={p.onUpgrade} style={{ borderRadius: T.radius }}>
          <Lock size={16} color={T.faint} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, color: T.ink2 }}>Paid plans include {p.buyer.firstName}&apos;s monthly note on your numbers</span>
          <ChevronRight size={18} color={T.faint} />
        </button>
      )}

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
