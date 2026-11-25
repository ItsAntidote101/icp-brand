'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

// The home hero. The dark line changes every few seconds while the coloured
// headline stays put, and the panels beside it move on to match. The three
// panels are drawn in code: each is one scene an owner will recognise.
//
// The panels stand like steps. The one in play is the tall wide one, the one
// just shown stays beside it as a middle strip with its scene under a colour
// wash, and the one coming next is the short thin strip. On each turn all
// three change width and height together.
// It stops turning while someone hovers or tabs into it, and never turns on
// its own for visitors who ask their device for less motion.

type Props = {
  eyebrow?: string
  lines: string[]
  headline: string
  text?: string
  primary?: { text: string; href: string }
  secondary?: { text: string; href: string }
}

const CAPTIONS = ['The price, then nothing', 'The 11pm form', 'Likes, but no deposit']
const TURN_MS = 5200

function ChatScene() {
  return (
    <svg viewBox="0 0 360 440" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="360" height="440" fill="#201515" />
      <g className="hs-fit">
      <g className="hs-pop hs-d1">
        <rect x="26" y="64" width="176" height="56" rx="19" fill="#fff" />
        <text x="48" y="100" className="hs-t" fontSize="21" fontWeight="600" fill="#201515">How much?</text>
      </g>
      <g className="hs-pop hs-d2">
        <rect x="150" y="140" width="184" height="62" rx="19" fill="#e8330a" />
        <rect x="172" y="160" width="112" height="9" rx="4.5" fill="#fff" opacity=".95" />
        <rect x="172" y="177" width="74" height="9" rx="4.5" fill="#fff" opacity=".7" />
        <path d="M296 180l5 5 10-11M304 185l2 0 10-11" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <text x="334" y="226" textAnchor="end" className="hs-t hs-pop hs-d3" fontSize="14" fill="#8a7d70">Seen</text>
      <g className="hs-pop hs-d4" opacity=".55">
        <rect x="26" y="252" width="88" height="48" rx="19" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="2" strokeDasharray="5 6" />
        <circle cx="52" cy="276" r="4" fill="#fff" opacity=".5" /><circle cx="70" cy="276" r="4" fill="#fff" opacity=".35" /><circle cx="88" cy="276" r="4" fill="#fff" opacity=".2" />
      </g>
      </g>
    </svg>
  )
}
function FormScene() {
  return (
    <svg viewBox="0 0 360 440" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="360" height="440" fill="#fbe4d8" />
      <g className="hs-fit">
      <g className="hs-pop hs-d1">
        <rect x="38" y="52" width="284" height="214" rx="20" fill="#fff" />
        <path d="M78 84a15 15 0 1 0 13 22 12 12 0 0 1-13-22z" fill="#201515" />
        <text x="104" y="101" className="hs-t" fontSize="19" fontWeight="600" fill="#201515">11:04 pm</text>
        <rect x="62" y="128" width="236" height="14" rx="7" fill="#efe8e0" />
        <rect x="62" y="154" width="190" height="14" rx="7" fill="#efe8e0" />
        <rect x="62" y="180" width="214" height="14" rx="7" fill="#efe8e0" />
        <rect x="62" y="212" width="112" height="34" rx="9" fill="#e8330a" />
      </g>
      <g className="hs-pop hs-d3">
        <rect x="38" y="286" width="284" height="56" rx="18" fill="#201515" />
        <path d="M66 304c0 12 9 21 21 21l4-6-7-4-3 3c-3-1-6-4-7-7l3-3-4-7z" fill="#fff" />
        <text x="104" y="320" className="hs-t" fontSize="15.5" fontWeight="500" fill="#fff">Called back two days later</text>
      </g>
      </g>
    </svg>
  )
}
function LikesScene() {
  return (
    <svg viewBox="0 0 360 440" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="360" height="440" fill="#f8f4f0" />
      <g className="hs-fit">
      <g className="hs-pop hs-d1">
        <rect x="38" y="46" width="284" height="238" rx="20" fill="#fff" />
        <rect x="56" y="64" width="248" height="140" rx="12" fill="#fbe4d8" />
        <circle cx="258" cy="104" r="18" fill="#e8330a" />
        <path d="M56 204l66-76 48 44 34-30 100 62z" fill="#f3c9b5" />
        <path d="M78 232c-7-7-18 1-12 11l12 12 12-12c6-10-5-18-12-11z" fill="#e8330a" />
        <text x="104" y="252" className="hs-t" fontSize="21" fontWeight="700" fill="#201515">200 likes</text>
      </g>
      <g className="hs-pop hs-d3">
        <rect x="38" y="302" width="284" height="56" rx="18" fill="none" stroke="#201515" strokeWidth="2.5" strokeDasharray="7 7" />
        <circle cx="76" cy="330" r="14" fill="none" stroke="#201515" strokeWidth="2.5" />
        <rect x="74.5" y="323" width="3" height="14" rx="1.5" fill="#201515" />
        <text x="104" y="336" className="hs-t" fontSize="17" fontWeight="500" fill="#201515">No deposit</text>
      </g>
      </g>
    </svg>
  )
}
const SCENES = [ChatScene, FormScene, LikesScene]

export default function HeroStage({ eyebrow, lines, headline, text, primary, secondary }: Props) {
  const count = Math.min(lines.length, SCENES.length) || 1
  const [on, setOn] = useState(0)
  const held = useRef(false)

  useEffect(() => {
    if (count < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => { if (!held.current && !document.hidden) setOn(i => (i + 1) % count) }, TURN_MS)
    return () => window.clearInterval(id)
  }, [count])

  const hold = (v: boolean) => () => { held.current = v }

  return (
    <section className="hs" onMouseEnter={hold(true)} onMouseLeave={hold(false)} onFocus={hold(true)} onBlur={hold(false)}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="ic-wrap hs-in">
        <div className="hs-copy">
          {eyebrow && <p className="ic-eye">{eyebrow}</p>}
          {lines.length > 0 && (
            <p className="hs-lines" aria-live="off">
              {lines.slice(0, count).map((l, i) => <span key={l} className={i === on ? 'hs-on' : ''} aria-hidden={i !== on}>{l}</span>)}
            </p>
          )}
          <h1 className="hs-h1">{headline}</h1>
          {text && <p className="ic-p">{text}</p>}
          <p className="hs-acts">
            {primary && <Link href={primary.href} className="ic-btn">{primary.text}<ArrowRight size={18} aria-hidden="true" /></Link>}
            {secondary && <Link href={secondary.href} className="ic-btn ic-btn-line">{secondary.text}</Link>}
          </p>
        </div>

        <div className="hs-panels" role="group" aria-label="Three ways an inquiry is lost">
          {SCENES.slice(0, count).map((Scene, i) => {
            const step = (i - on + count) % count            // 0 in play, last = just shown, others = coming up
            const role = step === 0 ? 'hs-open' : step === count - 1 ? 'hs-prev' : 'hs-next'
            return (
              <div key={i} className={`hs-panel ${role}`}>
                <span className="hs-scene"><Scene /></span>
                <span className="hs-strip" aria-hidden="true" />
                <span className="hs-cap">{CAPTIONS[i]}</span>
                <button type="button" className="hs-hit" aria-pressed={step === 0} aria-label={CAPTIONS[i]} onClick={() => setOn(i)} />
                {primary && (
                  <Link href={primary.href} className="hs-go" tabIndex={step === 0 ? 0 : -1} aria-hidden={step !== 0} aria-label={primary.text}>
                    <ArrowRight size={20} aria-hidden="true" />
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {count > 1 && <div className="ic-wrap"><div className="hs-ticks" aria-hidden="true">{[...Array(count)].map((_, i) => <i key={i} className={i === on ? 'hs-on' : ''} />)}</div></div>}
    </section>
  )
}

const css = `
.ic .hs{padding:clamp(22px,4vw,48px) 0 clamp(26px,4vw,48px);overflow:hidden}
.hs-in{display:grid;gap:30px;align-items:center}
.hs-lines{display:grid;margin:0 0 4px}
.hs-lines span{grid-area:1/1;font:500 clamp(30px,4.6vw,52px)/1.08 var(--head);letter-spacing:-.03em;color:var(--ink);opacity:0;transform:translateY(14px);transition:opacity .5s ease,transform .6s cubic-bezier(.2,.7,.2,1)}
.hs-lines span.hs-on{opacity:1;transform:none}
.ic .hs-h1{font:700 clamp(30px,4.6vw,52px)/1.08 var(--head);letter-spacing:-.03em;background:linear-gradient(92deg,#ff5a1f 0%,#e8330a 48%,#9c1f0a 100%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;padding-bottom:.08em}
.hs .ic-p{margin-top:18px}
.ic .hs-acts{display:flex;flex-wrap:wrap;gap:12px;margin:28px 0 0}
.hs .ic-btn{border-radius:99px;padding:0 26px}

.hs-panels{display:flex;align-items:flex-start;gap:10px;height:clamp(300px,58vw,470px)}
.hs-panel{position:relative;flex:0 0 30px;height:48%;min-width:0;border-radius:20px;overflow:hidden;background:#201515;transition:flex-basis var(--hs-t) var(--hs-e),flex-grow var(--hs-t) var(--hs-e),height var(--hs-t) var(--hs-e)}
.hs{--hs-t:.9s;--hs-e:cubic-bezier(.5,0,.12,1)}
.hs-panel.hs-prev{flex-basis:16%;height:76%}
.hs-panel.hs-open{flex:1 1 0;height:100%}
.hs-scene{position:absolute;inset:0}
.hs-scene svg{display:block;width:100%;height:100%}
.hs-t{font-family:var(--body)}
.hs-fit{transform-box:view-box;transform-origin:0 0}
.hs-strip{position:absolute;inset:0;background:linear-gradient(180deg,#ff8a55 0%,#e8330a 50%,#6a1a0a 100%);opacity:.94;transition:opacity .6s ease}
.hs-prev .hs-strip{opacity:.8}
.hs-open .hs-strip{opacity:0}
.hs-hit{position:absolute;inset:0;width:100%;height:100%;padding:0;border:0;background:transparent;cursor:pointer;border-radius:inherit}
.hs-open .hs-hit{cursor:default}
.hs-hit:focus-visible{outline:3px solid var(--ink);outline-offset:-3px}
.hs-panel:not(.hs-open):hover .hs-strip{filter:brightness(1.1)}
.hs-cap{display:none;position:absolute;left:0;right:0;bottom:0;padding:64px 78px 26px 24px;text-align:left;color:#fff;font:600 clamp(18px,1.7vw,21px)/1.2 var(--head);letter-spacing:-.01em;background:linear-gradient(180deg,rgba(32,21,21,0),rgba(32,21,21,.86) 58%,#201515);opacity:0;transform:translateY(10px);transition:opacity .25s ease,transform .4s ease;pointer-events:none}
.hs-open .hs-cap{opacity:1;transform:none;transition:opacity .5s ease .55s,transform .6s ease .55s}
.ic .hs-go{display:none;position:absolute;right:20px;bottom:20px;width:44px;height:44px;place-items:center;border-radius:50%;border:2px solid rgba(255,255,255,.85);color:#fff;opacity:0;pointer-events:none;transition:opacity .25s ease,background .15s,color .15s}
.hs-open .hs-go{opacity:1;pointer-events:auto;transition:opacity .5s ease .7s,background .15s,color .15s}
.ic .hs-go:hover,.ic .hs-go:focus-visible{background:#fff;color:#201515}
.hs-pop{opacity:0;transform:translateY(12px);transform-box:fill-box;transition:opacity .4s ease,transform .01s linear .5s}
.hs-prev .hs-pop{opacity:1;transform:none;transition:none}
.hs-prev .hs-pop.hs-d4{opacity:.55}
.hs-open .hs-pop{opacity:1;transform:none;transition:opacity .5s ease,transform .6s cubic-bezier(.2,.7,.2,1)}
.hs-open .hs-pop.hs-d4{opacity:.55}
.hs-open .hs-d1{transition-delay:.6s}.hs-open .hs-d2{transition-delay:1.1s}.hs-open .hs-d3{transition-delay:1.65s}.hs-open .hs-d4{transition-delay:2.2s}
.hs-ticks{display:flex;gap:8px;margin-top:20px}
.hs-ticks i{height:4px;width:34px;border-radius:2px;background:var(--line);overflow:hidden;position:relative}
.hs-ticks i::after{content:'';position:absolute;inset:0;background:var(--accent);transform:scaleX(0);transform-origin:left}
.hs-ticks i.hs-on::after{animation:hs-fill ${TURN_MS}ms linear forwards}
.hs:hover .hs-ticks i.hs-on::after,.hs:focus-within .hs-ticks i.hs-on::after{animation-play-state:paused}
@keyframes hs-fill{to{transform:scaleX(1)}}
@media (min-width:980px){
  .hs-in{grid-template-columns:.92fr 1.08fr;gap:clamp(32px,4.4vw,64px)}
  .hs-panels{height:clamp(430px,41vw,540px);gap:14px}
  .hs-panel{flex-basis:52px;border-radius:26px}
  .hs-panel.hs-prev{flex-basis:24%}
  .hs-ticks{margin-top:26px}
  .hs-cap{display:block}
  .ic .hs-go{display:grid}
  .hs-fit{transform:translate(32px,24px) scale(.82)}
}
@media (prefers-reduced-motion:reduce){
  .hs-lines span,.hs-panel,.hs-scene,.hs-strip,.hs-cap,.hs-pop,.hs-go{transition:none!important}
  .hs-ticks{display:none}
}
`
