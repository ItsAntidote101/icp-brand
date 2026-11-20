'use client'

// "Ready to upload": things a paying client can load straight into Google or
// Meta. The keyword list is built once from their own answers. The Meta files
// are templates they fill with their own customers: those lists never reach us.
import { useEffect, useState } from 'react'
import { ChevronRight, Download, Lock } from 'lucide-react'
import { T } from './overview'
import { buildMetaList, buildMetaSales, columnNames, guessMapping, parseCsv, type Cell, type Field, type Mapping } from '@/lib/customer-list'
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

// Reads the client's own spreadsheet in the browser and hands back the file
// Meta accepts. Nothing from the spreadsheet is sent to our server.
const MAX_BYTES = 10 * 1024 * 1024
const PEOPLE: { field: Field; label: string }[] = [
  { field: 'phone', label: 'Phone' }, { field: 'email', label: 'Email' }, { field: 'name', label: 'Full name' },
  { field: 'fn', label: 'First name' }, { field: 'ln', label: 'Last name' }, { field: 'ct', label: 'Town' },
]
const SALE: { field: Field; label: string }[] = [{ field: 'date', label: 'Sale date' }, { field: 'amount', label: 'Amount' }]
const num = (n: number) => n.toLocaleString('en-US')
const nice = (day: string) => new Date(`${day}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function CustomerListConverter({ ask, kind }: { ask: React.ReactNode; kind: 'customers' | 'sales' }) {
  const sales = kind === 'sales'
  const PICKS = sales ? [...SALE, ...PEOPLE] : PEOPLE
  const [rows, setRows] = useState<Cell[][] | null>(null)
  const [map, setMap]   = useState<Mapping>({})
  const [file, setFile] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const small = { font: `400 14px/1.5 ${T.font}`, color: T.muted, margin: 0 } as const

  async function read(f: File | undefined) {
    if (!f) return
    setError(''); setRows(null); setBusy(true)
    try {
      if (f.size > MAX_BYTES) throw new Error('That file is over 10 MB. Split it into smaller files and try again.')
      const name = f.name.toLowerCase()
      let data: Cell[][]
      if (name.endsWith('.xlsx')) {
        const { readSheet } = await import('read-excel-file/universal')
        data = (await readSheet(f)) as Cell[][]
      } else if (name.endsWith('.csv') || name.endsWith('.txt')) {
        data = parseCsv(await f.text())
      } else {
        throw new Error('Use an Excel file (.xlsx) or a CSV file. If yours is an older .xls, open it and save it as .xlsx first.')
      }
      data = data.filter(r => Array.isArray(r) && r.some(c => c !== null && c !== undefined && String(c).trim() !== ''))
      if (data.length === 0) throw new Error('That file looks empty.')
      setRows(data); setMap(guessMapping(data, sales)); setFile(f.name)
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Could not read that file. Save it again as .xlsx or CSV and try once more.')
    } finally { setBusy(false) }
  }

  const list   = rows && !sales ? buildMetaList(rows, map) : null
  const sold   = rows && sales ? buildMetaSales(rows, map) : null
  const result = list ?? sold
  const left   = sold
    ? [sold.noContact > 0 ? `${num(sold.noContact)} with no usable phone or email` : '', sold.noDate > 0 ? `${num(sold.noDate)} with no date we could read, or a date still to come` : '', sold.noAmount > 0 ? `${num(sold.noAmount)} with no amount` : '', sold.duplicates > 0 ? `${num(sold.duplicates)} listed twice` : '']
    : list
      ? [list.noContact > 0 ? `${num(list.noContact)} with no usable phone or email` : '', list.duplicates > 0 ? `${num(list.duplicates)} repeated` : '']
      : []
  const names  = rows ? columnNames(rows) : []

  return (
    <>
      <p style={small}>{sales
        ? 'Choose the spreadsheet where you record your sales. We turn it into the file Meta accepts, so Meta learns which inquiries became paying customers.'
        : 'Choose the spreadsheet you already keep your customers in. We turn it into the file Meta accepts, with phone numbers and columns fixed for you.'}</p>
      <p style={{ ...small, marginTop: 8, color: T.ink2 }}>Your file is read here on your own device. It is not sent to us or stored anywhere.</p>

      <label className="ov-btn ov-btn-quiet" style={{ marginTop: 12, cursor: 'pointer' }}>
        {busy ? 'Reading…' : rows ? 'Choose a different file' : 'Choose your file'}
        <input type="file" accept=".xlsx,.csv,.txt" onChange={e => { read(e.target.files?.[0]); e.target.value = '' }} style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
      </label>
      {error && <p role="alert" style={{ ...small, color: T.bad, marginTop: 8 }}>{error}</p>}

      {rows && result && (
        <div style={{ background: T.fill, borderRadius: 14, padding: '14px 16px', marginTop: 14 }}>
          <p style={{ font: `600 14px/1.4 ${T.font}`, color: T.ink, margin: '0 0 2px', overflowWrap: 'anywhere' }}>{file}</p>
          <p style={{ ...small, color: T.ink2 }}>
            {sold
              ? <>{num(sold.kept)} of {num(sold.total)} sales ready, worth KES {num(Math.round(sold.value))}{sold.first && sold.last ? (sold.first === sold.last ? `, on ${nice(sold.first)}` : `, from ${nice(sold.first)} to ${nice(sold.last)}`) : ''}.</>
              : list ? <>{num(list.kept)} of {num(list.total)} customers ready: {num(list.withPhone)} with a phone number, {num(list.withEmail)} with an email.</> : null}
          </p>
          {left.some(Boolean) && <p style={{ ...small, marginTop: 4 }}>Left out: {left.filter(Boolean).join(', ')}.</p>}
          {sold && <p style={{ ...small, marginTop: 4 }}>Dates are read day first, as in 18/11/2026. A sale with no time is set to midday.</p>}

          <p style={{ ...small, margin: '12px 0 6px' }}>We matched your columns like this. Change any that are wrong.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', alignItems: 'center' }}>
            {PICKS.map(({ field, label }) => (
              <label key={field} style={{ display: 'contents' }}>
                <span style={{ font: `400 14px/1.3 ${T.font}`, color: T.ink2 }}>{label}</span>
                <select
                  value={map[field] ?? -1}
                  onChange={e => { const v = Number(e.target.value); setMap(m => { const n = { ...m }; if (v < 0) delete n[field]; else n[field] = v; return n }) }}
                  style={{ font: `400 14px/1.3 ${T.font}`, color: T.ink, background: '#fff', border: `1px solid ${T.hairline}`, borderRadius: 10, padding: '8px 10px', minWidth: 0, width: '100%' }}
                >
                  <option value={-1}>Not in my file</option>
                  {names.map((n, i) => <option key={i} value={i}>{n}</option>)}
                </select>
              </label>
            ))}
          </div>

          {result.kept === 0
            ? <p role="alert" style={{ ...small, color: T.bad, marginTop: 12 }}>{sales ? 'Nothing is ready yet. Each sale needs a date, an amount and a phone number or email. Pick the right columns above.' : 'We could not find a phone number or email column. Pick the right columns above.'}</p>
            : (
              <button className="ov-btn ov-btn-primary" style={{ marginTop: 14 }} onClick={() => save(sales ? 'meta-offline-sales.csv' : 'meta-customer-list.csv', result.csv)}>
                <Download size={15} /> Download for Meta
              </button>
            )}
        </div>
      )}

      <p style={{ ...small, marginTop: 14 }}>{sales
        ? 'Then upload it in Meta Events Manager under your dataset. Meta asks you to confirm each column. Upload every week or two, because Meta only uses recent sales.'
        : 'Then upload it in Meta Ads Manager under Audiences, Custom audience, Customer list. Only upload customers who gave you their details themselves.'}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 18px', marginTop: 10 }}>
        <button className="ov-link" style={{ fontSize: 14 }} onClick={() => (sales ? save('meta-offline-sales-template.csv', META_OFFLINE_EVENTS_CSV) : save('meta-customer-list-template.csv', META_CUSTOMER_LIST_CSV))}>Or start from an empty template</button>
        {ask}
      </div>
    </>
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
      title: 'Meta customer list from your spreadsheet',
      sub: 'Reach your past customers and people like them',
      body: <CustomerListConverter ask={ask} kind="customers" />,
    },
    {
      title: 'Meta sales file from your spreadsheet',
      sub: 'Tell Meta which inquiries became sales',
      body: <CustomerListConverter ask={ask} kind="sales" />,
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
