import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Calculator, ChevronRight, ClipboardList, Clock, Gauge, PhoneCall, Shuffle, Users, Wrench } from 'lucide-react'
import SocialProofToast from '@/components/SocialProofToast'
import { HomeNav, LandingTracker } from './home-client'
import { FAQS } from './home-faqs'
import { CTA, SiteFooter, SiteStyles } from './site'

// The home page. Written for one reader: a Kenyan business owner who runs ads,
// gets inquiries and sees few sales.
//
// Few words, big type, one idea per block. The order is fixed:
//   pain      the inquiry that goes quiet
//   cause     the four usual reasons
//   solution  the diagnosis, shown as an example report
//   offer     Eugene and the free call, then what a plan adds
//   trigger   when it is worth doing
// Anything that needs explaining lives in the questions at the bottom, not in
// the blocks. The chat and the report are labelled examples; nothing here is a
// statistic about past clients. Rendered on the server.

export const dynamic = 'force-static'
// Each page names its own address; a site-wide one made every page claim to be the home page
export const metadata: Metadata = { alternates: { canonical: '/' } }

const STEPS = [
  { icon: ClipboardList, label: 'Answer 10 questions' },
  { icon: Gauge,         label: 'Get your score' },
  { icon: Wrench,        label: 'See what to fix first' },
  { icon: PhoneCall,     label: 'Talk it through, free' },
]

const CAUSES = [
  { icon: Users,      label: 'The wrong people see your ad' },
  { icon: Shuffle,    label: 'Your ad and your page disagree' },
  { icon: Clock,      label: 'Slow replies lose serious buyers' },
  { icon: Calculator, label: 'Nobody knows the cost per customer' },
]

const WHEN = ['Raising your ad budget', 'Renewing with your agency', 'A new intake or launch', 'A month of leads, no sales']

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

const Go = () => <Link href="/questionnaire" className="hp-btn">{CTA} <ArrowRight size={18} aria-hidden="true" /></Link>

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
        <section className="hp-top hp-c">
          <div className="hp-wrap">
            <p className="hp-kicker">For Kenyan businesses that run ads</p>
            <h1>Leads that never buy?</h1>
            <p className="hp-lead">Find out why in 3 minutes. Free.</p>
            <Go />
            <p className="hp-fine">No card. No access to your ad accounts.</p>

            <figure className="hp-card hp-chat" aria-label="Example of an inquiry that goes quiet">
              <div className="hp-chat-top">
                <span className="hp-ava" aria-hidden="true">W</span>
                <div><p style={{ font: '600 15px/1.2 var(--body)' }}>Wanjiru</p><p style={{ fontSize: 13, color: 'var(--faint)' }}>Came from your ad</p></div>
              </div>
              <p className="hp-bub hp-in">Hi, I saw your ad. How much is the 2 bedroom?</p>
              <p className="hp-bub hp-out">Hi Wanjiru! It is KES 8.5M and there is a payment plan. When can you come for a viewing?</p>
              <p className="hp-bub hp-in">Ok, let me get back to you.</p>
              <p className="hp-seen">Seen<strong>No reply for 3 weeks</strong></p>
            </figure>

            <ol id="how" className="hp-four" style={{ scrollMarginTop: 90 }}>
              {STEPS.map(s => <li key={s.label}><span className="hp-ico" aria-hidden="true"><s.icon size={24} strokeWidth={1.75} /></span>{s.label}</li>)}
            </ol>
          </div>
        </section>

        <section style={{ paddingTop: 0 }}>
          <div className="hp-wrap hp-tiles">
            {/* Cause */}
            <div className="hp-tile">
              <div className="hp-tt">
                <h2>Plenty of inquiries. No sales.</h2>
                <p>It is rarely the budget. It is usually one of these four.</p>
              </div>
              <ul className="hp-rows">
                {CAUSES.map(c => <li key={c.label}><span className="hp-ico" aria-hidden="true"><c.icon size={22} strokeWidth={1.75} /></span>{c.label}</li>)}
              </ul>
            </div>

            {/* Solution */}
            <div className="hp-tile hp-tile-dark hp-tile-flip">
              <div className="hp-tt">
                <h2>A clear answer. In shillings.</h2>
                <p>Your score, what is leaking each month and what to fix first.</p>
                <Link href="/questionnaire" className="hp-more">{CTA} <ChevronRight size={18} aria-hidden="true" /></Link>
              </div>
              <div className="hp-card hp-report">
                <span className="hp-tag">Example report, made-up property agency</span>
                <div className="hp-score">
                  <ScoreRing score={42} />
                  <div>
                    <p className="hp-small">Estimated leak each month</p>
                    <p className="hp-waste">KES 38,000</p>
                    <p className="hp-small">of a KES 120,000 ad budget</p>
                  </div>
                </div>
                <div className="hp-sep" />
                <div className="hp-find"><span className="hp-sev" style={{ background: '#dc2626' }} aria-hidden="true" />Ads reach all of Nairobi, not people ready to buy.</div>
                <div className="hp-sep" />
                <div className="hp-find"><span className="hp-sev" style={{ background: '#d97706' }} aria-hidden="true" />New inquiries wait over a day for a reply.</div>
                <p className="hp-fix"><strong>Fix first: </strong>put the payment plan in the first line of the page.</p>
              </div>
            </div>

            {/* Offer: the person */}
            <div className="hp-tile hp-tile-warm">
              <div className="hp-photo" role="img" aria-label="Photo of Eugene Kwata">EK</div>
              <div className="hp-tt">
                <h2>A person reads your report.</h2>
                <p>I am Eugene Kwata, a media buyer in Nairobi. We talk for 20 minutes, free, and pick your first fixes.</p>
                <Link href="/about" className="hp-more">More about me <ChevronRight size={18} aria-hidden="true" /></Link>
              </div>
            </div>
          </div>
        </section>

        {/* Offer: staying */}
        <section className="hp-c" style={{ paddingTop: 0 }}>
          <div className="hp-wrap">
            <h2>Want your numbers watched?</h2>
            <div className="hp-minis">
              <div className="hp-card hp-mini">
                <div className="hp-mini-vis" aria-hidden="true">
                  <svg viewBox="0 0 220 90" width="100%" height="100%" preserveAspectRatio="none">
                    <polyline points="6,18 48,26 90,40 132,46 174,62 214,70" fill="none" stroke="#201515" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="214" cy="70" r="6" fill="#e8330a" />
                  </svg>
                </div>
                <h3>Cost per lead, every week</h3>
                <p>Log two numbers on Monday. See if leads are getting cheaper.</p>
              </div>
              <div className="hp-card hp-mini">
                <div className="hp-mini-vis" aria-hidden="true" style={{ alignItems: 'flex-end', justifyContent: 'flex-start' }}>
                  <span style={{ background: '#201515', color: '#fff', borderRadius: '16px 16px 16px 5px', padding: '11px 14px', font: '400 14px/1.4 var(--body)', maxWidth: '88%' }}>Your leads are cheaper, but replies are slow. Fix that next.</span>
                </div>
                <h3>A note from me, every month</h3>
                <p>What I would change next, written for your business.</p>
              </div>
              <div className="hp-card hp-mini">
                <div className="hp-mini-vis" aria-hidden="true" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 9 }}>
                  {['What changed', 'A competitor', 'What to do'].map((t, i) => (
                    <span key={t} style={{ background: '#fff', borderRadius: 10, padding: '8px 12px', font: '500 13px/1 var(--body)', color: i === 2 ? '#e8330a' : '#605d52' }}>{t}</span>
                  ))}
                </div>
                <h3>Your market, in three points</h3>
                <p>Each week, with the source for every claim.</p>
              </div>
            </div>
            <p className="hp-priceline"><strong>From KES 6,500 a month.</strong> M-Pesa or card. Nothing renews on its own. <Link href="/pricing" style={{ color: 'var(--ink)', fontWeight: 600, textUnderlineOffset: 4 }}>See the plans</Link></p>
          </div>
        </section>

        {/* Trigger */}
        <section className="hp-c" style={{ paddingTop: 0 }}>
          <div className="hp-wrap">
            <h2>Do it before you spend more.</h2>
            <ul className="hp-chips" aria-label="Good moments to run the diagnosis">
              {WHEN.map(w => <li key={w}>{w}</li>)}
            </ul>
            <Go />
          </div>
        </section>

        <section id="faq" style={{ paddingTop: 0, scrollMarginTop: 80 }}>
          <div className="hp-wrap">
            <h2 className="hp-c">Questions? Answers.</h2>
            <div className="hp-card hp-faq">
              {FAQS.map(f => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter title="Find out why your leads are not buying." lead="3 minutes. Free. Then a call with me." />
      <SocialProofToast />
    </div>
  )
}
