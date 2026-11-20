import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { HomeNav } from '../home-client'
import { SiteFooter, SiteStyles } from '../site'

// Pricing. Every line here describes something the product does today:
// limits come from the code (3, 20 and unlimited diagnoses a month; market
// research re-runs weekly, daily, three times a day). Plans are paid one
// month at a time, so there is no annual price to show.

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Pricing | Ideal ICP',
  description: 'Start with a free diagnosis and a free call. Paid plans from KES 6,500 a month track your cost per lead every week, with a media buyer in Nairobi watching your numbers. Pay by M-Pesa or card, month by month.',
  alternates: { canonical: '/pricing' },
}

const PLANS = [
  {
    name: 'Free', price: 'KES 0', per: '',
    forWho: 'See what is wrong before you spend anything.',
    cta: 'Get my free diagnosis', pick: false,
    items: ['One diagnosis: 10 questions, about 3 minutes', 'Your score out of 100', 'Your top 3 problems', '3 fixes to start this week', 'A free 20 minute call with Eugene'],
  },
  {
    name: 'Starter', price: 'KES 6,500', per: 'a month',
    forWho: 'For a business running its own ads that wants them watched.',
    cta: 'Start free', pick: true,
    items: ['The full report: every problem and the whole fix plan', 'Your cost per lead tracked every week', 'A written note from Eugene every month', 'A weekly briefing on your market, with sources', 'Message Eugene from your dashboard', 'Up to 3 diagnoses a month'],
  },
  {
    name: 'Pro', price: 'KES 13,000', per: 'a month',
    forWho: 'For a business spending more, that wants Eugene closer.',
    cta: 'Start free', pick: false,
    items: ['Everything in Starter', 'An onboarding call with Eugene to set priorities', 'Monthly notes can include a voice or video walk-through', 'Re-run your market research once a day', 'Up to 20 diagnoses a month'],
  },
  {
    name: 'Agency', price: 'KES 26,000', per: 'a month',
    forWho: 'For agencies and consultants running ads for several clients.',
    cta: 'Start free', pick: false,
    items: ['Everything in Pro', 'Unlimited diagnoses, one for each client', 'A strategy call with Eugene every month', 'Re-run market research up to 3 times a day'],
  },
]

const PAYING = [
  { title: 'Pay with M-Pesa or card', body: 'Checkout runs through Paystack. Prices are in Kenya shillings.' },
  { title: 'One month at a time', body: 'Nothing renews on its own. You get a reminder a week before your month ends and you decide whether to pay again.' },
  { title: 'Renew early, lose nothing', body: 'If you pay before your month is up, the new 30 days are added to the end of what you already have.' },
  { title: 'Stop whenever you like', body: 'If you cancel or simply do not renew, you keep everything until the end of the month you paid for.' },
]

const QUESTIONS = [
  { q: 'Why do I start with the free diagnosis?', a: 'Because the paid plans build on it. The diagnosis creates your account and your first report. From your dashboard you can then choose a plan, or stay free.' },
  { q: 'What is the difference between the free report and the full one?', a: 'The free report asks 10 questions and shows your top 3 problems. The full report asks 22, opens your landing page to check it, and gives you every problem with the complete fix plan.' },
  { q: 'Can I change plans?', a: 'Yes, from your dashboard. If you move up partway through a month you only pay the difference for the days left.' },
  { q: 'Do you run my ads for me?', a: 'No. Ideal ICP shows you what to fix and tracks whether it is working, and you or your agency make the changes. If you want Eugene to manage your campaigns, ask him on your call.' },
  { q: 'Is there a contract?', a: 'No. You pay for a month and decide each month whether to continue.' },
]

export default function PricingPage() {
  return (
    <div className="hp">
      <SiteStyles />
      <HomeNav />
      <main>
        <section className="hp-page-top">
          <div className="hp-wrap">
            <h1>Start free. Pay only if you want your numbers watched.</h1>
            <p className="hp-lead" style={{ marginTop: 20 }}>The diagnosis and the call cost nothing. A plan adds a dashboard that tracks your cost per lead every week, and a media buyer in Nairobi who reads it.</p>
          </div>
        </section>

        <section style={{ paddingTop: 0 }}>
          <div className="hp-wrap">
            <div className="hp-plans">
              {PLANS.map(p => (
                <div key={p.name} className={`hp-card hp-plan${p.pick ? ' hp-plan-pick' : ''}`}>
                  {p.pick && <span className="hp-badge">Where most people start</span>}
                  <h2 style={{ fontSize: 22 }}>{p.name}</h2>
                  <p className="hp-plan-for">{p.forWho}</p>
                  <p className="hp-plan-price">{p.price} {p.per && <small>{p.per}</small>}</p>
                  <ul>
                    {p.items.map(i => <li key={i}><Check size={16} strokeWidth={2.5} aria-hidden="true" />{i}</li>)}
                  </ul>
                  <Link href="/questionnaire" className={`hp-btn${p.pick || p.name === 'Free' ? '' : ' hp-btn-line'}`}>{p.cta}</Link>
                </div>
              ))}
            </div>
            <p className="hp-fine" style={{ maxWidth: '70ch' }}>Every plan starts with the free diagnosis, which sets up your account. You choose a paid plan from inside your dashboard.</p>
          </div>
        </section>

        <section style={{ paddingTop: 0 }}>
          <div className="hp-wrap">
            <h2>How paying works</h2>
            <div className="hp-grid2">
              {PAYING.map(c => <div key={c.title} className="hp-card hp-cause"><h3>{c.title}</h3><p>{c.body}</p></div>)}
            </div>
          </div>
        </section>

        <section style={{ paddingTop: 0 }}>
          <div className="hp-wrap">
            <h2>Questions about plans</h2>
            <div className="hp-card hp-faq">
              {QUESTIONS.map(f => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
            </div>
            <p style={{ marginTop: 28 }}><Link href="/questionnaire" className="hp-btn">Get my free diagnosis <ArrowRight size={18} aria-hidden="true" /></Link></p>
          </div>
        </section>
      </main>
      <SiteFooter title="Not sure yet? Start with the free part." lead="Run the diagnosis, talk it through with me, and decide after that." />
    </div>
  )
}
