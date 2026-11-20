'use client'

// "Ready to upload": things a paying client can load straight into Google or
// Meta. The keyword list is built once from their own answers. The Meta files
// are templates they fill with their own customers: those lists never reach us.
import { useEffect, useState } from 'react'
import { ChevronRight, Download, Lock } from 'lucide-react'
import { T } from './overview'
import { keywordsCsv, keywordsText, META_CUSTOMER_LIST_CSV, META_OFFLINE_EVENTS_CSV, type KeywordSet } from '@/lib/ready-files'

function save(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url; a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function CopyLink({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button className="ov-link" style={{ fontSize: 14 }}
      onClick={() => { navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1800) }).catch(() => {}) }}>
      {done ? 'Copied' : label}
    </button>
  )
}

export default function ReadyToUpload({ tier, reportId, buyerName, onUpgrade, onMessage }: {
  tier: string; reportId: string; buyerName: string; onUpgrade: () => void; onMessage: () => void
}) {
  const paid = tier !== 'free'
  // Read the shared tokens here, not at module load: overview.tsx imports this file
  const small = { font: `400 14px/1.5 ${T.font}`, color: T.muted, margin: 0 } as const
  const rules = { ...small, margin: '10px 0 0', paddingLeft: 18, display: 'grid', gap: 4 } as const
  const [open, setOpen] = useState<number | null>(null)
  const [set, setSet]   = useState<KeywordSet | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!paid) return
    let live = true
    fetch(`/api/ready/keywords?reportId=${encodeURIComponent(reportId)}`)
      .then(r => (r.ok ? r.json() : null))
      .then((d: { set?: KeywordSet | null } | null) => { if (live && d?.set) setSet(d.set) })
      .catch(() => {})
    return () => { live = false }
  }, [paid, reportId])

  async function build() {
    if (busy) return
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/ready/keywords', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportId }) })
      const d = await res.json().catch(() => ({})) as { set?: KeywordSet; error?: string }
      if (!res.ok || !d.set) throw new Error(d.error || 'Could not build the list just now. Please try again.')
      setSet(d.set)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not build the list just now. Please try again.')
    } finally { setBusy(false) }
  }

  const ask = <button className="ov-link" style={{ fontSize: 14 }} onClick={onMessage}>Ask {buyerName} to check this</button>

  const items: { title: string; sub: string; body: React.ReactNode }[] = [
    {
      title: 'Google keywords and words to block',
      sub: set ? `${set.groups.reduce((n, g) => n + g.keywords.length, 0)} keywords, ${set.negatives.length} blocked words` : 'Built from your answers',
      body: !set ? (
        <>
          <p style={small}>A starter list for Google Search, built from what you told us you sell and who buys it. It has no search volume figures, because we have no honest source for them.</p>
          <button className="ov-btn ov-btn-quiet" onClick={build} disabled={busy} style={{ marginTop: 12 }}>{busy ? 'Building…' : 'Build my list'}</button>
          {error && <p role="alert" style={{ ...small, color: T.bad, marginTop: 8 }}>{error}</p>}
        </>
      ) : (
        <>
          {set.groups.map((g, i) => (
            <div key={i} style={{ background: T.fill, borderRadius: 14, padding: '12px 14px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
                <span style={{ font: `600 14px/1.3 ${T.font}`, color: T.ink }}>{g.name}</span>
                <CopyLink text={keywordsText(g)} />
              </div>
              <p style={{ font: `400 14px/1.6 ${T.font}`, color: T.ink2, margin: 0, whiteSpace: 'pre-wrap' }}>{keywordsText(g)}</p>
            </div>
          ))}
          {set.negatives.length > 0 && (
            <div style={{ background: T.fill, borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
                <span style={{ font: `600 14px/1.3 ${T.font}`, color: T.ink }}>Words to block</span>
                <CopyLink text={set.negatives.join('\n')} />
              </div>
              <p style={{ font: `400 14px/1.6 ${T.font}`, color: T.ink2, margin: 0 }}>{set.negatives.join(', ')}</p>
            </div>
          )}
          <ul style={rules}>
            <li>&quot;Quotes&quot; mean phrase match and [brackets] mean exact match. Paste them into Google Ads as they are.</li>
            <li>The file is for Google Ads Editor: Account, Import, From file. Change the Campaign column to your campaign&apos;s exact name first, or Editor creates a new campaign.</li>
            <li>This is a starting list. Check your search terms after a week and block what does not fit.</li>
          </ul>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 18px', marginTop: 14 }}>
            <button className="ov-btn ov-btn-quiet" onClick={() => save('google-keywords.csv', keywordsCsv(set))}><Download size={15} /> Download the file</button>
            {ask}
          </div>
        </>
      ),
    },
    {
      title: 'Meta customer list template',
      sub: 'Reach your past customers and people like them',
      body: (
        <>
          <p style={small}>Fill it with your own customers, then upload it in Meta Ads Manager under Audiences, Custom audience, Customer list. Your list goes straight from you to Meta. We never see it.</p>
          <ul style={rules}>
            <li>One customer per row. Delete the two example rows first.</li>
            <li>Phone numbers start with the country code and have no plus or leading zero: 254712345678.</li>
            <li>Put KE in the country column on every row. Leave a cell empty if you do not have that detail.</li>
          </ul>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 18px', marginTop: 14 }}>
            <button className="ov-btn ov-btn-quiet" onClick={() => save('meta-customer-list-template.csv', META_CUSTOMER_LIST_CSV)}><Download size={15} /> Download the template</button>
            {ask}
          </div>
        </>
      ),
    },
    {
      title: 'Meta offline sales template',
      sub: 'Tell Meta which inquiries became sales',
      body: (
        <>
          <p style={small}>For sales that closed by phone, on WhatsApp or in person. Upload it in Meta Events Manager under your dataset. Meta asks you to match each column when you upload.</p>
          <ul style={rules}>
            <li>Use Purchase for a sale and Lead for a serious inquiry.</li>
            <li>Give the date and time the sale happened, in the format shown.</li>
            <li>A Purchase row needs the amount and KES. Delete the two example rows first.</li>
          </ul>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 18px', marginTop: 14 }}>
            <button className="ov-btn ov-btn-quiet" onClick={() => save('meta-offline-sales-template.csv', META_OFFLINE_EVENTS_CSV)}><Download size={15} /> Download the template</button>
            {ask}
          </div>
        </>
      ),
    },
  ]

  return (
    <section aria-labelledby="ov-ready">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 4px 12px' }}>
        <h2 id="ov-ready" className="ov-h2">Ready to upload</h2>
        {!paid && <span style={{ font: `400 15px/1 ${T.font}`, color: T.muted }}>On Starter</span>}
      </div>
      <div className="ov-card" style={{ overflow: 'hidden' }}>
        {items.map((it, i) => {
          const isOpen = paid && open === i
          return (
            <div key={i} className="ov-item" data-open={isOpen}>
              {i > 0 && <div className="ov-sep" style={{ marginLeft: 20 }} />}
              <button className="ov-row" onClick={() => (paid ? setOpen(isOpen ? null : i) : onUpgrade())} aria-expanded={paid ? isOpen : undefined} style={{ alignItems: 'flex-start' }}>
                {!paid && <Lock size={15} color={T.faint} style={{ flexShrink: 0, marginTop: 3, marginLeft: -3 }} />}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="ov-clamp" style={{ fontWeight: 500, color: paid ? T.ink : T.ink2 }}>{it.title}</span>
                  <span style={{ display: 'block', font: `400 13px/1.3 ${T.font}`, color: T.faint, marginTop: 3 }}>{it.sub}</span>
                </span>
                <ChevronRight size={18} className={paid ? 'ov-chev' : undefined} color={paid ? undefined : T.faint} />
              </button>
              {paid && (
                <div className="ov-disc" aria-hidden={!isOpen}>
                  <div><div className="ov-detail" style={{ paddingLeft: 20 }}>{it.body}</div></div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
