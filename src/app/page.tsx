'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Target, Filter, TrendingDown, Radio, BarChart2, Activity,
  Star, Check, Menu, X, MapPin, ArrowRight,
} from 'lucide-react'

export const dynamic = 'force-static'

// ─── Design tokens ────────────────────────────────────────────────────────────
const P       = '#302161'
const Pbody   = 'rgba(48,33,97,0.88)'
const Pmuted  = 'rgba(48,33,97,0.5)'
const Pborder = 'rgba(48,33,97,0.1)'
const BgAlt   = '#f8f7ff'
const BgPurple = '#f5f3ff'
const font    = "'DM Sans', -apple-system, sans-serif"

// ─── Static data ─────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing',      href: '#pricing' },
  { label: 'FAQ',          href: '#faq' },
  { label: 'Results',      href: '#results' },
]

const MARQUEE_ITEMS = [
  '✦ Free ICP Diagnosis',
  '✦ No Agency Fluff',
  '✦ Real Numbers, Real Fixes',
  '✦ Results in 5 Minutes',
  '✦ Built by a Media Buyer',
  '✦ Region-Specific Insights',
]

const FEATURE_GRID = [
  { Icon: Target,       title: 'ICP Alignment',      desc: 'Know exactly who your best customer really is' },
  { Icon: Filter,       title: 'Funnel Audit',        desc: 'Score every step from ad click to conversion' },
  { Icon: TrendingDown, title: 'Budget Analysis',     desc: 'Find where your money is being wasted' },
  { Icon: Radio,        title: 'Channel Efficiency',  desc: 'Identify which platforms your ICP actually uses' },
  { Icon: BarChart2,    title: 'CSV Analysis',        desc: 'Upload your campaign data for instant media buyer insights' },
  { Icon: Activity,     title: 'Monthly Monitoring',  desc: 'Track your ICP health score improvement over time' },
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

const TESTIMONIALS = [
  {
    quote: "I was three months into a campaign with nothing to show for it. The diagnosis told me in 5 minutes what three agencies couldn't in six months — we were targeting procurement managers when our actual buyers were CFOs.",
    author: 'Head of Marketing, B2B SaaS, Nairobi',
  },
  {
    quote: "We had 14 form fields on our landing page. Fourteen. We cut it to four and leads tripled in two weeks. I didn't need a new campaign. I needed a diagnosis.",
    author: 'Growth Lead, Fintech Startup, Lagos',
  },
  {
    quote: "I uploaded our Meta CSV on a Monday morning. By lunch I had a report that found KES 38,000 in wasted spend. That one upload paid for a year of the subscription.",
    author: 'Marketing Director, E-commerce Brand, Nairobi',
  },
]

// ─── Score arc SVG ────────────────────────────────────────────────────────────

function ScoreArc({ score, size = 120 }: { score: number; size?: number }) {
  const r    = Math.round(size * 0.38)
  const cx   = size / 2
  const cy   = size / 2
  const circ = 2 * Math.PI * r
  const off  = circ * (1 - score / 100)
  const col  = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ede9fe" strokeWidth={size * 0.07} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={size * 0.07}
        strokeDasharray={circ} strokeDashoffset={off}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
    </svg>
  )
}

// ─── Hero illustration ────────────────────────────────────────────────────────

function HeroIllustration() {
  const bars = [
    { label: 'ICP Alignment',  v: 28 },
    { label: 'Targeting',      v: 42 },
    { label: 'Channel Mix',    v: 65 },
  ]
  const findings = [
    { text: 'Wrong audience targeting', col: '#dc2626', bg: '#fef2f2' },
    { text: 'High funnel friction',      col: '#d97706', bg: '#fffbeb' },
    { text: 'Meta budget misaligned',    col: '#dc2626', bg: '#fef2f2' },
  ]
  return (
    <div style={{ width: '100%', maxWidth: 400, background: 'linear-gradient(150deg, #f5f3ff 0%, #ede9fe 100%)', borderRadius: 24, padding: 28, border: `1px solid ${Pborder}`, boxShadow: '0 32px 80px rgba(48,33,97,0.15)' }}>

      {/* main card */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 14, border: `1px solid rgba(48,33,97,0.07)` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: Pmuted }}>ICP Health Score</p>
          </div>
          <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 8 }}>Critical</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', marginBottom: 20 }}>
          <ScoreArc score={34} size={120} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#ef4444', lineHeight: 1 }}>34</p>
            <p style={{ margin: 0, fontSize: 11, color: Pmuted }}>/100</p>
          </div>
        </div>

        {bars.map(b => {
          const col = b.v >= 70 ? '#22c55e' : b.v >= 40 ? '#f59e0b' : '#ef4444'
          return (
            <div key={b.label} style={{ marginBottom: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: Pbody }}>{b.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: col }}>{b.v}</span>
              </div>
              <div style={{ height: 5, background: '#f0edff', borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${b.v}%`, background: col, borderRadius: 99 }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* findings */}
      {findings.map(f => (
        <div key={f.text} style={{ background: f.bg, borderRadius: 10, padding: '9px 13px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: f.col, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: f.col, fontWeight: 600 }}>{f.text}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Feature illustrations ────────────────────────────────────────────────────

function ICPIllustration() {
  const dims = [
    { label: 'ICP Alignment',     score: 42 },
    { label: 'Targeting Accuracy', score: 28 },
    { label: 'Channel Efficiency', score: 65 },
    { label: 'Funnel Friction',    score: 35 },
    { label: 'Message Fit',        score: 55 },
    { label: 'Budget Allocation',  score: 20 },
  ]
  return (
    <div style={{ width: '100%', maxWidth: 400, background: BgPurple, borderRadius: 20, padding: 28 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: `1px solid rgba(48,33,97,0.07)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: Pmuted }}>Score Breakdown</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: '#ef4444', lineHeight: 1 }}>34</span>
              <span style={{ fontSize: 13, color: Pmuted }}>/100</span>
            </div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, background: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: 8 }}>Critical</span>
        </div>
        {dims.map(d => {
          const col = d.score >= 70 ? '#22c55e' : d.score >= 40 ? '#f59e0b' : '#ef4444'
          return (
            <div key={d.label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: Pbody }}>{d.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: col }}>{d.score}</span>
              </div>
              <div style={{ height: 6, background: '#f0edff', borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${d.score}%`, background: col, borderRadius: 99 }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FunnelIllustration() {
  const steps = [
    { label: 'Ad Impression',    pct: '100%',  warn: false, drop: null },
    { label: 'Click  (3.2%)',   pct: '3.2%',  warn: false, drop: '96.8% lost' },
    { label: 'Landing Page',     pct: '1.8%',  warn: false, drop: '44% exit' },
    { label: '14-field Form',    pct: '0.6%',  warn: true,  drop: '67% abandon' },
    { label: 'Lead Conversion',  pct: '0.2%',  warn: false, drop: '67% drop' },
  ]
  return (
    <div style={{ width: '100%', maxWidth: 400, background: BgPurple, borderRadius: 20, padding: 28 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: `1px solid rgba(48,33,97,0.07)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: Pmuted }}>Funnel Score</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>28</span>
              <span style={{ fontSize: 13, color: Pmuted }}>/100</span>
            </div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, background: '#fffbeb', color: '#d97706', padding: '4px 10px', borderRadius: 8 }}>High Friction</span>
        </div>
        {steps.map((s, i) => (
          <div key={s.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: s.warn ? '#fef2f2' : 'transparent', border: s.warn ? '1px solid #fecaca' : '1px solid transparent', borderRadius: 10, padding: '8px 10px' }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, background: s.warn ? '#dc2626' : P, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>{i + 1}</div>
              <span style={{ fontSize: 12, color: s.warn ? '#dc2626' : Pbody, flex: 1, fontWeight: s.warn ? 700 : 400 }}>{s.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: s.warn ? '#dc2626' : P }}>{s.pct}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ marginLeft: 22, paddingLeft: 12, height: 10, borderLeft: `1px dashed ${Pborder}` }} />
            )}
          </div>
        ))}
        <div style={{ marginTop: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '8px 12px' }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#dc2626' }}>14 form fields detected — average is 4</p>
        </div>
      </div>
    </div>
  )
}

function ChannelIllustration() {
  // Donut: circumference of r=56 ≈ 352
  const C = 2 * Math.PI * 56
  const channels = [
    { label: 'Meta / Facebook', pct: 65, color: '#ef4444', spend: 'KES 32,500', dash: C * 0.65, offset: 0 },
    { label: 'Google Search',   pct: 25, color: P,         spend: 'KES 12,500', dash: C * 0.25, offset: -(C * 0.65) },
    { label: 'LinkedIn',        pct: 10, color: '#6c4ddd', spend: 'KES 5,000',  dash: C * 0.10, offset: -(C * 0.90) },
  ]
  return (
    <div style={{ width: '100%', maxWidth: 400, background: BgPurple, borderRadius: 20, padding: 28 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: `1px solid rgba(48,33,97,0.07)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: Pmuted }}>Channel Spend</p>
            <p style={{ margin: 0, fontSize: 13, color: Pbody }}>Budget: KES 50,000/mo</p>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, background: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: 8 }}>Misaligned</span>
        </div>

        {/* donut chart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="56" fill="none" stroke="#f0edff" strokeWidth="16" />
              {channels.map(ch => (
                <circle key={ch.label} cx="60" cy="60" r="56" fill="none"
                  stroke={ch.color} strokeWidth="16"
                  strokeDasharray={`${ch.dash} ${C - ch.dash}`}
                  strokeDashoffset={ch.offset}
                  transform="rotate(-90 60 60)"
                  strokeLinecap="butt"
                />
              ))}
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#dc2626', lineHeight: 1.2, textAlign: 'center' }}>42%<br /><span style={{ fontSize: 9, fontWeight: 400, color: Pmuted }}>waste</span></p>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {channels.map(ch => (
              <div key={ch.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: ch.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: Pbody, flex: 1 }}>{ch.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: P }}>{ch.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* spend bars */}
        {channels.map(ch => (
          <div key={`bar-${ch.label}`} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: Pbody }}>{ch.spend}</span>
            </div>
            <div style={{ height: 6, background: '#f0edff', borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${ch.pct}%`, background: ch.color, borderRadius: 99 }} />
            </div>
          </div>
        ))}
        <div style={{ marginTop: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '7px 11px' }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#dc2626' }}>Waste: KES 21,000/mo — Meta over-indexed</p>
        </div>
      </div>
    </div>
  )
}

// ─── Shared components ────────────────────────────────────────────────────────

function Badge({ text }: { text: string }) {
  return (
    <div style={{ display: 'inline-block', background: '#ede9fe', color: P, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', padding: '5px 14px', borderRadius: 100, marginBottom: 16 }}>
      {text}
    </div>
  )
}

function H2({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,3.5vw,40px)', fontWeight: 700, letterSpacing: '-0.3px', color: P, margin: '0 0 20px', lineHeight: 1.2, ...style }}>
      {children}
    </h2>
  )
}

function Body({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{ fontSize: 16, lineHeight: 1.75, color: Pbody, margin: '0 0 28px', ...style }}>
      {children}
    </p>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [mobileOpen,        setMobileOpen]        = useState(false)
  const [openFaq,           setOpenFaq]           = useState<number | null>(null)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % 3), 5000)
    return () => clearInterval(t)
  }, [])

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

          <div className="hidden md:flex" style={{ gap: 2 }}>
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="nav-link"
                style={{ color: Pbody, textDecoration: 'none', fontSize: 14, fontWeight: 500, padding: '8px 16px', borderRadius: 100 }}>
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
      <section style={{ background: '#ffffff', paddingTop: 80, overflow: 'hidden' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', alignItems: 'stretch', gap: 48 }}>

          {/* copy — left column */}
          <div className="flex flex-col justify-center" style={{ flex: '0 0 44%', padding: '0 0 100px' }}>

            {/* dual badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
              <span style={{ background: 'linear-gradient(135deg,#e879f9,#a855f7)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 100, letterSpacing: '0.3px' }}>Free</span>
              <span style={{ background: '#ede9fe', color: P, fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 100, letterSpacing: '0.3px' }}>ICP Diagnostic Platform</span>
            </div>

            <h1 style={{ fontFamily: font, fontSize: 'clamp(36px,4.5vw,58px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-1px', color: P, margin: '0 0 24px' }}>
              You&rsquo;re not bad at marketing. You&rsquo;re targeting the wrong people.
            </h1>

            <p style={{ fontSize: 17, lineHeight: 1.7, color: Pbody, margin: '0 0 36px' }}>
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
              <div style={{ display: 'flex' }}>
                {[
                  { bg: 'linear-gradient(135deg,#6c4ddd,#302161)', t: 'KM' },
                  { bg: 'linear-gradient(135deg,#e879f9,#a855f7)', t: 'AO' },
                  { bg: 'linear-gradient(135deg,#f59e0b,#d97706)',  t: 'JN' },
                ].map((a, i) => (
                  <div key={i} style={{ width: 34, height: 34, borderRadius: '50%', background: a.bg, border: '2.5px solid #fff', marginLeft: i === 0 ? 0 : -10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.3px', boxShadow: '0 2px 8px rgba(0,0,0,0.14)', position: 'relative', zIndex: 3 - i }}>
                    {a.t}
                  </div>
                ))}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: P }}>50+ marketing teams</p>
                <p style={{ margin: 0, fontSize: 12, color: Pmuted }}>no ad account access needed.</p>
              </div>
            </div>
          </div>

          {/* illustration — right column: large gradient card anchored to bottom */}
          <div style={{ flex: 1, background: 'linear-gradient(135deg,#f472b6 0%,#c084fc 40%,#7c3aed 70%,#302161 100%)', borderRadius: '28px 28px 0 0', padding: '40px 32px 0', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 540 }}>

            {/* main score card */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '20px 24px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: Pmuted }}>ICP Health Score</p>
                  <p style={{ margin: 0, fontSize: 11, color: Pmuted }}>Q2 Diagnostic — May 2025</p>
                </div>
                <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>Critical</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <ScoreArc score={34} size={72} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#ef4444', lineHeight: 1 }}>34</span>
                    <span style={{ fontSize: 9, color: Pmuted }}>/100</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  {[{ label: 'ICP Alignment', v: 28 }, { label: 'Funnel Score', v: 42 }, { label: 'Channel Mix', v: 65 }].map(b => {
                    const col = b.v >= 70 ? '#22c55e' : b.v >= 40 ? '#f59e0b' : '#ef4444'
                    return (
                      <div key={b.label} style={{ marginBottom: 7 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 10, color: Pbody }}>{b.label}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: col }}>{b.v}</span>
                        </div>
                        <div style={{ height: 4, background: '#f0edff', borderRadius: 99 }}>
                          <div style={{ height: '100%', width: `${b.v}%`, background: col, borderRadius: 99 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* two side-by-side cards */}
            <div style={{ display: 'flex', gap: 14, flex: 1 }}>

              {/* findings card (white) */}
              <div style={{ flex: 1, background: '#fff', borderRadius: 18, padding: 18, boxShadow: '0 16px 48px rgba(0,0,0,0.15)' }}>
                <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: Pmuted }}>Top Findings</p>
                <div style={{ background: '#fef2f2', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#dc2626' }}>Wrong audience segment</p>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: '#ef4444', lineHeight: 1.4 }}>Targeting procurement — buyers are CFOs</p>
                </div>
                <div style={{ background: '#fffbeb', borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#d97706' }}>14 form fields</p>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: '#d97706', lineHeight: 1.4 }}>Industry avg is 4 — 67% abandon</p>
                </div>
              </div>

              {/* action card (dark purple) */}
              <div style={{ flex: 1, background: 'rgba(30,18,72,0.92)', borderRadius: 18, padding: 18, boxShadow: '0 16px 48px rgba(0,0,0,0.28)', backdropFilter: 'blur(10px)' }}>
                <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'rgba(255,255,255,0.5)' }}>Action Plan</p>
                {['Redefine ICP to CFO persona', 'Cut form to 4 fields now', 'Shift 40% budget to LinkedIn'].map((action, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 11 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Check size={9} color="#fff" strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>{action}</span>
                  </div>
                ))}
                <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 13px' }}>
                  <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Estimated waste recovered</p>
                  <p style={{ margin: '3px 0 0', fontSize: 17, fontWeight: 800, color: '#fff' }}>KES 38,000/mo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee ───────────────────────────────────────────────────────── */}
      <div style={{ background: BgAlt, borderTop: `1px solid ${Pborder}`, borderBottom: `1px solid ${Pborder}`, padding: '20px 0', overflow: 'hidden' }}>
        <div className="animate-marquee" style={{ display: 'flex', width: 'max-content' }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} style={{ fontSize: 13, fontWeight: 600, color: Pbody, padding: '0 40px', whiteSpace: 'nowrap' }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Feature 1 — card left, text right ────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '120px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
            <div className="w-full lg:w-auto flex justify-center flex-shrink-0">
              <ICPIllustration />
            </div>
            <div style={{ flex: 1 }}>
              <Badge text="The Real Problem" />
              <H2>Your ads are working. They&rsquo;re just talking to the wrong person.</H2>
              <Body>
                You&rsquo;ve tested creatives. You&rsquo;ve changed budgets. You&rsquo;ve hired agencies. But nothing
                sticks — because the problem was never the ad. It was the audience. We compare who
                you think your ideal customer is against who your actual best customers are. The gap
                between those two things is where your budget disappears every single month.
              </Body>
              <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: P, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
                Find My ICP Gap <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature 2 — text left, card right ────────────────────────────── */}
      <section style={{ padding: '120px 24px', background: BgAlt, borderTop: `1px solid ${Pborder}`, borderBottom: `1px solid ${Pborder}` }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16 lg:gap-20">
            <div className="w-full lg:w-auto flex justify-center flex-shrink-0">
              <FunnelIllustration />
            </div>
            <div style={{ flex: 1 }}>
              <Badge text="The Hidden Leak" />
              <H2>People are clicking your ads. They&rsquo;re just not becoming leads.</H2>
              <Body>
                A high click-through rate with zero conversions is not a targeting problem. It&rsquo;s
                a friction problem. Too many form fields. Too many steps before someone sees the
                value. A landing page that makes people work for something they haven&rsquo;t been
                convinced they need yet. We score every step of your funnel and show you exactly
                where people give up — and why.
              </Body>
              <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: P, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
                Score My Funnel <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature 3 — card left, text right ────────────────────────────── */}
      <section style={{ padding: '120px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
            <div className="w-full lg:w-auto flex justify-center flex-shrink-0">
              <ChannelIllustration />
            </div>
            <div style={{ flex: 1 }}>
              <Badge text="The Budget Drain" />
              <H2>You&rsquo;re not spending too little. You&rsquo;re spending in the wrong places.</H2>
              <Body>
                Doubling your budget won&rsquo;t fix a channel mismatch. If your ideal customer makes
                buying decisions on LinkedIn but you&rsquo;re running all your spend on Meta, you&rsquo;re
                paying for attention from people who will never buy. We map your spend against your
                ICP behavior — by region, by platform, by audience — and show you exactly where to
                shift the money.
              </Body>
              <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: P, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
                Audit My Spend <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature grid ──────────────────────────────────────────────────── */}
      <section style={{ background: BgAlt, borderTop: `1px solid ${Pborder}`, padding: '120px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <H2 style={{ fontSize: 'clamp(28px,4vw,40px)', margin: '0 0 16px' }}>
              Everything your marketing team needs.
            </H2>
            <p style={{ fontSize: 17, color: Pbody, maxWidth: 480, margin: '0 auto', lineHeight: 1.65 }}>
              Replace guesswork and scattered tools with a single diagnostic platform where you get clear answers.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {FEATURE_GRID.map(({ Icon, title, desc }) => (
              <div key={title} style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 20, padding: '28px 24px' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={22} color={P} strokeWidth={1.75} />
                </div>
                <h3 style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: P, margin: '0 0 8px', letterSpacing: '-0.2px' }}>{title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: Pbody, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${Pborder}`, borderBottom: `1px solid ${Pborder}`, padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: Pmuted, marginBottom: 56 }}>
            Why it matters now.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 40, textAlign: 'center' }}>
            {STATS.map(s => (
              <div key={s.label}>
                <p style={{ fontFamily: font, fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, color: P, letterSpacing: '-1.5px', margin: '0 0 10px', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 14, color: Pbody, margin: 0, lineHeight: 1.5 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Lead magnet ───────────────────────────────────────────────────── */}
      <section style={{ background: '#ede9fe', borderTop: `1px solid ${Pborder}`, padding: '80px 24px' }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <div className="flex flex-col md:flex-row items-center gap-10" style={{ background: '#fff', borderRadius: 24, padding: '48px 40px', boxShadow: '0 8px 40px rgba(48,33,97,0.1)' }}>
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
      <section id="pricing" style={{ background: BgAlt, borderTop: `1px solid ${Pborder}`, padding: '120px 24px' }}>
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
      <section id="faq" style={{ background: '#fff', borderTop: `1px solid ${Pborder}`, padding: '120px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <Badge text="FAQ" />
            <H2 style={{ fontSize: 'clamp(28px,4vw,40px)' }}>You ask, we answer.</H2>
            <p style={{ fontSize: 16, color: Pbody, margin: 0 }}>Everything you need to know before getting started.</p>
          </div>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} style={{ borderTop: `1px solid ${Pborder}` }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '22px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontFamily: font, fontSize: 16, fontWeight: 600, color: P, letterSpacing: '-0.2px', lineHeight: 1.4 }}>{item.q}</span>
                <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: openFaq === i ? P : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: openFaq === i ? '#fff' : P, fontSize: 18, fontWeight: 300, transition: 'background 0.2s', lineHeight: 1 }}>
                  {openFaq === i ? '−' : '+'}
                </span>
              </button>
              <div style={{ maxHeight: openFaq === i ? 400 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: Pbody, margin: '0 0 22px', paddingRight: 44 }}>{item.a}</p>
              </div>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${Pborder}` }} />
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section id="results" style={{ background: BgAlt, borderTop: `1px solid ${Pborder}`, padding: '120px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <Badge text="Real Results" />
            <H2 style={{ fontSize: 'clamp(28px,4vw,40px)', margin: '0 0 0' }}>
              Finally. An answer that isn&rsquo;t &ldquo;increase your budget.&rdquo;
            </H2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 16 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 20, padding: 32, boxShadow: activeTestimonial === i ? '0 16px 48px rgba(48,33,97,0.12)' : 'none', transform: activeTestimonial === i ? 'translateY(-4px)' : 'translateY(0)', transition: 'all 0.4s ease' }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 18 }}>
                  {[...Array(5)].map((_, s) => <Star key={s} size={14} fill={P} color={P} />)}
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.75, color: Pbody, margin: '0 0 20px', fontStyle: 'italic' }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p style={{ fontSize: 13, fontWeight: 600, color: Pmuted, margin: 0 }}>— {t.author}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 36 }}>
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)} aria-label={`Testimonial ${i + 1}`}
                style={{ width: activeTestimonial === i ? 28 : 8, height: 8, borderRadius: 99, background: activeTestimonial === i ? P : Pborder, border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0 }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ──────────────────────────────────────────────────────────── */}
      <section style={{ background: '#fff', borderTop: `1px solid ${Pborder}`, padding: '120px 24px' }}>
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
            </div>
            <div style={{ flexShrink: 0 }}>
              <div style={{ background: BgPurple, borderRadius: 20, padding: '36px 40px', textAlign: 'center', border: `1px solid ${Pborder}`, minWidth: 260 }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg,${P},#6c4ddd)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <span style={{ color: '#fff', fontSize: 26, fontWeight: 700, fontFamily: font }}>EK</span>
                </div>
                <p style={{ fontFamily: font, fontSize: 17, fontWeight: 700, color: P, margin: '0 0 4px' }}>Eugene Kwata</p>
                <p style={{ fontSize: 14, color: Pbody, margin: '0 0 12px' }}>Founder &amp; Lead Media Buyer</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#ede9fe', padding: '5px 12px', borderRadius: 100 }}>
                  <MapPin size={12} color={P} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: P }}>Nairobi, Kenya</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(160deg,#f0edff 0%,#e8e2ff 50%,#ede8ff 100%)', borderTop: `1px solid ${Pborder}`, padding: '120px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontFamily: font, fontSize: 'clamp(30px,5vw,52px)', fontWeight: 700, letterSpacing: '-0.4px', color: P, margin: '0 0 20px', lineHeight: 1.15 }}>
            Every month without a diagnosis is a month of budget you won&rsquo;t get back.
          </h2>
          <p style={{ fontSize: 18, color: Pbody, maxWidth: 520, margin: '0 auto 44px', lineHeight: 1.65 }}>
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
