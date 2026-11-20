'use client'

// Money and Funnel for the control room. Both are read only: they show what
// came in and where people drop off, and link back to the client's page.

import React, { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Segmented, T } from '../dashboard/overview'

type Month = { key: string; total: number; count: number }
type Money = {
  testMode: boolean
  months: Month[]; thisMonth: Month; lastMonth: Month
  paying: number; leaving: number; ifAllRenew: number
  renewals:   { userId: string; name: string; tier: string; date: string; cancelled: boolean; amount: number; inDays: number }[]
  unfinished: { userId: string | null; name: string; email: string; tier: string; amount: number; at: string }[]
  stopped:    { userId: string; name: string; email: string; lastPaid: string }[]
  recent:     { reference: string; userId: string | null; name: string; email: string; tier: string; kind: string; amount: number; at: string }[]
}
type Funnel = {
  days: number; capped: boolean
  steps: { label: string; people: number }[]
  outcomes: { calls: number; checkouts: number; paid: number }
  sources: { source: string; campaign: string; visitors: number; finished: number; calls: number; checkouts: number; paid: number }[]
}

const kes   = (n: number) => `KES ${Math.round(n).toLocaleString()}`
const cap   = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const day   = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const month = (key: string) => new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })
const pct   = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : 'n/a')

const P    = ({ children }: { children: React.ReactNode }) => <p style={{ font: `400 15px/1.5 ${T.font}`, color: T.muted, margin: 0, padding: 20 }}>{children}</p>
const H2   = ({ children, hint }: { children: React.ReactNode; hint?: string }) => (
  <div style={{ margin: '0 4px 12px' }}>
    <h2 className="ov-h2">{children}</h2>
    {hint && <p style={{ font: `400 14px/1.45 ${T.font}`, color: T.muted, margin: '4px 0 0' }}>{hint}</p>}
  </div>
)
const Bar  = ({ share, strong }: { share: number; strong?: boolean }) => (
  <div style={{ height: 8, borderRadius: 4, background: T.fill, overflow: 'hidden' }} aria-hidden="true">
    <div style={{ width: `${Math.max(share > 0 ? 2 : 0, Math.min(100, share * 100))}%`, height: '100%', borderRadius: 4, background: strong ? T.accent : T.ink }} />
  </div>
)

function Row({ first, onOpen, title, sub, right, tag }: { first: boolean; onOpen?: () => void; title: string; sub: string; right?: string; tag?: React.ReactNode }) {
  const inner = (
    <>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="ov-clamp" style={{ fontWeight: 500, WebkitLineClamp: 1 }}>{title}</span>
        <span style={{ display: 'block', font: `400 13px/1.35 ${T.font}`, color: T.faint, marginTop: 3 }}>{sub}</span>
      </span>
      {right && <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, whiteSpace: 'nowrap' }}>{right}</span>}
      {tag}
      {onOpen && <ChevronRight size={18} color={T.faint} />}
    </>
  )
  return (
    <div className={onOpen ? 'ov-item' : undefined}>
      {!first && <div className="ov-sep" />}
      {onOpen
        ? <button className="ov-row" onClick={onOpen}>{inner}</button>
        : <div className="ov-row" style={{ cursor: 'default' }}>{inner}</div>}
    </div>
  )
}

function useLoad<D>(url: string) {
  const [data, setData]   = useState<D | null>(null)
  const [failed, setFail] = useState(false)
  useEffect(() => {
    let live = true
    setData(null); setFail(false)
    fetch(url).then(async r => { if (!live) return; if (r.ok) setData(await r.json()); else setFail(true) }).catch(() => live && setFail(true))
    return () => { live = false }
  }, [url])
  return { data, failed }
}

// ─── Money ───────────────────────────────────────────────────────────────────
export function MoneyView({ onOpen }: { onOpen: (userId: string) => void }) {
  const { data: m, failed } = useLoad<Money>('/api/admin/money')
  if (failed) return <div className="ov-card"><P>Could not load the money figures. Refresh to try again.</P></div>
  if (!m) return <div className="ov-card"><P>Loading.</P></div>

  const top  = Math.max(1, ...m.months.map(x => x.total))
  const diff = m.thisMonth.total - m.lastMonth.total

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {m.testMode && (
        <p role="note" style={{ font: `400 14px/1.5 ${T.font}`, color: T.ink2, background: T.fill, borderRadius: 14, padding: '12px 16px', margin: 0 }}>
          Paystack is still on test keys, so the payments below are tests and not real money.
        </p>
      )}

      <section className="ov-card" style={{ padding: 'clamp(20px,3vw,28px)' }}>
        <dl className="cr-stat" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20, margin: '0 0 24px' }}>
          <div><dt>Collected this month</dt><dd>{kes(m.thisMonth.total)}</dd></div>
          <div><dt>Last month</dt><dd>{kes(m.lastMonth.total)}{m.lastMonth.total > 0 && diff !== 0 && <span style={{ display: 'block', font: `600 13px/1.5 ${T.font}`, color: diff > 0 ? T.good : T.bad }}>This month is {diff > 0 ? 'up' : 'down'} {pct(Math.abs(diff), m.lastMonth.total)}</span>}</dd></div>
          <div><dt>Paying clients</dt><dd>{m.paying}{m.leaving > 0 && <span style={{ display: 'block', font: `600 13px/1.5 ${T.font}`, color: T.bad }}>{m.leaving} cancelled</span>}</dd></div>
          <div><dt>Next month if all renew</dt><dd>{kes(m.ifAllRenew)}</dd></div>
        </dl>
        <div role="img" aria-label={`Collected per month: ${m.months.map(x => `${month(x.key)} ${kes(x.total)}`).join(', ')}`} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', alignItems: 'center', gap: '10px 12px', font: `400 13px/1 ${T.font}`, color: T.muted, fontVariantNumeric: 'tabular-nums' }}>
          {m.months.map((x, i) => (
            <React.Fragment key={x.key}>
              <span>{month(x.key)}</span>
              <Bar share={x.total / top} strong={i === m.months.length - 1} />
              <span style={{ color: T.ink, textAlign: 'right' }}>{x.total ? kes(x.total) : '0'}</span>
            </React.Fragment>
          ))}
        </div>
      </section>

      <section aria-labelledby="mn-renew">
        <H2 hint="Plans are paid month by month, so each of these is a decision the client makes again."><span id="mn-renew">Renewals in the next 14 days</span></H2>
        <div className="ov-card" style={{ overflow: 'hidden' }}>
          {m.renewals.length === 0 && <P>No plans end in the next two weeks.</P>}
          {m.renewals.map((r, i) => (
            <Row key={r.userId} first={i === 0} onOpen={() => onOpen(r.userId)} title={r.name}
              sub={`${cap(r.tier)}, ${r.inDays < 0 ? `ended ${-r.inDays}d ago` : r.inDays === 0 ? 'ends today' : `ends in ${r.inDays}d`} (${day(r.date)})`}
              right={kes(r.amount)}
              tag={r.cancelled ? <span className="cr-tag" style={{ background: 'rgba(232,51,10,0.10)', color: T.accent }}>Cancelled</span> : undefined} />
          ))}
        </div>
      </section>

      {m.unfinished.length > 0 && (
        <section aria-labelledby="mn-unfin">
          <H2 hint="They opened the payment page in the last 14 days and did not pay. A short message often closes these."><span id="mn-unfin">Started paying, did not finish</span></H2>
          <div className="ov-card" style={{ overflow: 'hidden' }}>
            {m.unfinished.map((u, i) => (
              <Row key={u.email} first={i === 0} onOpen={u.userId ? () => onOpen(u.userId!) : undefined} title={u.name}
                sub={`${cap(u.tier)}, tried ${day(u.at)}${u.userId ? '' : ', no account yet'}`} right={kes(u.amount)} />
            ))}
          </div>
        </section>
      )}

      {m.stopped.length > 0 && (
        <section aria-labelledby="mn-stop">
          <H2 hint="Paid before and are on the free plan now."><span id="mn-stop">Stopped paying</span></H2>
          <div className="ov-card" style={{ overflow: 'hidden' }}>
            {m.stopped.map((s, i) => <Row key={s.userId} first={i === 0} onOpen={() => onOpen(s.userId)} title={s.name} sub={`Last paid ${day(s.lastPaid)}`} />)}
          </div>
        </section>
      )}

      <section aria-labelledby="mn-recent">
        <H2><span id="mn-recent">Recent payments</span></H2>
        <div className="ov-card" style={{ overflow: 'hidden' }}>
          {m.recent.length === 0 && <P>No payments yet.</P>}
          {m.recent.map((p, i) => (
            <Row key={p.reference} first={i === 0} onOpen={p.userId ? () => onOpen(p.userId!) : undefined} title={p.name}
              sub={`${cap(p.tier)}${p.kind === 'proration' ? ' (upgrade top-up)' : ''}, ${day(p.at)}`} right={kes(p.amount)} />
          ))}
        </div>
      </section>
    </div>
  )
}

// ─── Funnel ──────────────────────────────────────────────────────────────────
export function FunnelView() {
  const [days, setDays] = useState<'7' | '30' | '90'>('30')
  const { data: f, failed } = useLoad<Funnel>(`/api/admin/funnel?days=${days}`)

  const picker = (
    <div style={{ marginBottom: 16 }}>
      <Segmented<'7' | '30' | '90'> label="Period" value={days} onChange={setDays} options={[{ value: '7', label: '7 days' }, { value: '30', label: '30 days' }, { value: '90', label: '90 days' }]} />
    </div>
  )
  if (failed) return <>{picker}<div className="ov-card"><P>Could not load the funnel. Refresh to try again.</P></div></>
  if (!f) return <>{picker}<div className="ov-card"><P>Loading.</P></div></>

  const top = Math.max(1, f.steps[0]?.people ?? 0)
  // The step that loses the largest share of the people who reached it
  let worst = -1, worstKeep = 1
  for (let i = 1; i < f.steps.length; i++) {
    const before = f.steps[i - 1].people
    if (before < 10) continue                       // too few people to read anything into
    const keep = f.steps[i].people / before
    if (keep < worstKeep) { worstKeep = keep; worst = i }
  }
  const finished = f.steps[2]?.people ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <section>
        {picker}
        <div className="ov-card" style={{ padding: 'clamp(20px,3vw,28px)' }}>
          <p style={{ font: `500 17px/1.4 ${T.font}`, margin: '0 0 22px' }}>
            {top <= 1 && f.steps[0].people === 0
              ? 'No visitors recorded in this period yet.'
              : worst > 0
                ? `Biggest drop: only ${pct(f.steps[worst].people, f.steps[worst - 1].people)} of people who ${f.steps[worst - 1].label.toLowerCase().replace('visited', 'visit').replace('started', 'start').replace('finished', 'finish')} go on to ${f.steps[worst].label.toLowerCase().replace('started', 'start').replace('finished', 'finish').replace('opened', 'open')}.`
                : 'Not enough visitors yet to say where people drop off.'}
          </p>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {f.steps.map((s, i) => (
              <li key={s.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 7 }}>
                  <span style={{ font: `400 15px/1.3 ${T.font}` }}>{s.label}</span>
                  <strong style={{ font: `700 16px/1 ${T.head}`, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{s.people.toLocaleString()}</strong>
                </div>
                <Bar share={s.people / top} strong={i === worst} />
                {i > 0 && f.steps[i - 1].people > 0 && <p style={{ font: `400 13px/1.3 ${T.font}`, color: i === worst ? T.accent : T.faint, margin: '6px 0 0' }}>{pct(s.people, f.steps[i - 1].people)} carry on from the step above</p>}
              </li>
            ))}
          </ol>
          <div className="ov-sep" style={{ margin: '24px 0 20px' }} />
          <dl className="cr-stat" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, margin: 0 }}>
            <div><dt>Asked for a call</dt><dd>{f.outcomes.calls}</dd></div>
            <div><dt>Started checkout</dt><dd>{f.outcomes.checkouts}</dd></div>
            <div><dt>New paying clients</dt><dd>{f.outcomes.paid}</dd></div>
          </dl>
          <p style={{ font: `400 13px/1.5 ${T.font}`, color: T.faint, margin: '16px 0 0' }}>
            {finished >= 10 && f.outcomes.calls <= finished && f.outcomes.paid <= finished ? `${pct(f.outcomes.calls, finished)} of finished diagnoses ask for a call and ${pct(f.outcomes.paid, finished)} become paying clients. ` : ''}
            Counts are people, not page views, and include your own test visits.{f.capped ? ' This period has more events than this screen reads, so the totals are a little low.' : ''}
          </p>
        </div>
      </section>

      <section aria-labelledby="fn-src">
        <H2 hint="Based on the ad link each person first arrived through."><span id="fn-src">Where they came from</span></H2>
        <div className="ov-card" style={{ overflowX: 'auto' }}>
          {f.sources.length === 0 ? <P>Nothing recorded in this period.</P> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', font: `400 14px/1.35 ${T.font}`, fontVariantNumeric: 'tabular-nums' }}>
              <thead>
                <tr style={{ color: T.faint, textAlign: 'right' }}>
                  <th scope="col" style={{ textAlign: 'left', fontWeight: 400, padding: '14px 6px 10px 16px' }}>Source</th>
                  {['Visitors', 'Finished', 'Calls', 'Paid'].map((h, i) => <th key={h} scope="col" style={{ fontWeight: 400, padding: `14px ${i === 3 ? 16 : 6}px 10px 6px` }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {f.sources.map(s => (
                  <tr key={`${s.source}|${s.campaign}`} style={{ borderTop: `1px solid ${T.hairline}`, textAlign: 'right' }}>
                    <th scope="row" style={{ textAlign: 'left', fontWeight: 500, padding: '12px 6px 12px 16px', maxWidth: 260, verticalAlign: 'top' }}>
                      {s.source}
                      {s.campaign && <span style={{ display: 'block', font: `400 13px/1.3 ${T.font}`, color: T.faint, marginTop: 2, overflowWrap: 'anywhere' }}>{s.campaign}</span>}
                    </th>
                    <td style={{ padding: '12px 6px', verticalAlign: 'top' }}>{s.visitors}</td>
                    <td style={{ padding: '12px 6px', verticalAlign: 'top' }}>{s.finished}<span style={{ display: 'block', font: `400 13px/1.3 ${T.font}`, color: T.faint, marginTop: 2 }}>{pct(s.finished, s.visitors)}</span></td>
                    <td style={{ padding: '12px 6px', verticalAlign: 'top' }}>{s.calls}</td>
                    <td style={{ padding: '12px 16px 12px 6px', verticalAlign: 'top', fontWeight: 700 }}>{s.paid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
