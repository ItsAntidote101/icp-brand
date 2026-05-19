'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  RefreshCw, Filter, TrendingDown, BarChart2, Activity,
  Check, Menu, X, MapPin, ArrowRight, Globe, MessageCircle,
  BarChart, TrendingUp, LayoutDashboard, Brain,
} from 'lucide-react'

export const dynamic = 'force-static'

// ─── Design tokens ────────────────────────────────────────────────────────────
const P       = '#302161'
const Pbody   = 'rgba(48,33,97,0.88)'
const Pmuted  = 'rgba(48,33,97,0.5)'
const Pborder = 'rgba(48,33,97,0.1)'
const BgAlt   = '#f8f7ff'
const BgPurple = '#f5f3ff'
const font    = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontBody = "'PolySans Neutral', -apple-system, system-ui, sans-serif"

// ─── Static data ─────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing',      href: '#pricing' },
  { label: 'FAQ',          href: '#faq' },
  { label: 'Results',      href: '#results' },
]


const STATS = [
  { value: '40–60%',   label: 'Of ad budgets wasted on wrong audience targeting' },
  { value: '5 min',    label: 'To complete your full ICP diagnostic' },
  { value: 'KES 50K+', label: 'Average monthly waste found per diagnosis' },
  { value: 'Zero',     label: 'Ad account access needed — ever' },
  { value: '10+',      label: 'Markets covered including Kenya, Nigeria, South Africa & East Africa' },
]

const TIERS = [
  {
    name: 'Starter', price: 'KES 6,500', period: '/ month',
    desc: 'For solo founders and small teams running their first serious paid campaigns.',
    features: ['Monthly ICP health check', 'Top 3 critical findings', 'Funnel friction score', 'Quick wins report', 'Email support'],
    cta: 'Start Free Diagnosis', href: '/questionnaire', highlight: false,
  },
  {
    name: 'Pro', price: 'KES 13,000', period: '/ month',
    desc: 'For growing teams that need speed, depth, and campaign-level analysis.',
    features: ['Everything in Starter', 'Weekly performance snapshots', 'CSV campaign analysis', 'Benchmark comparisons', 'Revenue-ranked findings', 'Complete report history'],
    cta: 'Start Pro', href: '/questionnaire', highlight: true,
  },
  {
    name: 'Agency', price: 'KES 26,000', period: '/ month',
    desc: 'For agencies managing multiple clients who need reporting at scale.',
    features: ['Everything in Pro', 'Quarterly deep dive audits', 'Multi-client management', 'White label reports', 'Priority support'],
    cta: 'Talk To Us', href: '/questionnaire', highlight: false,
  },
]

const FAQ_ITEMS = [
  {
    q: 'What is the difference between the free report and the subscriber report?',
    a: "The free report diagnoses your ICP based on your questionnaire answers — fast, instant, and genuinely useful. The subscriber report goes further. Our AI visits your actual landing page, researches your competitors, pulls real ad cost benchmarks for your region and industry, and gives you a report backed by live data — not just your answers. Most subscribers say the first deep report alone is worth the subscription.",
  },
  {
    q: 'I already have an agency. Why do I need this?',
    a: "Your agency optimizes what's in front of them. We diagnose what's underneath. Most agencies won't tell you your ICP is wrong — because fixing it means admitting the last six months of work was built on a broken foundation. We will.",
  },
  {
    q: 'Do you need access to my ad accounts?',
    a: "Never. No Google OAuth. No Meta permissions. No compliance headaches. You answer our diagnostic questions and optionally upload a CSV export of your campaign data. That's it.",
  },
  {
    q: 'How is this different from hiring a consultant?',
    a: "A consultant charges KES 50,000+ for a PDF you'll read once. We give you a living diagnostic that updates every month and tells you what to fix next — automatically.",
  },
  {
    q: 'What if my score is really low?',
    a: "Good. A low score with a clear fix is worth more than a high score with no direction. Most businesses score 34/100 on their first report. Within three months the average moves to 67.",
  },
  {
    q: 'Do you cover my region?',
    a: "Yes. East Africa, West Africa, South Africa, UK, Europe, US, Southeast Asia and more. Your recommendations reflect local ad costs, platform behavior, and audience psychology.",
  },
  {
    q: 'What is the AI Media Buyer Chat?',
    a: "Every subscriber gets access to an AI chat agent that has read your full diagnostic report. You can ask it anything — why your CPA is high, what ad copy to write for your ICP, how to fix your funnel — and it answers specifically based on your data. Agency subscribers can escalate to a real human media buyer in one click.",
  },
  {
    q: 'What is the Weekly Intelligence Briefing?',
    a: "Every Monday your dashboard updates with a fresh competitive intelligence report for your industry and region. It shows how your metrics compare to industry benchmarks, what competitors are doing, what is moving in your market, and one specific opportunity to act on that week. You also get it delivered to your inbox.",
  },
]



const HERO_HEADLINES = [
  { line1: "You're not bad at marketing.", line2: "You're targeting the wrong people." },
  { line1: "Your ads are getting clicks.", line2: "They're just not becoming leads." },
  { line1: "You're not spending too little.", line2: "You're spending in the wrong places." },
  { line1: "Your ICP is wrong.", line2: "That's why nothing is working." },
]

const HERO_CARDS = [
  { image: '/images/Holder-2.png', stat: '40-60%',   description: 'Of ad budgets wasted on wrong audience targeting' },
  { image: '/images/Holder-3.png', stat: 'KES 50K+', description: 'Average monthly waste found per client diagnosis' },
  { image: '/images/Holder-1.png', stat: '5 min',    description: 'To complete your full ICP diagnostic' },
  { image: '/images/Holder-4.png', stat: '3x',       description: 'Average improvement in lead quality after ICP fix' },
]

// ─── Shared components ────────────────────────────────────────────────────────

function Badge({ text }: { text: string }) {
  return (
    <div style={{ display: 'inline-block', fontFamily: fontBody, background: '#ede9fe', color: P, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '5px 14px', borderRadius: 100, marginBottom: 16 }}>
      {text}
    </div>
  )
}

function H2({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <h2 style={{ fontFamily: font, fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, letterSpacing: '-0.03em', color: P, margin: '0 0 24px', lineHeight: 1.1, ...style }}>
      {children}
    </h2>
  )
}

function Body({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{ fontFamily: fontBody, fontSize: 17, lineHeight: 1.7, color: 'rgba(48,33,97,0.75)', margin: '0 0 24px', ...style }}>
      {children}
    </p>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openFaq,    setOpenFaq]    = useState<number | null>(null)
  const [activeTab,  setActiveTab]  = useState('Google Reviews')
  const [heroIndex,   setHeroIndex]   = useState(0)
  const [heroVisible, setHeroVisible] = useState(true)

  const [calcBudget,      setCalcBudget]      = useState('')
  const [calcConvRate,    setCalcConvRate]     = useState('')
  const [calcResult,      setCalcResult]       = useState<number | null>(null)
  const [calcEmail,       setCalcEmail]        = useState('')
  const [calcSubmitted,   setCalcSubmitted]    = useState(false)
  const [calcEmailSent,   setCalcEmailSent]    = useState(false)
  const [checklistEmail,  setChecklistEmail]   = useState('')
  const [checklistSent,   setChecklistSent]    = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setHeroVisible(false)
      setTimeout(() => {
        setHeroIndex(i => (i + 1) % HERO_HEADLINES.length)
        setHeroVisible(true)
      }, 600)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  const advanceHero = () => {
    setHeroVisible(false)
    setTimeout(() => {
      setHeroIndex(i => (i + 1) % HERO_CARDS.length)
      setHeroVisible(true)
    }, 600)
  }

  return (
    <main style={{ fontFamily: '-apple-system,system-ui,sans-serif', color: Pbody, background: '#fff', overflowX: 'hidden' }}>

      {/* ── Sticky pill nav ───────────────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', justifyContent: 'center', padding: '14px 20px' }}>
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', maxWidth: 1320,
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${Pborder}`, borderRadius: 100,
          padding: '12px 24px',
          boxShadow: '0 2px 24px rgba(48,33,97,0.07)',
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${P},#6c4ddd)`, flexShrink: 0 }} />
            <span style={{ fontFamily: font, fontWeight: 700, fontSize: 15, color: P, letterSpacing: '-0.3px' }}>ICP Diagnostic</span>
          </Link>

          <div className="hidden md:flex" style={{ gap: 32 }}>
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="nav-link"
                style={{ fontFamily: fontBody, color: Pbody, textDecoration: 'none', fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em', padding: '8px 16px', borderRadius: 100 }}>
                {l.label}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/dashboard" className="hidden md:inline-block"
              style={{ color: Pbody, textDecoration: 'none', fontSize: 14, fontWeight: 500, padding: '8px 16px', borderRadius: 100 }}>
              Login
            </Link>
            <Link href="/questionnaire" style={{ background: P, color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600, padding: '10px 20px', borderRadius: 100, whiteSpace: 'nowrap' }}>
              Get Free Diagnosis
            </Link>
            <button onClick={() => setMobileOpen(o => !o)} className="md:hidden" aria-label="Menu"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: P, display: 'flex', alignItems: 'center' }}>
              {mobileOpen ? <X size={20} color={P} /> : <Menu size={20} color={P} />}
            </button>
          </div>
        </nav>
      </div>

      {/* mobile menu */}
      {mobileOpen && (
        <div className="md:hidden" style={{ position: 'fixed', top: 72, left: 0, right: 0, zIndex: 40, background: '#fff', borderBottom: `1px solid ${Pborder}`, padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(48,33,97,0.08)' }}>
          {NAV_LINKS.map(l => (
            <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
              style={{ color: Pbody, textDecoration: 'none', fontSize: 15, fontWeight: 500, padding: '14px 0', borderBottom: `1px solid ${Pborder}` }}>
              {l.label}
            </a>
          ))}
          <Link href="/dashboard" style={{ color: Pbody, textDecoration: 'none', fontSize: 15, fontWeight: 500, padding: '14px 0', borderBottom: `1px solid ${Pborder}` }}>Login</Link>
          <Link href="/questionnaire" style={{ display: 'block', textAlign: 'center', background: P, color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 15, padding: '14px', borderRadius: 12, marginTop: 12 }}>
            Get Free Diagnosis
          </Link>
        </div>
      )}

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ background: '#ffffff', paddingTop: 120, paddingBottom: 80, overflow: 'hidden' }}>
        <div className="container flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">

          {/* LEFT — animated copy */}
          <div className="flex flex-col justify-center lg:w-1/2 lg:flex-none">

            {/* animated headline — fixed height prevents layout shift */}
            <div style={{ minHeight: 'clamp(170px,22vw,230px)', marginBottom: 24, display: 'flex', alignItems: 'flex-start' }}>
              <h1 style={{
                fontFamily: font,
                fontSize: 'clamp(40px,5vw,66px)',
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '-0.04em',
                margin: 0,
                opacity: heroVisible ? 1 : 0,
                transition: 'opacity 600ms ease-in-out',
              }}>
                <span style={{ color: P, display: 'block' }}>{HERO_HEADLINES[heroIndex].line1}</span>
                <span style={{ color: '#c026d3', display: 'block' }}>{HERO_HEADLINES[heroIndex].line2}</span>
              </h1>
            </div>

            <p style={{ fontFamily: fontBody, fontSize: 18, lineHeight: 1.7, color: 'rgba(48,33,97,0.7)', margin: '0 0 36px', maxWidth: 480 }}>
              Get a free ICP diagnostic in 5 minutes. Subscribers unlock weekly competitive intelligence, a media buyer chat agent, live landing page assessment, and a personal strategy session — all in one platform.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}>
              <Link href="/questionnaire"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: P, color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 15, padding: '16px 32px', borderRadius: 14, boxShadow: '0 8px 28px rgba(48,33,97,0.28)', whiteSpace: 'nowrap' }}>
                Get Free Diagnosis
              </Link>
              <Link href="/report/demo"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: P, textDecoration: 'none', fontWeight: 600, fontSize: 15, padding: '16px 32px', borderRadius: 14, border: `2px solid ${P}`, whiteSpace: 'nowrap' }}>
                See A Sample Report
              </Link>
            </div>

            {/* trust line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 80, height: 34, borderRadius: 999, overflow: 'hidden', border: '2.5px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.14)', flexShrink: 0 }}>
                <Image src="/images/Frame 245.png" alt="Marketing team members" width={80} height={34}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: P }}>50+ marketing teams</p>
                <p style={{ margin: 0, fontSize: 12, color: Pmuted }}>no ad account access needed.</p>
              </div>
            </div>

            {/* Credibility bar */}
            <div style={{ marginTop: 24 }}>
              <p style={{ margin: '0 0 2px', fontFamily: fontBody, fontSize: 14, fontWeight: 600, color: P }}>Built by performance media buyers</p>
              <p style={{ margin: '0 0 6px', fontFamily: fontBody, fontSize: 13, color: 'rgba(48,33,97,0.6)', lineHeight: 1.5 }}>$2M+ in ad spend managed · 10+ years experience · East Africa, UK &amp; US markets</p>
              <Link href="/about" style={{ fontFamily: fontBody, fontSize: 13, color: P, textDecoration: 'underline' }}>Read our story →</Link>
            </div>
          </div>

          {/* RIGHT — rotating image cards */}
          <div className="lg:flex-1" style={{ display: 'flex', alignItems: 'flex-end', gap: 12, overflow: 'hidden', minHeight: 420 }}>

            {/* Small card — next item, partially visible */}
            <div style={{
              width: '38%',
              height: 340,
              borderRadius: 24,
              overflow: 'hidden',
              position: 'relative',
              flexShrink: 0,
              opacity: heroVisible ? 0.72 : 0,
              transition: 'opacity 600ms ease-in-out',
            }}>
              <Image
                src={HERO_CARDS[(heroIndex + 1) % HERO_CARDS.length].image}
                alt=""
                fill
                style={{ objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 52%)' }} />
              <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                <p style={{ fontFamily: font, fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 6px', lineHeight: 1 }}>
                  {HERO_CARDS[(heroIndex + 1) % HERO_CARDS.length].stat}
                </p>
                <p style={{ fontFamily: fontBody, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.4, maxWidth: 140 }}>
                  {HERO_CARDS[(heroIndex + 1) % HERO_CARDS.length].description}
                </p>
              </div>
            </div>

            {/* Large card — current item */}
            <div style={{
              flex: 1,
              height: 420,
              borderRadius: 24,
              overflow: 'hidden',
              position: 'relative',
              opacity: heroVisible ? 1 : 0,
              transition: 'opacity 600ms ease-in-out',
            }}>
              <Image
                src={HERO_CARDS[heroIndex].image}
                alt={HERO_CARDS[heroIndex].description}
                fill
                style={{ objectFit: 'cover' }}
                priority
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 52%)' }} />
              <div style={{ position: 'absolute', bottom: 28, left: 28, right: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <p style={{ fontFamily: font, fontSize: 64, fontWeight: 800, color: '#fff', margin: '0 0 8px', lineHeight: 1 }}>
                    {HERO_CARDS[heroIndex].stat}
                  </p>
                  <p style={{ fontFamily: fontBody, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.45, maxWidth: 200 }}>
                    {HERO_CARDS[heroIndex].description}
                  </p>
                </div>
                <button onClick={advanceHero} aria-label="Next card"
                  style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
                  <ArrowRight size={18} color={P} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Logo trust bar ────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderTop: `1px solid ${Pborder}`, borderBottom: `1px solid ${Pborder}`, padding: '32px 0', overflow: 'hidden' }}>
        <div className="container">
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: Pmuted, marginBottom: 20 }}>
            Trusted by teams at:
          </p>
        </div>
        <div className="animate-marquee" style={{ display: 'flex', alignItems: 'center', width: 'max-content', gap: 0 }}>
          {[...Array(2)].map((_, pass) =>
            [1, 2, 3, 4, 5, 6].map(n => (
              <div key={`${pass}-${n}`} style={{ padding: '0 32px', flexShrink: 0 }}>
                <Image
                  src={`/images/Logos-${n}.png`}
                  alt={`Partner logo ${n}`}
                  width={120}
                  height={32}
                  style={{ height: 32, width: 'auto', opacity: 0.5, filter: 'grayscale(100%)', display: 'block' }}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Feature blocks 1–3 ───────────────────────────────────────────── */}

      {/* Block 1 — Visual LEFT, Text RIGHT */}
      <section id="how-it-works" className="section-pad" style={{ background: '#ffffff', position: 'relative', overflow: 'hidden' }}>
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          {/* visual */}
          <div style={{ background: BgPurple, borderRadius: 24, overflow: 'hidden' }}>
            <Image
              src="/images/Holder-1.png"
              alt="ICP Alignment diagnostic"
              width={600}
              height={500}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
          {/* text */}
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <span style={{ background: 'linear-gradient(135deg,#e879f9,#a855f7)', color: '#fff', fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 6 }}>Smart</span>
              <span style={{ background: '#ede9fe', color: P, fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 6 }}>Sync</span>
            </div>
            <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,3.5vw,40px)', fontWeight: 700, color: P, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 28px' }}>
              Your targeting,<br />finally diagnosed.
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px' }}>
              {[
                'Know exactly who your best customer really is',
                'See the gap between your ICP and your ad targeting',
                'Get a score that tells you how misaligned you are',
              ].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: fontBody, fontSize: 17, color: 'rgba(48,33,97,0.75)', lineHeight: 1.7, marginBottom: 8 }}>
                  <span style={{ marginTop: 6, width: 6, height: 6, borderRadius: '50%', background: 'rgba(48,33,97,0.4)', flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: P, color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 15, padding: '16px 32px', borderRadius: 14 }}>
              <ArrowRight size={16} color="#fff" /> Find My ICP Gap
            </Link>
          </div>
        </div>
        {/* section number */}
        <span style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', writingMode: 'vertical-rl', fontSize: 12, color: 'rgba(48,33,97,0.2)', letterSpacing: '0.1em', fontWeight: 500 }}>01</span>
      </section>

      {/* Block 2 — Text LEFT, Visual RIGHT */}
      <section className="section-pad" style={{ background: BgAlt, position: 'relative', overflow: 'hidden' }}>
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          {/* text */}
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <span style={{ background: 'linear-gradient(135deg,#e879f9,#a855f7)', color: '#fff', fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 6 }}>Pro</span>
              <span style={{ background: '#ede9fe', color: P, fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 6 }}>Analysis</span>
            </div>
            <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,3.5vw,40px)', fontWeight: 700, color: P, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 28px' }}>
              Stop guessing.<br />Start knowing.
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px' }}>
              {[
                'Visualize exactly where your funnel breaks',
                'Smart alerts that show your highest drop-off point',
                'Fix the right thing first, not the easiest thing',
              ].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: fontBody, fontSize: 17, color: 'rgba(48,33,97,0.75)', lineHeight: 1.7, marginBottom: 8 }}>
                  <span style={{ marginTop: 6, width: 6, height: 6, borderRadius: '50%', background: 'rgba(48,33,97,0.4)', flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: P, color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 15, padding: '16px 32px', borderRadius: 14 }}>
              <ArrowRight size={16} color="#fff" /> Score My Funnel
            </Link>
          </div>
          {/* visual */}
          <div style={{ background: BgPurple, borderRadius: 24, overflow: 'hidden' }}>
            <Image
              src="/images/Holder-2.png"
              alt="Funnel scoring diagnostic"
              width={600}
              height={500}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </div>
        <span style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', writingMode: 'vertical-rl', fontSize: 12, color: 'rgba(48,33,97,0.2)', letterSpacing: '0.1em', fontWeight: 500 }}>02</span>
      </section>

      {/* Block 3 — Visual LEFT, Text RIGHT */}
      <section className="section-pad" style={{ background: '#ffffff', position: 'relative', overflow: 'hidden' }}>
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          {/* visual */}
          <div style={{ background: BgPurple, borderRadius: 24, overflow: 'hidden' }}>
            <Image
              src="/images/Holder-3.png"
              alt="Budget analysis diagnostic"
              width={600}
              height={500}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
          {/* text */}
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <span style={{ background: 'linear-gradient(135deg,#e879f9,#a855f7)', color: '#fff', fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 6 }}>Secure</span>
              <span style={{ background: '#ede9fe', color: P, fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 6 }}>Insights</span>
            </div>
            <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,3.5vw,40px)', fontWeight: 700, color: P, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 28px' }}>
              Your budget,<br />working harder.
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px' }}>
              {[
                'See which channels your ICP actually uses',
                'Find the exact campaigns wasting your spend',
                'Reallocate budget with confidence not guesswork',
              ].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: fontBody, fontSize: 17, color: 'rgba(48,33,97,0.75)', lineHeight: 1.7, marginBottom: 8 }}>
                  <span style={{ marginTop: 6, width: 6, height: 6, borderRadius: '50%', background: 'rgba(48,33,97,0.4)', flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: P, color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 15, padding: '16px 32px', borderRadius: 14 }}>
              <ArrowRight size={16} color="#fff" /> Audit My Spend
            </Link>
          </div>
        </div>
        <span style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', writingMode: 'vertical-rl', fontSize: 12, color: 'rgba(48,33,97,0.2)', letterSpacing: '0.1em', fontWeight: 500 }}>03</span>
      </section>

      {/* Block 4 — Text LEFT, Visual RIGHT */}
      <section className="section-pad" style={{ background: BgAlt, position: 'relative', overflow: 'hidden' }}>
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          {/* text */}
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <span style={{ background: 'linear-gradient(135deg,#e879f9,#a855f7)', color: '#fff', fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 6 }}>NEW</span>
              <span style={{ background: '#ede9fe', color: P, fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 6 }}>Intelligence</span>
            </div>
            <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,3.5vw,40px)', fontWeight: 700, color: P, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 28px' }}>
              Your market. Every week.<br />Automatically.
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px' }}>
              {[
                'Weekly competitive briefing delivered to your dashboard every Monday',
                'Benchmark your CTR, CPA and conversion rate against top performers in your region and industry',
                'Real-time competitor activity feed showing what\'s moving in your market',
              ].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: fontBody, fontSize: 17, color: 'rgba(48,33,97,0.75)', lineHeight: 1.7, marginBottom: 8 }}>
                  <span style={{ marginTop: 6, width: 6, height: 6, borderRadius: '50%', background: 'rgba(48,33,97,0.4)', flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
            <a href="#pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: P, color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 15, padding: '16px 32px', borderRadius: 14 }}>
              <ArrowRight size={16} color="#fff" /> See Intelligence Feature
            </a>
          </div>
          {/* visual */}
          <div style={{ background: BgPurple, borderRadius: 24, overflow: 'hidden' }}>
            <Image
              src="/images/Holder-5.png"
              alt="Weekly intelligence briefing"
              width={600}
              height={500}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </div>
        <span style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', writingMode: 'vertical-rl', fontSize: 12, color: 'rgba(48,33,97,0.2)', letterSpacing: '0.1em', fontWeight: 500 }}>04</span>
      </section>

      {/* ── Case study ────────────────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: BgAlt }}>
        <div className="container">
          <div style={{ background: BgAlt, borderRadius: 24, padding: 'clamp(36px,5vw,56px) clamp(24px,5vw,64px)', maxWidth: 1320, margin: '0 auto', border: `1px solid ${Pborder}` }}>
            <div style={{ marginBottom: 32 }}>
              <span style={{ display: 'inline-block', background: '#d946ef', color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '4px 14px', borderRadius: 100 }}>Real Result</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

              {/* LEFT */}
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: -16, left: -8, fontFamily: font, fontSize: 120, fontWeight: 800, color: P, opacity: 0.06, lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>&ldquo;</div>
                <h3 style={{ fontFamily: font, fontSize: 'clamp(28px,3vw,40px)', fontWeight: 700, color: P, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 20px', position: 'relative' }}>
                  From zero leads to converting<br />in week one.
                </h3>
                <p style={{ fontFamily: fontBody, fontSize: 16, color: 'rgba(48,33,97,0.75)', lineHeight: 1.75, margin: '0 0 32px' }}>
                  A legal services company in Nairobi had been running Google Search ads for 3 months with zero conversions. Our free diagnostic identified the problem in 5 minutes — their landing page had 14 form fields and required account creation before showing the service. They cut it to 3 fields. Leads came in within 7 days.
                </p>
                <div className="grid grid-cols-3 gap-4" style={{ marginBottom: 32 }}>
                  {[
                    { num: '14 → 3', label: 'Form fields reduced' },
                    { num: '0 → 12', label: 'Leads in week one' },
                    { num: '5 min',  label: 'Time to diagnosis' },
                  ].map(chip => (
                    <div key={chip.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: `1px solid ${Pborder}` }}>
                      <p style={{ fontFamily: font, fontSize: 28, fontWeight: 800, color: P, margin: '0 0 4px', lineHeight: 1 }}>{chip.num}</p>
                      <p style={{ fontFamily: fontBody, fontSize: 12, color: Pmuted, margin: 0, lineHeight: 1.4 }}>{chip.label}</p>
                    </div>
                  ))}
                </div>
                <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: fontBody, fontSize: 14, fontWeight: 600, color: P, textDecoration: 'none' }}>
                  Get your free diagnosis <ArrowRight size={14} color={P} />
                </Link>
              </div>

              {/* RIGHT — quote card */}
              <div style={{ background: P, borderRadius: 20, padding: 36 }}>
                <div style={{ fontFamily: font, fontSize: 64, fontWeight: 800, color: 'rgba(255,255,255,0.2)', lineHeight: 1, marginBottom: 16 }}>&ldquo;</div>
                <p style={{ fontFamily: fontBody, fontSize: 18, color: '#fff', lineHeight: 1.7, margin: '0 0 28px', fontStyle: 'italic' }}>
                  I didn&rsquo;t need a new campaign. I needed someone to tell me my landing page was broken. The diagnosis did that in 5 minutes. We fixed one thing and everything changed.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: font, fontSize: 13, fontWeight: 700, color: '#fff' }}>JM</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontFamily: font, fontSize: 14, fontWeight: 600, color: '#fff' }}>James M.</p>
                    <p style={{ margin: 0, fontFamily: fontBody, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Marketing Manager, Legal Services, Nairobi</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Dashboard preview ─────────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: '#fff', borderTop: `1px solid ${Pborder}` }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, color: P, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 16px' }}>
              Your marketing cockpit.
            </h2>
            <p style={{ fontFamily: fontBody, fontSize: 17, color: 'rgba(48,33,97,0.7)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              Everything your team needs to diagnose, fix, and monitor your ICP performance — in one place.
            </p>
          </div>

          {/* Dashboard image / placeholder */}
          <div style={{ width: '100%', height: 500, background: 'linear-gradient(135deg,#f8f7ff 0%,#ede9fe 100%)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${Pborder}`, boxShadow: '0 24px 80px rgba(48,33,97,0.12)', marginBottom: 32 }}>
            <p style={{ fontFamily: fontBody, fontSize: 18, color: 'rgba(48,33,97,0.3)', margin: 0 }}>Dashboard Preview</p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { Icon: LayoutDashboard, label: 'ICP Health Score tracking' },
              { Icon: Brain,           label: 'Weekly intelligence briefing' },
              { Icon: MessageCircle,   label: 'AI media buyer chat' },
            ].map(({ Icon, label }) => (
              <div key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 100, padding: '10px 20px' }}>
                <Icon size={16} color={P} strokeWidth={1.75} />
                <span style={{ fontFamily: fontBody, fontSize: 14, color: P, fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature grid ──────────────────────────────────────────────────── */}
      <section id="features" className="section-pad" style={{ background: BgAlt }}>
        <div className="container grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4 items-stretch">

          {/* LEFT COLUMN — white card, image fills remaining height */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '40px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <span style={{ background: 'linear-gradient(135deg,#e879f9,#d946ef)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 100 }}>Pre</span>
              <span style={{ background: '#ede9fe', color: P, fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 100 }}>Insights</span>
            </div>

            <h2 style={{ fontFamily: font, fontSize: 'clamp(32px,4vw,48px)', fontWeight: 700, color: P, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 20px' }}>
              Everything your diagnosis covers.
            </h2>

            <p style={{ fontFamily: fontBody, fontSize: 16, lineHeight: 1.7, color: 'rgba(48,33,97,0.7)', margin: '0 0 28px', maxWidth: 440 }}>
              Replace scattered guesswork and agency reports with one platform that tells you exactly what is broken.
            </p>

            <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: P, fontWeight: 600, fontSize: 15, textDecoration: 'none', marginBottom: 0 }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
              Learn More <ArrowRight size={16} />
            </Link>

            {/* image stretches to fill remaining vertical space */}
            <div style={{ flex: 1, marginTop: 32, borderRadius: 16, overflow: 'hidden', minHeight: 240 }}>
              <Image
                src="/images/Holder-4.png"
                alt="ICP diagnostic dashboard"
                width={600}
                height={450}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>

          {/* RIGHT COLUMN — 3×2 grid of feature cards, same total height */}
          <div className="grid grid-cols-2 gap-4" style={{ gridTemplateRows: 'repeat(3, 1fr)' }}>

            {/* Card 1 — featured dark */}
            <div style={{ background: P, borderRadius: 20, padding: '28px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <RefreshCw size={22} color="#fff" strokeWidth={1.75} />
              </div>
              <h3 style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>ICP Alignment</h3>
              <p style={{ fontFamily: fontBody, fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.75)', margin: 0 }}>Compare who you think your customer is against who actually buys from you.</p>
            </div>

            {/* Card 2 */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Globe size={22} color="#a855f7" strokeWidth={1.75} />
              </div>
              <h3 style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: P, margin: '0 0 8px' }}>Smart Targeting</h3>
              <p style={{ fontFamily: fontBody, fontSize: 14, lineHeight: 1.65, color: 'rgba(48,33,97,0.65)', margin: 0 }}>Region-specific recommendations based on where your audience decides.</p>
            </div>

            {/* Card 3 */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Filter size={22} color="#a855f7" strokeWidth={1.75} />
              </div>
              <h3 style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: P, margin: '0 0 8px' }}>Funnel Scoring</h3>
              <p style={{ fontFamily: fontBody, fontSize: 14, lineHeight: 1.65, color: 'rgba(48,33,97,0.65)', margin: 0 }}>Score every step from ad click to lead by drop-off impact.</p>
            </div>

            {/* Card 4 */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <TrendingDown size={22} color="#a855f7" strokeWidth={1.75} />
              </div>
              <h3 style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: P, margin: '0 0 8px' }}>Budget Reallocation</h3>
              <p style={{ fontFamily: fontBody, fontSize: 14, lineHeight: 1.65, color: 'rgba(48,33,97,0.65)', margin: 0 }}>Find which channels waste spend and where to shift money for return.</p>
            </div>

            {/* Card 5 */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <BarChart2 size={22} color="#a855f7" strokeWidth={1.75} />
              </div>
              <h3 style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: P, margin: '0 0 8px' }}>CSV Analysis</h3>
              <p style={{ fontFamily: fontBody, fontSize: 14, lineHeight: 1.65, color: 'rgba(48,33,97,0.65)', margin: 0 }}>Upload your Google or Meta export for instant media buyer analysis.</p>
            </div>

            {/* Card 6 */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <MessageCircle size={22} color="#a855f7" strokeWidth={1.75} />
              </div>
              <h3 style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: P, margin: '0 0 8px' }}>AI Media Buyer Chat</h3>
              <p style={{ fontFamily: fontBody, fontSize: 14, lineHeight: 1.65, color: 'rgba(48,33,97,0.65)', margin: 0 }}>Ask anything about your marketing. Get answers grounded in your actual diagnostic data — not generic advice.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Agency human escalation card ─────────────────────────────────── */}
      <section className="section-pad" style={{ background: BgAlt, paddingTop: 0 }}>
        <div className="container">
          <div style={{ background: 'linear-gradient(135deg,#302161 0%,#4c1d95 100%)', borderRadius: 20, padding: 'clamp(28px,4vw,40px) clamp(24px,5vw,48px)' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              {/* Left */}
              <div>
                <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '4px 14px', borderRadius: 100, marginBottom: 20 }}>Agency Feature</span>
                <h3 style={{ fontFamily: font, fontSize: 'clamp(22px,3vw,28px)', fontWeight: 700, color: '#fff', margin: '0 0 16px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>Talk to a real media buyer.</h3>
                <p style={{ fontFamily: fontBody, fontSize: 16, color: 'rgba(255,255,255,0.8)', margin: '0 0 28px', lineHeight: 1.7 }}>
                  Escalate from AI to human when you need it. Your assigned media buyer reviews your diagnostic before the call. No briefing needed.
                </p>
                <a href="#pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: P, textDecoration: 'none', fontWeight: 700, fontSize: 14, padding: '13px 28px', borderRadius: 12 }}>
                  See Agency Plan
                </a>
              </div>
              {/* Right */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'AI chat agent knows your full diagnostic',
                  'Escalate to human in one click',
                  'Media buyer responds within 24 hours',
                ].map(feat => (
                  <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.12)', borderRadius: 100, padding: '10px 18px' }}>
                    <Check size={14} color="#fff" strokeWidth={2.5} />
                    <span style={{ fontFamily: fontBody, fontSize: 14, color: '#fff', fontWeight: 500 }}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: BgAlt, borderTop: `1px solid ${Pborder}` }}>
        <div className="container">
          <h2 style={{ fontFamily: font, fontSize: 'clamp(32px,4vw,48px)', fontWeight: 700, color: P, letterSpacing: '-0.03em', lineHeight: 1.1, textAlign: 'center', margin: '0 0 48px' }}>
            Why it matters now.
          </h2>

          {/* white card container */}
          <div style={{ background: '#fff', borderRadius: 24, padding: '60px 80px', boxShadow: '0 2px 40px rgba(48,33,97,0.06)' }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 sm:gap-0">
              {STATS.map((s, i) => (
                <div key={s.label} style={{ display: 'contents' }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <p style={{ fontFamily: font, fontSize: 'clamp(36px,4vw,52px)', fontWeight: 700, color: P, letterSpacing: '-0.04em', margin: '0 0 12px', lineHeight: 1 }}>{s.value}</p>
                    <p style={{ fontFamily: fontBody, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(48,33,97,0.6)', margin: 0, lineHeight: 1.5, maxWidth: 160, marginLeft: 'auto', marginRight: 'auto' }}>{s.label}</p>
                  </div>
                  {i < STATS.length - 1 && (
                    <div className="hidden sm:block" style={{ width: 1, height: 60, background: Pborder, flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontFamily: fontBody, fontSize: 14, color: 'rgba(48,33,97,0.5)', textAlign: 'center', marginTop: 24, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7 }}>
            Every number above comes from real diagnostic data — not estimates. Your results may vary based on campaign size and targeting complexity.
          </p>
        </div>
      </section>

      {/* ── Lead magnet ───────────────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: '#ede9fe', borderTop: `1px solid ${Pborder}` }}>
        <div className="container">
          <div className="flex flex-col md:flex-row items-center gap-10 p-6 md:p-12" style={{ background: '#fff', borderRadius: 24, boxShadow: '0 8px 40px rgba(48,33,97,0.1)', maxWidth: 860, margin: '0 auto' }}>
            <div style={{ flex: 1 }}>
              <Badge text="Free Resource" />
              <h2 style={{ fontFamily: font, fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, letterSpacing: '-0.3px', color: P, margin: '0 0 14px', lineHeight: 1.2 }}>
                Not ready to subscribe yet?
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: Pbody, margin: '0 0 8px' }}>
                Download our free ICP Targeting Checklist — 27 questions that will tell you if
                your targeting is broken before you spend another shilling.
              </p>
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: P, color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 15, padding: '14px 28px', borderRadius: 12, whiteSpace: 'nowrap', boxShadow: '0 6px 24px rgba(48,33,97,0.2)' }}>
                Download Free Checklist
              </Link>
              <p style={{ fontSize: 12, color: Pmuted, marginTop: 10 }}>Free &middot; No email required</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Free vs Pro comparison ────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: '#fff', borderTop: `1px solid ${Pborder}` }}>
        <div className="container">

          {/* heading */}
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <Badge text="Free vs Pro" />
            <H2 style={{ fontSize: 'clamp(28px,4vw,44px)', margin: '0 0 16px' }}>
              Good diagnosis. Or a great one.
            </H2>
            <p style={{ fontFamily: fontBody, fontSize: 17, color: Pbody, maxWidth: 500, margin: '0 auto', lineHeight: 1.65 }}>
              The free report tells you what is broken. The subscriber report tells you exactly why — with real data to back it up.
            </p>
          </div>

          {/* two cards + vs label */}
          <div className="flex flex-col lg:flex-row items-stretch gap-0" style={{ maxWidth: 900, margin: '0 auto', alignItems: 'center' }}>

            {/* LEFT — Free card */}
            <div style={{ flex: 1, background: '#fff', border: `1px solid rgba(48,33,97,0.1)`, borderRadius: 20, padding: 40, display: 'flex', flexDirection: 'column' }}>
              {/* label */}
              <div style={{ display: 'inline-block', background: '#ede9fe', color: P, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '5px 14px', borderRadius: 100, marginBottom: 20, width: 'fit-content' }}>
                Free
              </div>
              <h3 style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: P, margin: '0 0 28px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                ICP Diagnostic Report
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {[
                  '30-question ICP assessment',
                  'Overall health score 0–100',
                  'Top 3 critical findings',
                  'Funnel friction score',
                  'Quick wins to implement now',
                  'Instant results',
                ].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: fontBody, fontSize: 15, color: Pbody }}>
                    <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={11} color={P} strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <div style={{ borderTop: `1px solid rgba(48,33,97,0.08)`, paddingTop: 24, marginBottom: 20 }}>
                <p style={{ fontFamily: fontBody, fontSize: 13, color: Pmuted, margin: 0 }}>No credit card required</p>
              </div>
              <Link href="/questionnaire" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', border: `2px solid ${P}`, color: P, fontWeight: 700, fontSize: 14, padding: '14px 20px', borderRadius: 12, letterSpacing: '-0.2px', background: 'transparent' }}>
                Get Free Diagnosis
              </Link>
            </div>

            {/* vs label */}
            <div style={{ flexShrink: 0, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'rgba(48,33,97,0.4)', fontFamily: fontBody, fontWeight: 600, padding: '16px 0' }}>
              vs
            </div>

            {/* RIGHT — Subscriber card */}
            <div style={{ flex: 1, background: P, borderRadius: 20, padding: 40, display: 'flex', flexDirection: 'column' }}>
              {/* label */}
              <div style={{ display: 'inline-block', background: '#d946ef', color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '5px 14px', borderRadius: 100, marginBottom: 20, width: 'fit-content' }}>
                Subscriber
              </div>
              <h3 style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 28px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Deep Research Report
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {[
                  'Everything in the free report',
                  'AI visits your actual landing page',
                  'Live competitor research',
                  'Regional ad cost benchmarks',
                  'Named competitor insights',
                  'Monthly monitoring and re-diagnosis',
                  'Score improvement tracking',
                  'CSV campaign analysis',
                ].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: fontBody, fontSize: 15, color: 'rgba(255,255,255,0.85)' }}>
                    <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={11} color="#fff" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 24, marginBottom: 20 }}>
                <p style={{ fontFamily: fontBody, fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0 }}>Paid for by one saved campaign optimisation</p>
              </div>
              <Link href="#pricing" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: '#fff', color: P, fontWeight: 700, fontSize: 14, padding: '14px 20px', borderRadius: 12, letterSpacing: '-0.2px' }}>
                See Pricing
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── Ad Waste Calculator ───────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: '#fff', borderTop: `1px solid ${Pborder}` }}>
        <div className="container">
          <div style={{ maxWidth: 800, margin: '0 auto', background: '#fff', border: `1px solid rgba(48,33,97,0.1)`, borderRadius: 24, padding: 'clamp(32px,5vw,56px) clamp(24px,5vw,64px)' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <span style={{ display: 'inline-block', background: '#d946ef', color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '4px 14px', borderRadius: 100, marginBottom: 20 }}>Free Tool</span>
              <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, color: P, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 16px' }}>
                How much are you wasting<br />on ads right now?
              </h2>
              <p style={{ fontFamily: fontBody, fontSize: 16, color: 'rgba(48,33,97,0.7)', lineHeight: 1.7, margin: 0 }}>
                Enter your numbers below. We will show you your estimated monthly waste in seconds. No email required.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" style={{ marginBottom: 24 }}>
              {/* Input 1: Monthly Budget */}
              <div>
                <label style={{ display: 'block', fontFamily: fontBody, fontSize: 13, fontWeight: 600, color: P, marginBottom: 8 }}>Monthly Ad Budget</label>
                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid rgba(48,33,97,0.2)`, borderRadius: 10, overflow: 'hidden' }}>
                  <span style={{ fontFamily: fontBody, fontSize: 14, fontWeight: 600, color: Pmuted, background: BgAlt, padding: '12px 14px', borderRight: `1px solid rgba(48,33,97,0.1)`, flexShrink: 0 }}>KES</span>
                  <input
                    type="number"
                    value={calcBudget}
                    onChange={e => { setCalcBudget(e.target.value); setCalcResult(null) }}
                    placeholder="50000"
                    style={{ flex: 1, fontFamily: fontBody, fontSize: 15, color: P, background: '#fff', border: 'none', padding: '12px 14px', outline: 'none' }}
                  />
                </div>
              </div>
              {/* Input 2: Conversion Rate */}
              <div>
                <label style={{ display: 'block', fontFamily: fontBody, fontSize: 13, fontWeight: 600, color: P, marginBottom: 8 }}>Current Conversion Rate</label>
                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid rgba(48,33,97,0.2)`, borderRadius: 10, overflow: 'hidden' }}>
                  <input
                    type="number"
                    step="0.1"
                    value={calcConvRate}
                    onChange={e => { setCalcConvRate(e.target.value); setCalcResult(null) }}
                    placeholder="2.5"
                    style={{ flex: 1, fontFamily: fontBody, fontSize: 15, color: P, background: '#fff', border: 'none', padding: '12px 14px', outline: 'none' }}
                  />
                  <span style={{ fontFamily: fontBody, fontSize: 14, fontWeight: 600, color: Pmuted, background: BgAlt, padding: '12px 14px', borderLeft: `1px solid rgba(48,33,97,0.1)`, flexShrink: 0 }}>%</span>
                </div>
                <p style={{ fontFamily: fontBody, fontSize: 12, color: Pmuted, margin: '6px 0 0' }}>leads / landing page visitors x 100</p>
              </div>
            </div>

            <button
              onClick={() => {
                const budget = parseFloat(calcBudget)
                const rate   = parseFloat(calcConvRate)
                if (!budget || !rate || budget <= 0 || rate <= 0) return
                const industryAvg = 3.5
                const waste = rate < industryAvg
                  ? Math.round(budget * (1 - rate / industryAvg))
                  : Math.round(budget * 0.1)
                setCalcResult(waste)
                setCalcSubmitted(true)
              }}
              disabled={!calcBudget || !calcConvRate}
              style={{ width: '100%', background: P, color: '#fff', border: 'none', borderRadius: 12, padding: 16, fontFamily: font, fontSize: 16, fontWeight: 600, cursor: calcBudget && calcConvRate ? 'pointer' : 'default', opacity: calcBudget && calcConvRate ? 1 : 0.5 }}
            >
              Calculate My Waste
            </button>

            {calcResult !== null && calcSubmitted && (
              <div style={{ marginTop: 32, padding: '32px', background: BgAlt, borderRadius: 16, textAlign: 'center', animation: 'fadeUp 0.4s ease both' }}>
                <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }`}</style>
                <p style={{ fontFamily: fontBody, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: Pmuted, margin: '0 0 8px' }}>Estimated Monthly Waste</p>
                <p style={{ fontFamily: font, fontSize: 'clamp(44px,6vw,72px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 8px', lineHeight: 1, color: calcResult > parseFloat(calcBudget) * 0.3 ? '#ef4444' : calcResult > parseFloat(calcBudget) * 0.15 ? '#f59e0b' : '#22c55e' }}>
                  KES {calcResult.toLocaleString()}
                </p>
                <p style={{ fontFamily: fontBody, fontSize: 15, color: 'rgba(48,33,97,0.75)', lineHeight: 1.7, margin: '0 0 28px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
                  Based on industry benchmarks, you are likely wasting KES {calcResult.toLocaleString()} per month due to ICP misalignment and funnel friction.
                </p>
                {!calcEmailSent ? (
                  <>
                    <p style={{ fontFamily: fontBody, fontSize: 14, fontWeight: 600, color: P, margin: '0 0 14px' }}>Get the full breakdown showing exactly where this waste is coming from.</p>
                    <div style={{ display: 'flex', gap: 8, maxWidth: 440, margin: '0 auto' }}>
                      <input
                        type="email"
                        value={calcEmail}
                        onChange={e => setCalcEmail(e.target.value)}
                        placeholder="your@email.com"
                        style={{ flex: 1, fontFamily: fontBody, fontSize: 14, color: P, background: '#fff', border: `1px solid rgba(48,33,97,0.2)`, borderRadius: 10, padding: '11px 14px', outline: 'none' }}
                      />
                      <button
                        onClick={async () => {
                          if (!calcEmail) return
                          await fetch('/api/lead-magnet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: calcEmail, type: 'calculator', wasteEstimate: calcResult }) })
                          setCalcEmailSent(true)
                        }}
                        style={{ background: P, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 18px', fontFamily: fontBody, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Send My Breakdown
                      </button>
                    </div>
                  </>
                ) : (
                  <p style={{ fontFamily: fontBody, fontSize: 14, fontWeight: 600, color: '#22c55e', margin: 0 }}>Check your inbox — breakdown sent.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="section-pad" style={{ background: BgAlt, borderTop: `1px solid ${Pborder}` }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <Badge text="Simple Pricing" />
            <H2 style={{ fontSize: 'clamp(28px,4vw,40px)', margin: '0 0 16px' }}>
              Stop guessing. Start knowing.
            </H2>
            <p style={{ fontSize: 17, color: Pbody, maxWidth: 460, margin: '0 auto', lineHeight: 1.65 }}>
              Every paid plan includes our deep research diagnostic — we visit your landing page, research your competitors, and benchmark your performance with real data. Not estimates.
            </p>
          </div>

          {/* Features comparison banner */}
          <div style={{ background: P, borderRadius: '16px 16px 0 0', padding: '14px 28px', marginBottom: 0, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: fontBody, fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6 }}>
              All paid plans include:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {['Weekly Intelligence Briefing', 'AI Media Buyer Chat', 'Deep Research Diagnostic', 'Self-Serve Subscription Management'].map(f => (
                <span key={f} style={{ fontFamily: fontBody, fontSize: 12, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Check size={11} color="rgba(255,255,255,0.6)" strokeWidth={2.5} />
                  {f}
                </span>
              ))}
            </div>
          </div>
          <div style={{ borderRadius: '0 0 20px 20px', overflow: 'hidden', marginBottom: 24 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" style={{ alignItems: 'start' }}>
              {TIERS.map(tier => (
                <div key={tier.name} style={{ background: tier.highlight ? P : '#fff', border: `1px solid ${tier.highlight ? 'transparent' : Pborder}`, borderRadius: 20, padding: '36px 28px', boxShadow: tier.highlight ? '0 20px 56px rgba(48,33,97,0.28)' : 'none', position: 'relative' }}>
                  {tier.highlight && (
                    <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#a78bfa,#6c4ddd)', color: '#fff', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', padding: '4px 16px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                      Most Popular
                    </div>
                  )}
                  <p style={{ fontFamily: font, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: tier.highlight ? 'rgba(255,255,255,0.6)' : Pmuted, margin: '0 0 10px' }}>{tier.name}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                    <span style={{ fontFamily: font, fontSize: 36, fontWeight: 800, letterSpacing: '-1px', color: tier.highlight ? '#fff' : P, lineHeight: 1 }}>{tier.price}</span>
                    <span style={{ fontSize: 14, color: tier.highlight ? 'rgba(255,255,255,0.55)' : Pmuted }}>{tier.period}</span>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: tier.highlight ? 'rgba(255,255,255,0.75)' : Pbody, margin: '0 0 24px' }}>{tier.desc}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {tier.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14 }}>
                        <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: '50%', background: tier.highlight ? 'rgba(255,255,255,0.18)' : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                          <Check size={10} color={tier.highlight ? '#fff' : P} strokeWidth={3} />
                        </span>
                        <span style={{ color: tier.highlight ? 'rgba(255,255,255,0.85)' : Pbody }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={tier.href} style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: tier.highlight ? '#fff' : P, color: tier.highlight ? P : '#fff', fontWeight: 700, fontSize: 14, padding: '14px 20px', borderRadius: 12, letterSpacing: '-0.2px' }}>
                    {tier.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: 14, color: Pmuted, marginTop: 32 }}>
            Start with a free diagnostic. Upgrade only when you&rsquo;re ready.
          </p>
        </div>
      </section>

      {/* ── What happens next ─────────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: '#fff', borderTop: `1px solid ${Pborder}` }}>
        <div className="container">
          <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,3vw,40px)', fontWeight: 700, color: P, letterSpacing: '-0.03em', lineHeight: 1.1, textAlign: 'center', margin: '0 0 64px' }}>
            What happens after you sign up.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: 1, heading: 'Complete your free diagnosis', body: 'Answer 20 questions about your business, targeting, and funnel. Takes 5 minutes.', chip: 'Day 0' },
              { num: 2, heading: 'Get your report instantly', body: 'Your personalized ICP diagnostic report is generated immediately with your health score, waste estimate, and critical findings.', chip: 'Day 0' },
              { num: 3, heading: 'Subscribe for deep research', body: 'Upgrade to unlock live landing page assessment, competitor research, weekly intelligence briefing, and AI chat agent.', chip: 'Day 1' },
              { num: 4, heading: 'Watch your score improve', body: 'Run monthly re-diagnoses to track improvement. Your score history builds automatically.', chip: 'Month 2+' },
            ].map((step, i, arr) => (
              <div key={step.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative' }}>
                {i < arr.length - 1 && (
                  <div className="hidden lg:block" style={{ position: 'absolute', top: 24, left: 'calc(50% + 24px)', right: 'calc(-50% + 24px)', height: 1, borderTop: '1px dashed rgba(48,33,97,0.2)' }} />
                )}
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: P, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, flexShrink: 0, position: 'relative', zIndex: 1 }}>
                  <span style={{ fontFamily: font, fontSize: 20, fontWeight: 700, color: '#fff' }}>{step.num}</span>
                </div>
                <span style={{ display: 'inline-block', fontFamily: fontBody, fontSize: 11, fontWeight: 700, color: P, background: '#ede9fe', padding: '3px 10px', borderRadius: 100, marginBottom: 12 }}>{step.chip}</span>
                <h3 style={{ fontFamily: font, fontSize: 17, fontWeight: 700, color: P, margin: '0 0 10px', letterSpacing: '-0.01em', lineHeight: 1.3 }}>{step.heading}</h3>
                <p style={{ fontFamily: fontBody, fontSize: 14, color: 'rgba(48,33,97,0.65)', lineHeight: 1.7, margin: 0 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="section-pad" style={{ background: BgAlt, borderTop: `1px solid ${Pborder}` }}>
        <div className="container flex flex-col lg:flex-row lg:gap-20 gap-12">

          {/* Left — sticky label + heading */}
          <div className="lg:w-[36%] lg:flex-none">
            <p style={{ fontFamily: fontBody, color: '#d946ef', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>FAQs</p>
            <h2 style={{ fontFamily: font, fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, letterSpacing: '-0.03em', color: P, lineHeight: 1.1, margin: '0 0 24px' }}>
              You ask,<br />we answer.
            </h2>
            <p style={{ fontFamily: fontBody, fontSize: 16, lineHeight: 1.7, color: Pbody, margin: 0 }}>
              Everything you need to know before getting started.{' '}
              <a href="mailto:support@icpbrand.co" style={{ color: '#d946ef', fontWeight: 600, textDecoration: 'none' }}>Contact Us</a>
            </p>
          </div>

          {/* Right — accordion */}
          <div style={{ flex: 1 }}>
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, marginBottom: 8, overflow: 'hidden', boxShadow: openFaq === i ? '0 4px 20px rgba(48,33,97,0.08)' : 'none', transition: 'box-shadow 0.2s' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '22px 28px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontFamily: font, fontSize: 16, fontWeight: 600, color: P, letterSpacing: '-0.2px', lineHeight: 1.4 }}>{item.q}</span>
                  <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: '50%', background: openFaq === i ? P : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: openFaq === i ? '#fff' : P, fontSize: 20, fontWeight: 300, transition: 'background 0.2s', lineHeight: 1 }}>
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                <div style={{ maxHeight: openFaq === i ? 400 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                  <p style={{ fontFamily: fontBody, fontSize: 15, lineHeight: 1.75, color: Pbody, margin: 0, padding: '0 28px 24px' }}>{item.a}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Social Proof ──────────────────────────────────────────────────── */}
      <section id="results" className="section-pad" style={{ background: BgAlt, borderTop: `1px solid ${Pborder}` }}>
        <div className="container">

          {/* header */}
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontFamily: fontBody, color: '#d946ef', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>Social Proof</p>
            <h2 style={{ fontFamily: font, fontSize: 'clamp(32px,4vw,48px)', fontWeight: 700, letterSpacing: '-0.03em', color: P, margin: '0 0 32px', lineHeight: 1.1 }}>
              Finally. An answer that isn&rsquo;t &ldquo;increase your budget.&rdquo;
            </h2>
            {/* filter tabs */}
            <div style={{ display: 'inline-flex', gap: 4, background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 100, padding: 6 }}>
              {['Google Reviews', 'Trustpilot', 'Direct'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ fontFamily: fontBody, fontSize: 14, fontWeight: 600, padding: '8px 20px', borderRadius: 100, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === tab ? P : 'transparent', color: activeTab === tab ? '#fff' : Pbody, whiteSpace: 'nowrap' }}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* 3-column card grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left — dark featured card */}
            <div style={{ background: P, borderRadius: 24, padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 440 }}>
              <div>
                <div style={{ display: 'inline-block', background: 'linear-gradient(135deg,#e879f9,#d946ef)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '5px 16px', borderRadius: 100, marginBottom: 28 }}>
                  Ease of Use
                </div>
                <p style={{ fontFamily: font, fontSize: 20, fontWeight: 600, color: '#fff', lineHeight: 1.55, margin: 0 }}>
                  &ldquo;I was three months into a campaign with nothing to show for it. The diagnosis told me in 5 minutes what three agencies couldn&rsquo;t in six months.&rdquo;
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 32 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)' }}>
                  <Image src="/images/Frame 245.png" alt="James Mwangi" width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontFamily: font, fontSize: 14, fontWeight: 700, color: '#fff' }}>James Mwangi</p>
                  <p style={{ margin: 0, fontFamily: fontBody, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>Head of Marketing, Nairobi</p>
                </div>
              </div>
            </div>

            {/* Middle — photo card */}
            <div style={{ borderRadius: 24, overflow: 'hidden', position: 'relative', height: 440 }}>
              <Image src="/images/section.jpg" alt="Amara Osei testimonial" fill style={{ objectFit: 'cover', objectPosition: 'center top' }} />
              {/* play button */}
              <div style={{ position: 'absolute', top: '36%', left: '50%', transform: 'translate(-50%,-50%)', width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#e879f9,#d946ef)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(217,70,239,0.45)', zIndex: 2 }}>
                <svg width="16" height="18" viewBox="0 0 16 18" fill="none"><path d="M2 1.5l12 7-12 7V1.5z" fill="#fff" /></svg>
              </div>
              {/* dark gradient overlay */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(48,33,97,0.93) 0%, rgba(48,33,97,0.35) 55%, transparent 100%)' }} />
              {/* text overlay */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 28px 32px' }}>
                <p style={{ fontFamily: font, fontSize: 16, fontWeight: 600, color: '#fff', lineHeight: 1.5, margin: '0 0 16px' }}>
                  &ldquo;We had 14 form fields on our landing page. Cut it to four and leads tripled in two weeks.&rdquo;
                </p>
                <p style={{ margin: '0 0 4px', fontFamily: font, fontSize: 14, fontWeight: 700, color: '#fff' }}>Amara Osei</p>
                <p style={{ margin: 0, fontFamily: fontBody, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Growth Lead, Lagos</p>
              </div>
            </div>

            {/* Right — photo card */}
            <div style={{ borderRadius: 24, overflow: 'hidden', position: 'relative', height: 440 }}>
              <Image src="/images/section.jpg" alt="Sarah Kimani testimonial" fill style={{ objectFit: 'cover', objectPosition: 'right center' }} />
              {/* play button */}
              <div style={{ position: 'absolute', top: '36%', left: '50%', transform: 'translate(-50%,-50%)', width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#e879f9,#d946ef)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(217,70,239,0.45)', zIndex: 2 }}>
                <svg width="16" height="18" viewBox="0 0 16 18" fill="none"><path d="M2 1.5l12 7-12 7V1.5z" fill="#fff" /></svg>
              </div>
              {/* dark gradient overlay */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(48,33,97,0.93) 0%, rgba(48,33,97,0.35) 55%, transparent 100%)' }} />
              {/* text overlay */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 28px 32px' }}>
                <p style={{ fontFamily: font, fontSize: 16, fontWeight: 600, color: '#fff', lineHeight: 1.5, margin: '0 0 16px' }}>
                  &ldquo;Found KES 38,000 in wasted spend in one CSV upload. Paid for a year of subscription.&rdquo;
                </p>
                <p style={{ margin: '0 0 4px', fontFamily: font, fontSize: 14, fontWeight: 700, color: '#fff' }}>Sarah Kimani</p>
                <p style={{ margin: 0, fontFamily: fontBody, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Marketing Director, Nairobi</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── LP Friction Checklist Lead Magnet ────────────────────────────── */}
      <section className="section-pad" style={{ background: BgAlt, borderTop: `1px solid ${Pborder}` }}>
        <div className="container">
          <div style={{ borderRadius: 24, padding: 'clamp(32px,5vw,56px) clamp(24px,5vw,64px)', background: BgAlt }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* LEFT */}
              <div>
                <span style={{ display: 'inline-block', background: '#d946ef', color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '4px 14px', borderRadius: 100, marginBottom: 20 }}>Free Download</span>
                <h2 style={{ fontFamily: font, fontSize: 'clamp(24px,3vw,38px)', fontWeight: 700, color: P, letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 20px' }}>
                  Is your landing page<br />killing your conversions?
                </h2>
                <p style={{ fontFamily: fontBody, fontSize: 16, color: 'rgba(48,33,97,0.75)', lineHeight: 1.7, margin: '0 0 28px' }}>
                  Download our 27-point Landing Page Friction Checklist. Every question maps to a real conversion killer we diagnose. Takes 10 minutes to complete. Most marketers find at least 8 problems.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                  {[
                    'Used by 50+ marketing teams',
                    'Covers mobile, desktop, and form friction',
                    'Includes industry benchmarks for each checkpoint',
                  ].map(point => (
                    <div key={point} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={11} color={P} strokeWidth={3} />
                      </span>
                      <span style={{ fontFamily: fontBody, fontSize: 15, color: P }}>{point}</span>
                    </div>
                  ))}
                </div>
                {!checklistSent ? (
                  <>
                    <input
                      type="email"
                      value={checklistEmail}
                      onChange={e => setChecklistEmail(e.target.value)}
                      placeholder="Your work email"
                      style={{ width: '100%', fontFamily: fontBody, fontSize: 14, color: P, background: '#fff', border: `1px solid rgba(48,33,97,0.2)`, borderRadius: 10, padding: '14px 16px', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
                    />
                    <button
                      onClick={async () => {
                        if (!checklistEmail) return
                        await fetch('/api/lead-magnet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: checklistEmail, type: 'checklist' }) })
                        setChecklistSent(true)
                      }}
                      style={{ width: '100%', background: P, color: '#fff', border: 'none', borderRadius: 12, padding: 16, fontFamily: font, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                      Send Me The Checklist
                    </button>
                    <p style={{ fontFamily: fontBody, fontSize: 12, color: Pmuted, margin: '10px 0 0', textAlign: 'center' }}>Free. No spam. Unsubscribe anytime.</p>
                  </>
                ) : (
                  <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 12, padding: '16px 20px' }}>
                    <p style={{ fontFamily: fontBody, fontSize: 14, fontWeight: 600, color: '#16a34a', margin: 0 }}>Checklist on its way. Check your inbox.</p>
                  </div>
                )}
              </div>

              {/* RIGHT — checklist preview card */}
              <div>
                <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 32px rgba(48,33,97,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${Pborder}` }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg,${P},#6c4ddd)` }} />
                    <span style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: P }}>Landing Page Friction Checklist</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { checked: true,  label: 'Value proposition visible in 5 seconds' },
                      { checked: true,  label: 'Form has fewer than 5 fields' },
                      { checked: false, label: 'Mobile load time under 3 seconds' },
                      { checked: true,  label: 'Primary CTA above the fold' },
                      { checked: false, label: 'Trust signals visible without scrolling' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${item.checked ? P : 'rgba(48,33,97,0.25)'}`, background: item.checked ? P : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {item.checked && <Check size={10} color="#fff" strokeWidth={3} />}
                        </div>
                        <span style={{ fontFamily: fontBody, fontSize: 13, color: item.checked ? P : Pmuted, lineHeight: 1.4 }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontFamily: fontBody, fontSize: 12, color: Pmuted, margin: '16px 0 0', textAlign: 'center' }}>+ 22 more checkpoints</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Team ──────────────────────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: '#fff', borderTop: `1px solid ${Pborder}` }}>
        <div className="container">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
            <div style={{ flex: 1 }}>
              <Badge text="Who Built This" />
              <H2>Built by someone who has managed over $2M in ad spend.</H2>
              <Body style={{ maxWidth: 520 }}>
                This platform was built by a performance media buyer who got tired of watching
                clients waste money on the wrong audience. Every diagnostic rule, every
                recommendation, every insight comes from real campaign experience — not theory.
              </Body>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: BgPurple, border: `1px solid ${Pborder}`, borderRadius: 16, padding: '14px 20px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg,${P},#6c4ddd)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: font }}>MB</span>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: P }}>Lead Media Buyer</p>
                  <p style={{ margin: 0, fontSize: 12, color: Pbody }}>Founder &amp; Lead Media Buyer</p>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ede9fe', padding: '4px 10px', borderRadius: 100, marginLeft: 8 }}>
                  <MapPin size={11} color={P} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: P }}>Nairobi, Kenya</span>
                </div>
              </div>
            </div>
            <div style={{ flexShrink: 0, borderRadius: 24, overflow: 'hidden', boxShadow: '0 16px 56px rgba(48,33,97,0.13)' }}>
              <Image
                src="/images/section.jpg"
                alt="Marketing team at work"
                width={480}
                height={340}
                style={{ width: 480, maxWidth: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Get It Done (Agency) ──────────────────────────────────────────── */}
      <section id="get-it-done" className="section-pad" style={{ background: BgAlt, borderTop: `1px solid ${Pborder}` }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-block', fontFamily: fontBody, background: '#302161', color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '5px 16px', borderRadius: 100, marginBottom: 20 }}>
              Agency Plan
            </div>
            <h2 style={{ fontFamily: font, fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, letterSpacing: '-0.03em', color: P, margin: '0 0 20px', lineHeight: 1.1 }}>
              Not enough time to fix it yourself?
            </h2>
            <p style={{ fontFamily: fontBody, fontSize: 18, color: 'rgba(48,33,97,0.65)', maxWidth: 580, margin: '0 auto', lineHeight: 1.7 }}>
              Hand your diagnostic to one of our media buyers. We show up already knowing your numbers. You just make the decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left — How it works */}
            <div>
              {[
                {
                  n: '01',
                  heading: 'Run your diagnostic',
                  body: 'Complete the ICP questionnaire. We generate your full diagnostic report with your health score, waste estimate, and critical findings.',
                },
                {
                  n: '02',
                  heading: 'We review before you arrive',
                  body: 'Your assigned media buyer reads your diagnostic before the session. No briefing. No time wasted. We already know what\'s broken.',
                },
                {
                  n: '03',
                  heading: 'We fix it together',
                  body: 'Live session where we implement your top 3 fixes. Targeting adjustments, landing page recommendations, budget reallocation — done on the call.',
                },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 28, marginBottom: 44 }}>
                  <div style={{ flexShrink: 0 }}>
                    <span style={{ fontFamily: font, fontSize: 52, fontWeight: 800, color: P, opacity: 0.1, lineHeight: 1, display: 'block' }}>{step.n}</span>
                  </div>
                  <div style={{ paddingTop: 8 }}>
                    <h3 style={{ fontFamily: font, fontSize: 20, fontWeight: 700, color: P, margin: '0 0 10px', letterSpacing: '-0.01em' }}>{step.heading}</h3>
                    <p style={{ fontFamily: fontBody, fontSize: 15, color: 'rgba(48,33,97,0.65)', lineHeight: 1.7, margin: 0 }}>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right — What's included card */}
            <div style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 24, padding: 40, boxShadow: '0 4px 32px rgba(48,33,97,0.08)' }}>
              <div style={{ display: 'inline-block', fontFamily: fontBody, background: P, color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '5px 14px', borderRadius: 100, marginBottom: 24 }}>
                Agency Plan — KES 26,000/mo
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {[
                  'Everything in Pro',
                  'Monthly strategy session with a media buyer',
                  'Pre-session diagnostic review',
                  'Live implementation of top 3 fixes',
                  '30-day follow-up report',
                  'Priority support response',
                  'Multi-client reporting',
                  'White label reports',
                ].map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <Check size={16} color={P} style={{ flexShrink: 0, marginTop: 3 }} />
                    <span style={{ fontFamily: fontBody, fontSize: 15, color: Pbody, lineHeight: 1.5 }}>{feat}</span>
                  </div>
                ))}
              </div>

              <div style={{ height: 1, background: Pborder, margin: '0 0 28px' }} />

              <blockquote style={{ margin: '0 0 28px', padding: '20px 24px', background: BgAlt, borderRadius: 14, borderLeft: `3px solid ${P}` }}>
                <p style={{ fontFamily: fontBody, fontSize: 14, color: Pbody, lineHeight: 1.75, margin: '0 0 14px', fontStyle: 'italic' }}>
                  &ldquo;I showed up to the session and they already knew my ICP score was 34, my landing page had 14 form fields, and exactly where my budget was going. We fixed three things in 45 minutes that my agency couldn&rsquo;t fix in 6 months.&rdquo;
                </p>
                <p style={{ fontFamily: fontBody, fontSize: 13, fontWeight: 600, color: P, margin: 0 }}>
                  — Head of Marketing, B2B SaaS, Nairobi
                </p>
              </blockquote>

              <Link href="/questionnaire"
                style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: P, color: '#fff', fontFamily: font, fontWeight: 700, fontSize: 15, padding: 18, borderRadius: 14, letterSpacing: '-0.2px', boxShadow: '0 8px 28px rgba(48,33,97,0.2)' }}>
                Get Started with Agency →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: 'linear-gradient(160deg,#f0edff 0%,#e8e2ff 50%,#ede8ff 100%)', borderTop: `1px solid ${Pborder}`, textAlign: 'center' }}>
        <div className="container">
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontFamily: font, fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, letterSpacing: '-0.03em', color: P, margin: '0 0 20px', lineHeight: 1.1 }}>
            Your competitors are getting smarter every week. Are you?
          </h2>
          <p style={{ fontFamily: fontBody, fontSize: 17, color: 'rgba(48,33,97,0.75)', maxWidth: 520, margin: '0 auto 44px', lineHeight: 1.7 }}>
            While you&rsquo;re reading this, top performers in your industry are optimizing their targeting, reading their weekly intelligence briefing, and fixing their funnel friction. Your free diagnosis takes 5 minutes. Start now.
          </p>
          <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: P, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 17, padding: '17px 40px', borderRadius: 12, letterSpacing: '-0.3px', boxShadow: '0 12px 40px rgba(48,33,97,0.25)' }}>
            Get My Free Diagnosis &rarr;
          </Link>
          <p style={{ fontSize: 13, color: Pmuted, marginTop: 16 }}>
            Free &middot; No credit card &middot; No ad account access needed
          </p>
        </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#fff', borderTop: `1px solid ${Pborder}`, padding: '72px 0 40px' }}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-14">
            {/* brand */}
            <div className="md:col-span-2">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${P},#6c4ddd)` }} />
                <span style={{ fontFamily: font, fontWeight: 700, fontSize: 16, color: P }}>ICP Diagnostic</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: Pbody, maxWidth: 280, margin: '0 0 24px' }}>
                The fastest way to find out why your marketing isn&rsquo;t working — and exactly how to fix it.
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: P, margin: '0 0 10px' }}>Get diagnostic tips by email</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="email" placeholder="you@company.com"
                  style={{ flex: 1, background: BgAlt, border: `1px solid ${Pborder}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, color: Pbody, outline: 'none' }} />
                <button style={{ background: P, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Subscribe
                </button>
              </div>
            </div>

            {/* quick links */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: Pmuted, margin: '0 0 16px' }}>Quick Links</p>
              {[
                { label: 'How It Works',       href: '#how-it-works' },
                { label: 'Pricing',            href: '#pricing' },
                { label: 'FAQ',                href: '#faq' },
                { label: 'Get Free Diagnosis', href: '/questionnaire' },
                { label: 'Dashboard Login',    href: '/dashboard' },
              ].map(l => (
                <div key={l.label} style={{ marginBottom: 10 }}>
                  <Link href={l.href} style={{ fontSize: 14, color: Pbody, textDecoration: 'none' }}>{l.label}</Link>
                </div>
              ))}
            </div>

            {/* contact */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: Pmuted, margin: '0 0 16px' }}>Contact</p>
              {[
                { label: 'support@icpbrand.co', href: 'mailto:support@icpbrand.co' },
                { label: 'Nairobi, Kenya',       href: '#' },
              ].map(l => (
                <div key={l.label} style={{ marginBottom: 10 }}>
                  <a href={l.href} style={{ fontSize: 14, color: Pbody, textDecoration: 'none' }}>{l.label}</a>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${Pborder}`, paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 13, color: Pmuted, margin: 0 }}>&copy; 2026 ICP Diagnostic. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Privacy Policy', 'Terms of Service'].map(l => (
                <a key={l} href="#" style={{ fontSize: 13, color: Pmuted, textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </main>
  )
}
