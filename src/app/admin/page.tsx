'use client'

// The control room. One login, five places:
//   Today     everything that needs Eugene, most urgent first
//   Clients   everyone; tap one for their whole story on a single page
//   Messages  one conversation per client, however it started
//   Money     what came in, what is due, who slipped away
//   Funnel    visits to diagnoses to calls to paid, by ad source
// Everything hangs off the client, so a complaint, a payment and a note are
// always found in the same place.

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { DashStyles, Segmented, T } from '../dashboard/overview'
import { FunnelView, MoneyView } from './business'

type Ref = { type: 'call' | 'message' | 'escalation'; id: string }
type ThreadItem = { key: string; at: string; from: 'client' | 'eugene'; kind: string; label: string; body: string; open: boolean; ref?: Ref }
type TodayItem  = { key: string; type: string; at: string; userId: string | null; who: string; title: string; detail: string; ref?: Ref }
type ClientRow  = { id: string; name: string | null; email: string; company: string | null; tier: string; status: string; renewsIn: number | null; cancelled: boolean; lastSeen: string; weeksLogged: number; open: number; lastMessage: ThreadItem | null }
type Week       = { week_start: string; spend: number; currency: string; leads: number; sales: number; cpl: number | null }
type Detail = {
  client: { id: string; email: string; name: string | null; company: string | null; tier: string; status: string; cancelled: boolean; renewalDate: string | null; joined: string; lastSeen: string }
  snapshot: { score: number | null; scoreDelta: number | null; topFindings: string[]; openFixes: string[]; fixesDone: number; weeks: Week[] }
  thread: ThreadItem[]
  lastSent: { sent_at: string; read_at: string | null } | null
  draft: { body: string; media_url: string | null } | null
  payments: { reference: string; tier: string; kind: string; status: string; paid_amount: number | null; expected_amount: number | null; created_at: string; paid_at: string | null }[]
  privateNote: string
}
type View = 'today' | 'clients' | 'messages' | 'money' | 'funnel'

const day     = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const weekDay = (ymd: string) => new Date(`${ymd}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const cap     = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const ago     = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d < 30 ? `${d} days ago` : day(iso)
}
const post = (url: string, body: unknown) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

const TYPE_LABEL: Record<string, string> = { escalation: 'Needs an answer', message: 'Message', call: 'Call request', renewal: 'Renewal', note_due: 'Note due', quiet: 'Quiet' }
const URGENT = new Set(['escalation', 'message', 'call'])

export default function ControlRoom() {
  const [data, setData]     = useState<{ today: TodayItem[]; clients: ClientRow[] } | null>(null)
  const [denied, setDenied] = useState(false)
  const [view, setView]     = useState<View>('today')
  const [openId, setOpenId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/overview')
    if (res.status === 401) { setDenied(true); return }
    if (res.ok) setData(await res.json())
  }, [])
  useEffect(() => { load() }, [load])
  // New messages and requests appear on their own, without a refresh
  useEffect(() => {
    const timer = setInterval(() => { if (!document.hidden) load() }, 30_000)
    return () => clearInterval(timer)
  }, [load])

  const shell: React.CSSProperties = { minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.ink, padding: 'clamp(20px,4vw,40px) clamp(14px,4vw,40px) 80px' }

  if (denied) return (
    <main style={shell}><DashStyles />
      <div className="ov-card" style={{ maxWidth: 460, margin: '12vh auto', padding: 28 }}>
        <h1 style={{ font: `700 24px/1.2 ${T.head}`, margin: '0 0 8px' }}>Admin only</h1>
        <p style={{ font: `400 15px/1.5 ${T.font}`, color: T.muted, margin: '0 0 20px' }}>Log in with your admin email using a login code, then come back to this page.</p>
        <Link className="ov-btn ov-btn-primary" href="/auth?tab=login&next=/admin">Log in</Link>
      </div>
    </main>
  )

  const urgent   = data?.today.filter(t => URGENT.has(t.type)).length ?? 0
  const threads  = (data?.clients ?? []).filter(c => c.lastMessage).sort((a, b) => b.open - a.open || (b.lastMessage!.at).localeCompare(a.lastMessage!.at))
  const openMsgs = threads.reduce((n, c) => n + c.open, 0)
  const q        = search.trim().toLowerCase()
  const clients  = (data?.clients ?? []).filter(c => !q || [c.name, c.email, c.company].some(x => (x ?? '').toLowerCase().includes(q)))

  async function markDone(ref: Ref) { await post('/api/admin/handle', ref); load() }

  return (
    <main style={shell}><DashStyles />
      <style dangerouslySetInnerHTML={{ __html: `
        .cr-wrap { max-width: 920px; margin: 0 auto; }
        .cr-area { width: 100%; resize: vertical; border: 0; background: none; padding: 16px 20px; font: 400 16px/1.6 ${T.font}; color: ${T.ink}; box-sizing: border-box; }
        .cr-area:focus, .cr-input:focus { outline: none; }
        .cr-input { width: 100%; border: 0; background: none; padding: 16px 20px; font: 400 16px/1.3 ${T.font}; color: ${T.ink}; box-sizing: border-box; }
        .cr-stat dt { font: 400 13px/1.3 ${T.font}; color: ${T.faint}; }
        .cr-stat dd { margin: 2px 0 0; font: 700 20px/1.2 ${T.head}; color: ${T.ink}; font-variant-numeric: tabular-nums; }
        .cr-bubble { max-width: 82%; padding: 12px 16px; border-radius: 18px; font: 400 15px/1.5 ${T.font}; white-space: pre-wrap; overflow-wrap: anywhere; }
        .cr-tag { font: 600 12px/1 ${T.font}; padding: 5px 9px; border-radius: 980px; white-space: nowrap; }
        @media (max-width: 480px) { .cr-wrap > header .seg { width: 100%; } .cr-wrap > header .seg button { flex: 1 0 auto; padding: 9px 8px; font-size: 13px; } }
      ` }} />

      <div className="cr-wrap">
        {openId ? (
          <ClientPage id={openId} onBack={() => { setOpenId(null); load() }} onChanged={load} />
        ) : (
          <>
            <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
              <div>
                <h1 style={{ font: `700 clamp(28px,4.5vw,34px)/1.1 ${T.head}`, letterSpacing: '-0.025em', margin: '0 0 8px' }}>Control room</h1>
                <p style={{ font: `400 17px/1.4 ${T.font}`, color: T.muted, margin: 0 }}>
                  {!data ? 'Loading.' : urgent > 0 ? `${urgent} ${urgent === 1 ? 'person is' : 'people are'} waiting on you.` : data.today.length > 0 ? 'Nobody is waiting on you. A few things to keep warm below.' : 'All clear. Nothing needs you today.'}
                </p>
              </div>
              <Segmented<View> label="Sections" value={view} onChange={setView} options={[
                { value: 'today', label: `Today${data?.today.length ? ` ${data.today.length}` : ''}` },
                { value: 'clients', label: 'Clients' },
                { value: 'messages', label: `Messages${openMsgs ? ` ${openMsgs}` : ''}` },
                { value: 'money', label: 'Money' },
                { value: 'funnel', label: 'Funnel' },
              ]} />
            </header>

            {data && view === 'today' && (
              data.today.length === 0
                ? <div className="ov-card" style={{ padding: 28 }}><p style={{ font: `400 16px/1.5 ${T.font}`, color: T.muted, margin: 0 }}>Nothing here. New call requests, messages, complaints, renewals and notes due will appear in this list.</p></div>
                : <div className="ov-card" style={{ overflow: 'hidden' }}>
                    {data.today.map((t, i) => (
                      <div key={t.key} className="ov-item">
                        {i > 0 && <div className="ov-sep" />}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                              <span className="cr-tag" style={URGENT.has(t.type) ? { background: 'rgba(232,51,10,0.10)', color: T.accent } : { background: T.fill, color: T.ink2 }}>{TYPE_LABEL[t.type] ?? t.type}</span>
                              {t.type !== 'note_due' && <span style={{ font: `400 13px/1 ${T.font}`, color: T.faint }}>{t.type === 'renewal' ? day(t.at) : ago(t.at)}</span>}
                            </div>
                            <p style={{ font: `500 16px/1.35 ${T.font}`, margin: '0 0 3px' }}>{t.who}: {t.title}</p>
                            {t.detail && <p className="ov-clamp" style={{ font: `400 14px/1.5 ${T.font}`, color: T.muted, margin: 0, whiteSpace: 'pre-line' }}>{t.detail}</p>}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                            {t.userId && <button className="ov-btn ov-btn-primary" style={{ padding: '10px 16px' }} onClick={() => setOpenId(t.userId)}>{URGENT.has(t.type) ? 'Reply' : 'Open'}</button>}
                            {t.ref && <button className="ov-btn ov-btn-quiet" style={{ padding: '10px 16px' }} onClick={() => markDone(t.ref!)}>Done</button>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
            )}

            {data && view === 'clients' && (
              <>
                <div className="ov-card" style={{ marginBottom: 16 }}>
                  <input className="cr-input" type="search" aria-label="Search clients" placeholder="Search by name, email or business" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="ov-card" style={{ overflow: 'hidden' }}>
                  {clients.length === 0 && <p style={{ font: `400 15px/1.5 ${T.font}`, color: T.muted, margin: 0, padding: 20 }}>No one matches that search.</p>}
                  {clients.map((c, i) => (
                    <div key={c.id} className="ov-item">
                      {i > 0 && <div className="ov-sep" />}
                      <button className="ov-row" onClick={() => setOpenId(c.id)}>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span className="ov-clamp" style={{ fontWeight: 500 }}>{c.name || c.email}</span>
                          <span style={{ display: 'block', font: `400 13px/1.35 ${T.font}`, color: T.faint, marginTop: 3 }}>
                            {[cap(c.tier), c.tier !== 'free' && c.renewsIn !== null ? `${c.cancelled ? 'ends' : 'renews'} in ${c.renewsIn}d` : '', `seen ${ago(c.lastSeen)}`, c.weeksLogged ? `${c.weeksLogged} ${c.weeksLogged === 1 ? 'week' : 'weeks'} logged` : ''].filter(Boolean).join(', ')}
                          </span>
                        </span>
                        {c.open > 0 && <span className="cr-tag" style={{ background: 'rgba(232,51,10,0.10)', color: T.accent }}>{c.open} waiting</span>}
                        <ChevronRight size={18} color={T.faint} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {data && view === 'money' && <MoneyView onOpen={setOpenId} />}
            {data && view === 'funnel' && <FunnelView />}

            {data && view === 'messages' && (
              threads.length === 0
                ? <div className="ov-card" style={{ padding: 28 }}><p style={{ font: `400 16px/1.5 ${T.font}`, color: T.muted, margin: 0 }}>No conversations yet. Call requests, replies to your notes and chat escalations all land here, one thread per client.</p></div>
                : <div className="ov-card" style={{ overflow: 'hidden' }}>
                    {threads.map((c, i) => (
                      <div key={c.id} className="ov-item">
                        {i > 0 && <div className="ov-sep" />}
                        <button className="ov-row" onClick={() => setOpenId(c.id)}>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                              <span style={{ fontWeight: c.open ? 700 : 500 }}>{c.name || c.email}</span>
                              <span style={{ font: `400 13px/1.4 ${T.font}`, color: T.faint, whiteSpace: 'nowrap' }}>{ago(c.lastMessage!.at)}</span>
                            </span>
                            <span className="ov-clamp" style={{ font: `400 14px/1.45 ${T.font}`, color: T.muted, marginTop: 3, WebkitLineClamp: 1 }}>
                              {c.lastMessage!.from === 'eugene' ? 'You: ' : ''}{c.lastMessage!.body || c.lastMessage!.label}
                            </span>
                          </span>
                          {c.open > 0 && <span aria-label={`${c.open} waiting`} style={{ width: 10, height: 10, borderRadius: '50%', background: T.accent, flexShrink: 0 }} />}
                          <ChevronRight size={18} color={T.faint} />
                        </button>
                      </div>
                    ))}
                  </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

// ─── One client, whole story ─────────────────────────────────────────────────
function ClientPage({ id, onBack, onChanged }: { id: string; onBack: () => void; onChanged: () => void }) {
  const [d, setD]           = useState<Detail | null>(null)
  const [reply, setReply]   = useState('')
  const [note, setNote]     = useState('')
  const [media, setMedia]   = useState('')
  const [priv, setPriv]     = useState('')
  const [busy, setBusy]     = useState('')
  const [confirm, setConf]  = useState(false)
  const [msg, setMsg]       = useState<{ where: 'reply' | 'note' | 'priv'; text: string; bad?: boolean } | null>(null)

  const load = useCallback(async (first = false) => {
    const res = await fetch(`/api/admin/client?id=${id}`)
    if (!res.ok) return
    const j = await res.json() as Detail
    setD(j)
    if (first) { setNote(j.draft?.body ?? ''); setMedia(j.draft?.media_url ?? ''); setPriv(j.privateNote) }
  }, [id])
  useEffect(() => { load(true) }, [load])
  // Pick up the client's replies while this page is open; what is being typed is left alone
  useEffect(() => {
    const timer = setInterval(() => { if (!document.hidden) load() }, 12_000)
    return () => clearInterval(timer)
  }, [load])

  if (!d) return <p style={{ font: `400 16px/1.5 ${T.font}`, color: T.muted }}>Loading client.</p>
  const c = d.client, s = d.snapshot
  const first = (c.name ?? '').split(' ')[0] || 'client'
  const paid = c.tier !== 'free'
  const renewsIn = c.renewalDate ? Math.ceil((new Date(c.renewalDate).getTime() - Date.now()) / 86_400_000) : null

  async function run(key: string, where: 'reply' | 'note' | 'priv', fn: () => Promise<string>) {
    setBusy(key); setMsg(null)
    try { const text = await fn(); setMsg({ where, text }); await load(); onChanged() }
    catch (e) { setMsg({ where, text: e instanceof Error ? e.message : 'Something went wrong', bad: true }) }
    finally { setBusy('') }
  }
  const ok = async (res: Response) => { const j = await res.json(); if (!res.ok) throw new Error(j.error ?? 'Something went wrong'); return j }

  const sendReply = () => run('reply', 'reply', async () => {
    const j = await ok(await post('/api/admin/message', { userId: c.id, body: reply })); setReply('')
    return j.emailed ? `Sent. ${first} will see it in their dashboard and inbox.` : 'Saved to their dashboard, but the email did not go out.'
  })
  const draftNote = () => run('draft', 'note', async () => {
    const j = await ok(await post('/api/admin/notes/draft', { userId: c.id })); setNote(j.draft); setConf(false)
    return 'Draft ready. Read it, make it yours, then send.'
  })
  const saveNote = (action: 'save' | 'send') => run(action, 'note', async () => {
    const j = await ok(await post('/api/admin/notes', { userId: c.id, body: note, mediaUrl: media, action }))
    if (action === 'send') { setNote(''); setMedia(''); setConf(false); return j.emailed ? `Note sent to ${first}.` : 'Note is on their dashboard, but the email did not go out.' }
    return 'Draft saved.'
  })
  const savePriv = () => run('priv', 'priv', async () => { await ok(await post('/api/admin/private-note', { userId: c.id, body: priv })); return 'Saved.' })
  const done = (ref: Ref) => run(ref.id, 'reply', async () => { await ok(await post('/api/admin/handle', ref)); return 'Marked as done.' })

  const H2 = ({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, margin: '0 4px 12px' }}>
      <h2 className="ov-h2">{children}</h2>{right}
    </div>
  )
  const Status = ({ where, fallback }: { where: 'reply' | 'note' | 'priv'; fallback: string }) => (
    <p role={msg?.where === where && msg.bad ? 'alert' : 'status'} style={{ font: `400 14px/1.45 ${T.font}`, color: msg?.where === where && msg.bad ? T.bad : T.muted, margin: 0, flex: '1 1 180px' }}>
      {msg?.where === where ? msg.text : fallback}
    </p>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <button className="ov-link" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginBottom: 14 }}><ChevronLeft size={18} />Control room</button>
        <h1 style={{ font: `700 clamp(26px,4.5vw,32px)/1.1 ${T.head}`, letterSpacing: '-0.025em', margin: '0 0 8px' }}>{c.name || c.email}</h1>
        <p style={{ font: `400 16px/1.45 ${T.font}`, color: T.muted, margin: 0 }}>
          {[c.company, c.email, `${cap(c.tier)} plan`, paid && renewsIn !== null ? `${c.cancelled ? 'cancelled, ends' : 'renews'} ${renewsIn < 0 ? `${-renewsIn}d ago` : `in ${renewsIn}d`}` : '', `joined ${day(c.joined)}`, `seen ${ago(c.lastSeen)}`].filter(Boolean).join(', ')}
        </p>
      </div>

      {/* What they see */}
      <section className="ov-card" style={{ padding: 'clamp(20px,3vw,28px)' }}>
        <dl className="cr-stat" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 18, margin: '0 0 20px' }}>
          <div><dt>ICP score</dt><dd>{s.score ?? 'None'}{s.scoreDelta ? <span style={{ font: `600 14px/1 ${T.font}`, color: s.scoreDelta > 0 ? T.good : T.bad }}> {s.scoreDelta > 0 ? '+' : ''}{s.scoreDelta}</span> : null}</dd></div>
          <div><dt>Fixes done</dt><dd>{s.fixesDone}</dd></div>
          <div><dt>Weeks logged</dt><dd>{s.weeks.length}</dd></div>
          <div><dt>Last note</dt><dd style={{ fontSize: 16 }}>{d.lastSent ? `${day(d.lastSent.sent_at)}${d.lastSent.read_at ? ', read' : ', unread'}` : 'Never'}</dd></div>
        </dl>
        {s.weeks.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', font: `400 14px/1.4 ${T.font}`, fontVariantNumeric: 'tabular-nums' }}>
            <thead><tr style={{ color: T.faint, textAlign: 'right' }}><th style={{ textAlign: 'left', fontWeight: 400, padding: '6px 0' }}>Week of</th><th style={{ fontWeight: 400 }}>Spend</th><th style={{ fontWeight: 400 }}>Leads</th><th style={{ fontWeight: 400 }}>Sales</th><th style={{ fontWeight: 400 }}>Per lead</th></tr></thead>
            <tbody>{s.weeks.map(w => (
              <tr key={w.week_start} style={{ borderTop: `1px solid ${T.hairline}`, textAlign: 'right' }}>
                <td style={{ textAlign: 'left', padding: '8px 0' }}>{weekDay(w.week_start)}</td>
                <td>{w.currency} {Math.round(w.spend).toLocaleString()}</td><td>{w.leads}</td><td>{w.sales}</td>
                <td style={{ fontWeight: 600 }}>{w.cpl !== null ? w.cpl.toLocaleString() : 'n/a'}</td>
              </tr>))}</tbody>
          </table>
        ) : <p style={{ font: `400 14px/1.5 ${T.font}`, color: T.muted, margin: 0 }}>No weekly numbers logged yet.</p>}
        {(s.topFindings.length > 0 || s.openFixes.length > 0) && (
          <div style={{ marginTop: 18, font: `400 14px/1.55 ${T.font}`, color: T.ink2 }}>
            {s.topFindings.length > 0 && <p style={{ margin: '0 0 6px' }}><span style={{ color: T.faint }}>Top findings: </span>{s.topFindings.join('. ')}</p>}
            {s.openFixes[0] && <p style={{ margin: 0 }}><span style={{ color: T.faint }}>Their first fix: </span>{s.openFixes[0]}</p>}
          </div>
        )}
      </section>

      {/* Conversation */}
      <section aria-labelledby="cr-conv">
        <H2><span id="cr-conv">Conversation</span></H2>
        <div className="ov-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {d.thread.length === 0 && <p style={{ font: `400 15px/1.5 ${T.font}`, color: T.muted, margin: 0 }}>Nothing yet. Write below to start the conversation.</p>}
            {d.thread.map(m => {
              const mine = m.from === 'eugene'
              return (
                <div key={m.key} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                  <span style={{ font: `400 12px/1.3 ${T.font}`, color: T.faint, margin: '0 6px 4px' }}>{m.label}, {day(m.at)}</span>
                  <div className="cr-bubble" style={mine ? { background: T.ink, color: '#fff' } : { background: T.fill, color: T.ink }}>{m.body || m.label}</div>
                  {m.open && m.ref && <button className="ov-link" style={{ margin: '6px 6px 0', fontSize: 13 }} disabled={busy !== ''} onClick={() => done(m.ref!)}>Mark as done without replying</button>}
                </div>
              )
            })}
          </div>
          <div className="ov-sep" style={{ marginLeft: 0 }} />
          <textarea className="cr-area" style={{ minHeight: 88 }} aria-label={`Message to ${first}`} placeholder={`Write to ${first}`} value={reply} maxLength={3000} onChange={e => setReply(e.target.value)} />
          <div className="ov-sep" style={{ marginLeft: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', flexWrap: 'wrap' }}>
            <Status where="reply" fallback={paid ? 'Shows in their dashboard chat and goes to their inbox.' : 'Goes to their inbox. Free accounts have no dashboard chat.'} />
            <button className="ov-btn ov-btn-primary" disabled={busy !== '' || reply.trim().length < 2} style={{ opacity: reply.trim().length < 2 ? 0.5 : 1 }} onClick={sendReply}>{busy === 'reply' ? 'Sending' : 'Send message'}</button>
          </div>
        </div>
      </section>

      {/* Monthly note */}
      {paid && (
        <section aria-labelledby="cr-note">
          <H2 right={<button className="ov-link" onClick={draftNote} disabled={busy !== ''}>{busy === 'draft' ? 'Writing a draft' : note ? 'Draft again' : 'Draft it for me'}</button>}><span id="cr-note">Monthly note</span></H2>
          <div className="ov-card" style={{ overflow: 'hidden' }}>
            <textarea className="cr-area" style={{ minHeight: 170 }} aria-label="Monthly note" placeholder={`Hi ${first}, ...`} value={note} maxLength={2000} onChange={e => { setNote(e.target.value); setConf(false) }} />
            {(c.tier === 'pro' || c.tier === 'agency') && (<><div className="ov-sep" style={{ marginLeft: 0 }} /><input className="cr-input" aria-label="Recording link" placeholder="Optional: Loom or voice note link (https://)" value={media} onChange={e => setMedia(e.target.value)} /></>)}
            <div className="ov-sep" style={{ marginLeft: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', flexWrap: 'wrap' }}>
              <Status where="note" fallback={`${note.trim().split(/\s+/).filter(Boolean).length} words. Aim for 60 to 90. Pinned to the top of their dashboard for 35 days.`} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="ov-btn ov-btn-quiet" disabled={busy !== '' || note.trim().length < 20} onClick={() => saveNote('save')}>{busy === 'save' ? 'Saving' : 'Save draft'}</button>
                {confirm
                  ? <button className="ov-btn ov-btn-primary" style={{ background: T.accent }} disabled={busy !== ''} onClick={() => saveNote('send')}>{busy === 'send' ? 'Sending' : `Yes, send to ${first}`}</button>
                  : <button className="ov-btn ov-btn-primary" disabled={busy !== '' || note.trim().length < 20} style={{ opacity: note.trim().length < 20 ? 0.5 : 1 }} onClick={() => setConf(true)}>Send note</button>}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Payments */}
      <section aria-labelledby="cr-pay">
        <H2><span id="cr-pay">Payments</span></H2>
        <div className="ov-card" style={{ overflow: 'hidden' }}>
          {d.payments.length === 0 && <p style={{ font: `400 15px/1.5 ${T.font}`, color: T.muted, margin: 0, padding: 20 }}>No payments yet.</p>}
          {d.payments.map((p, i) => (
            <div key={p.reference}>
              {i > 0 && <div className="ov-sep" />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', font: `400 15px/1.35 ${T.font}` }}>
                <span style={{ flex: 1 }}>{cap(p.tier ?? '')}{p.kind === 'proration' ? ' (upgrade top-up)' : ''}<span style={{ display: 'block', font: `400 13px/1.3 ${T.font}`, color: T.faint, marginTop: 2 }}>{day(p.paid_at ?? p.created_at)}</span></span>
                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>KES {Math.round(p.paid_amount ?? p.expected_amount ?? 0).toLocaleString()}</span>
                <span className="cr-tag" style={p.status === 'paid' ? { background: 'rgba(34,197,94,0.12)', color: T.good } : { background: T.fill, color: T.ink2 }}>{cap(p.status)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Private notes */}
      <section aria-labelledby="cr-priv">
        <H2><span id="cr-priv">Private notes</span></H2>
        <div className="ov-card" style={{ overflow: 'hidden' }}>
          <textarea className="cr-area" style={{ minHeight: 96 }} aria-label="Private notes" placeholder="Only you can see this. What you agreed, what to watch, how they like to be contacted." value={priv} maxLength={5000} onChange={e => setPriv(e.target.value)} />
          <div className="ov-sep" style={{ marginLeft: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', flexWrap: 'wrap' }}>
            <Status where="priv" fallback={`${first} never sees this.`} />
            <button className="ov-btn ov-btn-quiet" disabled={busy !== ''} onClick={savePriv}>{busy === 'priv' ? 'Saving' : 'Save'}</button>
          </div>
        </div>
      </section>
    </div>
  )
}
