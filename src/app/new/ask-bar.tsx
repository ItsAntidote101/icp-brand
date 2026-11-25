'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { loadOpener, loadProgress, saveOpener } from '@/lib/resume'

// A floating bar that carries the first question of the diagnosis onto every
// page. Tapping an answer starts the same conversation the home page opens
// with; nothing here talks to a server. It stays out of the way: it appears
// after a short scroll, hides while the conversation itself is on screen,
// and can be closed for the rest of the visit.

const CLOSED_KEY = 'icp_ask_closed'
const ANSWERS = ['Yes', 'I used to', 'Not yet']

export default function AskBar({ home, startHref }: { home: boolean; startHref: string }) {
  const [show, setShow] = useState(false)
  const [started, setStarted] = useState(false)
  const [closed, setClosed] = useState(true)
  const [inQuestions, setInQuestions] = useState(false)   // they got past the conversation last time

  useEffect(() => {
    let wasClosed = false
    try {
      wasClosed = sessionStorage.getItem(CLOSED_KEY) === '1'
    } catch { /* storage unavailable: behave as a first visit */ }
    setClosed(wasClosed)
    setStarted(Boolean(loadOpener()[27]) || Boolean(loadProgress()))
    setInQuestions(Boolean(loadProgress()))
    if (wasClosed) return

    const start = document.getElementById('start')
    let overStart = false
    const io = start ? new IntersectionObserver(([e]) => { overStart = e.isIntersecting; update() }, { threshold: 0.2 }) : null
    if (start && io) io.observe(start)
    const update = () => setShow(window.scrollY > 520 && !overStart)
    update()
    window.addEventListener('scroll', update, { passive: true })
    const sync = () => setStarted(Boolean(loadOpener()[27]) || Boolean(loadProgress()))
    window.addEventListener('icp-opener-changed', sync)
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('icp-opener-changed', sync); io?.disconnect() }
  }, [])

  // Tell the small "Cookie settings" button how tall this bar is, so on narrow
  // screens it can sit above it and never underneath.
  const barRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = barRef.current
    const root = document.documentElement
    if (!el || !show || closed) { root.style.removeProperty('--ab-h'); return }
    const fit = () => root.style.setProperty('--ab-h', `${el.offsetHeight + 10}px`)
    fit()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null
    ro?.observe(el)
    return () => { ro?.disconnect(); root.style.removeProperty('--ab-h') }
  }, [show, closed])

  const go = () => {
    if (inQuestions) { window.location.href = '/questionnaire'; return }
    if (home) document.getElementById('start')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
    else window.location.href = startHref
  }
  const pick = (value: string) => {
    saveOpener({ 27: value })
    window.dispatchEvent(new Event('icp-ask'))
    go()
  }
  const close = () => { setClosed(true); try { sessionStorage.setItem(CLOSED_KEY, '1') } catch { /* fine */ } }

  if (closed) return null
  return (
    <div ref={barRef} className={`ab${show ? ' ab-in' : ''}`} role="region" aria-label="Start your diagnosis" aria-hidden={!show}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <span className="ab-glow" aria-hidden="true" />
      <div className="ab-body">
        <p className="ab-q"><i aria-hidden="true" />{started ? 'Your diagnosis is waiting where you stopped.' : 'Are you running paid ads right now?'}</p>
        <div className="ab-acts">
          {started
            ? <button type="button" className="ab-go" tabIndex={show ? 0 : -1} onClick={go}>Carry on<ArrowRight size={16} aria-hidden="true" /></button>
            : ANSWERS.map(a => <button key={a} type="button" tabIndex={show ? 0 : -1} onClick={() => pick(a)}>{a}</button>)}
        </div>
      </div>
      <button type="button" className="ab-x" aria-label="Close" tabIndex={show ? 0 : -1} onClick={close}><X size={18} aria-hidden="true" /></button>
    </div>
  )
}

const css = `
.ab{position:fixed;z-index:50;left:50%;bottom:max(14px,env(safe-area-inset-bottom));width:min(720px,calc(100% - 24px));transform:translate(-50%,calc(100% + 30px));opacity:0;transition:transform .5s cubic-bezier(.2,.8,.2,1),opacity .3s ease;
  display:flex;align-items:center;gap:6px;padding:10px 8px 10px 18px;border-radius:22px;color:#fff;background:rgba(23,15,15,.9);backdrop-filter:blur(16px) saturate(1.3);-webkit-backdrop-filter:blur(16px) saturate(1.3);box-shadow:0 24px 60px -18px rgba(23,15,15,.6),inset 0 0 0 1px rgba(255,255,255,.1)}
.ab.ab-in{transform:translate(-50%,0);opacity:1}
.ab-glow{position:absolute;inset:-1.5px;border-radius:23.5px;padding:1.5px;pointer-events:none;background:linear-gradient(100deg,rgba(255,122,69,0) 0%,#ff7a45 30%,#e8330a 50%,rgba(232,51,10,0) 72%);background-size:260% 100%;animation:ab-run 5.5s linear infinite;
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
@keyframes ab-run{from{background-position:130% 0}to{background-position:-130% 0}}
.ab-body{flex:1;min-width:0;display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px}
.oh .ab-q{flex:1 1 220px;margin:0;display:flex;align-items:center;gap:11px;font:500 16px/1.3 var(--body);color:#fff}
.ab-q i{flex-shrink:0;width:9px;height:9px;border-radius:50%;background:#ff5a1f;box-shadow:0 0 0 0 rgba(255,90,31,.6);animation:ab-beat 2.2s ease-out infinite}
@keyframes ab-beat{to{box-shadow:0 0 0 11px rgba(255,90,31,0)}}
.ab-acts{display:flex;gap:8px}
.ab-acts button{min-height:44px;padding:0 16px;border-radius:99px;border:1.5px solid rgba(255,255,255,.34);background:transparent;color:#fff;font:600 15px/1 var(--body);white-space:nowrap;cursor:pointer;transition:background .15s,border-color .15s,color .15s}
.ab-acts button:hover{background:#fff;border-color:#fff;color:#201515}
.ab-acts .ab-go{display:inline-flex;align-items:center;gap:8px;background:#e8330a;border-color:#e8330a}
.ab-acts .ab-go:hover{background:#fff;border-color:#fff}
.ab-x{flex-shrink:0;width:44px;height:44px;display:grid;place-items:center;border:0;border-radius:50%;background:transparent;color:rgba(255,255,255,.6);cursor:pointer}
.ab-x:hover{color:#fff;background:rgba(255,255,255,.1)}
.ab button:focus-visible{outline:3px solid #ff7a45;outline-offset:2px}
@media (prefers-reduced-motion:reduce){.ab{transition:opacity .2s}.ab-glow,.ab-q i{animation:none}}
`
