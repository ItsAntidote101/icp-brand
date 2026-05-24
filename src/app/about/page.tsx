import type { Metadata } from 'next'
import Link from 'next/link'
import { Target, AlertTriangle, TrendingDown, BrainCircuit, Brain, Users, Eye, Zap, Shield, ArrowRight, Check, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About ICP Diagnostic — Built by Media Buyers, for Marketers',
  description: 'ICP Diagnostic was built by performance media buyers with $2M+ in ad spend managed. Learn about our team, our mission, and why we built the only ICP diagnostic platform built specifically for African and emerging markets.',
}

export const dynamic = 'force-static'

const Warm   = '#faf6ef'
const Dark   = '#18110a'
const Orange = '#e8330a'
const Muted  = 'rgba(24,17,10,0.5)'
const Border = 'rgba(24,17,10,0.12)'
const font   = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontB  = "'PolySans Neutral', -apple-system, system-ui, sans-serif"

export default function AboutPage() {
  return (
    <div style={{ fontFamily: fontB, color: Dark, backgroundColor: Warm, margin: 0, padding: 0 }}>

      {/* ── SECTION ONE: Hero ── */}
      <section style={{ background: Dark, padding: '120px 0', textAlign: 'center', position: 'relative' }}>

        {/* Sticky Nav */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 40px',
          background: 'rgba(24,17,10,0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, background: Orange, flexShrink: 0 }} />
            <span style={{ fontFamily: font, fontWeight: 700, fontSize: 16, color: '#fff' }}>ICP Diagnostic</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="hidden md:flex">
            <Link href="/"             style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>Home</Link>
            <Link href="/questionnaire" style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>Questionnaire</Link>
            <Link href="/about"        style={{ fontFamily: fontB, fontSize: 14, color: '#fff', textDecoration: 'none', fontWeight: 600 }}>About</Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/dashboard" style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>Login</Link>
            <Link href="/questionnaire" style={{ fontFamily: font, fontWeight: 700, fontSize: 14, color: '#fff', background: Orange, padding: '10px 20px', borderRadius: 6, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Get Free Diagnosis
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'inline-block', background: 'rgba(232,51,10,0.15)', color: Orange, fontFamily: fontB, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 16px', border: '1px solid rgba(232,51,10,0.3)', marginBottom: 32 }}>
            Our Story
          </div>

          <h1 style={{ fontFamily: font, fontWeight: 700, fontSize: 'clamp(36px,4vw,60px)', color: '#fff', maxWidth: 800, margin: '0 auto 24px', lineHeight: 1.15, letterSpacing: '-0.03em' }}>
            We got tired of watching good businesses waste money on the wrong audience.
          </h1>

          <p style={{ fontFamily: fontB, fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 600, margin: '0 auto', lineHeight: 1.65 }}>
            ICP Diagnostic was built by performance media buyers who spent years diagnosing the same problems over and over. We decided to build the tool we always wished existed.
          </p>

          {/* Stat chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 56 }}>
            {[
              { value: '$2M+', label: 'In ad spend managed' },
              { value: '10+',  label: 'Years of combined experience' },
              { value: '50+',  label: 'Diagnoses completed' },
            ].map((stat) => (
              <div key={stat.value} style={{ background: Warm, border: `1.5px solid ${Border}`, padding: '16px 24px', textAlign: 'center', minWidth: 140 }}>
                <div style={{ fontFamily: font, fontWeight: 700, fontSize: 28, color: Dark, lineHeight: 1.1 }}>{stat.value}</div>
                <div style={{ fontFamily: fontB, fontSize: 13, color: Muted, marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION TWO: The Problem We Saw ── */}
      <section style={{ background: Warm, padding: '120px 0' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            <div>
              <h2 style={{ fontFamily: font, fontWeight: 700, fontSize: 'clamp(28px,3vw,42px)', color: Dark, margin: '0 0 32px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                The same problem. Every single client.
              </h2>
              <p style={{ fontFamily: fontB, fontSize: 17, color: Muted, lineHeight: 1.75, margin: '0 0 20px' }}>
                After years of managing ad campaigns across East Africa, the UK, and the US, we kept seeing the same pattern. Businesses spending serious money on ads. Getting little to nothing back. Blaming their agency. Blaming the platform. Blaming their budget.
              </p>
              <p style={{ fontFamily: fontB, fontSize: 17, color: Muted, lineHeight: 1.75, margin: '0 0 20px' }}>
                The real problem was almost always the same. They were targeting the wrong people with the wrong message on the wrong landing page. Their ICP was broken. And nobody had ever told them that clearly.
              </p>
              <p style={{ fontFamily: fontB, fontSize: 17, color: Muted, lineHeight: 1.75 }}>
                So we built a tool that does exactly that. No fluff. No generic dashboards. Just a clear diagnosis of what is broken, why it is costing you money, and what to fix first.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: <Target size={20} color={Orange} />, bg: 'rgba(232,51,10,0.08)', title: 'Wrong audience', desc: 'Most businesses target who they think their customer is, not who actually buys from them.' },
                { icon: <AlertTriangle size={20} color="#f59e0b" />, bg: 'rgba(245,158,11,0.08)', title: 'Broken funnels', desc: 'Landing pages with too much friction kill conversions before the audience even sees the offer.' },
                { icon: <TrendingDown size={20} color="#dc2626" />, bg: 'rgba(220,38,38,0.08)', title: 'Wasted budget', desc: 'Money follows targeting. Wrong targeting means every shilling spent compounds the problem.' },
              ].map((card) => (
                <div key={card.title} style={{ background: '#fff', border: `1.5px solid ${Border}`, padding: '24px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {card.icon}
                  </div>
                  <div>
                    <div style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: Dark, marginBottom: 5 }}>{card.title}</div>
                    <div style={{ fontFamily: fontB, fontSize: 14, color: Muted, lineHeight: 1.65 }}>{card.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION THREE: The Team ── */}
      <section style={{ background: '#fff', padding: '120px 0' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontFamily: font, fontWeight: 700, fontSize: 'clamp(28px,3vw,42px)', color: Dark, textAlign: 'center', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            The minds behind the diagnostic.
          </h2>
          <p style={{ fontFamily: fontB, fontSize: 17, color: Muted, textAlign: 'center', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
            A combination of experienced media buyers and AI research systems working together to give you the most accurate diagnosis possible.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" style={{ marginTop: 56 }}>

            {/* Card 1 — Lead Media Buyer */}
            <div style={{ background: Warm, border: `1.5px solid ${Border}`, padding: 32 }}>
              <div style={{ width: 64, height: 64, background: Dark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: font, fontWeight: 700, fontSize: 16, color: '#fff' }}>MB</span>
              </div>
              <div style={{ fontFamily: font, fontWeight: 700, fontSize: 20, color: Dark, margin: '16px 0 4px' }}>Lead Media Buyer</div>
              <div style={{ fontFamily: fontB, fontSize: 14, color: Orange }}>Founder and Lead Media Buyer</div>
              <p style={{ fontFamily: fontB, fontSize: 14, color: Muted, lineHeight: 1.7, margin: '12px 0 20px' }}>
                10+ years managing performance campaigns across East Africa, UK, and US. Diagnosed over 50 ICP misalignments before building the tool to do it automatically.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {['Google Ads', 'Meta Ads', 'East Africa', 'B2B Lead Gen'].map((tag) => (
                  <span key={tag} style={{ fontFamily: fontB, fontSize: 12, fontWeight: 600, color: Dark, background: 'rgba(24,17,10,0.07)', border: `1px solid ${Border}`, padding: '3px 10px' }}>{tag}</span>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, fontSize: 13, color: Muted }}>
                <MapPin size={13} color={Muted} />
                <span style={{ fontFamily: fontB }}>Nairobi, Kenya</span>
              </div>
            </div>

            {/* Card 2 — The Diagnostic Engine */}
            <div style={{ background: Dark, padding: 32 }}>
              <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BrainCircuit size={28} color="#fff" />
              </div>
              <div style={{ fontFamily: font, fontWeight: 700, fontSize: 20, color: '#fff', margin: '16px 0 4px' }}>The Diagnostic Engine</div>
              <div style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>AI Research Analyst</div>
              <p style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: '12px 0 20px' }}>
                Powered by Claude, Anthropic's frontier AI. Runs live web research, visits landing pages, benchmarks performance against real industry data, and generates personalised diagnostic reports in minutes.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {['Live Web Research', 'Landing Page Analysis', 'Regional Benchmarks', 'ICP Scoring'].map((tag) => (
                  <span key={tag} style={{ fontFamily: fontB, fontSize: 12, fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '3px 10px' }}>{tag}</span>
                ))}
              </div>
            </div>

            {/* Card 3 — The Intelligence System */}
            <div style={{ background: Warm, border: `1.5px solid ${Border}`, padding: 32 }}>
              <div style={{ width: 64, height: 64, background: 'rgba(24,17,10,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={28} color={Dark} />
              </div>
              <div style={{ fontFamily: font, fontWeight: 700, fontSize: 20, color: Dark, margin: '16px 0 4px' }}>The Intelligence System</div>
              <div style={{ fontFamily: fontB, fontSize: 14, color: Orange }}>Market Research Specialist</div>
              <p style={{ fontFamily: fontB, fontSize: 14, color: Muted, lineHeight: 1.7, margin: '12px 0 20px' }}>
                Monitors competitor activity, tracks regional ad cost benchmarks across 10+ markets, and delivers weekly market briefings for every subscriber. Updated every Monday automatically.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {['Competitor Monitoring', 'Weekly Briefings', '10+ Regions', 'Benchmark Tracking'].map((tag) => (
                  <span key={tag} style={{ fontFamily: fontB, fontSize: 12, fontWeight: 600, color: Dark, background: 'rgba(24,17,10,0.07)', border: `1px solid ${Border}`, padding: '3px 10px' }}>{tag}</span>
                ))}
              </div>
            </div>

            {/* Card 4 — Regional Advisors */}
            <div style={{ background: '#fff', border: `1.5px dashed ${Border}`, padding: 32 }}>
              <div style={{ width: 64, height: 64, background: 'rgba(24,17,10,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={28} color={Muted} />
              </div>
              <div style={{ fontFamily: font, fontWeight: 700, fontSize: 20, color: Dark, margin: '16px 0 4px' }}>Regional Advisors</div>
              <div style={{ fontFamily: fontB, fontSize: 14, color: Orange }}>Onboarding Q3 2026</div>
              <p style={{ fontFamily: fontB, fontSize: 14, color: Muted, lineHeight: 1.7, margin: '12px 0 20px' }}>
                We are onboarding specialist media buyers for East Africa, West Africa, South Africa, and UK markets. Each advisor brings deep regional expertise to support Agency tier clients.
              </p>
              <a href="mailto:info@idealicp.com" style={{ fontFamily: fontB, fontSize: 14, color: Dark, textDecoration: 'underline' }}>
                Join as an Advisor →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION FOUR: Our Values ── */}
      <section style={{ background: Warm, padding: '120px 0' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontFamily: font, fontWeight: 700, fontSize: 'clamp(28px,3vw,42px)', color: Dark, margin: '0 0 56px', letterSpacing: '-0.02em' }}>
            How we think.
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Eye size={22} color={Orange} />,
                bg: 'rgba(232,51,10,0.08)',
                title: 'Radical specificity',
                desc: 'Generic advice is worthless. Every recommendation we make is tied to your actual data, your actual region, and your actual ICP. Not templates. Not best practices. Your situation.',
              },
              {
                icon: <Zap size={22} color="#f59e0b" />,
                bg: 'rgba(245,158,11,0.08)',
                title: 'Speed over perfection',
                desc: 'A good diagnosis delivered fast is worth more than a perfect one delivered in six weeks. We built this platform to give you answers in minutes, not months.',
              },
              {
                icon: <Shield size={22} color="#16a34a" />,
                bg: 'rgba(22,163,74,0.08)',
                title: 'Honesty over comfort',
                desc: 'We will tell you your ICP is wrong, your landing page is broken, and your budget is misallocated. Even when it is uncomfortable. Especially when it is uncomfortable.',
              },
            ].map((v) => (
              <div key={v.title} style={{ background: '#fff', border: `1.5px solid ${Border}`, padding: 32 }}>
                <div style={{ width: 48, height: 48, background: v.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {v.icon}
                </div>
                <div style={{ fontFamily: font, fontWeight: 700, fontSize: 18, color: Dark, margin: '20px 0 12px' }}>{v.title}</div>
                <p style={{ fontFamily: fontB, fontSize: 15, color: Muted, lineHeight: 1.7, margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION FIVE: The Mission ── */}
      <section style={{ background: Dark, padding: '120px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontFamily: font, fontWeight: 700, fontSize: 'clamp(32px,4vw,52px)', color: '#fff', margin: '0 0 32px', letterSpacing: '-0.03em' }}>
            Our mission is simple.
          </h2>
          <p style={{ fontFamily: fontB, fontSize: 'clamp(20px,2.5vw,26px)', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', maxWidth: 700, margin: '0 auto 20px', lineHeight: 1.65 }}>
            "Every business deserves to know exactly where their marketing is breaking, before they spend another shilling finding out the hard way."
          </p>
          <p style={{ fontFamily: fontB, fontSize: 16, color: 'rgba(255,255,255,0.35)', margin: '0 0 48px' }}>
            — The ICP Diagnostic Team
          </p>
          <Link href="/questionnaire" style={{ fontFamily: font, fontWeight: 700, fontSize: 15, color: '#fff', background: Orange, padding: '16px 32px', borderRadius: 6, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Get Your Free Diagnosis
            <ArrowRight size={16} color="#fff" />
          </Link>
        </div>
      </section>

      {/* ── SECTION SIX: Footer ── */}
      <footer style={{ background: Warm, borderTop: `1.5px solid ${Border}`, padding: '48px 0' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>

          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, background: Orange, flexShrink: 0 }} />
            <span style={{ fontFamily: font, fontWeight: 700, fontSize: 15, color: Dark }}>ICP Diagnostic</span>
          </Link>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {[
              { label: 'Home',          href: '/' },
              { label: 'Questionnaire', href: '/questionnaire' },
              { label: 'Pricing',       href: '/pricing' },
              { label: 'Dashboard',     href: '/dashboard' },
              { label: 'About',         href: '/about' },
              { label: 'Privacy',       href: '/privacy' },
              { label: 'Terms',         href: '/terms' },
            ].map((link) => (
              <Link key={link.href} href={link.href} style={{ fontFamily: fontB, fontSize: 14, color: Muted, textDecoration: 'none' }}>
                {link.label}
              </Link>
            ))}
          </div>

          <p style={{ fontFamily: fontB, fontSize: 13, color: Muted, margin: 0 }}>
            &copy; {new Date().getFullYear()} ICP Diagnostic. Built for African and emerging markets.
          </p>
        </div>
      </footer>

    </div>
  )
}
