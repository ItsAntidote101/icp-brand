import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { HomeNav } from '../../home-client'
import { CTA, SiteFooter, SiteStyles } from '../../site'
import { GUIDES, guideBySlug } from '../content'

export const dynamicParams = false
export function generateStaticParams() { return GUIDES.map(g => ({ slug: g.slug })) }

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = guideBySlug(params.slug)
  if (!g) return {}
  return {
    title: g.title, description: g.description,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: { title: g.question, description: g.description, type: 'article', url: `https://www.idealicp.com/guides/${g.slug}` },
  }
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const g = guideBySlug(params.slug)
  if (!g) notFound()
  const others = GUIDES.filter(o => o.slug !== g.slug)
  // Tells search engines this is an article answering one question, and who wrote it
  const schema = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: g.question, description: g.description,
    datePublished: g.updated, dateModified: g.updated,
    mainEntityOfPage: `https://www.idealicp.com/guides/${g.slug}`,
    author: { '@type': 'Person', name: 'Eugene Kwata', jobTitle: 'Media buyer', url: 'https://www.idealicp.com/about' },
    publisher: { '@type': 'Organization', name: 'Ideal ICP', url: 'https://www.idealicp.com' },
  }
  return (
    <div className="hp">
      <SiteStyles />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <HomeNav />
      <main>
        <article>
          <section className="hp-page-top" style={{ paddingBottom: 0 }}>
            <div className="hp-wrap">
              <p className="hp-crumb"><Link href="/guides">Guides</Link></p>
              <h1 style={{ maxWidth: '20ch' }}>{g.question}</h1>
              <p className="hp-byline"><i aria-hidden="true">EK</i><span>By Eugene Kwata, media buyer in Nairobi. Updated {new Date(g.updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}.</span></p>
            </div>
          </section>
          <section style={{ paddingTop: 36 }}>
            <div className="hp-wrap">
              <div className="hp-prose">
                <p className="hp-answer">{g.answer}</p>
                {g.body}
                <div className="hp-note" style={{ marginTop: 44 }}>
                  <h2 style={{ marginTop: 0, fontSize: 22 }}>{g.cta}</h2>
                  <p style={{ margin: '10px 0 18px' }}>The free diagnosis takes about 3 minutes. You get a scored report and a free 20 minute call with me to go through it.</p>
                  <Link href="/questionnaire" className="hp-btn">{CTA} <ArrowRight size={18} aria-hidden="true" /></Link>
                </div>
              </div>
            </div>
          </section>
        </article>
        <section style={{ paddingTop: 0 }}>
          <div className="hp-wrap">
            <h2 style={{ fontSize: 26, marginBottom: 20 }}>More answers</h2>
            <div className="hp-guides" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              {others.map(o => (
                <Link key={o.slug} href={`/guides/${o.slug}`} className="hp-card hp-guide">
                  <h3 style={{ fontSize: 20 }}>{o.question}</h3>
                  <span>Read the answer</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter title="Find out why your leads are not buying." />
    </div>
  )
}
