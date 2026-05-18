'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export const dynamic = 'force-static'

// ─── Design tokens ────────────────────────────────────────────────────────────
const P       = '#302161'
const Pbody   = 'rgba(48,33,97,0.88)'
const Pmuted  = 'rgba(48,33,97,0.5)'
const Pborder = 'rgba(48,33,97,0.1)'
const BgAlt   = '#f5f3ff'

const font = "'DM Sans', -apple-system, sans-serif"

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
  { icon: '🎯', title: 'ICP Alignment',      desc: 'Know exactly who your best customer really is' },
  { icon: '🔍', title: 'Funnel Audit',        desc: 'Score every step from ad click to conversion' },
  { icon: '💸', title: 'Budget Analysis',     desc: 'Find where your money is being wasted' },
  { icon: '📡', title: 'Channel Efficiency',  desc: 'Identify which platforms your ICP actually uses' },
  { icon: '📊', title: 'CSV Analysis',        desc: 'Upload your campaign data for instant media buyer insights' },
  { icon: '📈', title: 'Monthly Monitoring',  desc: 'Track your ICP health score improvement over time' },
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
    cta: 'Start Free Diagnosis', highlight: false,
  },
  {
    name: 'Pro', price: 'KES 13,000', period: '/ month',
    desc: 'For growing teams that need speed, depth, and campaign-level analysis.',
    features: ['Everything in Starter', 'Weekly performance snapshots', 'CSV campaign analysis', 'Benchmark comparisons', 'Revenue-ranked findings', 'Complete report history'],
    cta: 'Start Pro', highlight: true,
  },
  {
    name: 'Agency', price: 'KES 26,000', period: '/ month',
    desc: 'For agencies managing multiple clients who need reporting at scale.',
    features: ['Everything in Pro', 'Quarterly deep dive audits', 'Multi-client management', 'White label reports', 'Priority support'],
    cta: 'Talk To Us', highlight: false,
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

// ─── Mock UI illustrations ────────────────────────────────────────────────────

function ScoreCircle({ score, size = 96 }: { score: number; size?: number }) {
  const r    = 38
  const circ = 2 * Math.PI * r
  const off  = circ * (1 - score / 100)
  const col  = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#ede9fe" strokeWidth={8} />
      <circle cx="50" cy="50" r={r} fill="none" stroke={col} strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={off}
        strokeLinecap="round" transform="rotate(-90 50 50)" />
    </svg>
  )
}

function DiagnosticCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${Pborder}`, boxShadow: '0 24px 80px rgba(48,33,97,0.13)', padding: 24, width: '100%', maxWidth: 380 }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${P},#6c4ddd)`, flexShrink: 0 }} />
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: P }}>ICP Diagnostic</p>
          <p style={{ margin: 0, fontSize: 11, color: Pmuted }}>Full Report · April 2025</p>
        </div>
        <span style={{ marginLeft: 'auto', background: '#fef2f2', color: '#dc2626', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
          Needs Work
        </span>
      </div>
      {/* score row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ScoreCircle score={34} size={90} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#ef4444', lineHeight: 1 }}>34</p>
            <p style={{ margin: 0, fontSize: 10, color: Pmuted }}>/100</p>
          </div>
        </div>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: P }}>ICP Health Score</p>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: Pmuted }}>3 critical findings</p>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '5px 10px' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#dc2626', fontWeight: 600 }}>⚠ Immediate action needed</p>
          </div>
        </div>
      </div>
      {/* findings */}
      {[
        { label: 'Wrong audience targeting',  sev: 'Critical',    col: '#ef4444', bg: '#fef2f2' },
        { label: 'High funnel drop-off rate', sev: 'Warning',     col: '#f59e0b', bg: '#fffbeb' },
        { label: 'Channel mix opportunity',   sev: 'Opportunity', col: '#6366f1', bg: '#eef2ff' },
      ].map(f => (
        <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: `1px solid ${Pborder}` }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: f.col, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: Pbody, flex: 1 }}>{f.label}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: f.col, background: f.bg, padding: '2px 8px', borderRadius: 6 }}>{f.sev}</span>
        </div>
      ))}
    </div>
  )
}

function ICPCard() {
  const dims = [
    { label: 'ICP Alignment',      score: 42 },
    { label: 'Targeting Accuracy', score: 28 },
    { label: 'Channel Efficiency', score: 65 },
    { label: 'Funnel Friction',    score: 35 },
    { label: 'Message Fit',        score: 55 },
    { label: 'Budget Allocation',  score: 20 },
  ]
  return (
    <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${Pborder}`, boxShadow: '0 20px 60px rgba(48,33,97,0.1)', padding: 24, width: '100%', maxWidth: 380 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: Pmuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Score Breakdown</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: '#ef4444', lineHeight: 1 }}>34</span>
            <span style={{ fontSize: 14, color: Pmuted }}>/100</span>
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
            <div style={{ height: 6, background: BgAlt, borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${d.score}%`, background: col, borderRadius: 99 }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FunnelCard() {
  const steps = [
    { label: 'Ad Impression',      pct: '100%',  warn: false },
    { label: 'Click  (3.2% CTR)', pct: '3.2%',  warn: false },
    { label: 'Landing Page',       pct: '1.8%',  warn: false },
    { label: '14-field Form',      pct: '0.6%',  warn: true  },
    { label: 'Lead Conversion',    pct: '0.2%',  warn: false },
  ]
  return (
    <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${Pborder}`, boxShadow: '0 20px 60px rgba(48,33,97,0.1)', padding: 24, width: '100%', maxWidth: 380 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: Pmuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Funnel Score</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>28</span>
            <span style={{ fontSize: 14, color: Pmuted }}>/100</span>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, background: '#fffbeb', color: '#d97706', padding: '4px 10px', borderRadius: 8 }}>High Friction</span>
      </div>
      {steps.map((s, i) => (
        <div key={s.label}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: s.warn ? '#fef2f2' : 'transparent', border: s.warn ? '1px solid #fecaca' : '1px solid transparent', borderRadius: 10, padding: '8px 10px' }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: s.warn ? '#dc2626' : P, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
              {i + 1}
            </div>
            <span style={{ fontSize: 12, color: s.warn ? '#dc2626' : Pbody, flex: 1, fontWeight: s.warn ? 600 : 400 }}>{s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: s.warn ? '#dc2626' : P }}>{s.pct}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', height: 10 }}>
              <div style={{ width: 1, height: '100%', background: Pborder }} />
            </div>
          )}
        </div>
      ))}
      <div style={{ marginTop: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '8px 12px' }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#dc2626' }}>⚠ 14 form fields detected — industry average is 4</p>
      </div>
    </div>
  )
}

function ChannelCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${Pborder}`, boxShadow: '0 20px 60px rgba(48,33,97,0.1)', padding: 24, width: '100%', maxWidth: 380 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: Pmuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Channel Spend</p>
          <p style={{ margin: 0, fontSize: 13, color: Pbody }}>Budget: KES 50,000/mo</p>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, background: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: 8 }}>Misaligned</span>
      </div>
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#dc2626' }}>⚠ Estimated waste: KES 21,000/mo</p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#ef4444' }}>Meta over-indexed vs your ICP behaviour</p>
      </div>
      {[
        { label: 'Meta / Facebook', pct: 65, spend: 'KES 32,500', waste: true  },
        { label: 'Google Search',   pct: 25, spend: 'KES 12,500', waste: false },
        { label: 'LinkedIn',        pct: 10, spend: 'KES 5,000',  waste: false },
      ].map(ch => (
        <div key={ch.label} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: Pbody }}>{ch.label}</span>
              {ch.waste && <span style={{ fontSize: 9, fontWeight: 700, background: '#fef2f2', color: '#dc2626', padding: '1px 5px', borderRadius: 4 }}>Waste</span>}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: P }}>{ch.spend}</span>
          </div>
          <div style={{ height: 8, background: BgAlt, borderRadius: 99 }}>
            <div style={{ height: '100%', width: `${ch.pct}%`, background: ch.waste ? '#ef4444' : P, borderRadius: 99 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionBadge({ text }: { text: string }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: P, opacity: 0.55, margin: '0 0 14px' }}>
      {text}
    </p>
  )
}

function FeatureHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: font, fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 700, letterSpacing: '-0.3px', color: P, margin: '0 0 20px', lineHeight: 1.2 }}>
      {children}
    </h2>
  )
}

function FeatureBody({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 16, lineHeight: 1.75, color: Pbody, margin: '0 0 28px', maxWidth: 500 }}>
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
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${Pborder}`,
          borderRadius: 32, padding: '10px 16px 10px 20px',
          boxShadow: '0 2px 24px rgba(48,33,97,0.07)',
        }}>
          {/* logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg,${P},#6c4ddd)`, flexShrink: 0 }} />
            <span style={{ fontFamily: font, fontWeight: 700, fontSize: 15, color: P, letterSpacing: '-0.3px' }}>ICP Diagnostic</span>
          </Link>

          {/* desktop links */}
          <div className="hidden md:flex" style={{ gap: 2 }}>
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="nav-link"
                style={{ color: Pbody, textDecoration: 'none', fontSize: 14, fontWeight: 500, padding: '8px 14px', borderRadius: 24 }}>
                {l.label}
              </a>
            ))}
          </div>

          {/* right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/dashboard" className="hidden md:inline-block"
              style={{ color: Pbody, textDecoration: 'none', fontSize: 14, fontWeight: 500, padding: '8px 14px', borderRadius: 24 }}>
              Login
            </Link>
            <Link href="/questionnaire" style={{ background: P, color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600, padding: '9px 18px', borderRadius: 12, whiteSpace: 'nowrap' }}>
              Get Free Diagnosis
            </Link>
            {/* hamburger */}
            <button onClick={() => setMobileOpen(o => !o)} className="md:hidden"
              aria-label="Toggle menu"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {mobileOpen
                ? <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke={P} strokeWidth={2} strokeLinecap="round" /></svg>
                : <><div style={{ width: 20, height: 2, background: P, borderRadius: 2 }} /><div style={{ width: 20, height: 2, background: P, borderRadius: 2 }} /><div style={{ width: 20, height: 2, background: P, borderRadius: 2 }} /></>
              }
            </button>
          </div>
        </nav>
      </div>

      {/* mobile menu */}
      {mobileOpen && (
        <div className="md:hidden" style={{ position: 'fixed', top: 72, left: 0, right: 0, zIndex: 40, background: '#fff', borderBottom: `1px solid ${Pborder}`, padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 0, boxShadow: '0 8px 32px rgba(48,33,97,0.08)' }}>
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
      <section style={{ background: 'linear-gradient(160deg,#f5f3ff 0%,#ffffff 65%)', padding: '56px 24px 88px' }}>
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16" style={{ maxWidth: 1120, margin: '0 auto' }}>

          {/* left: copy */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', background: '#ede9fe', border: '1px solid rgba(109,40,217,0.2)', borderRadius: 32, padding: '5px 14px', marginBottom: 24 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#5b21b6' }}>ICP Diagnostic Platform</span>
            </div>

            <h1 style={{ fontFamily: font, fontSize: 'clamp(36px,5.5vw,64px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.4px', color: P, margin: '0 0 24px' }}>
              You&rsquo;re not bad at marketing.{' '}
              <span style={{ background: 'linear-gradient(135deg,#6c4ddd 0%,#302161 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                You&rsquo;re targeting the wrong people.
              </span>
            </h1>

            <p style={{ fontSize: 17, lineHeight: 1.75, color: Pbody, maxWidth: 520, margin: '0 0 36px' }}>
              Every month you run ads to the wrong audience is another month your CEO asks why
              the pipeline is empty. We diagnose exactly who you should be targeting, where your
              funnel is breaking, and what to fix first — in 5 minutes, for free.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <Link href="/questionnaire" style={{ display: 'inline-block', background: P, color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 15, padding: '14px 28px', borderRadius: 12, boxShadow: '0 8px 28px rgba(48,33,97,0.25)', letterSpacing: '-0.2px' }}>
                Diagnose My Marketing Now →
              </Link>
              <Link href="/report/demo" style={{ display: 'inline-block', background: 'transparent', color: P, textDecoration: 'none', fontWeight: 600, fontSize: 15, padding: '14px 28px', borderRadius: 12, border: `1.5px solid ${Pborder}` }}>
                See A Sample Report
              </Link>
            </div>

            <p style={{ fontSize: 13, color: Pmuted }}>
              Free diagnosis &middot; No ad account access needed &middot; Used by marketing teams in Kenya, Nigeria, UK &amp; US
            </p>
          </div>

          {/* right: mock card */}
          <div className="w-full lg:w-auto flex justify-center">
            <DiagnosticCard />
          </div>
        </div>
      </section>

      {/* ── Marquee ───────────────────────────────────────────────────────── */}
      <div style={{ background: BgAlt, borderTop: `1px solid ${Pborder}`, borderBottom: `1px solid ${Pborder}`, padding: '18px 0', overflow: 'hidden' }}>
        <div className="animate-marquee" style={{ display: 'flex', width: 'max-content' }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} style={{ fontSize: 13, fontWeight: 600, color: Pbody, padding: '0 40px', whiteSpace: 'nowrap' }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Feature block 1 — image left, text right ──────────────────────── */}
      <section id="how-it-works" style={{ padding: '100px 24px', maxWidth: 1120, margin: '0 auto' }}>
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full lg:w-auto flex justify-center flex-shrink-0">
            <ICPCard />
          </div>
          <div style={{ flex: 1 }}>
            <SectionBadge text="The Real Problem" />
            <FeatureHeading>Your ads are working. They&rsquo;re just talking to the wrong person.</FeatureHeading>
            <FeatureBody>
              You&rsquo;ve tested creatives. You&rsquo;ve changed budgets. You&rsquo;ve hired agencies. But nothing
              sticks — because the problem was never the ad. It was the audience. We compare who
              you think your ideal customer is against who your actual best customers are. The gap
              between those two things is where your budget disappears every single month.
            </FeatureBody>
            <Link href="/questionnaire" style={{ color: P, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
              Find My ICP Gap →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature block 2 — text left, image right ──────────────────────── */}
      <section style={{ background: BgAlt, borderTop: `1px solid ${Pborder}`, borderBottom: `1px solid ${Pborder}`, padding: '100px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            <div className="w-full lg:w-auto flex justify-center flex-shrink-0">
              <FunnelCard />
            </div>
            <div style={{ flex: 1 }}>
              <SectionBadge text="The Hidden Leak" />
              <FeatureHeading>People are clicking your ads. They&rsquo;re just not becoming leads.</FeatureHeading>
              <FeatureBody>
                A high click-through rate with zero conversions is not a targeting problem. It&rsquo;s
                a friction problem. Too many form fields. Too many steps before someone sees the
                value. A landing page that makes people work for something they haven&rsquo;t been
                convinced they need yet. We score every step of your funnel and show you exactly
                where people give up — and why.
              </FeatureBody>
              <Link href="/questionnaire" style={{ color: P, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
                Score My Funnel →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature block 3 — image left, text right ──────────────────────── */}
      <section style={{ padding: '100px 24px', maxWidth: 1120, margin: '0 auto' }}>
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full lg:w-auto flex justify-center flex-shrink-0">
            <ChannelCard />
          </div>
          <div style={{ flex: 1 }}>
            <SectionBadge text="The Budget Drain" />
            <FeatureHeading>You&rsquo;re not spending too little. You&rsquo;re spending in the wrong places.</FeatureHeading>
            <FeatureBody>
              Doubling your budget won&rsquo;t fix a channel mismatch. If your ideal customer makes
              buying decisions on LinkedIn but you&rsquo;re running all your spend on Meta, you&rsquo;re
              paying for attention from people who will never buy. We map your spend against your
              ICP behavior — by region, by platform, by audience — and show you exactly where to
              shift the money.
            </FeatureBody>
            <Link href="/questionnaire" style={{ color: P, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
              Audit My Spend →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature grid ──────────────────────────────────────────────────── */}
      <section style={{ background: BgAlt, borderTop: `1px solid ${Pborder}`, padding: '100px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, letterSpacing: '-0.3px', color: P, margin: '0 0 16px' }}>
              Everything your marketing team needs.
            </h2>
            <p style={{ fontSize: 17, color: Pbody, maxWidth: 480, margin: '0 auto', lineHeight: 1.65 }}>
              Replace guesswork and scattered tools with a single diagnostic platform where you get clear answers.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {FEATURE_GRID.map(f => (
              <div key={f.title} style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 20, padding: '24px 24px 20px' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: P, margin: '0 0 8px', letterSpacing: '-0.2px' }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: Pbody, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${Pborder}`, borderBottom: `1px solid ${Pborder}`, padding: '64px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: Pmuted, marginBottom: 48 }}>
            Why it matters now.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 32, textAlign: 'center' }}>
            {STATS.map(s => (
              <div key={s.label}>
                <p style={{ fontFamily: font, fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, color: P, letterSpacing: '-1px', margin: '0 0 8px', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 14, color: Pbody, margin: 0, lineHeight: 1.4 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: BgAlt, borderTop: `1px solid ${Pborder}`, padding: '100px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, letterSpacing: '-0.3px', color: P, margin: '0 0 16px' }}>
              Stop guessing. Start knowing.
            </h2>
            <p style={{ fontSize: 17, color: Pbody, maxWidth: 460, margin: '0 auto', lineHeight: 1.65 }}>
              One subscription. Complete visibility into why your marketing isn&rsquo;t working.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 16, alignItems: 'start' }}>
            {TIERS.map(tier => (
              <div key={tier.name} style={{ background: tier.highlight ? P : '#fff', border: `1px solid ${tier.highlight ? 'transparent' : Pborder}`, borderRadius: 20, padding: '32px 28px', boxShadow: tier.highlight ? '0 16px 48px rgba(48,33,97,0.25)' : 'none', position: 'relative' }}>
                {tier.highlight && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#a78bfa,#6c4ddd)', color: '#fff', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', padding: '4px 14px', borderRadius: 32, whiteSpace: 'nowrap' }}>
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
                      <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: '50%', background: tier.highlight ? 'rgba(255,255,255,0.2)' : BgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: tier.highlight ? '#fff' : P, fontWeight: 700, marginTop: 1 }}>✓</span>
                      <span style={{ color: tier.highlight ? 'rgba(255,255,255,0.85)' : Pbody }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/questionnaire" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: tier.highlight ? '#fff' : P, color: tier.highlight ? P : '#fff', fontWeight: 700, fontSize: 14, padding: '13px 20px', borderRadius: 12, letterSpacing: '-0.2px' }}>
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

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ maxWidth: 700, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,4vw,40px)', fontWeight: 700, letterSpacing: '-0.3px', color: P, margin: '0 0 12px' }}>
            You ask, we answer.
          </h2>
          <p style={{ fontSize: 16, color: Pbody }}>Everything you need to know before getting started.</p>
        </div>
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} style={{ borderTop: `1px solid ${Pborder}` }}>
            <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontFamily: font, fontSize: 16, fontWeight: 600, color: P, letterSpacing: '-0.2px', lineHeight: 1.4 }}>{item.q}</span>
              <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: openFaq === i ? P : BgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: openFaq === i ? '#fff' : P, fontSize: 18, fontWeight: 300, transition: 'background 0.2s' }}>
                {openFaq === i ? '−' : '+'}
              </span>
            </button>
            <div style={{ maxHeight: openFaq === i ? 400 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: Pbody, margin: '0 0 20px', paddingRight: 44 }}>{item.a}</p>
            </div>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${Pborder}` }} />
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section id="results" style={{ background: BgAlt, borderTop: `1px solid ${Pborder}`, padding: '100px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, letterSpacing: '-0.3px', color: P, margin: '0 0 12px', lineHeight: 1.2 }}>
              Finally. An answer that isn&rsquo;t<br />&ldquo;increase your budget.&rdquo;
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 16 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 20, padding: 28, boxShadow: activeTestimonial === i ? '0 16px 48px rgba(48,33,97,0.12)' : 'none', transform: activeTestimonial === i ? 'translateY(-4px)' : 'translateY(0)', transition: 'all 0.4s ease' }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {[...Array(5)].map((_, s) => <span key={s} style={{ color: '#f59e0b', fontSize: 14 }}>★</span>)}
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.75, color: Pbody, margin: '0 0 20px', fontStyle: 'italic' }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p style={{ fontSize: 13, fontWeight: 600, color: Pmuted, margin: 0 }}>— {t.author}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)} aria-label={`Testimonial ${i + 1}`}
                style={{ width: activeTestimonial === i ? 24 : 8, height: 8, borderRadius: 99, background: activeTestimonial === i ? P : Pborder, border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0 }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(160deg,#f0edff 0%,#e8e2ff 50%,#ede8ff 100%)', borderTop: `1px solid ${Pborder}`, padding: '96px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontFamily: font, fontSize: 'clamp(30px,5vw,52px)', fontWeight: 700, letterSpacing: '-0.4px', color: P, margin: '0 0 20px', lineHeight: 1.15 }}>
            Every month without a diagnosis is a month of budget you won&rsquo;t get back.
          </h2>
          <p style={{ fontSize: 18, color: Pbody, maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.65 }}>
            You don&rsquo;t have a spending problem. You have a targeting problem. And it has a name, a score, and a fix.
          </p>
          <Link href="/questionnaire" style={{ display: 'inline-block', background: P, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 17, padding: '17px 40px', borderRadius: 12, letterSpacing: '-0.3px', boxShadow: '0 12px 40px rgba(48,33,97,0.25)' }}>
            Get My Free Diagnosis →
          </Link>
          <p style={{ fontSize: 13, color: Pmuted, marginTop: 14 }}>
            Free &middot; No credit card &middot; No ad account access needed
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#fff', borderTop: `1px solid ${Pborder}`, padding: '64px 24px 40px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* brand + newsletter */}
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
                { label: 'How It Works',      href: '#how-it-works' },
                { label: 'Pricing',           href: '#pricing' },
                { label: 'FAQ',               href: '#faq' },
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
