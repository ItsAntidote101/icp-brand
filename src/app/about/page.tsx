import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { HomeNav } from '../home-client'
import { CTA, SiteFooter, SiteStyles } from '../site'

// About. Ideal ICP is one person and the tools he built, so this page is
// written by that person, in the first person, and says plainly which parts
// are done by him and which by software.

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'About | Ideal ICP, built by a media buyer in Nairobi',
  description: 'Ideal ICP was built by Eugene Kwata, a media buyer in Nairobi, to show Kenyan businesses why their ad leads are not buying and what to fix first.',
  alternates: { canonical: '/about' },
}

const WORK = [
  { title: 'What I do myself', body: 'I take the free calls. I read the numbers my clients log, write their monthly notes and answer their messages. When a report says something I disagree with, I say so.' },
  { title: 'What the software does', body: 'It asks the questions, puts your report together from your answers and gathers news on your market each week, and it has to show where its market facts came from.' },
  { title: 'What neither of us does', body: 'Log in to your ad accounts, run your campaigns without being asked, or dress an estimate up as a fact. Where a number is an estimate, the page says so.' },
]

const PROMISES = [
  { title: 'Plain language', body: 'If I cannot explain a problem without jargon, I have not understood it well enough to charge you for it.' },
  { title: 'Honest numbers', body: 'Your dashboard shows your own figures. Outside figures come with their source. Where something is an estimate, it is labelled as one.' },
  { title: 'A person you can reach', body: 'There is a chat in your dashboard that comes to me. I reply within a working day.' },
]

export default function AboutPage() {
  return (
    <div className="hp">
      <SiteStyles />
      <HomeNav />
      <main>
        <section className="hp-page-top">
          <div className="hp-wrap">
            <h1 style={{ maxWidth: '20ch' }}>I got tired of watching good businesses pay for leads that never buy.</h1>
          </div>
        </section>

        <section style={{ paddingTop: 0 }}>
          <div className="hp-wrap hp-me">
            <div className="hp-photo" role="img" aria-label="Photo of Eugene Kwata">EK</div>
            <div>
              <p style={{ marginTop: 0 }}>I am Eugene Kwata, a media buyer in Nairobi. I trained as a graphic designer and spent two years making ads before I moved into buying them. Today I run Google and Meta campaigns for a living.</p>
              <p>Over and over I opened ad accounts with the same story. Real money going out every month. Plenty of inquiries. Very few sales. The owner blamed the agency, the agency blamed the budget, and nobody had told the owner clearly what was actually wrong.</p>
              <p>It was almost never the budget. The ads were reaching the wrong people, or promising something the page did not deliver, or the serious buyers were getting the same slow reply as everyone else.</p>
              <p>So I built the thing I wished those owners had: a short set of questions that finds where the money is leaking, a report in plain language, and a call with me to decide what to fix first.</p>
            </div>
          </div>
        </section>

        <section style={{ paddingTop: 0 }}>
          <div className="hp-wrap">
            <h2>What ICP means</h2>
            <p className="hp-sub">ICP stands for ideal customer profile: a clear picture of the person most likely to buy from you. Most wasted ad money comes from aiming at someone else. The diagnosis checks how close your ads are to that person, and the score out of 100 tells you how far off you are.</p>
          </div>
        </section>

        <section style={{ paddingTop: 0 }}>
          <div className="hp-wrap">
            <h2>Who does what</h2>
            <p className="hp-sub">This is a one-person business with good tools, not a team of twenty. You should know which is which.</p>
            <div className="hp-stay-grid" style={{ borderColor: 'var(--line)' }}>
              {WORK.map(w => (
                <div key={w.title} className="hp-stay" style={{ borderColor: 'var(--line)' }}>
                  <h3>{w.title}</h3><p style={{ color: 'var(--muted)' }}>{w.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ paddingTop: 0 }}>
          <div className="hp-wrap">
            <h2>What you can hold me to</h2>
            <div className="hp-grid2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              {PROMISES.map(c => <div key={c.title} className="hp-card hp-cause"><h3>{c.title}</h3><p>{c.body}</p></div>)}
            </div>
            <p style={{ marginTop: 32 }}><Link href="/questionnaire" className="hp-btn">{CTA} <ArrowRight size={18} aria-hidden="true" /></Link></p>
          </div>
        </section>
      </main>
      <SiteFooter title="See what your own numbers say." />
    </div>
  )
}
