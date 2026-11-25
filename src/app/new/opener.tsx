'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { rangeKind, rangeNumber } from '@/lib/answers'

// The first screen of the site is the diagnosis itself, already started.
// Every figure shown is plain arithmetic on what the visitor just tapped:
// nothing here is a statistic about other businesses. The answers use the
// same ids and the same wording as the questionnaire, so they carry over.

export const OPENER_KEY = 'icp_opener_answers'

const SPEND = ['Under KES 20,000', 'KES 20,000 to 50,000', 'KES 50,000 to 100,000', 'KES 100,000 to 250,000', 'KES 250,000 to 500,000', 'Over KES 500,000']
const SALE  = ['Under KES 5,000', 'KES 5,000 to 20,000', 'KES 20,000 to 100,000', 'KES 100,000 to 500,000', 'KES 500,000 to 2,000,000', 'Over KES 2,000,000']

type Answers = Record<number, string>
type Step = 'ads' | 'spend' | 'inquiries' | 'buyers' | 'worth' | 'done' | 'notyet'

const tidy = (n: number) => {
  const r = n >= 10000 ? Math.round(n / 100) * 100 : n >= 1000 ? Math.round(n / 10) * 10 : Math.round(n)
  return `KES ${r.toLocaleString('en-KE')}`
}
/** A figure built on a range answer, worded the way the range allows. */
const approx = (v: string, times: number) => {
  const n = rangeNumber(v); if (!n) return ''
  const k = rangeKind(v)
  return k === 'over' ? `at least ${tidy(n * times)}` : k === 'under' ? `up to ${tidy(n * 2 * times)}` : `about ${tidy(n * times)}`
}

export default function Opener() {
  const [a, setA] = useState<Answers>({})
  const [step, setStep] = useState<Step>('ads')
  const [typed, setTyped] = useState('')
  const [warn, setWarn] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const moved = useRef(false)

  // Keep the newest line in view inside the card, but never scroll the page
  // before the visitor has touched anything.
  useEffect(() => {
    if (!moved.current) return
    const log = end.current?.parentElement
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [step])

  // Pick the conversation up from answers saved earlier in this visit, or
  // from the floating bar, which saves the first answer and then signals.
  useEffect(() => {
    const restore = () => {
      let saved: Answers = {}
      try { saved = JSON.parse(sessionStorage.getItem(OPENER_KEY) ?? '{}') ?? {} } catch { return }
      if (!saved[27]) return
      setA(saved); setTyped(''); setWarn('')
      setStep(saved[27] === 'Not yet' ? 'notyet' : !saved[13] ? 'spend' : !saved[14] ? 'inquiries' : !saved[35] ? 'buyers' : !saved[6] ? 'worth' : 'done')
    }
    restore()
    window.addEventListener('icp-ask', restore)
    return () => window.removeEventListener('icp-ask', restore)
  }, [])

  const save = (next: Answers) => {
    try { sessionStorage.setItem(OPENER_KEY, JSON.stringify(next)) } catch { /* private mode: the questions are simply asked again */ }
    window.dispatchEvent(new Event('icp-opener-changed'))
  }
  const answer = (id: number, value: string, to: Step) => {
    moved.current = true
    const next = { ...a, [id]: value }
    setA(next); save(next); setTyped(''); setWarn(''); setStep(to)
  }
  const restart = () => { setA({}); setStep('ads'); setTyped(''); setWarn(''); try { sessionStorage.removeItem(OPENER_KEY) } catch { /* nothing to clear */ } window.dispatchEvent(new Event('icp-opener-changed')) }

  const inquiries = Number(a[14] ?? 0)
  const buyers    = Number(a[35] ?? 0)

  const submitNumber = (id: 14 | 35) => {
    const n = Math.round(Number(typed))
    if (!typed.trim() || !Number.isFinite(n) || n < 0) { setWarn('Type a number. A rough one is fine.'); return }
    if (id === 14 && n < 1) { setWarn('Put at least 1. If the ads bring nothing yet, choose a rough guess.'); return }
    if (id === 35 && n > inquiries) { setWarn(`That is more than the ${inquiries} inquiries you entered.`); return }
    answer(id, String(n), id === 14 ? 'buyers' : 'worth')
  }

  const said = (text: string) => <p className="op-bub op-me">{text}</p>
  const asked = (text: React.ReactNode) => <p className="op-bub op-eu">{text}</p>
  const sum = (text: React.ReactNode) => <p className="op-sum">{text}</p>

  const past = (s: Step) => ['ads', 'spend', 'inquiries', 'buyers', 'worth', 'done'].indexOf(step) > ['ads', 'spend', 'inquiries', 'buyers', 'worth', 'done'].indexOf(s)
  const buyerChips = [0, 1, 2, 5, 10, 20].filter(n => n <= inquiries)

  return (
    <div className="op" aria-label="Start your diagnosis">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="op-top">
        <span className="op-ava" aria-hidden="true"><MessageCircle size={19} /></span>
        <div>
          <p className="op-name">Ideal ICP media buyer</p>
          <p className="op-role">Nairobi. The questions we ask every new client.</p>
        </div>
      </div>

      <div className="op-log" aria-live="polite">
        {asked('Are you running paid ads right now?')}
        {a[27] && said(a[27])}

        {step === 'notyet' && asked('Good. Before the first shilling is the cheapest time to get this right. Nine more questions and you get a launch plan.')}

        {a[27] && step !== 'notyet' && asked('How much goes into ads in a month?')}
        {a[13] && said(a[13])}

        {a[13] && asked('And how many inquiries does that bring? Calls, WhatsApp and forms together.')}
        {a[14] && said(`${inquiries} a month`)}
        {a[14] && sum(<>That is <strong>{approx(a[13], 1 / inquiries)}</strong> for each inquiry.</>)}

        {a[14] && asked(`Of those ${inquiries}, how many end up buying?`)}
        {a[35] && said(buyers === 0 ? 'None yet' : `${buyers} a month`)}
        {a[35] && (buyers === 0
          ? sum(<>So far the ads have paid for conversations, <strong>not customers</strong>.</>)
          : sum(<>Each sale is costing you <strong>{approx(a[13], 1 / buyers)}</strong> in ads. {inquiries - buyers} of your {inquiries} inquiries did not buy.</>))}

        {a[35] && asked('Last one. What is one sale worth to you?')}
        {a[6] && said(a[6])}
        {a[6] && sum(<>If one more in every ten inquiries bought, that is <strong>{approx(a[6], inquiries * 0.1)}</strong> more in sales a month, from the same ad budget.</>)}

        {step === 'done' && asked(buyers * 2 >= inquiries
          ? 'Most of your inquiries buy. Five more questions and your report shows what to protect before you spend more.'
          : 'Before more budget, find where those inquiries are lost. Five more questions and your report shows where, with the first fixes.')}
        <div ref={end} />
      </div>

      <div className="op-ask">
        {step === 'ads' && (
          <div className="op-chips">
            <button type="button" onClick={() => answer(27, 'Yes', 'spend')}>Yes</button>
            <button type="button" onClick={() => answer(27, 'I used to', 'spend')}>I used to</button>
            <button type="button" onClick={() => answer(27, 'Not yet', 'notyet')}>Not yet</button>
          </div>
        )}
        {step === 'spend' && (
          <div className="op-chips">{SPEND.map(o => <button type="button" key={o} onClick={() => answer(13, o, 'inquiries')}>{o}</button>)}</div>
        )}
        {step === 'inquiries' && (
          <>
            <div className="op-chips">{[10, 25, 50, 100, 200].map(n => <button type="button" key={n} onClick={() => answer(14, String(n), 'buyers')}>About {n}</button>)}</div>
            <form className="op-type" onSubmit={e => { e.preventDefault(); submitNumber(14) }}>
              <label htmlFor="op-inq">Or type the number</label>
              <div><input id="op-inq" inputMode="numeric" pattern="[0-9]*" value={typed} onChange={e => setTyped(e.target.value)} /><button type="submit">Next</button></div>
            </form>
          </>
        )}
        {step === 'buyers' && (
          <>
            <div className="op-chips">{buyerChips.map(n => <button type="button" key={n} onClick={() => answer(35, String(n), 'worth')}>{n === 0 ? 'None yet' : n}</button>)}</div>
            <form className="op-type" onSubmit={e => { e.preventDefault(); submitNumber(35) }}>
              <label htmlFor="op-buy">Or type the number</label>
              <div><input id="op-buy" inputMode="numeric" pattern="[0-9]*" value={typed} onChange={e => setTyped(e.target.value)} /><button type="submit">Next</button></div>
            </form>
          </>
        )}
        {step === 'worth' && (
          <div className="op-chips">{SALE.map(o => <button type="button" key={o} onClick={() => answer(6, o, 'done')}>{o}</button>)}</div>
        )}
        {(step === 'done' || step === 'notyet') && (
          <Link href="/questionnaire" className="op-go">
            {step === 'notyet' ? 'Build my launch plan' : buyers * 2 >= inquiries ? 'See my full report' : 'Show me where they are lost'}<ArrowRight size={18} aria-hidden="true" />
          </Link>
        )}
        {warn && <p className="op-warn" role="alert">{warn}</p>}
        {past('ads') || step === 'notyet' ? <button type="button" className="op-again" onClick={restart}>Start again</button> : null}
      </div>
    </div>
  )
}

const css = `
.op{background:#fff;border-radius:18px;width:min(100%,440px);box-shadow:0 24px 60px -28px rgba(32,21,21,.45);display:grid;position:relative;text-align:left}
.op-top{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid var(--line)}
.op-ava{flex-shrink:0;width:40px;height:40px;border-radius:50%;background:var(--navy);color:#fff;display:grid;place-items:center;font:700 16px/1 var(--head)}
.oh .op-name{font:600 15px/1.2 var(--body)}
.oh .op-role{font-size:13px;line-height:1.35;color:var(--muted);margin-top:2px}
.op-log{display:grid;gap:9px;padding:16px 18px 6px;max-height:min(52vh,430px);overflow-y:auto;overscroll-behavior:contain}
.oh .op-bub{font-size:15.5px;line-height:1.4;padding:10px 13px;border-radius:16px;max-width:88%}
.oh .op-eu{background:#f3efe9;border-bottom-left-radius:5px;justify-self:start}
.oh .op-me{background:var(--navy);color:#fff;border-bottom-right-radius:5px;justify-self:end}
.oh .op-sum{font-size:15.5px;line-height:1.45;background:var(--blush);border-left:3px solid var(--accent);padding:11px 13px;border-radius:4px 10px 10px 4px}
.oh .op-sum strong{font-weight:700;color:var(--ink)}
.op-ask{padding:12px 18px 18px;display:grid;gap:10px}
.op-chips{display:flex;flex-wrap:wrap;gap:8px}
.op-chips button{min-height:46px;padding:0 16px;border-radius:99px;border:1.5px solid var(--ink);background:#fff;color:var(--ink);font:500 15px/1 var(--body);cursor:pointer;transition:background .15s,color .15s}
.op-chips button:hover{background:var(--ink);color:#fff}
.op-type label{display:block;font-size:13px;color:var(--muted);margin-bottom:6px}
.op-type div{display:flex;gap:8px}
.op-type input{flex:1;min-width:0;height:46px;padding:0 14px;border-radius:8px;border:1.5px solid var(--line);font:500 16px/1 var(--body);color:var(--ink);background:#fff}
.op-type button{height:46px;padding:0 18px;border-radius:8px;border:0;background:var(--navy);color:#fff;font:600 15px/1 var(--body);cursor:pointer}
.op-go{display:flex;align-items:center;justify-content:center;gap:10px;min-height:54px;border-radius:8px;background:var(--accent);color:#fff!important;font:600 16px/1 var(--body);text-decoration:none}
.op-go:hover{background:#c92a06}
.oh .op-warn{font-size:14px;color:#b42318}
.op-again{justify-self:start;background:none;border:0;padding:6px 0;font:500 13.5px/1 var(--body);color:var(--muted);text-decoration:underline;cursor:pointer}
`
