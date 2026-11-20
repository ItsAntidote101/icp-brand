'use client'

// Eugene's screen for the monthly client note.
// Pick a client, read their numbers, edit the draft, send. Nothing reaches a
// client until "Send to client" is confirmed.

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashStyles, T } from '../../dashboard/overview'

type Week = { week_start: string; spend: number; currency: string; leads: number; sales: number; cpl: number | null }
type Client = {
  id: string; email: string; name: string | null; company: string | null; tier: string
  renewsIn: number | null; cancelled: boolean; due: boolean
  snapshot: { score: number | null; scoreDelta: number | null; lastDiagnosis: string | null; topFindings: string[]; openFixes: string[]; fixesDone: number; weeks: Week[] }
  lastSent: { sent_at: string; read_at: string | null; body: string } | null
  draft: { body: string; media_url: string | null } | null
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
// Week starts are plain dates, so read them in UTC or they slip a day in western time zones
const weekDay = (ymd: string) => new Date(`${ymd}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export default function AdminNotesPage() {
  const [clients, setClients] = useState<Client[] | null>(null)
  const [denied, setDenied]   = useState(false)
  const [selected, setSel]    = useState<string | null>(null)
  const [body, setBody]       = useState('')
  const [media, setMedia]     = useState('')
  const [busy, setBusy]       = useState<'' | 'draft' | 'save' | 'send'>('')
  const [confirm, setConfirm] = useState(false)
  const [msg, setMsg]         = useState<{ text: string; bad?: boolean } | null>(null)

  async function load(keep?: string) {
    const res = await fetch('/api/admin/notes')
    if (res.status === 401) { setDenied(true); return }
    const j = await res.json() as { clients?: Client[] }
    setClients(j.clients ?? [])
    if (keep) setSel(keep)
  }
  useEffect(() => { load() }, [])

  const c = clients?.find(x => x.id === selected) ?? null

  function pick(cl: Client) {
    setSel(cl.id); setBody(cl.draft?.body ?? ''); setMedia(cl.draft?.media_url ?? ''); setConfirm(false); setMsg(null)
  }

  async function draft() {
    if (!c) return
    setBusy('draft'); setMsg(null)
    try {
      const res = await fetch('/api/admin/notes/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: c.id }) })
      const j = await res.json() as { draft?: string; error?: string }
      if (!res.ok || !j.draft) throw new Error(j.error ?? 'Could not write a draft')
      setBody(j.draft); setConfirm(false)
      setMsg({ text: 'Draft ready. Read it, make it yours, then send.' })
    } catch (e) { setMsg({ text: e instanceof Error ? e.message : 'Could not write a draft', bad: true }) }
    finally { setBusy('') }
  }

  async function submit(action: 'save' | 'send') {
    if (!c) return
    setBusy(action); setMsg(null)
    try {
      const res = await fetch('/api/admin/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: c.id, body, mediaUrl: media, action }) })
      const j = await res.json() as { error?: string; emailed?: boolean }
      if (!res.ok) throw new Error(j.error ?? 'Could not save')
      if (action === 'send') {
        setBody(''); setMedia(''); setConfirm(false)
        setMsg({ text: j.emailed ? `Sent to ${c.name ?? c.email}. It is on their dashboard and in their inbox.` : `Saved to ${c.name ?? c.email}'s dashboard, but the email did not go out.`, bad: !j.emailed })
      } else setMsg({ text: 'Draft saved.' })
      await load(c.id)
    } catch (e) { setMsg({ text: e instanceof Error ? e.message : 'Could not save', bad: true }) }
    finally { setBusy('') }
  }

  const shell: React.CSSProperties = { minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.ink, padding: 'clamp(20px,4vw,40px) clamp(14px,4vw,40px) 80px' }

  if (denied) return (
    <main style={shell}><DashStyles />
      <div className="ov-card" style={{ maxWidth: 460, margin: '12vh auto', padding: 28 }}>
        <h1 style={{ font: `700 24px/1.2 ${T.head}`, margin: '0 0 8px' }}>Admin only</h1>
        <p style={{ font: `400 15px/1.5 ${T.font}`, color: T.muted, margin: '0 0 20px' }}>Log in with the admin email (kwata@idealicp.com) using a login code, then come back to this page.</p>
        <Link className="ov-btn ov-btn-primary" href="/auth?tab=login&next=/admin/notes">Log in</Link>
      </div>
    </main>
  )

  const dueCount = clients?.filter(x => x.due).length ?? 0

  return (
    <main style={shell}><DashStyles />
      <style dangerouslySetInnerHTML={{ __html: `
        .an-grid { display: grid; grid-template-columns: 340px 1fr; gap: 24px; align-items: start; max-width: 1180px; margin: 0 auto; }
        @media (max-width: 860px) { .an-grid { grid-template-columns: 1fr; } }
        .an-area { width: 100%; min-height: 190px; resize: vertical; border: 0; background: none; padding: 18px 20px; font: 400 16px/1.6 ${T.font}; color: ${T.ink}; box-sizing: border-box; }
        .an-area:focus, .an-link:focus { outline: none; }
        .an-link { width: 100%; border: 0; background: none; padding: 16px 20px; font: 400 15px/1.3 ${T.font}; color: ${T.ink}; box-sizing: border-box; }
        .an-stat dt { font: 400 13px/1.3 ${T.font}; color: ${T.faint}; }
        .an-stat dd { margin: 2px 0 0; font: 700 20px/1.2 ${T.head}; color: ${T.ink}; font-variant-numeric: tabular-nums; }
      ` }} />

      <div style={{ maxWidth: 1180, margin: '0 auto 28px' }}>
        <h1 style={{ font: `700 clamp(28px,4.5vw,34px)/1.1 ${T.head}`, letterSpacing: '-0.025em', margin: '0 0 8px' }}>Monthly notes</h1>
        <p style={{ font: `400 17px/1.4 ${T.font}`, color: T.muted, margin: 0 }}>
          {clients === null ? 'Loading your clients.' : clients.length === 0 ? 'No paying clients yet. They will appear here as soon as someone subscribes.' : dueCount === 0 ? 'Everyone has a note from the last 28 days.' : `${dueCount} ${dueCount === 1 ? 'client is' : 'clients are'} due a note.`}
        </p>
      </div>

      {clients && clients.length > 0 && (
        <div className="an-grid">
          <div className="ov-card" style={{ overflow: 'hidden' }}>
            {clients.map((cl, i) => (
              <div key={cl.id} className="ov-item" data-open={selected === cl.id} style={selected === cl.id ? { background: 'rgba(201,192,177,0.18)' } : undefined}>
                {i > 0 && <div className="ov-sep" />}
                <button className="ov-row" onClick={() => pick(cl)} aria-current={selected === cl.id}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="ov-clamp" style={{ fontWeight: 500 }}>{cl.name || cl.email}</span>
                    <span style={{ display: 'block', font: `400 13px/1.35 ${T.font}`, color: T.faint, marginTop: 3 }}>
                      {cap(cl.tier)}{cl.renewsIn !== null ? `, ${cl.cancelled ? 'ends' : 'renews'} in ${cl.renewsIn}d` : ''}
                    </span>
                  </span>
                  <span style={{ font: `600 13px/1 ${T.font}`, color: cl.due ? T.accent : T.faint, whiteSpace: 'nowrap' }}>
                    {cl.due ? 'Due' : `Sent ${day(cl.lastSent!.sent_at)}`}
                  </span>
                </button>
              </div>
            ))}
          </div>

          {!c ? (
            <div className="ov-card" style={{ padding: 28 }}>
              <p style={{ font: `400 16px/1.5 ${T.font}`, color: T.muted, margin: 0 }}>Pick a client to see their numbers and write their note.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <section className="ov-card" style={{ padding: 'clamp(20px,3vw,28px)' }}>
                <h2 className="ov-h2" style={{ marginBottom: 4 }}>{c.name || c.email}</h2>
                <p style={{ font: `400 14px/1.4 ${T.font}`, color: T.muted, margin: '0 0 20px' }}>{[c.company, c.email].filter(Boolean).join(', ')}</p>
                <dl className="an-stat" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 18, margin: '0 0 20px' }}>
                  <div><dt>ICP score</dt><dd>{c.snapshot.score ?? 'None'}{c.snapshot.scoreDelta ? <span style={{ font: `600 14px/1 ${T.font}`, color: c.snapshot.scoreDelta > 0 ? T.good : T.bad }}> {c.snapshot.scoreDelta > 0 ? '+' : ''}{c.snapshot.scoreDelta}</span> : null}</dd></div>
                  <div><dt>Fixes done</dt><dd>{c.snapshot.fixesDone}</dd></div>
                  <div><dt>Weeks logged</dt><dd>{c.snapshot.weeks.length}</dd></div>
                  <div><dt>Last note</dt><dd style={{ fontSize: 16 }}>{c.lastSent ? `${day(c.lastSent.sent_at)}${c.lastSent.read_at ? ', read' : ', unread'}` : 'Never'}</dd></div>
                </dl>
                {c.snapshot.weeks.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', font: `400 14px/1.4 ${T.font}`, fontVariantNumeric: 'tabular-nums' }}>
                    <thead><tr style={{ color: T.faint, textAlign: 'right' }}><th style={{ textAlign: 'left', fontWeight: 400, padding: '6px 0' }}>Week of</th><th style={{ fontWeight: 400 }}>Spend</th><th style={{ fontWeight: 400 }}>Leads</th><th style={{ fontWeight: 400 }}>Sales</th><th style={{ fontWeight: 400 }}>Per lead</th></tr></thead>
                    <tbody>
                      {c.snapshot.weeks.map(w => (
                        <tr key={w.week_start} style={{ borderTop: `1px solid ${T.hairline}`, textAlign: 'right' }}>
                          <td style={{ textAlign: 'left', padding: '8px 0' }}>{weekDay(w.week_start)}</td>
                          <td>{w.currency} {Math.round(w.spend).toLocaleString()}</td><td>{w.leads}</td><td>{w.sales}</td>
                          <td style={{ fontWeight: 600 }}>{w.cpl !== null ? w.cpl.toLocaleString() : 'n/a'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p style={{ font: `400 14px/1.5 ${T.font}`, color: T.muted, margin: 0 }}>No weekly numbers logged yet.</p>}
                {c.snapshot.openFixes.length > 0 && (
                  <p style={{ font: `400 14px/1.55 ${T.font}`, color: T.ink2, margin: '18px 0 0' }}><span style={{ color: T.faint }}>Their first fix: </span>{c.snapshot.openFixes[0]}</p>
                )}
              </section>

              <section aria-labelledby="an-note">
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 4px 12px' }}>
                  <h2 id="an-note" className="ov-h2">Your note</h2>
                  <button className="ov-link" onClick={draft} disabled={busy !== ''}>{busy === 'draft' ? 'Writing a draft' : body ? 'Draft again' : 'Draft it for me'}</button>
                </div>
                <div className="ov-card" style={{ overflow: 'hidden' }}>
                  <textarea className="an-area" aria-label="Note to the client" placeholder={`Hi ${(c.name ?? '').split(' ')[0] || 'there'}, ...`} value={body} maxLength={2000}
                    onChange={e => { setBody(e.target.value); setConfirm(false) }} />
                  {(c.tier === 'pro' || c.tier === 'agency') && (
                    <>
                      <div className="ov-sep" style={{ marginLeft: 0 }} />
                      <input className="an-link" aria-label="Video or voice note link" placeholder="Optional: Loom or voice note link (https://)" value={media} onChange={e => setMedia(e.target.value)} />
                    </>
                  )}
                  <div className="ov-sep" style={{ marginLeft: 0 }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 20px', flexWrap: 'wrap' }}>
                    <p role={msg?.bad ? 'alert' : 'status'} style={{ font: `400 14px/1.45 ${T.font}`, color: msg?.bad ? T.bad : T.muted, margin: 0, flex: '1 1 200px' }}>
                      {msg?.text ?? `${body.trim().split(/\s+/).filter(Boolean).length} words. Aim for 60 to 90.`}
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="ov-btn ov-btn-quiet" disabled={busy !== '' || body.trim().length < 20} onClick={() => submit('save')}>{busy === 'save' ? 'Saving' : 'Save draft'}</button>
                      {confirm
                        ? <button className="ov-btn ov-btn-primary" style={{ background: T.accent }} disabled={busy !== ''} onClick={() => submit('send')}>{busy === 'send' ? 'Sending' : `Yes, send to ${(c.name ?? '').split(' ')[0] || 'client'}`}</button>
                        : <button className="ov-btn ov-btn-primary" disabled={busy !== '' || body.trim().length < 20} style={{ opacity: body.trim().length < 20 ? 0.5 : 1 }} onClick={() => setConfirm(true)}>Send to client</button>}
                    </div>
                  </div>
                </div>
              </section>

              {c.lastSent && (
                <p style={{ font: `400 14px/1.55 ${T.font}`, color: T.muted, margin: '0 4px', whiteSpace: 'pre-wrap' }}>
                  <span style={{ color: T.faint }}>Last note, {day(c.lastSent.sent_at)}: </span>{c.lastSent.body}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  )
}
