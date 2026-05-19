import type { Metadata } from 'next'
import Link from 'next/link'
import { Target, AlertTriangle, TrendingDown, BrainCircuit, Brain, Users, Eye, Zap, Shield, ArrowRight, Check, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About ICP Diagnostic — Built by Media Buyers, for Marketers',
  description: 'ICP Diagnostic was built by performance media buyers with $2M+ in ad spend managed. Learn about our team, our mission, and why we built the only ICP diagnostic platform built specifically for African and emerging markets.',
}

export const dynamic = 'force-static'

// ─── Design tokens ────────────────────────────────────────────────────────────
const P       = '#302161'
const Pmuted  = 'rgba(48,33,97,0.5)'
const Pborder = 'rgba(48,33,97,0.08)'
const BgAlt   = '#f8f7ff'
const font    = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontB   = "'PolySans Neutral', -apple-system, system-ui, sans-serif"

export default function AboutPage() {
  return (
    <div style={{ fontFamily: fontB, color: P, backgroundColor: '#fff', margin: 0, padding: 0 }}>

      {/* ─── SECTION ONE: Hero ──────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #302161 0%, #4c1d95 100%)',
        padding: '120px 0',
        textAlign: 'center',
        position: 'relative',
      }}>

        {/* Sticky Nav */}
        <nav style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 40px',
          background: 'rgba(48,33,97,0.3)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <span style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ width: 16, height: 16, background: 'linear-gradient(135deg, #302161 0%, #6c4ddd 100%)', borderRadius: 3, display: 'block' }} />
            </span>
            <span style={{ fontFamily: font, fontWeight: 700, fontSize: 16, color: '#fff' }}>ICP Diagnostic</span>
          </Link>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="hidden md:flex">
            <Link href="/" style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Home</Link>
            <Link href="/questionnaire" style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Questionnaire</Link>
            <Link href="/about" style={{ fontFamily: fontB, fontSize: 14, color: '#fff', textDecoration: 'none', fontWeight: 600 }}>About</Link>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/dashboard" style={{
              fontFamily: fontB,
              fontSize: 14,
              color: 'rgba(255,255,255,0.8)',
              textDecoration: 'none',
            }}>Login</Link>
            <Link href="/questionnaire" style={{
              fontFamily: font,
              fontWeight: 700,
              fontSize: 14,
              color: P,
              background: '#fff',
              padding: '10px 20px',
              borderRadius: 10,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}>Get Free Diagnosis</Link>
          </div>
        </nav>

        {/* Hero content */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            fontFamily: fontB,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.1em',
            padding: '6px 16px',
            borderRadius: 100,
            marginBottom: 32,
          }}>OUR STORY</div>

          {/* H1 */}
          <h1 style={{
            fontFamily: font,
            fontWeight: 700,
            fontSize: 'clamp(36px, 4vw, 60px)',
            color: '#fff',
            maxWidth: 800,
            margin: '0 auto 24px',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
          }}>
            We got tired of watching good businesses waste money on the wrong audience.
          </h1>

          {/* Subtext */}
          <p style={{
            fontFamily: fontB,
            fontSize: 18,
            color: 'rgba(255,255,255,0.8)',
            maxWidth: 600,
            margin: '0 auto',
            lineHeight: 1.65,
          }}>
            ICP Diagnostic was built by performance media buyers who spent years diagnosing the same problems over and over. We decided to build the tool we always wished existed.
          </p>

          {/* Stat chips */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 16,
            marginTop: 56,
          }}>
            {[
              { value: '$2M+', label: 'In ad spend managed' },
              { value: '10+',  label: 'Years of combined experience' },
              { value: '50+',  label: 'Diagnoses completed' },
            ].map((stat) => (
              <div key={stat.value} style={{
                background: '#fff',
                borderRadius: 12,
                padding: '16px 24px',
                textAlign: 'center',
                minWidth: 140,
              }}>
                <div style={{ fontFamily: font, fontWeight: 700, fontSize: 28, color: P, lineHeight: 1.1 }}>{stat.value}</div>
                <div style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION TWO: The Problem We Saw ──────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '120px 0' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* Left column */}
            <div>
              <h2 style={{
                fontFamily: font,
                fontWeight: 700,
                fontSize: 'clamp(28px, 3vw, 42px)',
                color: P,
                margin: '0 0 32px',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}>
                The same problem. Every single client.
              </h2>
              <p style={{ fontFamily: fontB, fontSize: 17, color: 'rgba(48,33,97,0.75)', lineHeight: 1.75, margin: '0 0 20px' }}>
                After years of managing ad campaigns across East Africa, the UK, and the US, we kept seeing the same pattern. Businesses spending serious money on ads. Getting little to nothing back. Blaming their agency. Blaming the platform. Blaming their budget.
              </p>
              <p style={{ fontFamily: fontB, fontSize: 17, color: 'rgba(48,33,97,0.75)', lineHeight: 1.75, margin: '0 0 20px' }}>
                The real problem was almost always the same — they were targeting the wrong people with the wrong message on the wrong landing page. Their ICP was broken. And nobody had ever told them that clearly.
              </p>
              <p style={{ fontFamily: fontB, fontSize: 17, color: 'rgba(48,33,97,0.75)', lineHeight: 1.75, margin: '0 0 20px' }}>
                So we built a tool that does exactly that. No fluff. No generic dashboards. Just a clear diagnosis of what is broken, why it is costing you money, and what to fix first.
              </p>
            </div>

            {/* Right column — problem cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Card 1 */}
              <div style={{
                background: '#fff',
                borderRadius: 16,
                padding: '28px 24px',
                border: `1px solid ${Pborder}`,
                display: 'flex',
                gap: 20,
                alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: '#fee2e2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Target size={22} color="#ef4444" />
                </div>
                <div>
                  <div style={{ fontFamily: font, fontSize: 17, fontWeight: 700, color: P, marginBottom: 6 }}>Wrong audience</div>
                  <div style={{ fontFamily: fontB, fontSize: 14, color: Pmuted, lineHeight: 1.65 }}>Most businesses target who they think their customer is, not who actually buys from them.</div>
                </div>
              </div>

              {/* Card 2 */}
              <div style={{
                background: '#fff',
                borderRadius: 16,
                padding: '28px 24px',
                border: `1px solid ${Pborder}`,
                display: 'flex',
                gap: 20,
                alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: '#fef3c7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <AlertTriangle size={22} color="#f59e0b" />
                </div>
                <div>
                  <div style={{ fontFamily: font, fontSize: 17, fontWeight: 700, color: P, marginBottom: 6 }}>Broken funnels</div>
                  <div style={{ fontFamily: fontB, fontSize: 14, color: Pmuted, lineHeight: 1.65 }}>Landing pages with too much friction kill conversions before the audience even sees the offer.</div>
                </div>
              </div>

              {/* Card 3 */}
              <div style={{
                background: '#fff',
                borderRadius: 16,
                padding: '28px 24px',
                border: `1px solid ${Pborder}`,
                display: 'flex',
                gap: 20,
                alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: '#ede9fe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <TrendingDown size={22} color="#a855f7" />
                </div>
                <div>
                  <div style={{ fontFamily: font, fontSize: 17, fontWeight: 700, color: P, marginBottom: 6 }}>Wasted budget</div>
                  <div style={{ fontFamily: fontB, fontSize: 14, color: Pmuted, lineHeight: 1.65 }}>Money follows targeting. Wrong targeting means every shilling spent compounds the problem.</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION THREE: The Team ───────────────────────────────────────────── */}
      <section style={{ background: BgAlt, padding: '120px 0' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>

          {/* Heading */}
          <h2 style={{
            fontFamily: font,
            fontWeight: 700,
            fontSize: 'clamp(28px, 3vw, 42px)',
            color: P,
            textAlign: 'center',
            margin: '0 0 16px',
            letterSpacing: '-0.02em',
          }}>
            The minds behind the diagnostic.
          </h2>
          <p style={{
            fontFamily: fontB,
            fontSize: 17,
            color: Pmuted,
            textAlign: 'center',
            maxWidth: 600,
            margin: '0 auto',
            lineHeight: 1.7,
          }}>
            A combination of experienced media buyers and AI research systems working together to give you the most accurate diagnosis possible.
          </p>

          {/* Team grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" style={{ marginTop: 56 }}>

            {/* Card 1 — Lead Media Buyer */}
            <div style={{
              background: '#fff',
              borderRadius: 20,
              padding: 32,
              border: `1px solid ${Pborder}`,
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: `linear-gradient(135deg, ${P}, #6c4ddd)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: font, fontWeight: 700, fontSize: 18, color: '#fff' }}>MB</span>
              </div>
              <div style={{ fontFamily: font, fontWeight: 700, fontSize: 20, color: P, margin: '16px 0 4px' }}>Lead Media Buyer</div>
              <div style={{ fontFamily: fontB, fontSize: 14, color: '#a855f7' }}>Founder &amp; Lead Media Buyer</div>
              <p style={{ fontFamily: fontB, fontSize: 14, color: Pmuted, lineHeight: 1.7, margin: '12px 0 20px' }}>
                10+ years managing performance campaigns across East Africa, UK, and US. Diagnosed over 50 ICP misalignments before building the tool to do it automatically.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Google Ads', 'Meta Ads', 'East Africa', 'B2B Lead Gen'].map((tag) => (
                  <span key={tag} style={{
                    fontFamily: fontB, fontSize: 12, fontWeight: 600,
                    color: P, background: '#ede9fe',
                    padding: '4px 12px', borderRadius: 100,
                  }}>{tag}</span>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, fontSize: 13, color: P }}>
                <MapPin size={14} color={P} />
                <span style={{ fontFamily: fontB }}>Nairobi, Kenya</span>
              </div>
            </div>

            {/* Card 2 — The Diagnostic Engine */}
            <div style={{
              background: 'linear-gradient(135deg, #302161 0%, #4c1d95 100%)',
              borderRadius: 20,
              padding: 32,
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#ede9fe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BrainCircuit size={32} color={P} />
              </div>
              <div style={{ fontFamily: font, fontWeight: 700, fontSize: 20, color: '#fff', margin: '16px 0 4px' }}>The Diagnostic Engine</div>
              <div style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>AI Research Analyst</div>
              <p style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, margin: '12px 0 20px' }}>
                Powered by Claude, Anthropic's frontier AI. Runs live web research, visits landing pages, benchmarks performance against real industry data, and generates personalized diagnostic reports in minutes.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Live Web Research', 'Landing Page Analysis', 'Regional Benchmarks', 'ICP Scoring'].map((tag) => (
                  <span key={tag} style={{
                    fontFamily: fontB, fontSize: 12, fontWeight: 600,
                    color: '#fff', background: 'rgba(255,255,255,0.15)',
                    padding: '4px 12px', borderRadius: 100,
                  }}>{tag}</span>
                ))}
              </div>
            </div>

            {/* Card 3 — The Intelligence System */}
            <div style={{
              background: '#fff',
              borderRadius: 20,
              padding: 32,
              border: `1px solid ${Pborder}`,
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#ede9fe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Brain size={32} color={P} />
              </div>
              <div style={{ fontFamily: font, fontWeight: 700, fontSize: 20, color: P, margin: '16px 0 4px' }}>The Intelligence System</div>
              <div style={{ fontFamily: fontB, fontSize: 14, color: '#a855f7' }}>Market Research Specialist</div>
              <p style={{ fontFamily: fontB, fontSize: 14, color: Pmuted, lineHeight: 1.7, margin: '12px 0 20px' }}>
                Monitors competitor activity, tracks regional ad cost benchmarks across 10+ markets, and delivers weekly market briefings for every subscriber. Updated every Monday automatically.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Competitor Monitoring', 'Weekly Briefings', '10+ Regions', 'Benchmark Tracking'].map((tag) => (
                  <span key={tag} style={{
                    fontFamily: fontB, fontSize: 12, fontWeight: 600,
                    color: P, background: '#ede9fe',
                    padding: '4px 12px', borderRadius: 100,
                  }}>{tag}</span>
                ))}
              </div>
            </div>

            {/* Card 4 — Regional Advisors */}
            <div style={{
              background: '#fff',
              borderRadius: 20,
              padding: 32,
              border: '2px dashed rgba(48,33,97,0.15)',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Users size={32} color="rgba(48,33,97,0.3)" />
              </div>
              <div style={{ fontFamily: font, fontWeight: 700, fontSize: 20, color: P, margin: '16px 0 4px' }}>Regional Advisors</div>
              <div style={{ fontFamily: fontB, fontSize: 14, color: '#a855f7' }}>Onboarding Q3 2026</div>
              <p style={{ fontFamily: fontB, fontSize: 14, color: Pmuted, lineHeight: 1.7, margin: '12px 0 20px' }}>
                We are onboarding specialist media buyers for East Africa, West Africa, South Africa, and UK markets. Each advisor brings deep regional expertise to support Agency tier subscribers.
              </p>
              <a href="mailto:hello@idealicp.com" style={{ fontFamily: fontB, fontSize: 14, color: P, textDecoration: 'underline' }}>
                Join as an Advisor →
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ─── SECTION FOUR: Our Values ──────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '120px 0' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{
            fontFamily: font,
            fontWeight: 700,
            fontSize: 'clamp(28px, 3vw, 42px)',
            color: P,
            margin: '0 0 56px',
            letterSpacing: '-0.02em',
          }}>
            How we think.
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Value 1 */}
            <div style={{
              background: '#fff',
              border: `1px solid ${Pborder}`,
              borderRadius: 20,
              padding: 36,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: '#f3e8ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Eye size={24} color="#a855f7" />
              </div>
              <div style={{ fontFamily: font, fontWeight: 700, fontSize: 18, color: P, margin: '20px 0 12px' }}>Radical specificity</div>
              <p style={{ fontFamily: fontB, fontSize: 15, color: Pmuted, lineHeight: 1.7, margin: 0 }}>
                Generic advice is worthless. Every recommendation we make is tied to your actual data, your actual region, and your actual ICP. Not templates. Not best practices. Your situation.
              </p>
            </div>

            {/* Value 2 */}
            <div style={{
              background: '#fff',
              border: `1px solid ${Pborder}`,
              borderRadius: 20,
              padding: 36,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: '#fef3c7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={24} color="#f59e0b" />
              </div>
              <div style={{ fontFamily: font, fontWeight: 700, fontSize: 18, color: P, margin: '20px 0 12px' }}>Speed over perfection</div>
              <p style={{ fontFamily: fontB, fontSize: 15, color: Pmuted, lineHeight: 1.7, margin: 0 }}>
                A good diagnosis delivered fast is worth more than a perfect one delivered in six weeks. We built this platform to give you answers in minutes, not months.
              </p>
            </div>

            {/* Value 3 */}
            <div style={{
              background: '#fff',
              border: `1px solid ${Pborder}`,
              borderRadius: 20,
              padding: 36,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: '#dcfce7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={24} color="#16a34a" />
              </div>
              <div style={{ fontFamily: font, fontWeight: 700, fontSize: 18, color: P, margin: '20px 0 12px' }}>Honesty over comfort</div>
              <p style={{ fontFamily: fontB, fontSize: 15, color: Pmuted, lineHeight: 1.7, margin: 0 }}>
                We will tell you your ICP is wrong, your landing page is broken, and your budget is misallocated. Even when it is uncomfortable. Especially when it is uncomfortable.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── SECTION FIVE: The Mission ─────────────────────────────────────────── */}
      <section style={{ background: P, padding: '120px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{
            fontFamily: font,
            fontWeight: 700,
            fontSize: 'clamp(32px, 4vw, 52px)',
            color: '#fff',
            margin: '0 0 32px',
            letterSpacing: '-0.03em',
          }}>
            Our mission is simple.
          </h2>
          <p style={{
            fontFamily: fontB,
            fontSize: 'clamp(20px, 2.5vw, 28px)',
            color: 'rgba(255,255,255,0.85)',
            fontStyle: 'italic',
            maxWidth: 700,
            margin: '0 auto 20px',
            lineHeight: 1.65,
          }}>
            "Every business deserves to know exactly where their marketing is breaking — before they spend another shilling finding out the hard way."
          </p>
          <p style={{
            fontFamily: fontB,
            fontSize: 16,
            color: 'rgba(255,255,255,0.5)',
            margin: '0 0 48px',
          }}>
            — The ICP Diagnostic Team
          </p>
          <Link href="/questionnaire" style={{
            fontFamily: font,
            fontWeight: 700,
            fontSize: 15,
            color: P,
            background: '#fff',
            padding: '18px 36px',
            borderRadius: 14,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}>
            Get Your Free Diagnosis
            <ArrowRight size={16} color={P} />
          </Link>
        </div>
      </section>

      {/* ─── SECTION SIX: Footer ───────────────────────────────────────────────── */}
      <footer style={{
        background: '#fff',
        borderTop: `1px solid ${Pborder}`,
        padding: '48px 0',
      }}>
        <div style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <span style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${P} 0%, #6c4ddd 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ width: 14, height: 14, background: '#fff', borderRadius: 3, opacity: 0.9, display: 'block' }} />
            </span>
            <span style={{ fontFamily: font, fontWeight: 700, fontSize: 15, color: P }}>ICP Diagnostic</span>
          </Link>

          {/* Nav links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {[
              { label: 'Home',          href: '/' },
              { label: 'Questionnaire', href: '/questionnaire' },
              { label: 'Dashboard',     href: '/dashboard' },
              { label: 'About',         href: '/about' },
            ].map((link) => (
              <Link key={link.href} href={link.href} style={{
                fontFamily: fontB,
                fontSize: 14,
                color: Pmuted,
                textDecoration: 'none',
              }}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: 0 }}>
            &copy; 2025 ICP Diagnostic. Built for African &amp; emerging markets.
          </p>

        </div>
      </footer>

    </div>
  )
}
