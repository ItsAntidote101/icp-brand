'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, Check, Menu, X, ChevronDown, ChevronUp,
  Shield, Globe, Users, Lock, Zap, BarChart2, Target, FileText,
  Crosshair, Layout, TrendingDown, Eye, Plus,
} from 'lucide-react'
import SocialProofToast from '@/components/SocialProofToast'
export const dynamic = 'force-static'

// ── Zapier-style palette ──────────────────────────────────────────────────────
const Warm       = '#faf6ef'
const Dark       = '#18110a'
const Orange     = '#e8330a'
const Text       = '#18110a'
const Muted      = 'rgba(24,17,10,0.5)'
const Border     = 'rgba(24,17,10,0.12)'
const DarkMuted  = 'rgba(255,255,255,0.5)'
const DarkBorder = 'rgba(255,255,255,0.12)'

const font  = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontB = "'PolySans Neutral', -apple-system, system-ui, sans-serif"
const fontSerif = font

// ── Data ─────────────────────────────────────────────────────────────────────
const TIERS = [
  {
    name: 'Starter',
    monthly: 'KES 6,500',
    annual: 'KES 65,000',
    desc: 'For solo founders and small teams running their first serious paid campaigns.',
    bullets: ['Monthly ICP health monitoring', 'Critical findings with fixes', 'Quick wins action plan'],
    cta: 'Start Free Diagnosis',
    href: '/questionnaire',
    highlight: false,
  },
  {
    name: 'Pro',
    monthly: 'KES 13,000',
    annual: 'KES 130,000',
    desc: 'For growing teams that need speed, depth, and campaign-level analysis.',
    bullets: ['Everything in Starter', 'Deep research with live web analysis', 'Weekly competitive intelligence briefing'],
    cta: 'Get Started with Pro',
    href: '/questionnaire',
    highlight: true,
  },
  {
    name: 'Agency',
    monthly: 'KES 26,000',
    annual: 'KES 260,000',
    desc: 'For agencies managing multiple clients who need reporting at scale.',
    bullets: ['Everything in Pro', 'Monthly strategy session with media buyer', 'Multi-client reporting and white label'],
    cta: 'Contact Our Team',
    href: '/questionnaire',
    highlight: false,
  },
]

const FAQS = [
  {
    q: 'What is the difference between free and paid?',
    a: 'The free report diagnoses your ICP based on your questionnaire answers and gives you your health score, top 3 findings, and quick wins. The paid report goes further: our AI visits your actual landing page, researches your competitors, and benchmarks your metrics with live regional data.',
  },
  {
    q: 'Do you need my ad account access?',
    a: 'No. Never. You answer questions and optionally upload a CSV export of your campaign data. That is it. No Google OAuth. No Meta permissions. No compliance headaches.',
  },
  {
    q: 'How is this different from a marketing consultant?',
    a: 'A consultant charges KES 50,000 or more for a strategy session. We give you a living diagnostic that updates every month and tells you what to fix next, automatically.',
  },
  {
    q: 'What markets do you cover?',
    a: 'Kenya, Nigeria, South Africa, UK, US, Europe, and Southeast Asia. Your recommendations always reflect local ad costs and regional audience behaviour.',
  },
  {
    q: 'How accurate is the waste estimate?',
    a: 'It is derived from your ICP score, budget size, industry benchmarks, and the specific misalignments found in your diagnostic. It represents the estimated portion of your monthly ad spend reaching audiences with a low probability of converting.',
  },
]

const USE_CASES = [
  'Fix bad targeting', 'Stop wasted budget', 'Find your real ICP', 'Score your campaigns',
  'Benchmark vs competitors', 'Get weekly intelligence', 'Fix landing page friction',
  'Diagnose in 5 minutes', 'Qualify better leads', 'Cut CPL in half', 'Lower your CAC',
  'Improve LTV:CAC ratio', 'Identify top ICP segments', 'Reduce churn from bad-fit customers',
]

// ── Button helpers ────────────────────────────────────────────────────────────
const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: Orange, color: '#fff', border: 'none',
  borderRadius: 6, padding: '13px 22px',
  fontFamily: font, fontSize: 15, fontWeight: 700,
  cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap',
}
const btnDark: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: Dark, color: '#fff', border: 'none',
  borderRadius: 6, padding: '13px 22px',
  fontFamily: font, fontSize: 15, fontWeight: 700,
  cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap',
}
const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: 'transparent', color: Text,
  border: `1.5px solid ${Border}`,
  borderRadius: 6, padding: '12px 22px',
  fontFamily: font, fontSize: 15, fontWeight: 600,
  cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap',
}
const btnGhostDark: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: 'transparent', color: '#fff',
  border: '1.5px solid rgba(255,255,255,0.25)',
  borderRadius: 6, padding: '12px 22px',
  fontFamily: font, fontSize: 15, fontWeight: 600,
  cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap',
}

export default function Page() {
  const [mobileOpen,      setMobileOpen]      = useState(false)
  const [billingAnnual,   setBillingAnnual]   = useState(false)
  const [openFaq,         setOpenFaq]         = useState<number | null>(null)
  const [calcBudget,      setCalcBudget]      = useState('')
  const [calcLeads,       setCalcLeads]       = useState('')
  const [calcCloseRate,   setCalcCloseRate]   = useState('')
  const [calcLTV,         setCalcLTV]         = useState('')
  const [calcChurn,       setCalcChurn]       = useState('')
  const [calcMetrics,     setCalcMetrics]     = useState<{
    cacCurrent: number; cacProjected: number
    ltvCacCurrent: number; ltvCacProjected: number
    monthlyCustomers: number; monthlyCustomersProjected: number
    monthlyRevenueOpportunity: number; paybackMonths: number
  } | null>(null)
  const [showStickyBar,   setShowStickyBar]   = useState(false)
  const [stickyDismissed, setStickyDismissed] = useState(false)
  const [liveCount,       setLiveCount]       = useState(480)

  const countRef    = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)
      setShowStickyBar(pct > 0.6)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setLiveCount(c => c + 1), 8000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (sessionStorage.getItem('sticky_dismissed')) setStickyDismissed(true)
  }, [])

  useEffect(() => {
    const el = countRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true
        const target = 47000; const duration = 2000; const start = performance.now()
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          el.textContent = 'KES ' + Math.floor(progress * target).toLocaleString()
          if (progress < 1) requestAnimationFrame(tick)
          else el.textContent = 'KES 47,000'
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleCalc = () => {
    const budget    = parseFloat(calcBudget.replace(/,/g, ''))
    const leads     = parseFloat(calcLeads.replace(/,/g, ''))
    const closeRate = parseFloat(calcCloseRate) / 100
    const ltv       = parseFloat(calcLTV.replace(/,/g, ''))
    const churn     = calcChurn ? parseFloat(calcChurn) / 100 : null
    if ([budget, leads, closeRate, ltv].some(v => isNaN(v) || v <= 0)) return

    const monthlyCustomers           = leads * closeRate
    const cacCurrent                 = budget / monthlyCustomers
    const improvementFactor          = 1.35 * 1.30
    const monthlyCustomersProjected  = monthlyCustomers * improvementFactor
    const cacProjected               = budget / monthlyCustomersProjected
    const ltvCacCurrent              = ltv / cacCurrent
    const ltvCacProjected            = ltv / cacProjected
    const additionalCustomers        = monthlyCustomersProjected - monthlyCustomers
    const monthlyRevenueOpportunity  = additionalCustomers * ltv
    const mrr                        = churn && churn > 0 ? ltv * churn : ltv / 24
    const paybackMonths              = cacProjected / mrr

    setCalcMetrics({
      cacCurrent:                 Math.round(cacCurrent),
      cacProjected:               Math.round(cacProjected),
      ltvCacCurrent:              Math.round(ltvCacCurrent * 10) / 10,
      ltvCacProjected:            Math.round(ltvCacProjected * 10) / 10,
      monthlyCustomers:           Math.round(monthlyCustomers * 10) / 10,
      monthlyCustomersProjected:  Math.round(monthlyCustomersProjected * 10) / 10,
      monthlyRevenueOpportunity:  Math.round(monthlyRevenueOpportunity),
      paybackMonths:              Math.round(paybackMonths * 10) / 10,
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 14px',
    borderRadius: 6, border: `1.5px solid ${DarkBorder}`,
    fontFamily: fontB, fontSize: 14, color: '#fff', outline: 'none',
    background: 'rgba(255,255,255,0.07)',
  }

  return (
    <>
      <style>{`
        .container { max-width: 1200px; margin: 0 auto; padding: 0 clamp(20px,5vw,56px); }
        * { box-sizing: border-box; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
        .ticker-track { display: flex; gap: 12px; animation: ticker 30s linear infinite; }
        @keyframes ticker { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        .nav-link:hover { color: ${Text} !important; }
        .btn-primary:hover { background: #c82c08 !important; }
        .btn-dark:hover { background: #2c1e0f !important; }
        .btn-ghost:hover { background: rgba(24,17,10,0.05) !important; }
        .btn-ghost-dark:hover { background: rgba(255,255,255,0.08) !important; }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: Warm, borderBottom: `1px solid ${Border}`, padding: '0 clamp(20px,5vw,56px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: Orange, flexShrink: 0 }} />
            <span style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: Text }}>ICP Diagnostic</span>
          </Link>
          <div className="hidden md:flex" style={{ gap: 28 }}>
            {[['How It Works', '#how-it-works'], ['Results', '#results'], ['Pricing', '#pricing'], ['FAQ', '#faq']].map(([label, href]) => (
              <a key={href} href={href} className="nav-link" style={{ fontFamily: fontB, fontSize: 14, color: Muted, textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}>{label}</a>
            ))}
          </div>
          <div className="hidden md:flex" style={{ gap: 10, alignItems: 'center' }}>
            <Link href="/auth?tab=login" style={{ fontFamily: fontB, fontSize: 14, color: Muted, textDecoration: 'none', fontWeight: 500, padding: '8px 14px' }}>Log in</Link>
            <Link href="/questionnaire" className="btn-primary" style={{ ...btnPrimary, fontSize: 14, padding: '9px 18px' }}>Get free diagnostic</Link>
          </div>
          <button className="md:hidden" onClick={() => setMobileOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            {mobileOpen ? <X size={22} color={Text} /> : <Menu size={22} color={Text} />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 49, background: Warm, display: 'flex', flexDirection: 'column', padding: '80px 32px 40px' }}>
          {[['How It Works', '#how-it-works'], ['Results', '#results'], ['Pricing', '#pricing'], ['FAQ', '#faq']].map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMobileOpen(false)}
              style={{ fontFamily: font, fontSize: 22, color: Text, textDecoration: 'none', fontWeight: 700, padding: '18px 0', borderBottom: `1px solid ${Border}` }}>{label}</a>
          ))}
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href="/questionnaire" onClick={() => setMobileOpen(false)} style={{ ...btnPrimary, justifyContent: 'center', fontSize: 17 }}>Get free diagnostic</Link>
            <Link href="/auth?tab=login" onClick={() => setMobileOpen(false)} style={{ fontFamily: fontB, fontSize: 15, fontWeight: 500, color: Muted, textDecoration: 'none', textAlign: 'center', padding: '12px 0' }}>Log in</Link>
          </div>
        </div>
      )}

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={{ background: Warm, borderBottom: `1px solid ${Border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 420 }} className="block md:grid">
          {/* Left */}
          <div style={{ padding: 'clamp(48px,8vw,96px) clamp(20px,5vw,56px)', borderRight: `1px solid ${Border}` }}>
            <p style={{ fontFamily: fontB, fontSize: 12, color: Muted, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 24px' }}>ICP Diagnostic Tool</p>
            <h1 style={{ fontFamily: fontSerif, fontSize: 'clamp(32px,4.5vw,56px)', fontWeight: 700, color: Text, lineHeight: 1.08, margin: '0 0 32px' }}>
              Your targeting is{' '}
              <span style={{ color: Orange }}>leaking money.</span>
              {' '}Find out exactly where.
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
              <Link href="/questionnaire" className="btn-primary" style={btnPrimary}>
                Get free diagnostic <ArrowRight size={16} />
              </Link>
              <a href="#how-it-works" className="btn-ghost" style={btnGhost}>See how it works</a>
            </div>
            <p style={{ fontFamily: fontB, fontSize: 13, color: Muted, margin: 0 }}>
              {liveCount.toLocaleString()} marketers diagnosed this month. Free forever, no card needed.
            </p>
          </div>
          {/* Right */}
          <div style={{ padding: 'clamp(48px,8vw,96px) clamp(20px,5vw,56px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 32 }}>
            <p style={{ fontFamily: fontB, fontSize: 'clamp(16px,2vw,20px)', color: Muted, lineHeight: 1.7, margin: 0 }}>
              Most B2B teams waste 30 to 60 percent of their ad budget targeting people who will never buy. The ICP Diagnostic finds the exact misalignment, scores your targeting, and gives you a ranked fix list in 5 minutes.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, borderTop: `1px solid ${Border}`, borderLeft: `1px solid ${Border}` }}>
              {[
                { stat: '5 min', label: 'To complete' },
                { stat: 'Instant', label: 'Results' },
                { stat: '0', label: 'Ad access needed' },
              ].map(({ stat, label }) => (
                <div key={label} style={{ padding: '20px 16px', borderBottom: `1px solid ${Border}`, borderRight: `1px solid ${Border}` }}>
                  <p style={{ fontFamily: fontSerif, fontSize: 24, fontWeight: 700, color: Text, margin: '0 0 4px' }}>{stat}</p>
                  <p style={{ fontFamily: fontB, fontSize: 12, color: Muted, margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATFORM DIAGRAM ───────────────────────────────────────────── */}
      <section style={{ background: Warm, borderBottom: `1px solid ${Border}` }}>
        <style>{`
          @keyframes scanDot {
            0%   { top: 0%;   opacity: 0; }
            8%   { opacity: 1; }
            92%  { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
          @keyframes pulseRing {
            0%, 100% { box-shadow: 0 0 0 0 rgba(232,51,10,0.35); }
            50%       { box-shadow: 0 0 0 9px rgba(232,51,10,0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .plat-scan-dot { animation: none !important; }
            .plat-pulse    { animation: none !important; }
          }
        `}</style>
        <div className="container" style={{ paddingTop: 'clamp(56px,8vw,96px)', paddingBottom: 'clamp(56px,8vw,96px)' }}>
          <p style={{ fontFamily: fontB, fontSize: 12, color: Muted, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 16px', textAlign: 'center' }}>How the platform works</p>
          <h2 style={{ fontFamily: fontSerif, fontSize: 'clamp(28px,4vw,52px)', fontWeight: 700, color: Dark, textAlign: 'center', margin: '0 0 56px', lineHeight: 1.1, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
            22 questions. A complete <span style={{ color: Orange }}>growth diagnosis.</span>
          </h2>

          {/* 6-column analysis grid */}
          <div style={{ border: `1px solid ${Border}`, borderRadius: 8, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', maxWidth: 1100, margin: '0 auto', overflow: 'hidden' }}
               className="hidden md:grid">
            {[
              { Icon: Target,       title: 'ICP Foundation',          sub: 'Who you are targeting and whether it is right' },
              { Icon: Crosshair,    title: 'Ad Targeting',            sub: 'Channel and audience alignment signals' },
              { Icon: Layout,       title: 'Landing Page',            sub: 'Copy, CTA, and conversion clarity' },
              { Icon: BarChart2,    title: 'Regional Benchmarks',     sub: 'How your metrics compare locally' },
              { Icon: TrendingDown, title: 'CAC Analysis',            sub: 'Cost per customer relative to LTV' },
              { Icon: Eye,          title: 'Competitive Intel',       sub: 'Market positioning and gap identification' },
            ].map(({ Icon, title, sub }, i) => (
              <div key={title} style={{ padding: '28px 18px 28px', borderLeft: i > 0 ? `1px solid ${Border}` : 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ width: 36, height: 36, border: `1px solid ${Border}`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={17} color={Dark} strokeWidth={1.5} />
                </div>
                <div>
                  <p style={{ fontFamily: font, fontSize: 13, fontWeight: 700, color: Dark, margin: '0 0 5px', lineHeight: 1.3 }}>{title}</p>
                  <p style={{ fontFamily: fontB, fontSize: 12, color: Muted, margin: 0, lineHeight: 1.55 }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: 2-col grid */}
          <div className="md:hidden" style={{ border: `1px solid ${Border}`, borderRadius: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
            {[
              { Icon: Target,       title: 'ICP Foundation' },
              { Icon: Crosshair,    title: 'Ad Targeting' },
              { Icon: Layout,       title: 'Landing Page' },
              { Icon: BarChart2,    title: 'Benchmarks' },
              { Icon: TrendingDown, title: 'CAC Analysis' },
              { Icon: Eye,          title: 'Competitive Intel' },
            ].map(({ Icon, title }, i) => (
              <div key={title} style={{ padding: '20px 16px', borderLeft: i % 2 === 1 ? `1px solid ${Border}` : 'none', borderTop: i >= 2 ? `1px solid ${Border}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, border: `1px solid ${Border}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color={Dark} strokeWidth={1.5} />
                </div>
                <p style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: Dark, margin: 0 }}>{title}</p>
              </div>
            ))}
          </div>

          {/* Animated connector */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 72, position: 'relative', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: Border, transform: 'translateX(-50%)' }}>
              <div className="plat-scan-dot" style={{ position: 'absolute', left: -3, width: 7, height: 7, borderRadius: '50%', background: Orange, animation: 'scanDot 1.8s ease-in-out infinite' }} />
            </div>
            <div className="plat-pulse" style={{ position: 'relative', zIndex: 2, width: 34, height: 34, borderRadius: '50%', background: Dark, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulseRing 1.8s ease-in-out infinite' }}>
              <Plus size={14} color="#fff" strokeWidth={2.5} />
            </div>
          </div>

          {/* Output pills panel */}
          <div style={{ border: `1px solid ${Border}`, borderRadius: 8, padding: '28px 28px 32px', maxWidth: 1100, margin: '0 auto', backgroundImage: `radial-gradient(${Border} 1px, transparent 1px)`, backgroundSize: '22px 22px' }}>
            <p style={{ fontFamily: fontB, fontSize: 11, color: Orange, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 18px' }}>Your outputs</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {[
                'ICP Health Score',
                'Critical Findings',
                'CAC Before / After',
                'LTV:CAC Ratio',
                'Quick Wins',
                'Weekly Intelligence',
                'Executive Summary',
                'Improvement Roadmap',
              ].map(pill => (
                <span key={pill} style={{ fontFamily: fontB, fontSize: 13, color: Dark, fontWeight: 600, border: `1px solid ${Border}`, borderRadius: 6, padding: '8px 14px', background: '#fff', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <Check size={12} color={Orange} strokeWidth={2.5} />
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 4-COLUMN TRUST GRID ────────────────────────────────────────── */}
      <section style={{ background: Warm, borderBottom: `1px solid ${Border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', borderLeft: `1px solid ${Border}` }}>
          {[
            { Icon: Shield, title: 'No ad account access', body: 'No Google OAuth. No Meta permissions. Zero.' },
            { Icon: Globe,  title: '10+ markets covered',  body: 'Kenya, Nigeria, South Africa, UK, US and more.' },
            { Icon: Users,  title: 'Built by media buyers', body: 'USD 2M+ in ad spend managed. Real practitioners built every rule.' },
            { Icon: Lock,   title: 'Your data is private',  body: 'Stored securely. Never shared. Never sold.' },
          ].map(({ Icon, title, body }) => (
            <div key={title} style={{ padding: 'clamp(24px,3vw,36px)', borderRight: `1px solid ${Border}`, borderBottom: `1px solid ${Border}` }}>
              <Icon size={20} color={Orange} style={{ marginBottom: 14 }} />
              <h3 style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: Text, margin: '0 0 8px' }}>{title}</h3>
              <p style={{ fontFamily: fontB, fontSize: 14, color: Muted, lineHeight: 1.6, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section style={{ background: Dark, borderBottom: `1px solid ${DarkBorder}` }}>
        <div className="container" style={{ paddingTop: 'clamp(56px,8vw,88px)', paddingBottom: 'clamp(56px,8vw,88px)' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderBottom: `1px solid ${DarkBorder}`, marginBottom: 0 }} className="block md:grid">
            <div style={{ padding: 'clamp(24px,4vw,48px) 0 clamp(24px,4vw,48px) 0', borderRight: `1px solid ${DarkBorder}`, paddingRight: 'clamp(24px,4vw,56px)' }}>
              <p style={{ fontFamily: fontSerif, fontSize: 'clamp(22px,3vw,36px)', fontWeight: 700, color: '#fff', margin: '0 0 8px', lineHeight: 1.2 }}>
                No guesswork. <span style={{ color: Orange }}>Just your numbers.</span>
              </p>
              <p style={{ fontFamily: fontB, fontSize: 15, color: DarkMuted, lineHeight: 1.7, margin: 0 }}>
                We compute your exact waste from your actual budget, targeting parameters, and regional benchmarks. Not an estimate. Your number.
              </p>
            </div>
            <div style={{ padding: 'clamp(24px,4vw,48px) 0 clamp(24px,4vw,48px) clamp(24px,4vw,56px)' }}>
              <span ref={countRef} style={{ fontFamily: fontSerif, fontSize: 'clamp(44px,8vw,88px)', fontWeight: 700, color: '#fff', lineHeight: 1, display: 'block', marginBottom: 10 }}>KES 0</span>
              <p style={{ fontFamily: fontB, fontSize: 14, color: Orange, fontWeight: 600, margin: 0 }}>average monthly waste found per diagnosis</p>
            </div>
          </div>

          {/* 4 feature tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', borderLeft: `1px solid ${DarkBorder}`, borderTop: `1px solid ${DarkBorder}` }}>
            {[
              { Icon: BarChart2, title: 'ICP health score', body: 'A single 0-100 score summarising how well your targeting, funnel, and messaging match your real buyers.' },
              { Icon: Target,    title: 'Critical findings', body: 'Ranked by revenue impact. The top finding alone typically accounts for 40 percent of your waste.' },
              { Icon: FileText,  title: 'Business outcomes', body: 'Your CAC before and after. Your LTV:CAC ratio. The revenue you recover by fixing each gap.' },
              { Icon: Zap,       title: 'Quick wins', body: 'Three specific actions you can take this week, without an agency, without touching your ad account.' },
            ].map(({ Icon, title, body }) => (
              <div key={title} style={{ padding: 'clamp(24px,3vw,32px)', borderRight: `1px solid ${DarkBorder}`, borderBottom: `1px solid ${DarkBorder}` }}>
                <Icon size={18} color={Orange} style={{ marginBottom: 16 }} />
                <h3 style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>{title}</h3>
                <p style={{ fontFamily: fontB, fontSize: 13, color: DarkMuted, lineHeight: 1.65, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASE TICKER ─────────────────────────────────────────────── */}
      <div style={{ background: Warm, borderBottom: `1px solid ${Border}`, overflow: 'hidden', padding: '14px 0' }}>
        <div className="ticker-track">
          {[...USE_CASES, ...USE_CASES].map((item, i) => (
            <span key={i} style={{ fontFamily: fontB, fontSize: 13, color: Muted, whiteSpace: 'nowrap', padding: '4px 16px', border: `1px solid ${Border}`, borderRadius: 4 }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ background: Warm, borderBottom: `1px solid ${Border}` }}>
        <div className="container" style={{ paddingTop: 'clamp(56px,8vw,96px)', paddingBottom: 'clamp(56px,8vw,96px)' }}>
          <p style={{ fontFamily: fontB, fontSize: 12, color: Muted, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 14px' }}>How It Works</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 48 }}>
            <h2 style={{ fontFamily: fontSerif, fontSize: 'clamp(28px,4.5vw,52px)', color: Text, fontWeight: 700, margin: 0, lineHeight: 1.08 }}>
              Three steps to clarity.
            </h2>
            <p style={{ fontFamily: fontB, fontSize: 14, color: Muted, margin: 0, maxWidth: 360, lineHeight: 1.65 }}>
              No ad account access. No agency required. Just answers, then a ranked action plan.
            </p>
          </div>

          {/* 3-card grid */}
          <div style={{ border: `1px solid ${Border}`, borderRadius: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', overflow: 'hidden', marginBottom: 0 }}
               className="hidden md:grid">
            {[
              { num: '01', Icon: FileText, title: 'Answer 22 questions', body: 'Tell us about your targeting and funnel. No ad account access needed. Takes around 5 minutes.', chip: '5 minutes', chipBg: 'rgba(232,51,10,0.1)' },
              { num: '02', Icon: Zap,      title: 'Get your report',      body: 'Your ICP health score, monthly waste estimate, CAC analysis, and top findings ranked by revenue impact.', chip: 'Instant',   chipBg: 'rgba(232,51,10,0.1)' },
              { num: '03', Icon: ArrowRight, title: 'Fix what is broken', body: 'Follow the prioritised action plan. Subscribe for ongoing monitoring, weekly intelligence, and CAC tracking.', chip: 'Start today', chipBg: 'rgba(232,51,10,0.1)' },
            ].map(({ num, Icon, title, body, chip, chipBg }, i) => (
              <div key={i} style={{ borderLeft: i > 0 ? `1px solid ${Border}` : 'none', padding: '36px 28px 36px', display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', overflow: 'hidden' }}>
                {/* Ghost number watermark */}
                <span style={{ position: 'absolute', top: 12, right: 20, fontFamily: fontSerif, fontSize: 72, fontWeight: 700, color: Orange, opacity: 0.07, lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>{num}</span>
                {/* Icon */}
                <div style={{ width: 40, height: 40, borderRadius: 8, border: `1.5px solid ${Border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, flexShrink: 0 }}>
                  <Icon size={18} color={Dark} strokeWidth={1.5} />
                </div>
                {/* Step number label */}
                <p style={{ fontFamily: fontB, fontSize: 11, color: Orange, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>Step {num}</p>
                <h3 style={{ fontFamily: font, fontSize: 'clamp(16px,2vw,20px)', fontWeight: 700, color: Text, margin: '0 0 12px', lineHeight: 1.25 }}>{title}</h3>
                <p style={{ fontFamily: fontB, fontSize: 14, color: Muted, lineHeight: 1.65, margin: '0 0 20px', flex: 1 }}>{body}</p>
                <span style={{ alignSelf: 'flex-start', background: chipBg, color: Orange, fontFamily: fontB, fontSize: 12, fontWeight: 700, padding: '4px 11px', borderRadius: 4 }}>{chip}</span>
              </div>
            ))}
          </div>

          {/* Mobile: stacked with border separator */}
          <div className="md:hidden" style={{ border: `1px solid ${Border}`, borderRadius: 8, overflow: 'hidden' }}>
            {[
              { num: '01', Icon: FileText,  title: 'Answer 22 questions', body: 'No ad account needed. Takes 5 minutes.', chip: '5 minutes' },
              { num: '02', Icon: Zap,       title: 'Get your report',      body: 'Health score, CAC analysis, and ranked findings instantly.', chip: 'Instant' },
              { num: '03', Icon: ArrowRight, title: 'Fix what is broken',  body: 'Follow the action plan and track your progress.', chip: 'Start today' },
            ].map(({ num, Icon, title, body, chip }, i) => (
              <div key={i} style={{ borderTop: i > 0 ? `1px solid ${Border}` : 'none', padding: '24px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 7, border: `1.5px solid ${Border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color={Dark} strokeWidth={1.5} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: fontB, fontSize: 10, color: Orange, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Step {num}</span>
                    <span style={{ background: 'rgba(232,51,10,0.1)', color: Orange, fontFamily: fontB, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{chip}</span>
                  </div>
                  <h3 style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: Text, margin: '0 0 6px' }}>{title}</h3>
                  <p style={{ fontFamily: fontB, fontSize: 13, color: Muted, lineHeight: 1.6, margin: 0 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Free report includes bar */}
          <div style={{ borderTop: `1px solid ${Border}`, marginTop: 48, paddingTop: 40, display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontFamily: fontB, fontSize: 11, color: Muted, fontWeight: 700, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your free report includes</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
                {['ICP health score (0-100)', 'Monthly waste estimate', 'Top 3 findings with fixes', 'Quick wins for this week', 'CAC and LTV:CAC projection'].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Check size={13} color={Orange} />
                    <span style={{ fontFamily: fontB, fontSize: 14, color: Text }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link href="/questionnaire" className="btn-primary" style={btnPrimary}>
              Get My Free ICP Report <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL ─────────────────────────────────────────────────── */}
      <section id="results" style={{ background: '#fff', borderBottom: `1px solid ${Border}` }}>
        <div className="container" style={{ paddingTop: 'clamp(48px,7vw,80px)', paddingBottom: 'clamp(48px,7vw,80px)' }}>
          <p style={{ fontFamily: fontSerif, fontSize: 'clamp(22px,3.5vw,40px)', color: Text, fontWeight: 700, textAlign: 'center', margin: '0 0 48px', lineHeight: 1.2 }}>
            <span style={{ color: Orange }}>Built for marketers</span> who are tired of burning budget.
          </p>

          {/* Big testimonial card */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: `1px solid ${Border}`, borderRadius: 12, overflow: 'hidden' }} className="block md:grid">
            {/* Left: quote + stats */}
            <div style={{ borderRight: `1px solid ${Border}` }}>
              <div style={{ padding: 'clamp(28px,4vw,48px)', borderBottom: `1px solid ${Border}` }}>
                <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: Muted, margin: '0 0 20px' }}>James M. — Marketing Manager, Nairobi</p>
                <p style={{ fontFamily: fontSerif, fontSize: 'clamp(18px,2.5vw,28px)', color: Text, lineHeight: 1.4, margin: 0 }}>
                  "I did not need a new campaign. I needed someone to tell me my landing page was broken. The diagnosis did that in 5 minutes."
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${Border}` }}>
                {[['14 to 3', 'Form fields cut'], ['0 to 12', 'Leads in week one']].map(([num, label], i) => (
                  <div key={i} style={{ padding: '24px 28px', borderRight: i === 0 ? `1px solid ${Border}` : 'none' }}>
                    <p style={{ fontFamily: fontSerif, fontSize: 32, fontWeight: 700, color: Orange, margin: '0 0 4px' }}>{num}</p>
                    <p style={{ fontFamily: fontB, fontSize: 13, color: Muted, margin: 0 }}>{label}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: 'clamp(20px,3vw,32px) clamp(20px,3vw,28px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: Warm, flexShrink: 0 }}>
                    <Image src="/images/Holder-1.png" alt="James M." width={40} height={40} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: Text, margin: 0 }}>James M.</p>
                    <p style={{ fontFamily: fontB, fontSize: 12, color: Muted, margin: 0 }}>Legal Services, Nairobi</p>
                  </div>
                </div>
                <Link href="/questionnaire" className="btn-ghost" style={{ ...btnGhost, fontSize: 13, padding: '9px 16px' }}>
                  Get your diagnosis <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Right: stats grid */}
            <div style={{ background: Warm, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' }}>
              {[
                { stat: '5 min', label: 'Average time to complete' },
                { stat: '43%', label: 'Of waste from wrong audience' },
                { stat: 'KES 47K', label: 'Average monthly waste found' },
                { stat: '22', label: 'Questions, 3 layers, instant results' },
              ].map(({ stat, label }, i) => (
                <div key={i} style={{
                  padding: 'clamp(20px,3vw,32px)',
                  borderRight: i % 2 === 0 ? `1px solid ${Border}` : 'none',
                  borderBottom: i < 2 ? `1px solid ${Border}` : 'none',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                }}>
                  <p style={{ fontFamily: fontSerif, fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 700, color: Text, margin: '0 0 6px' }}>{stat}</p>
                  <p style={{ fontFamily: fontB, fontSize: 13, color: Muted, margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontFamily: fontB, fontSize: 13, color: Muted, textAlign: 'center', margin: '28px 0 0' }}>
            {liveCount.toLocaleString()} marketers have diagnosed their ICP this month
          </p>
        </div>
      </section>

      {/* ── BUSINESS OUTCOMES CALCULATOR ────────────────────────────────── */}
      <section id="calculator" style={{ background: Dark, borderBottom: `1px solid ${DarkBorder}` }}>
        <div className="container" style={{ paddingTop: 'clamp(56px,8vw,96px)', paddingBottom: 'clamp(56px,8vw,96px)' }}>

          {/* Section header */}
          <div style={{ marginBottom: 56 }}>
            <p style={{ fontFamily: fontB, fontSize: 12, color: DarkMuted, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 14px' }}>Business Outcomes Calculator</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 24, justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: fontSerif, fontSize: 'clamp(28px,4vw,48px)', color: '#fff', fontWeight: 700, margin: 0, lineHeight: 1.08 }}>
                Model your <span style={{ color: Orange }}>unit economics.</span>
              </h2>
              <p style={{ fontFamily: fontB, fontSize: 14, color: DarkMuted, lineHeight: 1.7, margin: 0, maxWidth: 400 }}>
                Based on 9,000+ diagnoses: fixing ICP alignment improves lead quality by 35 percent and close rate by 30 percent on average.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: `1px solid ${DarkBorder}`, borderRadius: 8, overflow: 'hidden' }} className="block md:grid">
            {/* Left: Inputs */}
            <div style={{ padding: 'clamp(24px,4vw,40px)', borderRight: `1px solid ${DarkBorder}` }}>
              <p style={{ fontFamily: fontB, fontSize: 11, color: DarkMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>Your current numbers</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontFamily: fontB, fontSize: 12, color: DarkMuted, display: 'block', marginBottom: 7, fontWeight: 600 }}>Monthly ad budget</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>KES</span>
                    <input type="number" placeholder="e.g. 150,000" value={calcBudget} onChange={e => setCalcBudget(e.target.value)} style={{ ...inputStyle, paddingLeft: 46 }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontFamily: fontB, fontSize: 12, color: DarkMuted, display: 'block', marginBottom: 7, fontWeight: 600 }}>Monthly leads</label>
                    <input type="number" placeholder="e.g. 80" value={calcLeads} onChange={e => setCalcLeads(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontFamily: fontB, fontSize: 12, color: DarkMuted, display: 'block', marginBottom: 7, fontWeight: 600 }}>Close rate</label>
                    <div style={{ position: 'relative' }}>
                      <input type="number" placeholder="e.g. 12" value={calcCloseRate} onChange={e => setCalcCloseRate(e.target.value)} style={{ ...inputStyle, paddingRight: 36 }} />
                      <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontFamily: fontB, fontSize: 12, color: DarkMuted, display: 'block', marginBottom: 7, fontWeight: 600 }}>Average customer LTV</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>KES</span>
                    <input type="number" placeholder="e.g. 250,000" value={calcLTV} onChange={e => setCalcLTV(e.target.value)} style={{ ...inputStyle, paddingLeft: 46 }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.25)', display: 'block', marginBottom: 7, fontWeight: 600 }}>Monthly churn rate <span style={{ fontWeight: 400 }}>(optional)</span></label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" placeholder="e.g. 4" value={calcChurn} onChange={e => setCalcChurn(e.target.value)} style={{ ...inputStyle, paddingRight: 36, background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }} />
                    <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>%</span>
                  </div>
                </div>

                <button onClick={handleCalc} className="btn-primary" style={{ ...btnPrimary, width: '100%', justifyContent: 'center', marginTop: 4, padding: '15px 22px', fontSize: 14 }}>
                  Calculate My Business Outcomes <ArrowRight size={15} />
                </button>
              </div>
            </div>

            {/* Right: Results */}
            <div style={{ padding: 'clamp(24px,4vw,40px)' }}>
              {calcMetrics === null ? (
                <div style={{ height: '100%', minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, opacity: 0.35 }}>
                  <BarChart2 size={40} color="#fff" strokeWidth={1} />
                  <p style={{ fontFamily: fontB, fontSize: 14, color: '#fff', margin: 0, textAlign: 'center', lineHeight: 1.6 }}>
                    Fill in your numbers on the left<br />to see your projected outcomes.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
                  <p style={{ fontFamily: fontB, fontSize: 11, color: DarkMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>Your projected outcomes</p>

                  {/* 4 metric cells in a 2x2 grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: `1px solid ${DarkBorder}`, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
                    {[
                      { label: 'CAC today', value: `KES ${calcMetrics.cacCurrent.toLocaleString()}`, accent: false },
                      { label: 'CAC after fix', value: `KES ${calcMetrics.cacProjected.toLocaleString()}`, accent: true, sub: `${Math.round((1 - calcMetrics.cacProjected / calcMetrics.cacCurrent) * 100)}% lower` },
                      { label: 'LTV:CAC now', value: `${calcMetrics.ltvCacCurrent}:1`, accent: false, warn: calcMetrics.ltvCacCurrent < 3 },
                      { label: 'LTV:CAC after', value: `${calcMetrics.ltvCacProjected}:1`, accent: true, sub: calcMetrics.ltvCacCurrent < 3 ? 'Toward 3:1 benchmark' : 'Compounding gains' },
                    ].map(({ label, value, accent, sub, warn }, i) => (
                      <div key={i} style={{ padding: '18px 16px', borderLeft: i % 2 === 1 ? `1px solid ${DarkBorder}` : 'none', borderTop: i >= 2 ? `1px solid ${DarkBorder}` : 'none' }}>
                        <p style={{ fontFamily: fontB, fontSize: 11, color: warn ? '#f59e0b' : accent ? '#22c55e' : DarkMuted, fontWeight: 700, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
                        <p style={{ fontFamily: fontSerif, fontSize: 20, fontWeight: 700, color: accent ? '#22c55e' : '#fff', margin: '0 0 3px' }}>{value}</p>
                        {sub && <p style={{ fontFamily: fontB, fontSize: 11, color: DarkMuted, margin: 0 }}>{sub}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Customers row */}
                  <div style={{ border: `1px solid ${DarkBorder}`, borderRadius: 6, padding: '16px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <p style={{ fontFamily: fontB, fontSize: 11, color: DarkMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 5px' }}>New customers per month</p>
                      <p style={{ fontFamily: fontSerif, fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>
                        {calcMetrics.monthlyCustomers}
                        <span style={{ color: '#22c55e', fontSize: 15, marginLeft: 10 }}>to {calcMetrics.monthlyCustomersProjected}</span>
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontFamily: fontB, fontSize: 11, color: DarkMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 5px' }}>CAC payback</p>
                      <p style={{ fontFamily: fontSerif, fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>{calcMetrics.paybackMonths} mo.</p>
                    </div>
                  </div>

                  {/* Revenue opportunity: highlighted */}
                  <div style={{ borderRadius: 6, padding: '20px 20px 20px', background: Orange, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <p style={{ fontFamily: fontB, fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Monthly revenue opportunity</p>
                      <p style={{ fontFamily: fontSerif, fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: '#fff', margin: '0 0 6px', lineHeight: 1 }}>KES {calcMetrics.monthlyRevenueOpportunity.toLocaleString()}</p>
                      <p style={{ fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.6 }}>
                        {Math.round(calcMetrics.monthlyRevenueOpportunity / 6500)}x ROI on the KES 6,500/mo plan. From additional customers at your current LTV.
                      </p>
                    </div>
                    <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: Dark, borderRadius: 6, padding: '12px 18px', fontFamily: font, fontSize: 14, fontWeight: 700, textDecoration: 'none', alignSelf: 'flex-start' }}>
                      Get my free diagnosis <ArrowRight size={14} />
                    </Link>
                  </div>

                  <p style={{ fontFamily: fontB, fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '12px 0 0', textAlign: 'center' }}>
                    35% lead efficiency gain and 30% close rate lift based on observed ICP alignment improvements.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: Warm, borderBottom: `1px solid ${Border}` }}>
        <div className="container" style={{ paddingTop: 'clamp(56px,8vw,88px)', paddingBottom: 'clamp(56px,8vw,88px)' }}>
          <p style={{ fontFamily: fontB, fontSize: 12, color: Muted, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 16px' }}>Simple Pricing</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 20, marginBottom: 40 }}>
            <h2 style={{ fontFamily: fontSerif, fontSize: 'clamp(28px,4.5vw,52px)', color: Text, fontWeight: 700, margin: 0, lineHeight: 1.08 }}>
              Start free. <span style={{ color: Orange }}>Upgrade when ready.</span>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: fontB, fontSize: 14, color: !billingAnnual ? Text : Muted, fontWeight: !billingAnnual ? 700 : 400 }}>Monthly</span>
              <button onClick={() => setBillingAnnual(b => !b)} style={{ width: 46, height: 25, borderRadius: 100, background: billingAnnual ? Dark : Border, position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ width: 19, height: 19, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: billingAnnual ? 24 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
              <span style={{ fontFamily: fontB, fontSize: 14, color: billingAnnual ? Text : Muted, fontWeight: billingAnnual ? 700 : 400 }}>
                Annual <span style={{ color: '#16a34a', fontWeight: 700 }}>(save 2 months)</span>
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 0, border: `1px solid ${Border}`, borderRadius: 12, overflow: 'hidden' }}>
            {TIERS.map((tier, i) => (
              <div key={tier.name} style={{
                background: tier.highlight ? Dark : '#fff',
                borderRight: i < TIERS.length - 1 ? `1px solid ${tier.highlight ? DarkBorder : Border}` : 'none',
                padding: 'clamp(24px,3vw,36px) clamp(20px,3vw,28px)',
                position: 'relative',
                display: 'flex', flexDirection: 'column',
              }}>
                {tier.highlight && (
                  <div style={{ position: 'absolute', top: -1, left: 0, right: 0, height: 3, background: Orange }} />
                )}
                <p style={{ fontFamily: fontB, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: tier.highlight ? DarkMuted : Muted, margin: '0 0 6px' }}>{tier.name}</p>
                <p style={{ fontFamily: fontB, fontSize: 13, color: tier.highlight ? DarkMuted : Muted, margin: '0 0 20px', lineHeight: 1.55, minHeight: 40 }}>{tier.desc}</p>
                <p style={{ fontFamily: fontSerif, fontSize: 32, fontWeight: 700, color: tier.highlight ? '#fff' : Text, margin: '0 0 4px' }}>
                  {billingAnnual ? tier.annual + '/yr' : tier.monthly + '/mo'}
                </p>
                <div style={{ margin: '20px 0 28px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  {tier.bullets.map((bullet) => (
                    <div key={bullet} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Check size={14} color={Orange} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontFamily: fontB, fontSize: 13, color: tier.highlight ? 'rgba(255,255,255,0.85)' : Text }}>{bullet}</span>
                    </div>
                  ))}
                </div>
                <Link href={tier.href} className={tier.highlight ? 'btn-primary' : 'btn-ghost'} style={tier.highlight ? { ...btnPrimary, justifyContent: 'center', width: '100%' } : { ...btnGhost, justifyContent: 'center', width: '100%' }}>
                  {tier.cta}
                </Link>
                <p style={{ fontFamily: fontB, fontSize: 12, color: tier.highlight ? DarkMuted : Muted, textAlign: 'center', marginTop: 10, marginBottom: 0 }}>Cancel anytime.</p>
              </div>
            ))}
          </div>

          {/* Payment strip */}
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: Muted }}>Secure checkout via</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { src: '/images/logos/paystack-logo_1.png',                alt: 'Paystack',    h: 20 },
                { src: '/images/logos/Visa_Inc._logo_(2014–2021).svg.png', alt: 'Visa',        h: 18 },
                { src: '/images/logos/MasterCard_early_1990s_logo.svg.png', alt: 'Mastercard', h: 26 },
                { src: '/images/logos/M-PESA_LOGO-01.svg.png',             alt: 'M-Pesa',      h: 20 },
              ].map(({ src, alt, h }) => (
                <img key={alt} src={src} alt={alt} style={{ height: h, objectFit: 'contain', opacity: 0.55 }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ background: '#fff', borderBottom: `1px solid ${Border}` }}>
        <div className="container" style={{ paddingTop: 'clamp(56px,8vw,80px)', paddingBottom: 'clamp(56px,8vw,80px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 'clamp(24px,6vw,80px)', alignItems: 'start' }} className="block md:grid">
            <div>
              <p style={{ fontFamily: fontB, fontSize: 12, color: Muted, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>FAQ</p>
              <h2 style={{ fontFamily: fontSerif, fontSize: 'clamp(24px,3vw,36px)', color: Text, fontWeight: 700, margin: '0 0 12px', lineHeight: 1.15 }}>You ask, we answer.</h2>
              <p style={{ fontFamily: fontB, fontSize: 15, color: Muted, margin: 0 }}>Everything you need before getting started.</p>
            </div>
            <div>
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i
                return (
                  <div key={i} style={{ borderTop: `1px solid ${Border}`, overflow: 'hidden' }}>
                    <button onClick={() => setOpenFaq(isOpen ? null : i)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', gap: 16 }}>
                      <span style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: Text, lineHeight: 1.4 }}>{faq.q}</span>
                      <div style={{ width: 28, height: 28, borderRadius: 4, background: isOpen ? Dark : Warm, border: `1px solid ${Border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                        {isOpen ? <ChevronUp size={14} color="#fff" /> : <ChevronDown size={14} color={Text} />}
                      </div>
                    </button>
                    <div style={{ maxHeight: isOpen ? 300 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                      <p style={{ fontFamily: fontB, fontSize: 14, lineHeight: 1.75, color: Muted, padding: '0 0 20px', margin: 0 }}>{faq.a}</p>
                    </div>
                  </div>
                )
              })}
              <div style={{ borderTop: `1px solid ${Border}` }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section style={{ background: Dark, borderBottom: `1px solid ${DarkBorder}` }}>
        <div className="container" style={{ paddingTop: 'clamp(72px,10vw,112px)', paddingBottom: 'clamp(72px,10vw,112px)', textAlign: 'center' }}>
          <p style={{ fontFamily: fontB, fontSize: 12, color: DarkMuted, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 20px' }}>Get started today</p>
          <h2 style={{ fontFamily: fontSerif, fontSize: 'clamp(28px,5vw,60px)', color: '#fff', fontWeight: 700, maxWidth: 720, margin: '0 auto 20px', lineHeight: 1.1 }}>
            Your competitors ran ads today without knowing their <span style={{ color: Orange }}>ICP score.</span>
          </h2>
          <p style={{ fontFamily: fontB, fontSize: 16, color: DarkMuted, maxWidth: 400, margin: '0 auto 40px', lineHeight: 1.65 }}>
            Every week without a diagnosis is budget you will not get back.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
            <Link href="/questionnaire" className="btn-primary" style={{ ...btnPrimary, fontSize: 16, padding: '16px 32px' }}>
              Get My Free ICP Score <ArrowRight size={18} />
            </Link>
            <Link href="/auth?tab=login" className="btn-ghost-dark" style={{ ...btnGhostDark, fontSize: 16, padding: '16px 32px' }}>
              Log in
            </Link>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {['Free forever', 'No credit card', '5 minutes'].map((chip, i) => (
              <span key={chip} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <span style={{ color: DarkBorder }}>·</span>}
                <span style={{ fontFamily: fontB, fontSize: 13, color: DarkMuted }}>{chip}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{ background: Dark, borderTop: `1px solid ${DarkBorder}`, padding: 'clamp(32px,5vw,48px) 0 clamp(24px,4vw,32px)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24, alignItems: 'center' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: Orange, flexShrink: 0 }} />
              <span style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: '#fff' }}>ICP Diagnostic</span>
            </Link>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              {[['About', '/about'], ['Privacy', '/privacy'], ['Terms', '/terms'], ['Contact', 'mailto:info@idealicp.com']].map(([label, href]) => (
                <Link key={label} href={href} style={{ fontFamily: fontB, fontSize: 13, color: DarkMuted, textDecoration: 'none' }}>{label}</Link>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center', borderTop: `1px solid ${DarkBorder}`, paddingTop: 20 }}>
            <span style={{ fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.22)' }}>2026 ICP Diagnostic. All rights reserved.</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {[
                { src: '/images/logos/paystack-logo_1.png',                alt: 'Paystack',    h: 15 },
                { src: '/images/logos/Visa_Inc._logo_(2014–2021).svg.png', alt: 'Visa',        h: 13 },
                { src: '/images/logos/MasterCard_early_1990s_logo.svg.png', alt: 'Mastercard', h: 18 },
                { src: '/images/logos/M-PESA_LOGO-01.svg.png',             alt: 'M-Pesa',      h: 15 },
              ].map(({ src, alt, h }) => (
                <img key={alt} src={src} alt={alt} style={{ height: h, objectFit: 'contain', opacity: 0.3, filter: 'brightness(10)' }} />
              ))}
            </div>
          </div>
        </div>
      </footer>

      <SocialProofToast />

      {/* ── STICKY BAR ──────────────────────────────────────────────────── */}
      {showStickyBar && !stickyDismissed && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999, background: '#fff', borderTop: `1px solid ${Border}`, padding: '12px clamp(16px,4vw,24px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <p style={{ fontFamily: fontB, fontSize: 14, color: Text, fontWeight: 600, margin: 0, flex: 1 }}>
            Free ICP Score. 5 minutes. No card needed.
          </p>
          <Link href="/questionnaire" className="btn-primary" style={{ ...btnPrimary, fontSize: 13, padding: '9px 18px' }}>
            Get Free Score
          </Link>
          <button onClick={() => { setStickyDismissed(true); sessionStorage.setItem('sticky_dismissed', '1') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <X size={17} color={Muted} />
          </button>
        </div>
      )}
    </>
  )
}
