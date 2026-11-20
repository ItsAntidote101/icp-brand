import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import SocialProofToast from '@/components/SocialProofToast'
import { HomeNav, LandingTracker } from './home-client'
import { FAQS } from './home-faqs'

// The home page. Written for one reader: a Kenyan business owner who runs ads,
// gets inquiries and sees few sales. It follows one line of thought:
//   pain      the inquiry that goes quiet
//   cause     the four things that usually cause it
//   solution  the diagnosis, shown with an example report
//   offer     free, plus a call with Eugene; then what staying looks like
//   trigger   when it is worth doing
// Rendered on the server so search engines and slow phones get the words at once.
// Nothing here is a statistic about past clients. The chat and the report are
// labelled examples.

export const dynamic = 'force-static'
// Each page names its own address; a site-wide one made every page claim to be the home page
export const metadata: Metadata = { alternates: { canonical: '/' } }

const CTA = 'Get my free diagnosis'

const FAMILIAR = [
  'People ask "how much?" and go quiet the moment you answer.',
  'Your agency sends a report full of clicks and reach. Your phone stays quiet.',
  'You boosted a post, got plenty of likes and not one sale.',
  'Leads say "let me get back to you" and never do.',
  'You got a few customers, but you cannot tell which ad brought them.',
]

const CAUSES = [
  { title: 'The wrong people see your ad', body: 'The ad reaches people who are curious, not people who are ready and able to buy. They inquire, then vanish.' },
  { title: 'Your ad and your page say different things', body: 'The ad promises one thing. The page or the first WhatsApp reply talks about another. The buyer loses trust and leaves.' },
  { title: 'Serious buyers get lost among the rest', body: 'Every inquiry gets the same slow reply, so the few people who were ready to pay cool off before anyone calls them.' },
  { title: 'Nobody knows what a customer really costs', body: 'Without that number you cannot tell a good month from a bad one, or whether more budget would help or hurt.' },
]

const STEPS = [
  { title: 'Answer 10 questions', body: 'What you sell, what you spend on ads and what comes back. About 3 minutes. No access to your ad accounts.' },
  { title: 'Get your report', body: 'A score out of 100, an estimate of what is leaking in shillings each month, and your fixes in order.' },
  { title: 'Go through it with me', body: 'Book a free 20 minute call. We decide together what to fix first.' },
]

const STAYING = [
  { title: 'Your cost per lead, every week', body: 'You log spend and leads in 30 seconds on Monday. The dashboard shows whether each lead is getting cheaper.' },
  { title: 'A note from me every month', body: 'I read your numbers and write to you about what I would change next. You can reply in the dashboard.' },
  { title: 'Three things from your market', body: 'Each week: what changed, what a competitor did and what to do about it, each with its source.' },
]

const WHEN = [
  'You are about to raise your ad budget.',
  'Your agency contract is up for renewal.',
  'A new intake, launch or season is coming.',
  'You have had a month of inquiries and almost no sales.',
]

const css = `
.hp{--ink:#201515;--ink2:#36342e;--muted:#605d52;--faint:#8a877b;--bg:#f8f4f0;--card:#fff;--line:rgba(201,192,177,.55);--fill:rgba(32,21,21,.05);--accent:#e8330a;--good:#15803d;
  --head:'PolySans Median',-apple-system,system-ui,sans-serif;--body:'PolySans Neutral',-apple-system,system-ui,sans-serif;
  background:var(--bg);color:var(--ink);font-family:var(--body);-webkit-font-smoothing:antialiased;overflow-x:clip}
.hp *{box-sizing:border-box}
.hp a{color:inherit}
.hp :focus-visible{outline:3px solid var(--accent);outline-offset:3px;border-radius:8px}
.hp-wrap{max-width:1080px;margin:0 auto;padding:0 clamp(20px,5vw,40px)}
.hp section{padding:clamp(56px,9vw,104px) 0}
.hp h1,.hp h2,.hp h3{font-family:var(--head);font-weight:700;letter-spacing:-.025em;margin:0;text-wrap:balance}
.hp h1{font-size:clamp(40px,7.2vw,76px);line-height:1.02}
.hp h2{font-size:clamp(28px,4.4vw,44px);line-height:1.1}
.hp h3{font-size:19px;line-height:1.3;letter-spacing:-.01em}
.hp p{margin:0;text-wrap:pretty}
.hp-lead{font-size:clamp(17px,2vw,20px);line-height:1.55;color:var(--ink2);max-width:58ch}
.hp-sub{font-size:17px;line-height:1.6;color:var(--muted);max-width:62ch;margin-top:14px!important}
.hp-kicker{font-size:15px;color:var(--muted);margin-bottom:18px!important}
.hp-btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:54px;padding:0 28px;border-radius:980px;background:var(--ink);color:#fff!important;font:600 17px/1 var(--body);text-decoration:none;border:0;cursor:pointer;transition:transform .15s ease,background .15s ease}
.hp-btn:hover{background:#000}.hp-btn:active{transform:scale(.98)}
.hp-btn-sm{min-height:42px;padding:0 18px;font-size:15px}
.hp-btn-light{background:#fff;color:var(--ink)!important}.hp-btn-light:hover{background:#f1ece6}
.hp-fine{font-size:14px;color:var(--faint);margin-top:14px!important}
.hp-card{background:var(--card);border-radius:22px;box-shadow:0 1px 2px rgba(32,21,21,.05),0 10px 30px -14px rgba(32,21,21,.16)}
.hp-sep{height:1px;background:var(--line)}

.hp-nav{position:sticky;top:0;z-index:50;background:rgba(248,244,240,.86);backdrop-filter:saturate(1.4) blur(14px);-webkit-backdrop-filter:saturate(1.4) blur(14px);border-bottom:1px solid var(--line)}
.hp-nav-in{max-width:1080px;margin:0 auto;padding:0 clamp(20px,5vw,40px);height:62px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.hp-brand{display:flex;align-items:center;gap:9px;font:700 16px/1 var(--head);text-decoration:none}
.hp-mark{width:24px;height:24px;border-radius:7px;background:var(--accent)}
.hp-links{display:none;gap:28px}.hp-links a,.hp-login{font-size:15px;color:var(--muted);text-decoration:none}.hp-links a:hover,.hp-login:hover{color:var(--ink)}
.hp-nav-cta{display:flex;align-items:center;gap:14px}.hp-login{display:none}
.hp-burger{display:flex;background:none;border:0;padding:8px;margin-right:-8px;color:var(--ink);cursor:pointer}
.hp-menu{position:fixed;inset:62px 0 0;background:var(--bg);padding:12px clamp(20px,5vw,40px) 40px;display:flex;flex-direction:column;overflow:auto}
.hp-menu a:not(.hp-btn){font:700 24px/1 var(--head);padding:20px 0;border-bottom:1px solid var(--line);text-decoration:none}
@media (max-width:420px){.hp-nav-cta .hp-btn-sm{display:none}}
@media (min-width:900px){.hp-links{display:flex}.hp-login{display:inline}.hp-burger{display:none}}

.hp-hero{padding-top:clamp(40px,7vw,88px)!important}
.hp-hero-grid{display:grid;gap:clamp(36px,6vw,64px);align-items:center}
@media (min-width:900px){.hp-hero-grid{grid-template-columns:1.15fr .85fr}}
.hp-hero .hp-lead{margin:22px 0 30px}

.hp-chat{padding:20px 18px 18px;max-width:400px;width:100%;justify-self:center}
.hp-chat-top{display:flex;align-items:center;gap:10px;padding:0 4px 14px;border-bottom:1px solid var(--line);margin-bottom:16px}
.hp-ava{width:36px;height:36px;border-radius:50%;background:var(--fill);display:flex;align-items:center;justify-content:center;font:600 14px/1 var(--body);color:var(--muted)}
.hp .hp-bub{width:fit-content;max-width:84%;padding:11px 14px;border-radius:18px;font-size:15px;line-height:1.45;margin-bottom:8px}
.hp-in{background:var(--fill);border-bottom-left-radius:6px}
.hp .hp-out{background:var(--ink);color:#fff;margin-left:auto;border-bottom-right-radius:6px}
.hp-seen{text-align:center;font-size:13px;color:var(--faint);padding:14px 0 4px}
.hp-seen strong{display:block;font:600 15px/1.4 var(--body);color:var(--accent)}

.hp-list{list-style:none;margin:32px 0 0;padding:0}
.hp-list li{display:flex;gap:14px;align-items:flex-start;padding:18px 0;border-top:1px solid var(--line);font-size:clamp(17px,2.1vw,21px);line-height:1.4}
.hp-list li:last-child{border-bottom:1px solid var(--line)}
.hp-dot{width:8px;height:8px;border-radius:50%;background:var(--accent);margin-top:.55em;flex-shrink:0}

.hp-grid2{display:grid;gap:16px;margin-top:36px}
@media (min-width:760px){.hp-grid2{grid-template-columns:1fr 1fr}}
.hp-cause{padding:26px 26px 28px}
.hp-cause p{font-size:16px;line-height:1.6;color:var(--muted);margin-top:8px}

.hp-how{display:grid;gap:clamp(32px,6vw,64px);align-items:start;margin-top:40px}
@media (min-width:900px){.hp-how{grid-template-columns:.9fr 1.1fr}}
.hp-steps{list-style:none;margin:0;padding:0;counter-reset:s}
.hp-steps li{counter-increment:s;position:relative;padding:0 0 28px 56px}
.hp-steps li::before{content:counter(s);position:absolute;left:0;top:-2px;width:38px;height:38px;border-radius:50%;background:var(--card);box-shadow:0 1px 2px rgba(32,21,21,.08),0 4px 12px -6px rgba(32,21,21,.2);display:flex;align-items:center;justify-content:center;font:700 16px/1 var(--head)}
.hp-steps li:not(:last-child)::after{content:'';position:absolute;left:18.5px;top:42px;bottom:6px;width:1px;background:var(--line)}
.hp-steps p{font-size:16px;line-height:1.6;color:var(--muted);margin-top:6px}

.hp-report{padding:clamp(22px,3vw,30px)}
.hp-tag{display:inline-block;font-size:13px;color:var(--muted);background:var(--fill);border-radius:980px;padding:6px 12px;margin-bottom:20px}
.hp-score{display:flex;align-items:center;gap:20px;padding-bottom:22px}
.hp-ring{position:relative;width:96px;height:96px;flex-shrink:0}
.hp-ring b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:700 32px/1 var(--head);letter-spacing:-.03em}
.hp-waste{font:700 clamp(22px,3vw,28px)/1.15 var(--head);letter-spacing:-.02em}
.hp-small{font-size:14px;line-height:1.5;color:var(--muted)}
.hp-find{display:flex;gap:12px;align-items:flex-start;padding:14px 0;font-size:16px;line-height:1.45}
.hp-sev{width:9px;height:9px;border-radius:50%;margin-top:.5em;flex-shrink:0}
.hp .hp-fix{margin-top:8px;padding:16px 18px;background:var(--fill);border-radius:14px;font-size:15px;line-height:1.55}
.hp-fix strong{font-weight:600}

.hp-me{display:grid;gap:clamp(28px,5vw,56px);align-items:center}
@media (min-width:820px){.hp-me{grid-template-columns:300px 1fr}}
.hp-photo{aspect-ratio:4/5;width:100%;max-width:300px;border-radius:22px;background:linear-gradient(160deg,#eadfd3,#d8c9b8);display:flex;align-items:flex-end;padding:18px;font:700 64px/1 var(--head);color:rgba(32,21,21,.28);letter-spacing:-.04em}
.hp-me p{font-size:clamp(17px,2vw,19px);line-height:1.65;color:var(--ink2);max-width:60ch;margin-top:16px}

.hp-dark{background:var(--ink);color:#fff}
.hp-dark h2,.hp-dark h3,.hp-dark .hp-price p{color:#fff}
.hp-dark .hp-sub,.hp-dark .hp-stay p{color:rgba(255,255,255,.66)}
.hp-stay-grid{display:grid;gap:0;margin-top:40px;border-top:1px solid rgba(255,255,255,.14)}
@media (min-width:820px){.hp-stay-grid{grid-template-columns:repeat(3,1fr);border-top:0;gap:clamp(24px,4vw,48px)}}
.hp-stay{padding:24px 0;border-bottom:1px solid rgba(255,255,255,.14)}
@media (min-width:820px){.hp-stay{border-bottom:0;border-top:1px solid rgba(255,255,255,.14)}}
.hp-stay p{font-size:16px;line-height:1.6;margin-top:8px}
.hp-price{display:flex;flex-wrap:wrap;gap:16px 28px;align-items:center;justify-content:space-between;margin-top:36px}
.hp-price p{font-size:17px;line-height:1.55;max-width:52ch}.hp-price strong{font-weight:600}
.hp-textlink{font:600 16px/1 var(--body);text-decoration:underline;text-underline-offset:4px}

.hp-when{display:grid;gap:clamp(28px,5vw,56px);align-items:start}
@media (min-width:900px){.hp-when{grid-template-columns:1fr 1fr}}
.hp-check{list-style:none;margin:0;padding:8px 26px}
.hp-check li{display:flex;gap:14px;align-items:flex-start;padding:17px 0;font-size:17px;line-height:1.45}
.hp-check li+li{border-top:1px solid var(--line)}
.hp-tick{width:24px;height:24px;border-radius:50%;background:var(--ink);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}

.hp-faq{margin-top:32px;overflow:hidden}
.hp-faq details+details{border-top:1px solid var(--line)}
.hp-faq summary{list-style:none;cursor:pointer;padding:22px 26px;font:600 18px/1.35 var(--body);display:flex;justify-content:space-between;gap:16px;align-items:center}
.hp-faq summary::-webkit-details-marker{display:none}
.hp-faq summary::after{content:'+';font:400 26px/1 var(--body);color:var(--faint);flex-shrink:0;transition:transform .2s ease}
.hp-faq details[open] summary::after{transform:rotate(45deg)}
.hp-faq details p{padding:0 26px 24px;font-size:16px;line-height:1.65;color:var(--muted);max-width:70ch}

.hp-end{text-align:left}
.hp-end .hp-lead{color:rgba(255,255,255,.72);margin:18px 0 30px}
.hp-foot{padding:32px 0 48px;display:flex;flex-wrap:wrap;gap:16px 28px;align-items:center;justify-content:space-between;font-size:14px;color:rgba(255,255,255,.55);border-top:1px solid rgba(255,255,255,.14)}
.hp-foot nav{display:flex;flex-wrap:wrap;gap:8px 22px}.hp-foot a{text-decoration:none}.hp-foot a:hover{color:#fff}
@media (prefers-reduced-motion:reduce){.hp *{transition:none!important}}
`

function ScoreRing({ score }: { score: number }) {
  const r = 42, c = 2 * Math.PI * r
  return (
    <div className="hp-ring" role="img" aria-label={`Score ${score} out of 100`}>
      <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(32,21,21,.08)" strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke="#d97706" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 48 48)" />
      </svg>
      <b>{score}</b>
    </div>
  )
}

export default function Page() {
  return (
    <div className="hp">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <LandingTracker />
      <HomeNav />

      <main>
        {/* Pain */}
        <section className="hp-hero">
          <div className="hp-wrap hp-hero-grid">
            <div>
              <p className="hp-kicker">For Kenyan businesses that run ads to get leads</p>
              <h1>Getting leads that never buy?</h1>
              <p className="hp-lead">
                Find out where your ad money is leaking. Answer 10 questions and in about 3 minutes you get a scored report: why your leads are not becoming customers, what it is costing you in shillings, and what to fix first.
              </p>
              <Link href="/questionnaire" className="hp-btn">{CTA} <ArrowRight size={18} aria-hidden="true" /></Link>
              <p className="hp-fine">Free. No card. No access to your ad accounts.</p>
            </div>

            <figure className="hp-card hp-chat" style={{ margin: 0 }} aria-label="Example of an inquiry that goes quiet">
              <div className="hp-chat-top">
                <span className="hp-ava" aria-hidden="true">W</span>
                <div><p style={{ font: '600 15px/1.2 var(--body)' }}>Wanjiru</p><p style={{ fontSize: 13, color: 'var(--faint)' }}>Came from your ad</p></div>
              </div>
              <p className="hp-bub hp-in">Hi, I saw your ad. How much is the 2 bedroom?</p>
              <p className="hp-bub hp-out">Hi Wanjiru! It is KES 8.5M and there is a payment plan. When can you come for a viewing?</p>
              <p className="hp-bub hp-in">Ok, let me get back to you.</p>
              <p className="hp-seen">Seen<strong>No reply for 3 weeks</strong></p>
            </figure>
          </div>
        </section>

        <section style={{ paddingTop: 0 }}>
          <div className="hp-wrap">
            <h2>Sound familiar?</h2>
            <ul className="hp-list">
              {FAMILIAR.map(t => <li key={t}><span className="hp-dot" aria-hidden="true" />{t}</li>)}
            </ul>
          </div>
        </section>

        {/* Cause */}
        <section style={{ paddingTop: 0 }}>
          <div className="hp-wrap">
            <h2>It is rarely the budget.</h2>
            <p className="hp-sub">When inquiries come in and sales do not, the cause is usually one of four things. The diagnosis checks each one.</p>
            <div className="hp-grid2">
              {CAUSES.map(c => (
                <div key={c.title} className="hp-card hp-cause"><h3>{c.title}</h3><p>{c.body}</p></div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution */}
        <section id="how" style={{ paddingTop: 0, scrollMarginTop: 80 }}>
          <div className="hp-wrap">
            <h2>A clear answer in about 3 minutes.</h2>
            <p className="hp-sub">You tell me about your business and your ads. You get back a report you can act on the same day.</p>
            <div className="hp-how">
              <ol className="hp-steps">
                {STEPS.map(s => <li key={s.title}><h3>{s.title}</h3><p>{s.body}</p></li>)}
              </ol>

              <div className="hp-card hp-report">
                <span className="hp-tag">Example report for a made-up Nairobi property agency</span>
                <div className="hp-score">
                  <ScoreRing score={42} />
                  <div>
                    <p className="hp-small">Estimated leak each month</p>
                    <p className="hp-waste">KES 38,000</p>
                    <p className="hp-small">of a KES 120,000 ad budget</p>
                  </div>
                </div>
                <div className="hp-sep" />
                <div className="hp-find"><span className="hp-sev" style={{ background: '#dc2626' }} aria-hidden="true" />Your ads reach all of Nairobi, not people ready to buy property.</div>
                <div className="hp-sep" />
                <div className="hp-find"><span className="hp-sev" style={{ background: '#dc2626' }} aria-hidden="true" />The ad promises a payment plan. The page never mentions it.</div>
                <div className="hp-sep" />
                <div className="hp-find"><span className="hp-sev" style={{ background: '#d97706' }} aria-hidden="true" />New inquiries wait more than a day for a first reply.</div>
                <p className="hp-fix"><strong>Fix this first: </strong>show the payment plan in the first line of the page, so the promise in the ad is the first thing a buyer sees.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Offer: the person */}
        <section style={{ paddingTop: 0 }}>
          <div className="hp-wrap hp-me">
            <div className="hp-photo" role="img" aria-label="Photo of Eugene Kwata">EK</div>
            <div>
              <h2>A person reads your report. That person is me.</h2>
              <p>I am Eugene Kwata, a media buyer in Nairobi. I trained as a graphic designer and spent two years making ads before I moved into buying them. Today I run Google and Meta campaigns for a living.</p>
              <p>I built this because I kept opening ad accounts with the same problem: money going out, inquiries coming in and very few sales. The diagnosis finds where that happens. Then we talk, for 20 minutes, free, about what to fix first.</p>
              <p style={{ marginTop: 26 }}><Link href="/questionnaire" className="hp-btn">{CTA} <ArrowRight size={18} aria-hidden="true" /></Link></p>
            </div>
          </div>
        </section>

        {/* Offer: staying */}
        <section className="hp-dark">
          <div className="hp-wrap">
            <h2>If you want me to keep watching your numbers</h2>
            <p className="hp-sub">The free diagnosis shows you what is wrong today. A plan keeps you from sliding back.</p>
            <div className="hp-stay-grid">
              {STAYING.map(s => <div key={s.title} className="hp-stay"><h3>{s.title}</h3><p>{s.body}</p></div>)}
            </div>
            <div className="hp-price">
              <p><strong>From KES 6,500 a month.</strong> Pay with M-Pesa or card, one month at a time. Nothing renews on its own.</p>
              <Link href="/pricing" className="hp-textlink">See the plans</Link>
            </div>
          </div>
        </section>

        {/* Trigger */}
        <section>
          <div className="hp-wrap hp-when">
            <div>
              <h2>The best time is before you spend more.</h2>
              <p className="hp-sub">Three minutes now costs less than another month of ads aimed at the wrong people.</p>
              <p style={{ marginTop: 28 }}><Link href="/questionnaire" className="hp-btn">{CTA} <ArrowRight size={18} aria-hidden="true" /></Link></p>
            </div>
            <ul className="hp-card hp-check" aria-label="Good moments to run the diagnosis">
              {WHEN.map(w => <li key={w}><span className="hp-tick" aria-hidden="true"><Check size={14} strokeWidth={3} /></span>{w}</li>)}
            </ul>
          </div>
        </section>

        <section id="faq" style={{ paddingTop: 0, scrollMarginTop: 80 }}>
          <div className="hp-wrap">
            <h2>Questions people ask first</h2>
            <div className="hp-card hp-faq">
              {FAQS.map(f => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
            </div>
          </div>
        </section>
      </main>

      <footer className="hp-dark">
        <section className="hp-end">
          <div className="hp-wrap">
            <h2>Find out why your leads are not buying.</h2>
            <p className="hp-lead">10 questions, about 3 minutes, and a free call with me to go through the answer.</p>
            <Link href="/questionnaire" className="hp-btn hp-btn-light">{CTA} <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
        </section>
        <div className="hp-wrap">
          <div className="hp-foot">
            <span>© 2026 Ideal ICP, Nairobi</span>
            <nav aria-label="Footer">
              <Link href="/pricing">Pricing</Link><Link href="/about">About</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="mailto:info@idealicp.com">Contact</a>
            </nav>
          </div>
        </div>
      </footer>

      <SocialProofToast />
    </div>
  )
}
