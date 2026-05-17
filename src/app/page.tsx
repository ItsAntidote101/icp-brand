import Link from 'next/link'

export const dynamic = 'force-static'

// ─── Design tokens (matches Ohio Demo 9) ─────────────────────────────────────
const P      = '#302161'
const Pbody  = 'rgba(48,33,97,0.88)'
const Pmuted = 'rgba(48,33,97,0.48)'
const Pborder = 'rgba(48,33,97,0.1)'
const BgAlt  = '#f8f7ff'
const BgCard = '#f4f2ff'

// ─── Nav ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
]

// ─── Feature blocks ───────────────────────────────────────────────────────────

const FEATURE_BLOCKS = [
  {
    badge: 'THE REAL PROBLEM',
    title: "Your ads are working. They're just talking to the wrong person.",
    desc: "You've tested creatives. You've changed budgets. You've hired agencies. But nothing sticks — because the problem was never the ad. It was the audience. We compare who you think your ideal customer is against who your actual best customers are. The gap between those two things is where your budget disappears every single month.",
    cta: 'Find My ICP Gap →',
    href: '/questionnaire',
  },
  {
    badge: 'THE HIDDEN LEAK',
    title: "People are clicking your ads. They're just not becoming leads.",
    desc: "A high click-through rate with zero conversions is not a targeting problem. It's a friction problem. Too many form fields. Too many steps before someone sees the value. A landing page that makes people work for something they haven't been convinced they need yet. We score every step of your funnel and show you exactly where people give up — and why.",
    cta: 'Score My Funnel →',
    href: '/questionnaire',
  },
  {
    badge: 'THE BUDGET DRAIN',
    title: "You're not spending too little. You're spending in the wrong places.",
    desc: "Doubling your budget won't fix a channel mismatch. If your ideal customer makes buying decisions on LinkedIn but you're running all your spend on Meta, you're paying for attention from people who will never buy. We map your spend against your ICP behavior — by region, by platform, by audience — and show you exactly where to shift the money.",
    cta: 'Audit My Spend →',
    href: '/questionnaire',
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
  { value: '40–60%', label: 'Of ad budgets wasted on wrong audience targeting' },
  { value: '5 min',  label: 'To complete your full ICP diagnostic' },
  { value: 'KES 50K+', label: 'Average monthly waste found per diagnosis' },
  { value: 'Zero',   label: 'Ad account access needed — ever' },
]

// ─── Pricing ─────────────────────────────────────────────────────────────────

const TIERS = [
  {
    name: 'Starter',
    price: 'KES 6,500',
    period: '/ month',
    desc: 'For solo founders and small teams running their first serious paid campaigns.',
    features: [
      'Monthly ICP health check',
      'Top 3 critical findings',
      'Funnel friction score',
      'Quick wins report',
      'Email support',
    ],
    cta: 'Start Free Diagnosis',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 'KES 13,000',
    period: '/ month',
    desc: 'For growing teams that need speed, depth, and campaign-level analysis.',
    features: [
      'Everything in Starter',
      'Weekly performance snapshots',
      'CSV campaign analysis',
      'Benchmark comparisons by industry and region',
      'Full findings ranked by revenue impact',
      'Complete report history',
    ],
    cta: 'Start Pro',
    highlight: true,
  },
  {
    name: 'Agency',
    price: 'KES 26,000',
    period: '/ month',
    desc: 'For agencies managing multiple clients who need reporting at scale.',
    features: [
      'Everything in Pro',
      'Quarterly deep dive audits',
      'Multi-client management',
      'White label reports',
      'Custom diagnostic frameworks',
      'Priority support',
    ],
    cta: 'Talk To Us',
    highlight: false,
  },
]

// ─── Testimonials ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "I was three months into a campaign with nothing to show for it. My CEO was asking questions I couldn't answer. The diagnosis told me in 5 minutes what three agencies in six months couldn't — we were targeting procurement managers when our actual buyers were CFOs. Everything changed after that.",
    author: 'Head of Marketing, B2B SaaS, Nairobi',
  },
  {
    quote: "The funnel audit was the wake-up call we needed. We had 14 form fields on our landing page. Fourteen. We cut it to four and our lead volume tripled in two weeks. I didn't need a new campaign. I needed a diagnosis.",
    author: 'Growth Lead, Fintech Startup, Lagos',
  },
  {
    quote: "I uploaded our Meta CSV on a Monday morning. By lunch I had a report that found KES 38,000 in wasted spend on job-seeker keywords we didn't even know we were bidding on. That one upload paid for a year of the subscription.",
    author: 'Marketing Director, E-commerce Brand, Nairobi',
  },
]

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: "I already have an agency. Why do I need this?",
    a: "Your agency optimizes what's in front of them. We diagnose what's underneath. Most agencies won't tell you your ICP is wrong — because fixing it means admitting the last six months of work was built on a broken foundation. We will.",
  },
  {
    q: "Do you need access to my ad accounts?",
    a: "Never. No Google OAuth. No Meta permissions. No compliance headaches. You answer our diagnostic questions and optionally upload a CSV export of your campaign data. That's it.",
  },
  {
    q: "How is this different from hiring a consultant?",
    a: "A consultant charges KES 50,000+ for a strategy session that gives you a PDF you'll read once. We give you a living diagnostic that updates every month, tracks your improvement, and tells you what to fix next — automatically.",
  },
  {
    q: "What if my score is really low?",
    a: "Good. That means we found the problem before it got worse. A low score with a clear fix is worth more than a high score with no direction. Most businesses score 34/100 on their first report. Within three months the average moves to 67.",
  },
  {
    q: "Do you cover my region?",
    a: "Yes. We give region-specific recommendations for East Africa, West Africa, South Africa, UK, Europe, US, Southeast Asia and more. Your recommendations reflect local ad costs, platform behavior, and audience psychology.",
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
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg, #302161 0%, #6c4ddd 100%)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: P, letterSpacing: '-0.4px' }}>
              ICP Brand
            </span>
          </Link>

          <div style={{ display: 'flex', gap: 4 }} className="hidden sm:flex">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href}
                className="nav-link"
                style={{ color: Pbody, textDecoration: 'none', fontSize: 14, fontWeight: 500, padding: '8px 16px', borderRadius: 24 }}>
                {l.label}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/dashboard" style={{ color: Pbody, textDecoration: 'none', fontSize: 14, fontWeight: 500, padding: '8px 14px', borderRadius: 24 }}
              className="hidden sm:block">
              Login
            </Link>
            <Link href="/questionnaire" style={{
              background: P, color: '#fff', textDecoration: 'none',
              fontSize: 14, fontWeight: 600, padding: '9px 18px',
              borderRadius: 12, letterSpacing: '-0.2px', whiteSpace: 'nowrap',
            }}>
              Get Started
            </Link>
          </div>
        </nav>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px 80px', textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: BgCard, border: `1px solid ${Pborder}`,
          borderRadius: 32, padding: '6px 16px', marginBottom: 28,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: P }}>
            ICP Diagnostic Platform
          </span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(40px, 7vw, 68px)',
          fontWeight: 800, lineHeight: 1.08,
          letterSpacing: '-0.4px', color: P, margin: '0 0 24px',
        }}>
          You&rsquo;re not bad at marketing.{' '}
          <span style={{ background: 'linear-gradient(135deg, #6c4ddd 0%, #302161 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            You&rsquo;re targeting the wrong people.
          </span>
        </h1>

        <p style={{ fontSize: 18, lineHeight: 1.7, color: Pbody, maxWidth: 600, margin: '0 auto 40px' }}>
          Every month you run ads to the wrong audience is another month your CEO asks why the
          pipeline is empty. We diagnose exactly who you should be targeting, where your funnel
          is breaking, and what to fix first — in 5 minutes, for free.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          <Link href="/questionnaire" style={{
            display: 'inline-block', background: P, color: '#fff',
            textDecoration: 'none', fontWeight: 700, fontSize: 16,
            padding: '15px 32px', borderRadius: 12, letterSpacing: '-0.3px',
            boxShadow: '0 8px 32px rgba(48,33,97,0.28)',
          }}>
            Diagnose My Marketing Now →
          </Link>
          <a href="/report/demo" style={{
            display: 'inline-block', background: BgCard, color: P,
            textDecoration: 'none', fontWeight: 600, fontSize: 16,
            padding: '15px 32px', borderRadius: 12, letterSpacing: '-0.3px',
            border: `1px solid ${Pborder}`,
          }}>
            See A Sample Report
          </a>
        </div>

        <p style={{ fontSize: 13, color: Pmuted }}>
          Free diagnosis · No ad account access needed · Used by marketing teams in Kenya, Nigeria, UK &amp; US
        </p>
      </section>

      {/* ── Social proof bar ──────────────────────────────────────────────────── */}
      <div style={{ background: BgAlt, borderTop: `1px solid ${Pborder}`, borderBottom: `1px solid ${Pborder}`, padding: '20px 24px' }}>
        <div style={{
          maxWidth: 1000, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 'clamp(16px, 3vw, 48px)', flexWrap: 'wrap',
        }}>
          {[
            '✦ Free ICP Diagnosis',
            '✦ No Agency Fluff',
            '✦ Real Numbers, Real Fixes',
            '✦ Results in 5 Minutes',
            '✦ Built by a Media Buyer',
            '✦ Region-Specific Insights',
          ].map(s => (
            <span key={s} style={{ fontSize: 13, fontWeight: 600, color: Pbody, letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* ── Feature blocks ───────────────────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: 1080, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: P, opacity: 0.5, marginBottom: 12 }}>
            Stop guessing. Start knowing.
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800, letterSpacing: '-0.4px', color: P,
            margin: '0 0 16px', lineHeight: 1.15,
          }}>
            Three reasons your campaigns aren&rsquo;t working.
          </h2>
          <p style={{ fontSize: 17, color: Pbody, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            Every broken campaign has a root cause. Here&rsquo;s how we find yours.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {FEATURE_BLOCKS.map(block => (
            <div key={block.badge} style={{
              background: BgCard, border: `1px solid ${Pborder}`,
              borderRadius: 20, padding: '28px 28px 24px',
              display: 'flex', flexDirection: 'column',
            }}>
              <p style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '1px', color: P, opacity: 0.5,
                margin: '0 0 14px',
              }}>
                {block.badge}
              </p>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16, fontWeight: 700, color: P,
                letterSpacing: '-0.3px', margin: '0 0 12px', lineHeight: 1.35,
              }}>
                {block.title}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: Pbody, margin: '0 0 20px', flexGrow: 1 }}>
                {block.desc}
              </p>
              <Link href={block.href} style={{
                display: 'inline-block', color: P, textDecoration: 'none',
                fontSize: 13, fontWeight: 700, letterSpacing: '-0.2px',
              }}>
                {block.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────────── */}
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
                  fontSize: 44, fontWeight: 800, color: P,
                  letterSpacing: '-1px', margin: '0 0 6px', lineHeight: 1,
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
            fontWeight: 800, letterSpacing: '-0.4px', color: P, margin: '0 0 16px',
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
              borderRadius: 20, padding: '36px 28px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: -12, right: 16,
                fontFamily: 'var(--font-display)',
                fontSize: 88, fontWeight: 900,
                color: i === 1 ? 'rgba(255,255,255,0.07)' : 'rgba(48,33,97,0.06)',
                lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
              }}>
                {step.n}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 10,
                background: i === 1 ? 'rgba(255,255,255,0.15)' : P,
                color: '#fff', fontFamily: 'var(--font-display)',
                fontWeight: 700, fontSize: 13, marginBottom: 20,
              }}>
                {step.n}
              </div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 17, fontWeight: 700,
                color: i === 1 ? '#fff' : P,
                letterSpacing: '-0.3px', margin: '0 0 12px', lineHeight: 1.3,
              }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: i === 1 ? 'rgba(255,255,255,0.75)' : Pbody, margin: 0 }}>
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
              fontWeight: 800, letterSpacing: '-0.4px', color: P, margin: '0 0 16px',
            }}>
              Stop guessing. Start knowing.
            </h2>
            <p style={{ fontSize: 17, color: Pbody, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
              One subscription. Complete visibility into why your marketing isn&rsquo;t
              working — and exactly how to fix it.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16, alignItems: 'start' }}>
            {TIERS.map(tier => (
              <div key={tier.name} style={{
                background: tier.highlight ? P : '#fff',
                border: `1px solid ${tier.highlight ? 'transparent' : Pborder}`,
                borderRadius: 20, padding: '32px 28px',
                boxShadow: tier.highlight ? '0 16px 48px rgba(48,33,97,0.28)' : 'none',
                position: 'relative',
              }}>
                {tier.highlight && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #a78bfa, #6c4ddd)',
                    color: '#fff', fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.6px',
                    padding: '4px 14px', borderRadius: 32,
                  }}>
                    Most Popular
                  </div>
                )}

                <p style={{
                  fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.8px',
                  color: tier.highlight ? 'rgba(255,255,255,0.6)' : Pmuted, margin: '0 0 12px',
                }}>
                  {tier.name}
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 800,
                    letterSpacing: '-1px', color: tier.highlight ? '#fff' : P, lineHeight: 1,
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
                        flexShrink: 0, width: 18, height: 18, borderRadius: '50%',
                        background: tier.highlight ? 'rgba(255,255,255,0.2)' : BgCard,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: tier.highlight ? '#fff' : P,
                        fontWeight: 700, marginTop: 1,
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
                  display: 'block', textAlign: 'center', textDecoration: 'none',
                  background: tier.highlight ? '#fff' : P,
                  color: tier.highlight ? P : '#fff',
                  fontWeight: 700, fontSize: 14, padding: '13px 20px',
                  borderRadius: 12, letterSpacing: '-0.2px',
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

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: P, opacity: 0.5, marginBottom: 12 }}>
            Real results
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800, letterSpacing: '-0.4px', color: P,
            margin: '0 0 16px', lineHeight: 1.15,
          }}>
            Finally. An answer that isn&rsquo;t<br />&ldquo;increase your budget.&rdquo;
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{
              background: BgCard, border: `1px solid ${Pborder}`,
              borderRadius: 20, padding: '28px 28px 24px',
            }}>
              <p style={{
                fontSize: 15, lineHeight: 1.7, color: Pbody,
                margin: '0 0 20px', fontStyle: 'italic',
              }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: Pmuted, margin: 0 }}>
                — {t.author}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 800, letterSpacing: '-0.4px', color: P, margin: '0 0 12px',
          }}>
            You ask, we answer.
          </h2>
          <p style={{ fontSize: 16, color: Pbody }}>Everything you need to know.</p>
        </div>

        {FAQ.map((item, i) => (
          <div key={i} style={{ borderBottom: `1px solid ${Pborder}`, padding: '24px 0' }}>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16, fontWeight: 700, color: P,
              letterSpacing: '-0.3px', margin: '0 0 10px',
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
        padding: '96px 24px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 800, letterSpacing: '-0.4px', color: P,
            margin: '0 0 20px', lineHeight: 1.1,
          }}>
            Every month without a diagnosis is a month of budget you won&rsquo;t get back.
          </h2>
          <p style={{ fontSize: 18, color: Pbody, maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.65 }}>
            You don&rsquo;t have a spending problem. You have a targeting problem. And it has a name,
            a score, and a fix. Take 5 minutes right now and find out exactly what&rsquo;s breaking
            your marketing — before your next campaign goes live.
          </p>
          <Link href="/questionnaire" style={{
            display: 'inline-block', background: P, color: '#fff',
            textDecoration: 'none', fontWeight: 700, fontSize: 17,
            padding: '17px 40px', borderRadius: 12, letterSpacing: '-0.3px',
            boxShadow: '0 12px 40px rgba(48,33,97,0.28)',
          }}>
            Get My Free Diagnosis →
          </Link>
          <p style={{ fontSize: 13, color: Pmuted, marginTop: 14 }}>
            Free · No credit card · No ad account access needed
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${Pborder}`, padding: '40px 24px', background: '#fff' }}>
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
            &copy; {new Date().getFullYear()} ICP Brand. Built to stop wasted ad spend.
          </p>
        </div>
      </footer>

    </main>
  )
}
