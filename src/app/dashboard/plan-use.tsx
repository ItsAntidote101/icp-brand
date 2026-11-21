'use client'

// "Included in your plan": what resets each month, what has been used, what is
// still waiting, and past months. The same block is shown to the client and,
// in the control room, to the media buyer.
import { useEffect, useState } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { T } from './overview'
import type { Allowances } from '@/lib/allowances'

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

export function PlanUseBody({ a, admin = false }: { a: Allowances; admin?: boolean }) {
  const [open, setOpen] = useState(false)
  const row = { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '14px 20px' } as const
  const name = { font: `400 16px/1.35 ${T.font}`, color: T.ink } as const
  const num  = { font: `600 15px/1.3 ${T.font}`, color: T.ink, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } as const
  const sub  = { display: 'block', font: `400 13px/1.35 ${T.font}`, color: T.faint, marginTop: 3 } as const
  const sessions = a.items.find(i => i.key === 'sessions')
  const nudge = sessions && sessions.left ? a.daysLeft <= 7 : false
  const past = a.history.slice(1)

  if (a.items.length === 0 && a.extras.length === 0) {
    return <p style={{ font: `400 15px/1.5 ${T.font}`, color: T.muted, margin: 0, padding: 20 }}>{admin ? 'No paid plan, so nothing is included.' : 'Nothing is included on the free plan yet.'}</p>
  }
  return (
    <>
      {a.items.map((it, i) => (
        <div key={it.key}>
          {i > 0 && <div className="ov-sep" style={{ marginLeft: 20 }} />}
          <div style={row}>
            <span style={{ minWidth: 0 }}>
              <span style={name}>{it.label}</span>
              <span style={{ ...sub, color: it.key === 'sessions' && nudge ? T.accent : T.faint, fontWeight: it.key === 'sessions' && nudge ? 600 : 400 }}>
                {it.limit === null ? `Run this month. No monthly limit on ${admin ? 'this' : 'your'} plan.`
                  : it.left === 0 ? `All used. Resets ${a.resetsOn}.`
                  : it.key === 'sessions' && nudge ? `${it.left} unused, ${a.daysLeft} ${a.daysLeft === 1 ? 'day' : 'days'} left. Resets ${a.resetsOn}.`
                  : `${it.left} left. Resets ${a.resetsOn}.`}
              </span>
            </span>
            <span style={num}>{it.limit === null ? it.used : `${it.used} of ${it.limit}`}</span>
          </div>
        </div>
      ))}
      {a.extras.map(e => (
        <div key={e.key}>
          <div className="ov-sep" style={{ marginLeft: 20 }} />
          <div style={row}>
            <span style={{ minWidth: 0 }}>
              <span style={name}>{e.label}</span>
              <span style={sub}>{e.done && e.at ? `${e.key === 'drafts' ? 'Last written' : 'Built'} ${day(e.at)}` : admin ? 'Not used yet' : 'Included, not used yet'}</span>
            </span>
            {e.done && <Check size={17} color={T.good} style={{ flexShrink: 0, alignSelf: 'center' }} aria-label="Used" />}
          </div>
        </div>
      ))}
      <div className="ov-item" data-open={open}>
        <div className="ov-sep" style={{ marginLeft: 20 }} />
        <button className="ov-row" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span style={{ flex: 1, color: T.ink2 }}>Earlier months</span>
          <ChevronRight size={18} className="ov-chev" />
        </button>
        <div className="ov-disc" aria-hidden={!open}>
          <div>
            <div className="ov-detail" style={{ paddingLeft: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', font: `400 14px/1.4 ${T.font}`, color: T.ink2, fontVariantNumeric: 'tabular-nums' }}>
                <thead>
                  <tr style={{ color: T.muted, textAlign: 'left' }}>
                    <th style={{ fontWeight: 400, padding: '0 0 6px' }}>Month</th>
                    <th style={{ fontWeight: 400, padding: '0 0 6px', textAlign: 'right' }}>Sessions</th>
                    <th style={{ fontWeight: 400, padding: '0 0 6px', textAlign: 'right' }}>Diagnoses</th>
                  </tr>
                </thead>
                <tbody>
                  {past.map(h => (
                    <tr key={h.month} style={{ borderTop: `1px solid ${T.hairline}` }}>
                      <td style={{ padding: '8px 0' }}>{h.month}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>{h.sessions}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>{h.diagnoses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function PlanUseCard({ tier }: { tier: string }) {
  const [a, setA] = useState<Allowances | null>(null)
  useEffect(() => {
    if (tier === 'free') return
    let live = true
    fetch('/api/allowances').then(r => (r.ok ? r.json() : null))
      .then((d: { allowances?: Allowances | null } | null) => { if (live && d?.allowances) setA(d.allowances) })
      .catch(() => {})
    return () => { live = false }
  }, [tier])
  if (tier === 'free' || !a || (a.items.length === 0 && a.extras.length === 0)) return null
  return (
    <section aria-labelledby="ov-use">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 4px 12px' }}>
        <h2 id="ov-use" className="ov-h2">Included in your plan</h2>
        <span style={{ font: `400 15px/1 ${T.font}`, color: T.muted }}>{a.month}</span>
      </div>
      <div className="ov-card" style={{ overflow: 'hidden' }}><PlanUseBody a={a} /></div>
    </section>
  )
}
