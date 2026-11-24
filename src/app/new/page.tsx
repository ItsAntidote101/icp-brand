import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Check, ClipboardList, Gauge, LineChart, Wrench } from 'lucide-react'
import { GUIDES } from '../guides/content'
import { FAQS } from '../home-faqs'
import { CTA, SiteStyles } from '../site'
import Opener from './opener'

// Preview of the new public look, kept off the home page and out of search
// until it is approved. The layout follows the consulting demo of the Ohio
// theme (split hero with an overlapping card, icon row, split sections with
// accordions, plans beside questions, article cards, closing band). Brand
// type and colours are unchanged, and every picture is drawn in code: no
// stock photos, no client logos, no figures about past clients.

export const dynamic = 'force-static'
export const metadata: Metadata = { title: 'New look preview | Ideal ICP', robots: { index: false, follow: false } }

const STEPS = [
  { icon: ClipboardList, title: 'Answer', text: '10 questions about your ads and your sales.' },
  { icon: Gauge,         title: 'Score',  text: 'A score out of 100, or a launch plan if you have not started.' },
  { icon: Wrench,        title: 'Fix',    text: 'The first three fixes, with the words to use.' },
  { icon: LineChart,     title: 'Track',  text: 'Your cost per inquiry, checked every week.' },
]

// Every line here is something a plan already includes today.
const HUMAN = [
  { when: 'With your free report', what: 'One free 20 minute call with Eugene to go over your results. Only if you ask for it.' },
  { when: 'On Starter', what: 'Message Eugene from your dashboard and he replies himself. Every month he writes you a note on your numbers.' },
  { when: 'On Pro', what: 'Eugene reviews your campaign setup plan and sits with you for one hands-on session a month: tracking, CRM or campaign setup.' },
  { when: 'On Agency', what: 'Up to four hands-on sessions a month and a monthly strategy call.' },
]

const CAUSES = [
  { q: 'The wrong people see your ad', a: 'The ad reaches the curious, not the ready. The diagnosis shows who your ads are really aimed at, set against who actually buys from you.' },
  { q: 'Your ad and your page disagree', a: 'The ad promises one thing and the page or the first reply talks about another. People leave at the gap.' },
  { q: 'Slow replies lose serious buyers', a: 'A buyer who waits a day has usually asked someone else. We look at how fast a new inquiry hears back, and what it hears.' },
  { q: 'Nobody knows the cost per customer', a: 'Without that number every budget decision is a guess. We work it out from figures you already have.' },
]

const PACKS = [
  { title: 'Ready to upload', text: 'Keywords, words to block, and your customer and sales lists turned into files Meta and Google accept.' },
  { title: 'A setup plan', text: 'How to structure campaigns and bidding at your stage, reviewed by a media buyer.' },
  { title: 'Done with you', text: 'CRM, tracking and campaign setup, built together in your own account.' },
]

const PLANS = [
  { name: 'Starter', price: '6,500', items: ['Every problem with its fix', 'Files ready to upload', 'Your numbers tracked weekly', 'A monthly note from Eugene'] },
  { name: 'Pro', price: '13,000', items: ['Everything in Starter', 'A campaign setup plan', 'One hands-on session a month', 'An onboarding call'] },
]

const css = `
.oh{--blush:#fbeee6;--navy:#201515;background:#fff}
.oh-wrap{max-width:1180px;margin:0 auto;padding:0 clamp(20px,5vw,40px)}
.oh section{padding:clamp(56px,8vw,112px) 0}
.oh .oh-eye{font:500 13px/1.3 var(--body);letter-spacing:.09em;text-transform:uppercase;color:var(--muted);margin:0 0 18px}
.oh h1{font-size:clamp(46px,8vw,92px);line-height:.98;letter-spacing:-.035em}
.oh h2{font-size:clamp(32px,4.6vw,52px);line-height:1.05;letter-spacing:-.03em}
.oh em{font-style:normal;color:var(--accent)}
.oh-p{font-size:clamp(16px,1.6vw,18px);line-height:1.65;color:var(--ink2);max-width:52ch;margin-top:18px!important}
.oh-p strong{color:var(--ink);font-weight:600}
.oh-btn{display:inline-flex;align-items:center;gap:10px;min-height:52px;padding:0 24px;border-radius:6px;background:var(--accent);color:#fff!important;font:600 16px/1 var(--body);text-decoration:none;transition:background .2s,transform .15s}
.oh-btn:hover{background:#c92a06}.oh-btn:active{transform:scale(.98)}
.oh-btn-dark{background:var(--navy)}.oh-btn-dark:hover{background:#000}
.oh-link{display:inline-flex;align-items:center;gap:8px;font:600 16px/1 var(--body);text-decoration:none;color:var(--ink)}
.oh-link span{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;border:2px solid var(--ink);transition:background .2s,color .2s}
.oh-link:hover span{background:var(--ink);color:#fff}
.oh-acts{display:flex;flex-wrap:wrap;align-items:center;gap:16px 22px;margin-top:30px}

.oh-nav{position:sticky;top:0;z-index:50;background:rgba(251,238,230,.9);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.oh-nav-in{max-width:1180px;margin:0 auto;padding:0 clamp(20px,5vw,40px);height:68px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.oh-brand{display:flex;align-items:center;gap:9px;font:700 18px/1 var(--head);letter-spacing:-.02em;text-decoration:none}
.oh-brand i{width:10px;height:10px;border-radius:50%;background:var(--accent)}
.oh-menu{display:none;gap:30px}
.oh-menu a{font:500 15px/1 var(--body);text-decoration:none;color:var(--ink)}
.oh-menu a:hover{color:var(--accent)}
.oh-nav .oh-btn{min-height:40px;padding:0 16px;font-size:14px;border-radius:6px}

.oh-hero{background:var(--blush);padding:0 0 clamp(48px,7vw,96px)!important;position:relative;overflow:hidden}
.oh-hero:before{content:'';position:absolute;right:-180px;top:-220px;width:520px;height:520px;border-radius:50%;border:90px solid rgba(232,51,10,.07)}
.oh-hero-in{display:grid;gap:44px;position:relative}
.oh-stage{position:relative;background:linear-gradient(160deg,#f3d9c9,#f7e6da);min-height:380px;padding:34px clamp(18px,4vw,44px) 96px;margin:0 calc(-1 * clamp(20px,5vw,40px));display:grid;place-items:center}
.oh-dots{position:absolute;width:170px;height:70px;background-image:radial-gradient(rgba(232,51,10,.45) 2.2px,transparent 2.4px);background-size:14px 14px;pointer-events:none}
.oh-chat{background:#fff;border-radius:18px;padding:18px;width:min(100%,360px);box-shadow:0 24px 60px -28px rgba(32,21,21,.45);display:grid;gap:9px;position:relative}
.oh-chat-top{display:flex;align-items:center;gap:10px;padding-bottom:10px;border-bottom:1px solid var(--line);margin-bottom:4px}
.oh-ava{width:36px;height:36px;border-radius:50%;background:var(--blush);display:grid;place-items:center;font:700 15px/1 var(--head)}
.oh .oh-bub{font-size:15px;line-height:1.4;padding:10px 13px;border-radius:16px;max-width:86%}
.oh .oh-in{background:#f3efe9;border-bottom-left-radius:5px;justify-self:start}
.oh .oh-out{background:var(--navy);color:#fff;border-bottom-right-radius:5px;justify-self:end}
.oh .oh-seen{font-size:13px;color:var(--faint);text-align:right}
.oh .oh-seen strong{display:block;color:var(--accent);font-weight:600;margin-top:2px}
.oh-note{position:absolute;right:0;bottom:-34px;left:clamp(20px,12vw,160px);background:var(--navy);color:#fff;padding:24px 26px}
.oh .oh-note p{font-size:15px;line-height:1.6;color:rgba(255,255,255,.82)}
.oh .oh-note strong{color:#fff;font-weight:600}
.oh-hero-txt{padding-top:28px;order:-1}

.oh .oh-h1{font-size:clamp(40px,6.2vw,76px);line-height:1}
.oh-vows{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.oh-hero .oh-hero-in{gap:28px}
.oh-hero .oh-hero-txt{padding-top:20px}
.oh-hero .oh-p{margin-top:14px!important}
.oh-vows li{display:flex;gap:10px;align-items:flex-start;font:500 16px/1.4 var(--body)}
.oh-vows svg{flex-shrink:0;color:var(--accent);margin-top:2px}
.oh-ladder{list-style:none;margin:0;padding:0;display:grid}
.oh-ladder li{display:grid;gap:6px;padding:20px 0;border-top:1px solid var(--line)}
.oh-ladder li:last-child{border-bottom:1px solid var(--line)}
.oh-ladder span{font:600 14px/1.3 var(--body);color:var(--accent)}
.oh .oh-ladder p{font-size:17px;line-height:1.55;color:var(--ink)}

.oh-steps{display:grid;grid-template-columns:1fr 1fr;gap:34px 20px;text-align:center}
.oh-steps span{display:grid;place-items:center;width:56px;height:56px;border-radius:50%;background:var(--blush);color:var(--accent);margin:0 auto 14px}
.oh-steps h3{font-size:19px}
.oh .oh-steps p{font-size:15px;line-height:1.55;color:var(--muted);margin-top:6px;max-width:26ch;margin-inline:auto}

.oh-split{display:grid;gap:40px;align-items:center}
.oh-vis{position:relative;background:var(--blush);padding:clamp(22px,4vw,48px) clamp(18px,4vw,48px) 132px;display:grid;place-items:center;min-height:360px}
.oh-tiles{position:absolute;left:clamp(16px,8vw,90px);right:0;bottom:0;display:grid;grid-template-columns:1fr 1fr}
.oh-tiles div{padding:22px 22px 24px;color:#fff}
.oh-tiles div:first-child{background:var(--navy)}.oh-tiles div:last-child{background:var(--accent)}
.oh-tiles b{display:block;font:700 34px/1 var(--head);letter-spacing:-.03em}
.oh-tiles small{display:block;font:400 14px/1.35 var(--body);margin-top:8px;opacity:.9}
.oh-report{background:#fff;border-radius:16px;padding:20px;width:min(100%,380px);box-shadow:0 24px 60px -30px rgba(32,21,21,.4)}
.oh-tag{display:inline-block;font:500 12px/1 var(--body);color:var(--muted);background:#f3efe9;border-radius:99px;padding:7px 11px;margin-bottom:16px}
.oh-score{display:flex;align-items:center;gap:16px;margin-bottom:14px}
.oh-ring{position:relative;width:84px;height:84px;flex-shrink:0}
.oh-ring b{position:absolute;inset:0;display:grid;place-items:center;font:700 26px/1 var(--head)}
.oh .oh-find{display:flex;gap:10px;font-size:14.5px;line-height:1.45;padding:11px 0;border-top:1px solid var(--line)}
.oh-find i{flex-shrink:0;width:8px;height:8px;border-radius:50%;margin-top:6px}
.oh .oh-fix{font-size:14.5px;line-height:1.45;background:var(--blush);border-radius:10px;padding:11px 13px;margin-top:6px}

.oh-acc{margin-top:26px;display:grid;gap:10px}
.oh-acc details{background:var(--blush);border-radius:6px}
.oh-white .oh-acc details{background:#fff}
.oh-acc summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:12px;padding:16px 18px;font:600 16px/1.35 var(--body)}
.oh-acc summary::-webkit-details-marker{display:none}
.oh-acc summary svg{flex-shrink:0;color:var(--accent)}
.oh-acc summary:after{content:'+';margin-left:auto;font:400 22px/1 var(--body)}
.oh-acc details[open] summary:after{content:'\\2212'}
.oh .oh-acc details p{padding:0 18px 18px 48px;font-size:15px;line-height:1.6;color:var(--ink2)}

.oh-chart{background:#fff;border-radius:16px;padding:22px;width:min(100%,400px);box-shadow:0 24px 60px -30px rgba(32,21,21,.4)}
.oh .oh-chart p{font-size:13px;color:var(--muted)}
.oh-chart b{display:block;font:700 30px/1.1 var(--head);letter-spacing:-.025em;margin:4px 0 2px}
.oh-rows{list-style:none;margin:26px 0 0;padding:0;display:grid;gap:14px}
.oh-rows li{display:flex;gap:12px;font-size:16px;line-height:1.5;color:var(--ink2)}
.oh-rows svg{flex-shrink:0;color:var(--accent);margin-top:3px}

.oh-blush{background:var(--blush)}
.oh-packs{display:grid;gap:16px;margin-top:38px}
.oh-pack{background:#fff;border-radius:8px;padding:28px 26px;border-top:4px solid var(--navy)}
.oh-pack:nth-child(2){border-top-color:var(--accent)}
.oh-pack h3{font-size:22px;letter-spacing:-.02em}
.oh .oh-pack p{font-size:15.5px;line-height:1.6;color:var(--ink2);margin-top:10px}

.oh-pf{display:grid;gap:56px}
.oh-plans{display:grid;gap:34px;margin-top:34px}
.oh-plan h3{font-size:18px}
.oh .oh-price{font:700 clamp(44px,6vw,60px)/1 var(--head);letter-spacing:-.04em;margin:12px 0 14px}
.oh-price small{font:500 15px/1 var(--body);letter-spacing:0;color:var(--muted);margin-right:6px}
.oh-chip{display:inline-block;font:500 12.5px/1 var(--body);background:rgba(32,21,21,.07);border-radius:4px;padding:6px 9px}
.oh-plan ul{list-style:none;margin:20px 0 24px;padding:0;display:grid;gap:11px}
.oh-plan li{display:flex;gap:10px;font-size:15px;line-height:1.4;color:var(--ink2)}
.oh-plan li svg{flex-shrink:0;color:var(--accent);margin-top:2px}

.oh-head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:34px}
.oh-posts{display:grid;gap:34px}
.oh-post{text-decoration:none;display:block}
.oh-thumb{aspect-ratio:5/4;background:var(--blush);display:grid;place-items:center;overflow:hidden;position:relative;transition:transform .3s}
.oh-post:hover .oh-thumb{transform:translateY(-4px)}
.oh .oh-meta{font-size:13.5px;color:var(--muted);margin:18px 0 8px}
.oh-post h3{font-size:clamp(20px,2vw,23px);line-height:1.2;letter-spacing:-.02em}
.oh-post:hover h3{color:var(--accent)}
.oh-tags{display:flex;gap:8px;margin-top:14px}

.oh-band{background:var(--navy);color:#fff;position:relative;overflow:hidden}
.oh-band:before{content:'';position:absolute;right:-140px;bottom:-200px;width:460px;height:460px;border-radius:50%;border:80px solid rgba(232,51,10,.22)}
.oh .oh-band h2{color:#fff}
.oh .oh-band .oh-eye{color:rgba(255,255,255,.6)}
.oh-band .oh-wrap{position:relative}

.oh-foot{background:#170f0f;color:rgba(255,255,255,.7);padding:48px 0 40px}
.oh-foot-in{display:grid;gap:26px}
.oh .oh-foot p{font-size:15px;line-height:1.6;max-width:38ch;margin-top:14px}
.oh-foot nav{display:flex;flex-wrap:wrap;gap:12px 24px}
.oh-foot nav a{font-size:15px;text-decoration:none;color:rgba(255,255,255,.85)}
.oh-foot nav a:hover{color:#fff}
.oh .oh-copy{font-size:13.5px;color:rgba(255,255,255,.5);margin:0}

@media(min-width:720px){
  .oh-foot-in{grid-template-columns:1.2fr 1fr;align-items:start}
  .oh-copy{grid-column:1/-1}
  .oh-steps{grid-template-columns:repeat(4,1fr)}
  .oh-ladder li{grid-template-columns:170px 1fr;gap:20px}
  .oh-packs,.oh-posts{grid-template-columns:repeat(3,1fr)}
  .oh-plans{grid-template-columns:1fr 1fr}
}
@media(min-width:960px){
  .oh-menu{display:flex}
  .oh-hero .oh-hero-in{grid-template-columns:1fr 1fr;gap:26px clamp(40px,7vw,96px);align-items:center;grid-template-areas:'stage txt' 'stage vows'}
  .oh-hero .oh-stage{grid-area:stage}.oh-hero .oh-hero-txt{grid-area:txt;align-self:end;padding-top:0}.oh-vows{grid-area:vows;align-self:start}
  .oh-stage{margin:0 0 0 calc(-1 * max(clamp(20px,5vw,40px), (100vw - 1180px) / 2 + clamp(20px,5vw,40px)));min-height:560px}
  .oh-hero-txt{padding-top:0;order:0}
  .oh-split{grid-template-columns:1fr 1fr;gap:clamp(40px,7vw,96px)}
  .oh-flip .oh-vis{order:2}
  .oh-pf{grid-template-columns:1.25fr 1fr;gap:clamp(40px,6vw,80px)}
  .oh-pf>div:last-child{border-left:1px solid var(--line);padding-left:clamp(40px,6vw,80px)}
}
@media(prefers-reduced-motion:reduce){.oh *{transition:none!important}}
`

function Ring({ score }: { score: number }) {
  const r = 36, c = 2 * Math.PI * r
  return (
    <div className="oh-ring" role="img" aria-label={`Score ${score} out of 100`}>
      <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
        <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(32,21,21,.08)" strokeWidth="7" />
        <circle cx="42" cy="42" r={r} fill="none" stroke="#e8330a" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 42 42)" />
      </svg>
      <b>{score}</b>
    </div>
  )
}

// A different simple drawing for each guide card, in the brand colours
function Thumb({ i }: { i: number }) {
  return (
    <svg viewBox="0 0 250 200" width="100%" height="100%" aria-hidden="true">
      {i === 0 && <><circle cx="92" cy="104" r="58" fill="#e8330a" /><rect x="118" y="52" width="92" height="92" fill="#201515" /><circle cx="164" cy="98" r="22" fill="#fbeee6" /></>}
      {i === 1 && <><rect x="40" y="118" width="38" height="46" fill="#201515" /><rect x="88" y="88" width="38" height="76" fill="#e8330a" /><rect x="136" y="58" width="38" height="106" fill="#201515" /><circle cx="198" cy="52" r="20" fill="#e8330a" /></>}
      {i === 2 && <><rect x="38" y="44" width="124" height="56" rx="28" fill="#201515" /><rect x="88" y="110" width="124" height="56" rx="28" fill="#e8330a" /><circle cx="66" cy="72" r="7" fill="#fbeee6" /><circle cx="90" cy="72" r="7" fill="#fbeee6" /></>}
    </svg>
  )
}

const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

export default function Page() {
  return (
    <div className="hp oh">
      <SiteStyles />
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <header className="oh-nav">
        <div className="oh-nav-in">
          <Link href="/" className="oh-brand"><i aria-hidden="true" />Ideal ICP</Link>
          <nav className="oh-menu" aria-label="Main">
            <a href="#how">How it works</a>
            <Link href="/guides">Resources</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/about">About</Link>
            <Link href="/login">Log in</Link>
          </nav>
          <Link href="/questionnaire" className="oh-btn oh-btn-dark">Free diagnosis</Link>
        </div>
      </header>

      <main>
        <section className="oh-hero">
          <div className="oh-wrap oh-hero-in">
            <div className="oh-stage" style={{ paddingBottom: 34 }}>
              <span className="oh-dots" style={{ left: '8%', top: 18 }} aria-hidden="true" />
              <Opener />
            </div>
            <div className="oh-hero-txt">
              <p className="oh-eye">For Kenyan businesses that run ads</p>
              <h1 className="oh-h1">Don&apos;t put another shilling into ads yet.</h1>
              <p className="oh-p">First find out why the inquiries you <strong>already paid for</strong> are not buying.</p>
            </div>
            <ul className="oh-vows">
              <li><Check size={18} aria-hidden="true" />Nobody will call you unless you ask.</li>
              <li><Check size={18} aria-hidden="true" />No access to your ad account needed.</li>
              <li><Check size={18} aria-hidden="true" />Rough numbers from memory are enough.</li>
            </ul>
          </div>
        </section>

        <section>
          <div className="oh-wrap oh-split">
            <div>
              <p className="oh-eye">Who you are dealing with</p>
              <h2>You get a media buyer, not a score.</h2>
              <p className="oh-p">The questions find where your sales leak. Then <strong>Eugene works on it with you</strong>, with your real numbers in front of him.</p>
            </div>
            <ol className="oh-ladder">
              {HUMAN.map(h => (
                <li key={h.when}>
                  <span>{h.when}</span>
                  <p>{h.what}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="how" style={{ scrollMarginTop: 70, paddingTop: 0 }}>
          <div className="oh-wrap">
            <ol className="oh-steps" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {STEPS.map(s => (
                <li key={s.title}>
                  <span aria-hidden="true"><s.icon size={24} strokeWidth={1.8} /></span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section style={{ paddingTop: 0 }}>
          <div className="oh-wrap oh-split">
            <div className="oh-vis">
              <div className="oh-report">
                <span className="oh-tag">Example report, made-up property agency</span>
                <div className="oh-score">
                  <Ring score={42} />
                  <div><p style={{ fontSize: 13, color: 'var(--muted)' }}>Score</p><p style={{ font: '700 20px/1.2 var(--head)' }}>Needs work</p></div>
                </div>
                <p className="oh-find"><i style={{ background: '#dc2626' }} aria-hidden="true" />Ads reach all of Nairobi, not people ready to buy.</p>
                <p className="oh-find"><i style={{ background: '#d97706' }} aria-hidden="true" />New inquiries wait over a day for a reply.</p>
                <p className="oh-fix"><strong>Fix first: </strong>put the payment plan in the first line.</p>
              </div>
              <div className="oh-tiles">
                <div><b>10</b><small>questions, in plain language</small></div>
                <div><b>3 min</b><small>to your score and first fixes</small></div>
              </div>
            </div>
            <div>
              <p className="oh-eye">What it finds</p>
              <h2>Plenty of inquiries. <em>No sales.</em></h2>
              <p className="oh-p">It is rarely the budget. It is usually <strong>one of these four</strong>, and the diagnosis tells you which.</p>
              <div className="oh-acc">
                {CAUSES.map((c, i) => (
                  <details key={c.q} open={i === 0}>
                    <summary><ArrowUpRight size={18} aria-hidden="true" />{c.q}</summary>
                    <p>{c.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ paddingTop: 0 }}>
          <div className="oh-wrap oh-split oh-flip">
            <div className="oh-vis" style={{ paddingBottom: 'clamp(22px,4vw,48px)' }}>
              <div className="oh-chart">
                <p>Cost per inquiry</p>
                <b>Tracked every week</b>
                <p>From two numbers you log on Monday</p>
                <svg viewBox="0 0 320 120" width="100%" style={{ marginTop: 14 }} aria-hidden="true">
                  <line x1="0" y1="119" x2="320" y2="119" stroke="rgba(32,21,21,.12)" />
                  <polyline points="8,24 68,34 128,52 188,58 248,80 310,92" fill="none" stroke="#201515" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="310" cy="92" r="7" fill="#e8330a" />
                </svg>
                <p style={{ marginTop: 6 }}>Example chart</p>
              </div>
            </div>
            <div>
              <p className="oh-eye">After the diagnosis</p>
              <h2>Your numbers, <em>watched.</em></h2>
              <p className="oh-p">A plan keeps the fixes moving and shows you, in your own figures, <strong>whether they worked</strong>.</p>
              <ul className="oh-rows">
                <li><Check size={18} aria-hidden="true" />Cost per inquiry checked every week</li>
                <li><Check size={18} aria-hidden="true" />A written note from Eugene every month</li>
                <li><Check size={18} aria-hidden="true" />Your market in three points, each with its source</li>
              </ul>
              <div className="oh-acts"><Link href="/pricing" className="oh-btn oh-btn-dark">See the plans <ArrowRight size={17} aria-hidden="true" /></Link></div>
            </div>
          </div>
        </section>

        <section className="oh-blush">
          <div className="oh-wrap">
            <p className="oh-eye">More than a report</p>
            <h2>We hand you <em>the work.</em></h2>
            <p className="oh-p">Advice is cheap. Paying clients get the files, the plan and a pair of hands.</p>
            <div className="oh-packs">
              {PACKS.map(p => <div key={p.title} className="oh-pack"><h3>{p.title}</h3><p>{p.text}</p></div>)}
            </div>
          </div>
        </section>

        <section>
          <div className="oh-wrap oh-pf">
            <div>
              <p className="oh-eye">Paid month by month. Nothing renews on its own.</p>
              <h2>Choose <em>a plan.</em></h2>
              <p className="oh-p">Start free. Pay only if you want the fixes handed to you and your numbers tracked.</p>
              <div className="oh-plans">
                {PLANS.map(p => (
                  <div key={p.name} className="oh-plan">
                    <h3>{p.name}</h3>
                    <p className="oh-price"><small>KES</small>{p.price}</p>
                    <span className="oh-chip">A month, by M-Pesa or card</span>
                    <ul>{p.items.map(i => <li key={i}><Check size={17} aria-hidden="true" />{i}</li>)}</ul>
                    <Link href="/pricing" className="oh-btn">See {p.name} <ArrowRight size={17} aria-hidden="true" /></Link>
                  </div>
                ))}
              </div>
            </div>
            <div className="oh-white">
              <p className="oh-eye">Questions</p>
              <h2 style={{ fontSize: 'clamp(26px,3vw,34px)' }}>Before you start.</h2>
              <div className="oh-acc">
                {FAQS.slice(0, 4).map((f, i) => (
                  <details key={f.q} open={i === 0} style={{ background: 'var(--blush)' }}>
                    <summary><ArrowUpRight size={18} aria-hidden="true" />{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ paddingTop: 0 }}>
          <div className="oh-wrap">
            <div className="oh-head">
              <div><p className="oh-eye">Resources</p><h2>Straight <em>answers.</em></h2></div>
              <Link href="/guides" className="oh-btn">All guides <ArrowRight size={17} aria-hidden="true" /></Link>
            </div>
            <div className="oh-posts">
              {GUIDES.slice(0, 3).map((g, i) => (
                <Link key={g.slug} href={`/guides/${g.slug}`} className="oh-post">
                  <div className="oh-thumb"><Thumb i={i} /></div>
                  <p className="oh-meta">Updated {day(g.updated)}</p>
                  <h3>{g.question}</h3>
                  <div className="oh-tags"><span className="oh-chip">Guide</span></div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="oh-band">
          <div className="oh-wrap">
            <p className="oh-eye">3 minutes. Free. No card.</p>
            <h2>Leads not buying?<br /><em>Find out why.</em></h2>
            <div className="oh-acts"><Link href="/questionnaire" className="oh-btn">{CTA} <ArrowRight size={17} aria-hidden="true" /></Link></div>
          </div>
        </section>
      </main>

      <footer className="oh-foot">
        <div className="oh-wrap oh-foot-in">
          <div>
            <Link href="/" className="oh-brand" style={{ color: '#fff' }}><i aria-hidden="true" />Ideal ICP</Link>
            <p>Ad diagnosis and hands-on help for Kenyan businesses that sell through inquiries.</p>
          </div>
          <nav aria-label="Footer">
            <Link href="/pricing">Pricing</Link><Link href="/guides">Resources</Link><Link href="/about">About</Link>
            <Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="mailto:info@idealicp.com">Contact</a>
          </nav>
          <p className="oh-copy">© 2026 Ideal ICP, Nairobi</p>
        </div>
      </footer>
    </div>
  )
}
