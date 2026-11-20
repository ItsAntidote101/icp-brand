import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import SocialProofToast from '@/components/SocialProofToast'
import { HomeNav, LandingTracker } from './home-client'
import { FAQS } from './home-faqs'
import { CTA, SiteFooter, SiteStyles } from './site'

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
      <SiteStyles />
      {/* The questions below, in a form search engines can read. Home page only. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }) }} />
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

      <SiteFooter title="Find out why your leads are not buying." />

      <SocialProofToast />
    </div>
  )
}
