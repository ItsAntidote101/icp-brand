import type { Metadata } from 'next'
import Link from 'next/link'
import { HomeNav } from '../home-client'
import { SiteFooter, SiteStyles } from '../site'
import { GUIDES } from './content'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Guides for Kenyan businesses running ads | Ideal ICP',
  description: 'Plain answers to the questions business owners ask about ads and leads: why leads do not buy, what a lead should cost in Kenya and how to qualify leads on WhatsApp.',
  alternates: { canonical: '/guides' },
}

export default function GuidesPage() {
  return (
    <div className="hp">
      <SiteStyles />
      <HomeNav />
      <main>
        <section className="hp-page-top">
          <div className="hp-wrap">
            <h1>Plain answers about ads and leads.</h1>
            <p className="hp-lead" style={{ marginTop: 20 }}>Short guides for Kenyan business owners, written by a media buyer in Nairobi. Each one starts with the answer.</p>
          </div>
        </section>
        <section style={{ paddingTop: 0 }}>
          <div className="hp-wrap">
            <div className="hp-guides">
              {GUIDES.map(g => (
                <Link key={g.slug} href={`/guides/${g.slug}`} className="hp-card hp-guide">
                  <h2 style={{ fontSize: 22, lineHeight: 1.25 }}>{g.question}</h2>
                  <p>{g.description}</p>
                  <span>Read the answer</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter title="Want the answer for your own business?" />
    </div>
  )
}
