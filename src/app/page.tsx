'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  RefreshCw, Filter, TrendingDown, BarChart2, Activity,
  Check, Menu, X, MapPin, ArrowRight, Globe,
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

  return (
    <main style={{ fontFamily: '-apple-system,system-ui,sans-serif', color: Pbody, background: '#fff', overflowX: 'hidden' }}>

      {/* ── Sticky pill nav ───────────────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', justifyContent: 'center', padding: '14px 20px' }}>
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', maxWidth: 1060,
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
      <section style={{ background: '#ffffff', paddingTop: 120, overflow: 'hidden' }}>
        <div className="flex flex-col gap-10 lg:flex-row lg:items-stretch lg:gap-20" style={{ maxWidth: 1200, margin: '0 auto', paddingLeft: 24 }}>

          {/* copy — left column */}
          <div className="flex flex-col justify-center px-5 pb-16 lg:px-0 lg:pb-32 lg:w-[44%] lg:flex-none">

            {/* dual badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
              <span style={{ background: 'linear-gradient(135deg,#e879f9,#a855f7)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 100, letterSpacing: '0.3px' }}>Free</span>
              <span style={{ background: '#ede9fe', color: P, fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 100, letterSpacing: '0.3px' }}>ICP Diagnostic Platform</span>
            </div>

            <h1 style={{ fontFamily: font, fontSize: 'clamp(40px,5vw,68px)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.04em', color: P, margin: '0 0 24px' }}>
              You&rsquo;re not bad at marketing. You&rsquo;re targeting the wrong people.
            </h1>

            <p style={{ fontFamily: fontBody, fontSize: 17, lineHeight: 1.7, color: 'rgba(48,33,97,0.75)', margin: '0 0 36px' }}>
              Every month you run ads to the wrong audience is another month your CEO asks why
              the pipeline is empty. We diagnose exactly who you should be targeting — in 5 minutes, for free.
            </p>

            {/* CTA with circular arrow icon */}
            <div style={{ marginBottom: 32 }}>
              <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: P, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 15, padding: '10px 24px 10px 10px', borderRadius: 100, boxShadow: '0 8px 28px rgba(48,33,97,0.28)' }}>
                <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ArrowRight size={17} color="#fff" />
                </span>
                Get Free Diagnosis
              </Link>
            </div>

            {/* avatar social proof */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 80, height: 34, borderRadius: 999, overflow: 'hidden', border: '2.5px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.14)', flexShrink: 0 }}>
                <Image
                  src="/images/Frame 245.png"
                  alt="Marketing team members"
                  width={80}
                  height={34}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: P }}>50+ marketing teams</p>
                <p style={{ margin: 0, fontSize: 12, color: Pmuted }}>no ad account access needed.</p>
              </div>
            </div>
          </div>

          {/* illustration — right column */}
          <div className="lg:flex-1" style={{ background: 'linear-gradient(135deg,#f5f3ff 0%,#ede9fe 60%,#ddd6fe 100%)', borderRadius: '24px 24px 0 0', display: 'flex', alignItems: 'flex-end', overflow: 'hidden', minHeight: 320 }}>
            <Image
              src="/images/Holder.png"
              alt="ICP Diagnostic Dashboard"
              width={700}
              height={600}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              priority
            />
          </div>
        </div>
      </section>

      {/* ── Logo trust bar ────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderTop: `1px solid ${Pborder}`, borderBottom: `1px solid ${Pborder}`, padding: '32px 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', paddingLeft: 24 }}>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center" style={{ maxWidth: 1200, margin: '0 auto' }}>
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
              <ArrowRight size={16} color="#fff" /> Diagnose My ICP
            </Link>
          </div>
        </div>
        {/* section number */}
        <span style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', writingMode: 'vertical-rl', fontSize: 12, color: 'rgba(48,33,97,0.2)', letterSpacing: '0.1em', fontWeight: 500 }}>01</span>
      </section>

      {/* Block 2 — Text LEFT, Visual RIGHT */}
      <section className="section-pad" style={{ background: BgAlt, position: 'relative', overflow: 'hidden' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center" style={{ maxWidth: 1200, margin: '0 auto' }}>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center" style={{ maxWidth: 1200, margin: '0 auto' }}>
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

      {/* ── Feature grid ──────────────────────────────────────────────────── */}
      <section id="features" className="section-pad" style={{ background: BgAlt }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch" style={{ maxWidth: 1200, margin: '0 auto' }}>

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

            <a href="#how-it-works" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: P, fontWeight: 600, fontSize: 15, textDecoration: 'none', marginBottom: 0 }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
              Learn More <ArrowRight size={16} />
            </a>

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
                <Activity size={22} color="#a855f7" strokeWidth={1.75} />
              </div>
              <h3 style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: P, margin: '0 0 8px' }}>Monthly Health Check</h3>
              <p style={{ fontFamily: fontBody, fontSize: 14, lineHeight: 1.65, color: 'rgba(48,33,97,0.65)', margin: 0 }}>Track ICP score improvement month over month automatically.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: BgAlt, borderTop: `1px solid ${Pborder}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontFamily: font, fontSize: 'clamp(32px,4vw,48px)', fontWeight: 700, color: P, letterSpacing: '-0.03em', lineHeight: 1.1, textAlign: 'center', margin: '0 0 48px' }}>
            Why it matters now.
          </h2>

          {/* white card container */}
          <div style={{ background: '#fff', borderRadius: 24, padding: '60px 80px', maxWidth: 1100, margin: '0 auto', boxShadow: '0 2px 40px rgba(48,33,97,0.06)' }}>
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
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <div className="flex flex-col md:flex-row items-center gap-10 p-6 md:p-12" style={{ background: '#fff', borderRadius: 24, boxShadow: '0 8px 40px rgba(48,33,97,0.1)' }}>
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

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="section-pad" style={{ background: BgAlt, borderTop: `1px solid ${Pborder}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <Badge text="Simple Pricing" />
            <H2 style={{ fontSize: 'clamp(28px,4vw,40px)', margin: '0 0 16px' }}>
              Stop guessing. Start knowing.
            </H2>
            <p style={{ fontSize: 17, color: Pbody, maxWidth: 460, margin: '0 auto', lineHeight: 1.65 }}>
              One subscription. Complete visibility into why your marketing isn&rsquo;t working.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 16, alignItems: 'start' }}>
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
          <p style={{ textAlign: 'center', fontSize: 14, color: Pmuted, marginTop: 32 }}>
            Start with a free diagnostic. Upgrade only when you&rsquo;re ready.
          </p>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="section-pad" style={{ background: BgAlt, borderTop: `1px solid ${Pborder}` }}>
        <div className="flex flex-col lg:flex-row lg:gap-20 gap-12" style={{ maxWidth: 1200, margin: '0 auto' }}>

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
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

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

      {/* ── Team ──────────────────────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: '#fff', borderTop: `1px solid ${Pborder}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
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
                  <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: font }}>EK</span>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: P }}>Eugene Kwata</p>
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

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: 'linear-gradient(160deg,#f0edff 0%,#e8e2ff 50%,#ede8ff 100%)', borderTop: `1px solid ${Pborder}`, textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontFamily: font, fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, letterSpacing: '-0.03em', color: P, margin: '0 0 20px', lineHeight: 1.1 }}>
            Every month without a diagnosis is a month of budget you won&rsquo;t get back.
          </h2>
          <p style={{ fontFamily: fontBody, fontSize: 17, color: 'rgba(48,33,97,0.75)', maxWidth: 520, margin: '0 auto 44px', lineHeight: 1.7 }}>
            You don&rsquo;t have a spending problem. You have a targeting problem. And it has a name, a score, and a fix.
          </p>
          <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: P, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 17, padding: '17px 40px', borderRadius: 12, letterSpacing: '-0.3px', boxShadow: '0 12px 40px rgba(48,33,97,0.25)' }}>
            Get My Free Diagnosis <ArrowRight size={18} />
          </Link>
          <p style={{ fontSize: 13, color: Pmuted, marginTop: 16 }}>
            Free &middot; No credit card &middot; No ad account access needed
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#fff', borderTop: `1px solid ${Pborder}`, padding: '72px 24px 40px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
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
