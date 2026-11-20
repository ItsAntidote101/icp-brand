'use client'

// "Done with you": ask the media buyer to do a hands-on job together.
// Included on Pro (one a month) and Agency. Each request lands in the control
// room's Today queue and in his inbox.
import { useEffect, useState } from 'react'
import { ChevronRight, Lock } from 'lucide-react'
import { T } from './overview'
import { JOBS, monthlyLimit, type JobId } from '@/lib/hands-on'

type State = { limit: number; used: number; requests: { id: string; job: string; open: boolean; at: string }[] }
const TIMES = ['Weekday morning', 'Weekday afternoon', 'Weekday evening', 'Saturday']

export default function HandsOnCard({ tier, buyerName, onUpgrade }: { tier: string; buyerName: string; onUpgrade: () => void }) {
  const included = tier === 'pro' || tier === 'agency'
  const [state, setState] = useState<State | null>(null)
  const [open, setOpen]   = useState<JobId | null>(null)
  const [tools, setTools] = useState('')
  const [phone, setPhone] = useState('')
  const [time, setTime]   = useState(TIMES[0])
  const [notes, setNotes] = useState('')
  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState('')
  const [sentJob, setSentJob] = useState('')

  useEffect(() => {
    if (!included) return
    let live = true
    fetch('/api/hands-on').then(r => (r.ok ? r.json() : null)).then((d: State | null) => { if (live && d) setState(d) }).catch(() => {})
    return () => { live = false }
  }, [included])

  async function send(job: JobId) {
    if (busy) return
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/hands-on', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job, tools, whatsapp: phone, preferredTime: time, notes }) })
      const d = await res.json().catch(() => ({})) as Partial<State> & { error?: string }
      if (!res.ok) throw new Error(d.error || 'Could not send that. Please try again.')
      if (typeof d.used === 'number') setState({ limit: d.limit ?? monthlyLimit(tier), used: d.used, requests: d.requests ?? [] })
      setSentJob(JOBS.find(j => j.id === job)?.title ?? ''); setOpen(null); setTools(''); setNotes('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send that. Please try again.')
    } finally { setBusy(false) }
  }

  const head = (right: string) => (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 4px 12px' }}>
      <h2 id="ov-hands" className="ov-h2">Done with you</h2>
      {right && <span style={{ font: `400 15px/1 ${T.font}`, color: T.muted }}>{right}</span>}
    </div>
  )

  if (!included) {
    return (
      <section aria-labelledby="ov-hands">
        {head('On Pro')}
        <button className="ov-card ov-row ov-item" onClick={onUpgrade} style={{ borderRadius: T.radius, alignItems: 'flex-start', width: '100%' }}>
          <Lock size={15} color={T.faint} style={{ flexShrink: 0, marginTop: 3 }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 500, color: T.ink2 }}>{buyerName} sets it up with you</span>
            <span style={{ display: 'block', font: `400 13px/1.35 ${T.font}`, color: T.faint, marginTop: 3 }}>CRM connection, conversion tracking and campaign setup, in a session each month</span>
          </span>
          <ChevronRight size={18} color={T.faint} />
        </button>
      </section>
    )
  }

  const limit = state?.limit ?? monthlyLimit(tier)
  const used  = state?.used ?? 0
  const full  = used >= limit
  const small = { font: `400 14px/1.5 ${T.font}`, color: T.muted, margin: 0 } as const
  const field = { font: `400 15px/1.3 ${T.font}`, color: T.ink, background: '#fff', border: `1px solid ${T.hairline}`, borderRadius: 12, padding: '11px 12px', width: '100%', boxSizing: 'border-box' } as const
  const lab   = { display: 'block', font: `400 13px/1.3 ${T.font}`, color: T.muted, margin: '0 0 5px' } as const

  return (
    <section aria-labelledby="ov-hands">
      {head(`${Math.min(used, limit)} of ${limit} used this month`)}
      <div className="ov-card" style={{ overflow: 'hidden' }}>
        <p style={{ ...small, padding: '16px 20px 12px', color: T.ink2 }}>
          Some jobs are quicker done together. Pick one and {buyerName} sets it up with you on a call or over WhatsApp.
        </p>

        {sentJob && (
          <p role="status" style={{ ...small, color: T.good, fontWeight: 600, padding: '0 20px 12px' }}>Request sent: {sentJob}. {buyerName} will message you on WhatsApp to agree a time.</p>
        )}
        {state && state.requests.filter(r => r.open).length > 0 && !sentJob && (
          <p style={{ ...small, padding: '0 20px 12px' }}>Waiting on {buyerName}: {state.requests.filter(r => r.open).map(r => r.job).join(', ')}.</p>
        )}

        {full ? (
          <p style={{ ...small, padding: '0 20px 18px' }}>{limit === 1 ? 'This month\u2019s session is booked. A new one opens on the 1st' : 'This month\u2019s sessions are booked. New ones open on the 1st'}, and you can message {buyerName} any time in between.</p>
        ) : JOBS.map((j, i) => {
          const isOpen = open === j.id
          return (
            <div key={j.id} className="ov-item" data-open={isOpen}>
              <div className="ov-sep" style={{ marginLeft: i === 0 ? 0 : 20 }} />
              <button className="ov-row" onClick={() => { setOpen(isOpen ? null : j.id); setError('') }} aria-expanded={isOpen} style={{ alignItems: 'flex-start' }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="ov-clamp" style={{ fontWeight: 500 }}>{j.title}</span>
                  <span style={{ display: 'block', font: `400 13px/1.3 ${T.font}`, color: T.faint, marginTop: 3 }}>{j.sub}</span>
                </span>
                <ChevronRight size={18} className="ov-chev" />
              </button>
              <div className="ov-disc" aria-hidden={!isOpen}>
                <div>
                  {isOpen && (
                    <form className="ov-detail" style={{ paddingLeft: 20, display: 'grid', gap: 12 }} onSubmit={e => { e.preventDefault(); send(j.id) }}>
                      {j.id !== 'other' && (
                        <label>
                          <span style={lab}>{j.id === 'crm' ? 'Where do your inquiries go today?' : j.id === 'tracking' ? 'Which platforms do you advertise on?' : 'What do you want to run?'}</span>
                          <input style={field} value={tools} onChange={e => setTools(e.target.value)} maxLength={200}
                            placeholder={j.id === 'crm' ? 'e.g. WhatsApp and a Google Sheet' : j.id === 'tracking' ? 'e.g. Meta and Google, website on WordPress' : 'e.g. Leads on Meta for our January intake'} />
                        </label>
                      )}
                      <label>
                        <span style={lab}>WhatsApp number</span>
                        <input style={field} type="tel" inputMode="tel" autoComplete="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="0712 345 678" />
                      </label>
                      <label>
                        <span style={lab}>Best time</span>
                        <select style={field} value={time} onChange={e => setTime(e.target.value)}>{TIMES.map(t => <option key={t}>{t}</option>)}</select>
                      </label>
                      <label>
                        <span style={lab}>{j.id === 'other' ? 'What do you need a hand with?' : 'Anything else he should know? (optional)'}</span>
                        <textarea style={{ ...field, minHeight: 72, resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} maxLength={1000} required={j.id === 'other'} />
                      </label>
                      <p style={small}>You stay in control of your accounts. You add {buyerName} as a partner on your ad account, and you never share a password.</p>
                      {error && <p role="alert" style={{ ...small, color: T.bad }}>{error}</p>}
                      <div><button type="submit" className="ov-btn ov-btn-primary" disabled={busy || phone.replace(/\D/g, '').length < 9}>{busy ? 'Sending…' : `Ask ${buyerName} to set this up`}</button></div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
