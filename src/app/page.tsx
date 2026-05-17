import Link from 'next/link'

export const dynamic = 'force-dynamic'

// ─── Design tokens (matches Ohio Demo 9) ─────────────────────────────────────
const P   = '#302161'                    // primary
const Pbody = 'rgba(48,33,97,0.88)'     // body text
const Pmuted = 'rgba(48,33,97,0.48)'    // muted text
const Pborder = 'rgba(48,33,97,0.1)'    // border
const BgAlt = '#f8f7ff'                 // near-white bg
const BgCard = '#f4f2ff'                // light purple card

// ─── Nav ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
]

// ─── Pain point cards ─────────────────────────────────────────────────────────

const PAIN_POINTS = [
  {
    icon: '🎯',
    title: 'Wrong audience, every time',
    desc: "You're targeting the right industry but the wrong decision-maker — or chasing a customer who can't actually afford you.",
  },
  {
    icon: '📡',
    title: "Ad targeting that looks right but isn't",
    desc: "Your audience settings look correct but the algorithm is serving your ads to people who will never, ever buy.",
  },
  {
    icon: '🚧',
    title: 'Landing pages that kill intent',
    desc: 'Clicks arrive but the page loses them in seconds. Wrong headline, missing proof, wrong call to action.',
  },
  {
    icon: '💸',
    title: 'Budget going to the wrong stage',
    desc: "Too much on awareness, not enough on conversion — or the reverse. Either way, you're bleeding spend.",
  },
  {
    icon: '📣',
    title: "Message your market doesn't feel",
    desc: "Your offer is solid but the copy speaks to pain your audience doesn't recognise — or doesn't believe yet.",
  },
  {
    icon: '📊',
    title: 'Positioning that sounds like everyone else',
    desc: 'Competitors say the same thing. Nothing in your funnel makes switching feel like the obvious next step.',
  },
]

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: '01',
    title: 'Answer 18 questions about your business',
    desc: 'Tell us about your offer, your targeting, your funnel, and your current results. Every question is calibrated — no fluff.',
  },
  {
    n: '02',
    title: 'AI generates your personalised diagnosis',
    desc: 'Our model cross-references your answers against proven ICP frameworks and surfaces exactly where your funnel is breaking down.',
  },
  {
    n: '03',
    title: 'Walk away with a clear action plan',
    desc: 'Not a 40-page PDF. A prioritised list of specific changes you can implement this week — ranked by revenue impact.',
  },
]

// ─── Stats ───────────────────────────────────────────────────────────────────

const STATS = [
  { value: '2,400+', label: 'Diagnostics completed' },
  { value: '4.9/5', label: 'Average report rating' },
  { value: '5 min', label: 'Average completion time' },
  { value: '38%', label: 'Avg. CPA improvement' },
]

// ─── Pricing ─────────────────────────────────────────────────────────────────

const TIERS = [
  {
    name: 'Starter',
    price: 'KES 6,500',
    period: '/ month',
    desc: 'For solo founders and small teams running their first serious paid campaigns.',
    features: [
      'Monthly ICP diagnostic report',
      'Full 6-dimension score breakdown',
      'Specific quick-win recommendations',
      'Subscriber dashboard access',
    ],
    cta: 'Start with Starter',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 'KES 13,000',
    period: '/ month',
    desc: 'For growing teams that need speed, depth, and campaign-level analysis.',
    features: [
      'Everything in Starter',
      'Priority re-diagnosis turnaround',
      'Campaign CSV analysis',
      'Score trend tracking over time',
    ],
    cta: 'Start with Pro',
    highlight: true,
  },
  {
    name: 'Agency',
    price: 'KES 26,000',
    period: '/ month',
    desc: 'For agencies managing multiple clients who need reporting at scale.',
    features: [
      'Everything in Pro',
      'Multi-client reporting',
      'Dedicated strategy review session',
      'White-label report exports',
    ],
    cta: 'Start with Agency',
    highlight: false,
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main style={{ fontFamily: 'var(--font-body)', color: Pbody, background: '#fff' }}>

      {/* ── Floating pill nav ─────────────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', justifyContent: 'center', padding: '16px 24px' }}>
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: 980,
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${Pborder}`,
          borderRadius: 32,
          padding: '10px 16px 10px 20px',
          boxShadow: '0 2px 24px rgba(48,33,97,0.08)',
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg, #302161 0%, #6c4ddd 100%)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: P, letterSpacing: '-0.4px' }}>
              ICP Brand
            </span>
          </Link>

          {/* Center links — hidden on mobile */}
          <div style={{ display: 'flex', gap: 4 }} className="hidden sm:flex">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} style={{
                color: Pbody,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                padding: '8px 16px',
                borderRadius: 24,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(136,136,137,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {l.label}
              </a>
            ))}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/dashboard" style={{
              color: Pbody,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
              padding: '8px 14px',
              borderRadius: 24,
            }}
            className="hidden sm:block">
              Login
            </Link>
            <Link href="/questionnaire" style={{
              background: P,
              color: '#fff',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
              padding: '9px 18px',
              borderRadius: 12,
              letterSpacing: '-0.2px',
              whiteSpace: 'nowrap',
            }}>
              Get Started
            </Link>
          </div>
        </nav>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px 80px', textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: BgCard,
          border: `1px solid ${Pborder}`,
          borderRadius: 32,
          padding: '6px 16px',
          marginBottom: 28,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: P }}>
            Free · AI-Powered · Instant Results
          </span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(40px, 7vw, 68px)',
          fontWeight: 800,
          lineHeight: 1.08,
          letterSpacing: '-0.4px',
          color: P,
          margin: '0 0 24px',
        }}>
          Understand every move<br />
          <span style={{ background: 'linear-gradient(135deg, #6c4ddd 0%, #302161 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            your money makes.
          </span>
        </h1>

        <p style={{
          fontSize: 18,
          lineHeight: 1.7,
          color: Pbody,
          maxWidth: 560,
          margin: '0 auto 40px',
        }}>
          Get a free ICP diagnostic report in 5 minutes. We pinpoint exactly where your
          targeting, messaging, or funnel is leaking revenue — with a clear plan to fix it.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          <Link href="/questionnaire" style={{
            display: 'inline-block',
            background: P,
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 16,
            padding: '15px 32px',
            borderRadius: 12,
            letterSpacing: '-0.3px',
            boxShadow: '0 8px 32px rgba(48,33,97,0.28)',
          }}>
            Get My Free Diagnosis →
          </Link>
          <a href="#how-it-works" style={{
            display: 'inline-block',
            background: BgCard,
            color: P,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 16,
            padding: '15px 32px',
            borderRadius: 12,
            letterSpacing: '-0.3px',
            border: `1px solid ${Pborder}`,
          }}>
            See how it works
          </a>
        </div>

        <p style={{ fontSize: 13, color: Pmuted }}>
          No credit card required · Takes 5 minutes · Results delivered instantly
        </p>
      </section>

      {/* ── Social proof bar ──────────────────────────────────────────────────── */}
      <div style={{ background: BgAlt, borderTop: `1px solid ${Pborder}`, borderBottom: `1px solid ${Pborder}`, padding: '20px 24px' }}>
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(20px, 4vw, 56px)',
          flexWrap: 'wrap',
        }}>
          {[
            '✦ 100% Free diagnostic',
            '✦ AI-powered analysis',
            '✦ Report in seconds',
            '✦ No agency jargon',
            '✦ Actionable fixes only',
          ].map(s => (
            <span key={s} style={{ fontSize: 13, fontWeight: 600, color: Pbody, letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* ── Pain points ───────────────────────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: 1080, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: P, opacity: 0.5, marginBottom: 12 }}>
            Stop guessing. Start knowing.
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800,
            letterSpacing: '-0.4px',
            color: P,
            margin: '0 0 16px',
            lineHeight: 1.15,
          }}>
            Burning ad spend with nothing to show for it?
          </h2>
          <p style={{ fontSize: 17, color: Pbody, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            Most campaigns fail for one of six reasons. We diagnose all of them — in minutes.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {PAIN_POINTS.map(card => (
            <div key={card.title} style={{
              background: BgCard,
              border: `1px solid ${Pborder}`,
              borderRadius: 20,
              padding: '28px 28px 24px',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>{card.icon}</div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                fontWeight: 700,
                color: P,
                letterSpacing: '-0.3px',
                margin: '0 0 10px',
              }}>
                {card.title}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: Pbody, margin: 0 }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why it matters now — stats ────────────────────────────────────────── */}
      <div style={{ background: BgAlt, borderTop: `1px solid ${Pborder}`, borderBottom: `1px solid ${Pborder}`, padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: Pmuted, marginBottom: 40 }}>
            Why it matters now.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 32 }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 44,
                  fontWeight: 800,
                  color: P,
                  letterSpacing: '-1px',
                  margin: '0 0 6px',
                  lineHeight: 1,
                }}>
                  {s.value}
                </p>
                <p style={{ fontSize: 14, color: Pbody, margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ maxWidth: 960, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: P, opacity: 0.5, marginBottom: 12 }}>
            Simple process
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800,
            letterSpacing: '-0.4px',
            color: P,
            margin: '0 0 16px',
          }}>
            Three steps. Five minutes.
          </h2>
          <p style={{ fontSize: 17, color: Pbody, maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
            A clear path forward.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
          {STEPS.map((step, i) => (
            <div key={step.n} style={{
              background: i === 1 ? P : BgCard,
              border: `1px solid ${i === 1 ? 'transparent' : Pborder}`,
              borderRadius: 20,
              padding: '36px 28px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                top: -12,
                right: 16,
                fontFamily: 'var(--font-display)',
                fontSize: 88,
                fontWeight: 900,
                color: i === 1 ? 'rgba(255,255,255,0.07)' : 'rgba(48,33,97,0.06)',
                lineHeight: 1,
                pointerEvents: 'none',
                userSelect: 'none',
              }}>
                {step.n}
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 10,
                background: i === 1 ? 'rgba(255,255,255,0.15)' : P,
                color: '#fff',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 13,
                marginBottom: 20,
              }}>
                {step.n}
              </div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 17,
                fontWeight: 700,
                color: i === 1 ? '#fff' : P,
                letterSpacing: '-0.3px',
                margin: '0 0 12px',
                lineHeight: 1.3,
              }}>
                {step.title}
              </h3>
              <p style={{
                fontSize: 14,
                lineHeight: 1.65,
                color: i === 1 ? 'rgba(255,255,255,0.75)' : Pbody,
                margin: 0,
              }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: BgAlt, borderTop: `1px solid ${Pborder}`, padding: '100px 24px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: P, opacity: 0.5, marginBottom: 12 }}>
              Simple pricing
            </p>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 800,
              letterSpacing: '-0.4px',
              color: P,
              margin: '0 0 16px',
            }}>
              Built to grow with you.
            </h2>
            <p style={{ fontSize: 17, color: Pbody, maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
              Start free. Subscribe when you see the value. Cancel anytime.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16, alignItems: 'start' }}>
            {TIERS.map(tier => (
              <div key={tier.name} style={{
                background: tier.highlight ? P : '#fff',
                border: `1px solid ${tier.highlight ? 'transparent' : Pborder}`,
                borderRadius: 20,
                padding: '32px 28px',
                boxShadow: tier.highlight ? '0 16px 48px rgba(48,33,97,0.28)' : 'none',
                position: 'relative',
              }}>
                {tier.highlight && (
                  <div style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #a78bfa, #6c4ddd)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    padding: '4px 14px',
                    borderRadius: 32,
                  }}>
                    Most popular
                  </div>
                )}

                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: tier.highlight ? 'rgba(255,255,255,0.6)' : Pmuted,
                  margin: '0 0 12px',
                }}>
                  {tier.name}
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 38,
                    fontWeight: 800,
                    letterSpacing: '-1px',
                    color: tier.highlight ? '#fff' : P,
                    lineHeight: 1,
                  }}>
                    {tier.price}
                  </span>
                  <span style={{ fontSize: 14, color: tier.highlight ? 'rgba(255,255,255,0.6)' : Pmuted }}>
                    {tier.period}
                  </span>
                </div>

                <p style={{ fontSize: 14, lineHeight: 1.6, color: tier.highlight ? 'rgba(255,255,255,0.75)' : Pbody, margin: '0 0 24px' }}>
                  {tier.desc}
                </p>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tier.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14 }}>
                      <span style={{
                        flexShrink: 0,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: tier.highlight ? 'rgba(255,255,255,0.2)' : BgCard,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        color: tier.highlight ? '#fff' : P,
                        fontWeight: 700,
                        marginTop: 1,
                      }}>
                        ✓
                      </span>
                      <span style={{ color: tier.highlight ? 'rgba(255,255,255,0.85)' : Pbody }}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href="/questionnaire" style={{
                  display: 'block',
                  textAlign: 'center',
                  textDecoration: 'none',
                  background: tier.highlight ? '#fff' : P,
                  color: tier.highlight ? P : '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  padding: '13px 20px',
                  borderRadius: 12,
                  letterSpacing: '-0.2px',
                }}>
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: 14, color: Pmuted, marginTop: 28 }}>
            Start with a free diagnostic. Upgrade only when you&rsquo;re ready.
          </p>
        </div>
      </section>

      {/* ── You ask, we answer — FAQ ──────────────────────────────────────────── */}
      <section style={{ maxWidth: 640, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 800,
            letterSpacing: '-0.4px',
            color: P,
            margin: '0 0 12px',
          }}>
            You ask, we answer.
          </h2>
          <p style={{ fontSize: 16, color: Pbody }}>Everything you need to know.</p>
        </div>

        {[
          {
            q: 'Is the diagnostic really free?',
            a: 'Yes. Your first ICP diagnostic report is 100% free, no credit card required. You get a full 6-dimension breakdown and specific recommendations.',
          },
          {
            q: 'How is this different from a generic marketing audit?',
            a: 'We focus exclusively on your Ideal Customer Profile — the root cause behind most ad performance issues. Our model is calibrated by region, industry, and funnel type.',
          },
          {
            q: 'How long does it take?',
            a: 'The questionnaire takes 4–6 minutes. Your report is generated in under 30 seconds.',
          },
          {
            q: 'What do I need before I start?',
            a: "Just knowledge of your current ad campaigns — your offer, who you're targeting, your approximate spend, and what results you're getting. No spreadsheets needed.",
          },
        ].map((item, i) => (
          <div key={i} style={{
            borderBottom: `1px solid ${Pborder}`,
            padding: '24px 0',
          }}>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 700,
              color: P,
              letterSpacing: '-0.3px',
              margin: '0 0 10px',
            }}>
              {item.q}
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: Pbody, margin: 0 }}>
              {item.a}
            </p>
          </div>
        ))}
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(160deg, #f0edff 0%, #e8e2ff 50%, #ede8ff 100%)',
        borderTop: `1px solid ${Pborder}`,
        padding: '96px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 800,
            letterSpacing: '-0.4px',
            color: P,
            margin: '0 0 20px',
            lineHeight: 1.1,
          }}>
            Ready to take control of your spend?
          </h2>
          <p style={{ fontSize: 18, color: Pbody, maxWidth: 440, margin: '0 auto 40px', lineHeight: 1.65 }}>
            Every day you run ads without a clear ICP is money handed to your competitors.
            Five minutes now saves thousands later.
          </p>
          <Link href="/questionnaire" style={{
            display: 'inline-block',
            background: P,
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 17,
            padding: '17px 40px',
            borderRadius: 12,
            letterSpacing: '-0.3px',
            boxShadow: '0 12px 40px rgba(48,33,97,0.28)',
          }}>
            Start My Free Diagnosis →
          </Link>
          <p style={{ fontSize: 13, color: Pmuted, marginTop: 14 }}>
            Takes 5 minutes · Instant results · Zero cost
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${Pborder}`,
        padding: '40px 24px',
        background: '#fff',
      }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, #302161 0%, #6c4ddd 100%)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: P, letterSpacing: '-0.3px' }}>
              ICP Brand
            </span>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Questionnaire', href: '/questionnaire' },
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Pricing', href: '#pricing' },
            ].map(l => (
              <Link key={l.label} href={l.href} style={{ fontSize: 14, color: Pmuted, textDecoration: 'none' }}>
                {l.label}
              </Link>
            ))}
          </div>
          <p style={{ fontSize: 13, color: Pmuted, margin: 0 }}>
            © {new Date().getFullYear()} ICP Brand. Built to stop wasted ad spend.
          </p>
        </div>
      </footer>

    </main>
  )
}
