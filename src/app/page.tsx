'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, Check, Menu, X,
  Target, Shield, Globe, Users, Lock, ChevronDown, ChevronUp, Zap,
  TrendingDown, BarChart2, Brain, FileSearch, AlertTriangle,
} from 'lucide-react'
import SocialProofToast from '@/components/SocialProofToast'
export const dynamic = 'force-static'

const P       = '#302161'
const Accent  = '#7c3aed'
const Dark    = '#0d0b1a'
const Light   = '#f8f7ff'
const PMuted  = 'rgba(48,33,97,0.55)'
const PBorder = 'rgba(48,33,97,0.1)'
const font    = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontB   = "'PolySans Neutral', -apple-system, system-ui, sans-serif"

const HERO_HEADLINES = [
  { line1: 'You are not bad at marketing.', highlight: 'You are targeting the wrong people.' },
  { line1: 'Your ads are getting clicks.', highlight: 'They are just not becoming leads.' },
  { line1: 'You are not spending too little.', highlight: 'You are spending in the wrong places.' },
  { line1: 'Your ICP is wrong.', highlight: 'That is why nothing is working.' },
]

const PERSONA_COPY: Record<string, string> = {
  'Marketing Head': 'Show your CEO exactly where budget is leaking and what to fix first.',
  'Founder': 'See what is broken before you spend another shilling on ads.',
  'Agency': 'Diagnose your clients before you touch their campaigns.',
  default: 'Answer 20 questions. See exactly where your ad budget is going.',
}

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
]

const LOGOS = ['Logos-1', 'Logos-2', 'Logos-3', 'Logos-4', 'Logos-5', 'Logos-6']

const USE_CASES = [
  'Fix bad targeting', 'Stop wasted budget', 'Find your real ICP',
  'Score your campaigns', 'Benchmark vs competitors', 'Get weekly intelligence',
  'Fix landing page friction', 'Diagnose in 5 minutes', 'Qualify better leads', 'Cut CPL in half',
]

export default function Page() {
  const [mobileOpen,      setMobileOpen]      = useState(false)
  const [heroIndex,       setHeroIndex]       = useState(0)
  const [heroVisible,     setHeroVisible]     = useState(true)
  const [persona,         setPersona]         = useState<'Marketing Head' | 'Founder' | 'Agency'>('Marketing Head')
  const [billingAnnual,   setBillingAnnual]   = useState(false)
  const [openFaq,         setOpenFaq]         = useState<number | null>(null)
  const [calcBudget,      setCalcBudget]      = useState('')
  const [calcConvRate,    setCalcConvRate]    = useState('')
  const [calcResult,      setCalcResult]      = useState<number | null>(null)
  const [showStickyBar,   setShowStickyBar]   = useState(false)
  const [stickyDismissed, setStickyDismissed] = useState(false)
  const [liveCount,       setLiveCount]       = useState(480)

  const countRef    = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroVisible(false)
      setTimeout(() => { setHeroIndex(i => (i + 1) % HERO_HEADLINES.length); setHeroVisible(true) }, 500)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

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
    const budget = parseFloat(calcBudget.replace(/,/g, ''))
    const rate   = parseFloat(calcConvRate)
    if (isNaN(budget) || isNaN(rate) || budget <= 0 || rate < 0) return
    setCalcResult(rate < 3.5 ? Math.round(budget * (1 - rate / 3.5)) : Math.round(budget * 0.1))
  }

  return (
    <>
      <style>{`
        .lp-container { max-width: 1200px; margin: 0 auto; padding: 0 clamp(20px,5vw,56px); }
        * { box-sizing: border-box; }
        .lp-tag { display: inline-flex; align-items: center; background: rgba(124,58,237,0.1); color: ${Accent}; font-family: ${fontB}; font-size: 12px; font-weight: 700; padding: 6px 16px; border-radius: 100px; letter-spacing: 0.05em; text-transform: uppercase; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
        @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        .hero-card { animation: float 6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .hero-card { animation: none !important; } }
      `}</style>

      {/* ── NAV ────────────────────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${PBorder}`, padding: '0 clamp(20px,5vw,56px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${P},${Accent})`, flexShrink: 0 }} />
            <span style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: P }}>ICP Diagnostic</span>
          </Link>
          <div className="hidden md:flex" style={{ gap: 32, alignItems: 'center' }}>
            {[['How It Works', '#how-it-works'], ['Pricing', '#pricing'], ['FAQ', '#faq']].map(([label, href]) => (
              <a key={href} href={href} style={{ fontFamily: fontB, fontSize: 14, color: PMuted, textDecoration: 'none', fontWeight: 500 }}>{label}</a>
            ))}
          </div>
          <div className="hidden md:flex" style={{ gap: 10, alignItems: 'center' }}>
            <Link href="/auth?tab=login" style={{ fontFamily: fontB, fontSize: 14, color: PMuted, textDecoration: 'none', fontWeight: 500, padding: '8px 16px' }}>Log in</Link>
            <Link href="/questionnaire" style={{ fontFamily: fontB, fontSize: 14, fontWeight: 700, color: '#fff', background: P, padding: '10px 24px', borderRadius: 100, textDecoration: 'none' }}>Get Started</Link>
          </div>
          <button className="md:hidden" onClick={() => setMobileOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
            {mobileOpen ? <X size={22} color={P} /> : <Menu size={22} color={P} />}
          </button>
        </div>
      </nav>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 49, background: '#fff', display: 'flex', flexDirection: 'column', padding: '80px 28px 40px' }}>
          {[['How It Works', '#how-it-works'], ['Pricing', '#pricing'], ['FAQ', '#faq']].map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMobileOpen(false)}
              style={{ fontFamily: font, fontSize: 24, color: P, textDecoration: 'none', fontWeight: 700, padding: '18px 0', borderBottom: `1px solid ${PBorder}` }}>{label}</a>
          ))}
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href="/questionnaire" onClick={() => setMobileOpen(false)} style={{ fontFamily: font, fontSize: 17, fontWeight: 700, color: '#fff', background: P, padding: '16px 28px', borderRadius: 100, textDecoration: 'none', textAlign: 'center' }}>Get free diagnostic</Link>
            <Link href="/auth?tab=login" onClick={() => setMobileOpen(false)} style={{ fontFamily: fontB, fontSize: 15, fontWeight: 500, color: PMuted, textDecoration: 'none', textAlign: 'center' }}>Log in</Link>
          </div>
        </div>
      )}

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: 'clamp(48px,8vw,96px) 0 0', overflow: 'hidden' }}>
        <div className="lp-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48, alignItems: 'center' }} className="lg:grid-cols-2">

            {/* Left: text */}
            <div>
              <div style={{ marginBottom: 24 }}>
                <span className="lp-tag">B2B ICP Diagnostic</span>
              </div>

              <div style={{ minHeight: 'clamp(80px,14vw,160px)', marginBottom: 20 }}>
                <h1 style={{
                  fontFamily: font, fontSize: 'clamp(32px,5vw,58px)', fontWeight: 800,
                  lineHeight: 1.1, margin: 0, color: P,
                  opacity: heroVisible ? 1 : 0, transition: 'opacity 500ms ease-in-out',
                }}>
                  <span style={{ display: 'block', color: P }}>{HERO_HEADLINES[heroIndex].line1}</span>
                  <span style={{ display: 'block', color: Accent }}>{HERO_HEADLINES[heroIndex].highlight}</span>
                </h1>
              </div>

              {/* Persona selector */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {(['Marketing Head', 'Founder', 'Agency'] as const).map(p => (
                  <button key={p} onClick={() => setPersona(p)}
                    style={{ fontFamily: fontB, fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 100, background: persona === p ? P : 'transparent', color: persona === p ? '#fff' : PMuted, border: `1.5px solid ${persona === p ? P : PBorder}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {p}
                  </button>
                ))}
              </div>
              <p style={{ fontFamily: fontB, fontSize: 16, lineHeight: 1.65, color: PMuted, margin: '0 0 32px', maxWidth: 480 }}>
                {PERSONA_COPY[persona] ?? PERSONA_COPY.default}
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', marginBottom: 28 }}>
                <Link href="/questionnaire"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: P, color: '#fff', textDecoration: 'none', fontFamily: font, fontWeight: 700, fontSize: 16, padding: '15px 32px', borderRadius: 100 }}>
                  Get My Free Diagnosis <ArrowRight size={16} color="#fff" />
                </Link>
                <Link href="/auth?tab=login"
                  style={{ fontFamily: fontB, fontSize: 14, fontWeight: 600, color: PMuted, textDecoration: 'none' }}>
                  Already have an account
                </Link>
              </div>

              {/* Social proof */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 8 }}>
                <Image src="/images/Frame 245.png" alt="Marketers" width={72} height={28} style={{ borderRadius: 999, height: 28, width: 'auto' }} />
                <span style={{ fontFamily: fontB, fontSize: 13, color: PMuted }}>{liveCount.toLocaleString()} marketers diagnosed this month</span>
              </div>
            </div>

            {/* Right: floating ICP Score card */}
            <div className="hidden lg:flex" style={{ justifyContent: 'center', alignItems: 'center', padding: '24px 0 48px' }}>
              <div className="hero-card" style={{
                background: '#fff', borderRadius: 28,
                boxShadow: '0 40px 100px rgba(48,33,97,0.16), 0 8px 24px rgba(48,33,97,0.08)',
                padding: '28px 28px 24px', width: 340,
                border: `1px solid ${PBorder}`,
                position: 'relative',
              }}>
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <p style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: PMuted, margin: '0 0 4px' }}>ICP Health Score</p>
                    <p style={{ fontFamily: font, fontSize: 44, fontWeight: 800, color: P, margin: 0, lineHeight: 1 }}>73<span style={{ fontSize: 18, color: PMuted }}>/100</span></p>
                  </div>
                  {/* Score ring */}
                  <div style={{ position: 'relative', width: 68, height: 68 }}>
                    <svg width="68" height="68" viewBox="0 0 68 68" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="34" cy="34" r="28" fill="none" stroke="#ede9fe" strokeWidth="7" />
                      <circle cx="34" cy="34" r="28" fill="none" stroke={Accent} strokeWidth="7"
                        strokeDasharray={`${2 * Math.PI * 28 * 0.73} ${2 * Math.PI * 28 * 0.27}`}
                        strokeLinecap="round" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: font, fontSize: 15, fontWeight: 800, color: P }}>73</span>
                    </div>
                  </div>
                </div>

                {/* Dimension bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                  {[
                    { label: 'ICP Alignment',    score: 68, color: '#f59e0b' },
                    { label: 'Message Match',     score: 45, color: '#ef4444' },
                    { label: 'Channel Fit',       score: 81, color: '#22c55e' },
                    { label: 'Budget Allocation', score: 62, color: '#f59e0b' },
                  ].map(({ label, score, color }) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontFamily: fontB, fontSize: 11, color: PMuted }}>{label}</span>
                        <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, color: P }}>{score}</span>
                      </div>
                      <div style={{ height: 5, background: '#f0eeff', borderRadius: 100 }}>
                        <div style={{ height: 5, width: `${score}%`, background: color, borderRadius: 100, transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top finding chip */}
                <div style={{ background: '#fef9c3', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 14 }}>
                  <AlertTriangle size={14} color="#ca8a04" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontFamily: fontB, fontSize: 12, color: '#92400e', fontWeight: 600, lineHeight: 1.4 }}>Top finding: Message-to-Market mismatch detected</span>
                </div>

                {/* Waste estimate */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 0', borderTop: `1px solid ${PBorder}` }}>
                  <span style={{ fontFamily: fontB, fontSize: 12, color: PMuted }}>Est. monthly waste</span>
                  <span style={{ fontFamily: font, fontSize: 18, fontWeight: 800, color: '#ef4444' }}>KES 47,000</span>
                </div>

                {/* Floating badge */}
                <div style={{ position: 'absolute', top: -14, right: 20, background: '#22c55e', color: '#fff', fontFamily: fontB, fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 100, letterSpacing: '0.04em', boxShadow: '0 4px 12px rgba(34,197,94,0.35)' }}>
                  Live Report
                </div>
              </div>
            </div>
          </div>

          {/* Use-case chips strip */}
          <div style={{ borderTop: `1px solid ${PBorder}`, marginTop: 32, padding: '24px 0 0' }}>
            <p style={{ fontFamily: fontB, fontSize: 11, color: PMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>What we diagnose</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 40 }}>
              {USE_CASES.map((chip, i) => (
                <span key={i} style={{ fontFamily: fontB, fontSize: 13, color: P, border: `1px solid ${PBorder}`, borderRadius: 100, padding: '8px 18px', background: Light }}>
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGO STRIP ────────────────────────────────────────────────────── */}
      <div style={{ background: Light, borderTop: `1px solid ${PBorder}`, borderBottom: `1px solid ${PBorder}`, padding: '28px 0' }}>
        <div className="lp-container">
          <p style={{ fontFamily: fontB, fontSize: 11, color: PMuted, textAlign: 'center', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 600 }}>
            Trusted by teams at
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'clamp(20px,5vw,56px)', flexWrap: 'wrap' }}>
            {LOGOS.map(name => (
              <Image key={name} src={`/images/${name}.png`} alt="Company logo" width={120} height={32}
                style={{ height: 26, width: 'auto', opacity: 0.4, objectFit: 'contain', filter: 'grayscale(100%)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── PAIN — dark ─────────────────────────────────────────────────────── */}
      <section id="pain" style={{ background: Dark }}>
        <div className="lp-container" style={{ paddingTop: 'clamp(64px,9vw,112px)', paddingBottom: 'clamp(64px,9vw,112px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48 }} className="lg:grid-cols-2 lg:gap-20">
            {/* Left: heading */}
            <div>
              <span className="lp-tag" style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', marginBottom: 24, display: 'inline-flex' }}>Sound familiar?</span>
              <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,4vw,52px)', color: '#fff', fontWeight: 800, margin: '20px 0 24px', lineHeight: 1.1 }}>
                If two of these are true,{' '}
                <span style={{ color: Accent }}>your ICP needs a fix.</span>
              </h2>
              <p style={{ fontFamily: fontB, fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 400, margin: '0 0 36px' }}>
                The problem is almost never the platform or the creative. It is your ICP. It has a score and a fix.
              </p>
              <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#fff', color: Dark, textDecoration: 'none', fontFamily: font, fontWeight: 700, fontSize: 15, padding: '14px 28px', borderRadius: 100 }}>
                Find My ICP Score <ArrowRight size={16} color={Dark} />
              </Link>
            </div>
            {/* Right: pain list as cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { text: 'Clicks, no conversions', icon: <TrendingDown size={18} color="#ef4444" /> },
                { text: 'Leads your sales team calls garbage', icon: <AlertTriangle size={18} color="#f59e0b" /> },
                { text: 'Agency reports, no real answers', icon: <FileSearch size={18} color={Accent} /> },
                { text: 'Changing creatives, same flat results', icon: <BarChart2 size={18} color="#22c55e" /> },
                { text: 'Budget going somewhere, you cannot see where', icon: <Target size={18} color="#60a5fa" /> },
              ].map(({ text, icon }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', background: 'rgba(255,255,255,0.04)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {icon}
                  </div>
                  <span style={{ fontFamily: fontB, fontSize: 15, color: '#fff', fontWeight: 600, lineHeight: 1.3 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT YOU GET — features grid ──────────────────────────────────── */}
      <section style={{ background: '#fff', padding: 'clamp(64px,9vw,112px) 0' }}>
        <div className="lp-container">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 56 }}>
            <span className="lp-tag" style={{ marginBottom: 20 }}>What You Get</span>
            <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,4vw,52px)', color: P, fontWeight: 800, margin: '0 0 16px', lineHeight: 1.1, maxWidth: 680 }}>
              Everything you need to stop{' '}
              <span style={{ color: Accent }}>guessing.</span>
            </h2>
            <p style={{ fontFamily: fontB, fontSize: 16, color: PMuted, maxWidth: 520, lineHeight: 1.65, margin: 0 }}>
              One 5-minute questionnaire produces a full diagnostic report that tells you where your budget is leaking and what to fix first.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              {
                icon: <BarChart2 size={22} color="#fff" />,
                bg: `linear-gradient(135deg, ${P}, ${Accent})`,
                title: 'ICP Health Score',
                body: 'A single 0-100 score that shows exactly how well your targeting matches your best buyers. Know your baseline instantly.',
              },
              {
                icon: <AlertTriangle size={22} color="#fff" />,
                bg: 'linear-gradient(135deg, #dc2626, #f97316)',
                title: 'Critical Findings',
                body: 'Your top revenue-leaking problems ranked by financial impact. Each one comes with a specific explanation and fix.',
              },
              {
                icon: <Zap size={22} color="#fff" />,
                bg: 'linear-gradient(135deg, #d97706, #f59e0b)',
                title: 'Quick Wins',
                body: 'A prioritized action plan of changes you can make this week. No consultant needed. No ad account access required.',
              },
              {
                icon: <Brain size={22} color="#fff" />,
                bg: 'linear-gradient(135deg, #0891b2, #6366f1)',
                title: 'Competitive Intelligence',
                body: 'Weekly briefings on what your competitors are doing in your market. Benchmarks, CPAs, and audience shift signals.',
              },
            ].map(({ icon, bg, title, body }) => (
              <div key={title} style={{ borderRadius: 20, overflow: 'hidden', background: '#fff', border: `1px solid ${PBorder}`, boxShadow: '0 2px 16px rgba(48,33,97,0.05)' }}>
                {/* Gradient top */}
                <div style={{ background: bg, padding: '28px 24px 24px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {icon}
                  </div>
                  <h3 style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.3 }}>{title}</h3>
                </div>
                {/* Body */}
                <div style={{ padding: '20px 24px 24px' }}>
                  <p style={{ fontFamily: fontB, fontSize: 14, color: PMuted, lineHeight: 1.7, margin: 0 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — dark ─────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ background: Dark, padding: 'clamp(64px,9vw,112px) 0' }}>
        <div className="lp-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 64 }} className="lg:grid-cols-2 lg:gap-20">
            {/* Left: steps */}
            <div>
              <span className="lp-tag" style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', marginBottom: 24, display: 'inline-flex' }}>How It Works</span>
              <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,4vw,48px)', color: '#fff', fontWeight: 800, margin: '20px 0 48px', lineHeight: 1.1 }}>
                Three steps to<br /><span style={{ color: Accent }}>clarity.</span>
              </h2>

              {[
                { num: '01', title: 'Answer 20 questions', body: 'Tell us about your targeting, budget, and funnel. No ad account access needed. Takes 5 minutes.', chip: '5 min' },
                { num: '02', title: 'Get your ICP report', body: 'Your health score, monthly waste estimate, and findings ranked by revenue impact. Delivered instantly.', chip: 'Instant' },
                { num: '03', title: 'Fix what is broken', body: 'Follow the prioritized action plan. Subscribe for ongoing monitoring and weekly competitive intelligence.', chip: 'Start today' },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'flex-start', paddingBottom: 36, marginBottom: 36, borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${P},${Accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: font, fontSize: 14, fontWeight: 800, color: '#fff' }}>
                    {step.num}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <h3 style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>{step.title}</h3>
                      <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, background: 'rgba(124,58,237,0.25)', color: '#a78bfa', padding: '3px 10px', borderRadius: 100 }}>{step.chip}</span>
                    </div>
                    <p style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>{step.body}</p>
                  </div>
                </div>
              ))}

              <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#fff', color: Dark, textDecoration: 'none', fontFamily: font, fontWeight: 700, fontSize: 15, padding: '14px 28px', borderRadius: 100 }}>
                Get My Free ICP Report <ArrowRight size={16} color={Dark} />
              </Link>
            </div>

            {/* Right: checklist card */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 24, padding: 'clamp(24px,4vw,40px)', width: '100%' }}>
                <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', margin: '0 0 20px' }}>Your free report includes</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    'ICP health score (0-100)',
                    'Monthly revenue waste estimate',
                    'Top 3 critical findings with explanations',
                    'Quick wins action plan for this week',
                    'Regional benchmark comparison',
                    'Score trend tracking over time',
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: `linear-gradient(135deg,${P},${Accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={12} color="#fff" />
                      </div>
                      <span style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>{item}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 32, padding: '20px', background: 'rgba(124,58,237,0.15)', borderRadius: 14, border: '1px solid rgba(124,58,237,0.25)' }}>
                  <p style={{ fontFamily: fontB, fontSize: 12, color: '#a78bfa', margin: '0 0 4px', fontWeight: 600 }}>No card needed</p>
                  <p style={{ fontFamily: font, fontSize: 15, color: '#fff', fontWeight: 700, margin: '0 0 2px' }}>Free forever. Upgrade when you are ready.</p>
                  <p style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Paid plans start at KES 6,500/month.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COST STAT — light ──────────────────────────────────────────────── */}
      <section id="cost" style={{ background: Light, padding: 'clamp(64px,9vw,112px) 0' }}>
        <div className="lp-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 64 }} className="lg:grid-cols-2 lg:gap-20">
            {/* Left: counter */}
            <div>
              <span className="lp-tag" style={{ marginBottom: 20, display: 'inline-flex' }}>What inaction costs</span>
              <span ref={countRef} style={{ fontFamily: font, fontSize: 'clamp(48px,8vw,96px)', fontWeight: 800, color: P, lineHeight: 1, display: 'block', margin: '20px 0 12px' }}>KES 0</span>
              <p style={{ fontFamily: fontB, fontSize: 16, color: Accent, margin: '0 0 40px', fontWeight: 600 }}>average monthly waste found per diagnosis</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { pct: '43%', label: 'Wrong audience targeting', color: '#ef4444', Icon: Target },
                  { pct: '31%', label: 'Landing page friction',    color: '#f59e0b', Icon: TrendingDown },
                  { pct: '26%', label: 'Budget on wrong channels', color: Accent,    Icon: BarChart2 },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: '#fff', borderRadius: 14, border: `1px solid ${PBorder}`, boxShadow: '0 2px 8px rgba(48,33,97,0.04)' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: row.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <row.Icon size={18} color={row.color} />
                    </div>
                    <span style={{ fontFamily: font, fontSize: 22, fontWeight: 800, color: row.color, minWidth: 56 }}>{row.pct}</span>
                    <span style={{ fontFamily: fontB, fontSize: 14, color: PMuted }}>{row.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: calculator */}
            <div>
              <div style={{ background: Dark, borderRadius: 24, padding: 'clamp(24px,4vw,40px)', boxShadow: '0 20px 60px rgba(13,11,26,0.15)' }}>
                <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', margin: '0 0 16px' }}>Waste calculator</p>
                <h3 style={{ fontFamily: font, fontSize: 22, color: '#fff', fontWeight: 700, margin: '0 0 24px' }}>How much are you losing?</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>KES</span>
                    <input type="number" placeholder="Monthly ad budget" value={calcBudget} onChange={e => setCalcBudget(e.target.value)}
                      style={{ width: '100%', padding: '14px 14px 14px 52px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', fontFamily: fontB, fontSize: 14, color: '#fff', outline: 'none', background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input type="number" placeholder="Current conversion rate" value={calcConvRate} onChange={e => setCalcConvRate(e.target.value)}
                      style={{ width: '100%', padding: '14px 40px 14px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', fontFamily: fontB, fontSize: 14, color: '#fff', outline: 'none', background: 'rgba(255,255,255,0.06)' }} />
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>%</span>
                  </div>
                </div>
                <button onClick={handleCalc} style={{ width: '100%', background: `linear-gradient(135deg,${P},${Accent})`, color: '#fff', fontFamily: font, fontSize: 15, fontWeight: 700, borderRadius: 100, padding: '14px 0', border: 'none', cursor: 'pointer' }}>
                  Calculate My Waste
                </button>
                {calcResult !== null && (
                  <div style={{ marginTop: 24, textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: 14 }}>
                    <p style={{ fontFamily: font, fontSize: 32, color: '#ef4444', margin: '0 0 6px', fontWeight: 800 }}>
                      KES {calcResult.toLocaleString()}
                    </p>
                    <p style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 16px' }}>estimated wasted per month</p>
                    <Link href="/questionnaire" style={{ display: 'block', background: '#fff', color: Dark, fontFamily: font, fontSize: 14, fontWeight: 700, borderRadius: 100, padding: '13px 0', textDecoration: 'none' }}>
                      Get My Free Diagnosis
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROOF — white ──────────────────────────────────────────────────── */}
      <section id="results" style={{ background: '#fff', padding: 'clamp(64px,9vw,112px) 0' }}>
        <div className="lp-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48 }} className="lg:grid-cols-2 lg:gap-20">
            {/* Left: quote */}
            <div>
              <span className="lp-tag" style={{ marginBottom: 20, display: 'inline-flex' }}>Real Result</span>
              <h2 style={{ fontFamily: font, fontSize: 'clamp(26px,3.5vw,44px)', color: P, fontWeight: 800, margin: '20px 0 32px', lineHeight: 1.15 }}>
                From zero leads to converting{' '}
                <span style={{ color: Accent }}>in week one.</span>
              </h2>
              <blockquote style={{ fontFamily: font, fontSize: 'clamp(16px,2.5vw,22px)', color: P, lineHeight: 1.5, margin: '0 0 28px', fontStyle: 'italic', padding: '0 0 0 20px', borderLeft: `3px solid ${Accent}` }}>
                &ldquo;I did not need a new campaign. I needed someone to tell me my landing page was broken. The diagnosis did that in 5 minutes.&rdquo;
              </blockquote>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: Light }}>
                  <Image src="/images/Holder-1.png" alt="James M." width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <p style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: P, margin: 0 }}>James M.</p>
                  <p style={{ fontFamily: fontB, fontSize: 13, color: PMuted, margin: 0 }}>Marketing Manager, Legal Services, Nairobi</p>
                </div>
              </div>
            </div>

            {/* Right: stat cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { num: '14 to 3', label: 'Form fields cut after diagnostic', color: P },
                { num: '0 to 12',  label: 'Qualified leads generated in week one', color: Accent },
                { num: '5 min',    label: 'Time to complete the full diagnosis', color: '#22c55e' },
              ].map(({ num, label, color }) => (
                <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '22px 24px', background: Light, borderRadius: 16, border: `1px solid ${PBorder}` }}>
                  <span style={{ fontFamily: font, fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 800, color, flexShrink: 0, minWidth: 90 }}>{num}</span>
                  <span style={{ fontFamily: fontB, fontSize: 14, color: PMuted, lineHeight: 1.4 }}>{label}</span>
                </div>
              ))}
              <p style={{ fontFamily: fontB, fontSize: 13, color: PMuted, margin: '8px 0 0', paddingLeft: 4 }}>
                {liveCount.toLocaleString()} marketers have diagnosed their ICP this month
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST — light ──────────────────────────────────────────────────── */}
      <section style={{ background: Light, padding: 'clamp(48px,7vw,80px) 0' }}>
        <div className="lp-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { Icon: Shield, color: '#16a34a', bg: '#dcfce7', title: 'No ad account access', body: 'No Google OAuth. No Meta permissions. Zero.' },
              { Icon: Globe,  color: '#3b82f6', bg: '#dbeafe', title: '10+ markets covered',  body: 'Kenya, Nigeria, South Africa, UK, US and more.' },
              { Icon: Users,  color: Accent,    bg: '#ede9fe', title: 'Built by media buyers', body: 'USD 2M+ in spend managed. Real buyers built every rule.' },
              { Icon: Lock,   color: '#d97706', bg: '#fef3c7', title: 'Your data is private',  body: 'Stored securely. Never shared. Never sold.' },
            ].map(({ Icon, color, bg, title, body }) => (
              <div key={title} style={{ background: '#fff', borderRadius: 18, padding: '24px 22px', border: `1px solid ${PBorder}`, boxShadow: '0 2px 12px rgba(48,33,97,0.04)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={20} color={color} />
                </div>
                <h3 style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: P, margin: '0 0 8px' }}>{title}</h3>
                <p style={{ fontFamily: fontB, fontSize: 13, color: PMuted, lineHeight: 1.6, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: '#fff', padding: 'clamp(64px,9vw,112px) 0' }}>
        <div className="lp-container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="lp-tag" style={{ marginBottom: 20, display: 'inline-flex' }}>Simple Pricing</span>
            <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,4vw,52px)', color: P, fontWeight: 800, margin: '20px 0 14px', lineHeight: 1.1 }}>
              Start free. Upgrade when ready.
            </h2>
            <p style={{ fontFamily: fontB, fontSize: 16, color: PMuted, maxWidth: 440, margin: '0 auto 32px', lineHeight: 1.6 }}>
              Free shows what is broken. Paid shows exactly why, backed by live research.
            </p>

            {/* Billing toggle */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: Light, borderRadius: 100, padding: '6px 20px 6px 6px', border: `1px solid ${PBorder}` }}>
              <button onClick={() => setBillingAnnual(false)}
                style={{ fontFamily: fontB, fontSize: 13, fontWeight: 700, padding: '7px 18px', borderRadius: 100, background: !billingAnnual ? '#fff' : 'transparent', color: !billingAnnual ? P : PMuted, border: 'none', cursor: 'pointer', boxShadow: !billingAnnual ? '0 2px 8px rgba(48,33,97,0.1)' : 'none', transition: 'all 0.15s' }}>
                Monthly
              </button>
              <button onClick={() => setBillingAnnual(true)}
                style={{ fontFamily: fontB, fontSize: 13, fontWeight: 700, padding: '7px 18px', borderRadius: 100, background: billingAnnual ? '#fff' : 'transparent', color: billingAnnual ? P : PMuted, border: 'none', cursor: 'pointer', boxShadow: billingAnnual ? '0 2px 8px rgba(48,33,97,0.1)' : 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8 }}>
                Annual <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 700 }}>2 months free</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, maxWidth: 1000, margin: '0 auto' }}>
            {TIERS.map((tier) => (
              <div key={tier.name} style={{ borderRadius: 24, padding: 'clamp(24px,3vw,36px) clamp(20px,3vw,32px)', position: 'relative', background: tier.highlight ? `linear-gradient(160deg,${P},${Accent})` : '#fff', border: tier.highlight ? 'none' : `1.5px solid ${PBorder}`, boxShadow: tier.highlight ? '0 24px 64px rgba(48,33,97,0.3)' : '0 2px 16px rgba(48,33,97,0.05)' }}>
                {tier.highlight && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)' }}>
                    <span style={{ display: 'inline-block', background: '#22c55e', color: '#fff', fontFamily: fontB, fontSize: 11, fontWeight: 700, padding: '5px 16px', borderRadius: 100, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}>Most Popular</span>
                  </div>
                )}
                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: tier.highlight ? 'rgba(255,255,255,0.55)' : PMuted }}>{tier.name}</span>
                </div>
                <p style={{ fontFamily: font, fontSize: 32, fontWeight: 800, color: tier.highlight ? '#fff' : P, margin: '0 0 4px' }}>
                  {billingAnnual ? tier.annual : tier.monthly}
                </p>
                <p style={{ fontFamily: fontB, fontSize: 12, color: tier.highlight ? 'rgba(255,255,255,0.5)' : PMuted, margin: '0 0 20px' }}>{billingAnnual ? 'per year' : 'per month'}</p>
                <p style={{ fontFamily: fontB, fontSize: 13, color: tier.highlight ? 'rgba(255,255,255,0.65)' : PMuted, margin: '0 0 24px', lineHeight: 1.55 }}>{tier.desc}</p>
                <div style={{ margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {tier.bullets.map((bullet, bi) => (
                    <div key={bi} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: tier.highlight ? 'rgba(255,255,255,0.15)' : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={11} color={tier.highlight ? '#fff' : Accent} />
                      </div>
                      <span style={{ fontFamily: fontB, fontSize: 13, color: tier.highlight ? 'rgba(255,255,255,0.85)' : P }}>{bullet}</span>
                    </div>
                  ))}
                </div>
                <Link href={tier.href} style={{ display: 'block', textAlign: 'center', fontFamily: fontB, fontSize: 14, fontWeight: 700, color: tier.highlight ? P : '#fff', background: tier.highlight ? '#fff' : P, padding: '14px 0', borderRadius: 100, textDecoration: 'none' }}>
                  {tier.cta}
                </Link>
                <p style={{ fontFamily: fontB, fontSize: 12, color: tier.highlight ? 'rgba(255,255,255,0.35)' : PMuted, textAlign: 'center', marginTop: 10, marginBottom: 0 }}>Cancel anytime. No contracts.</p>
              </div>
            ))}
          </div>

          {/* Payment logos */}
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: PMuted }}>Secure checkout via</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { src: '/images/logos/paystack-logo_1.png',                alt: 'Paystack',    h: 22 },
                { src: '/images/logos/Visa_Inc._logo_(2014–2021).svg.png', alt: 'Visa',        h: 20 },
                { src: '/images/logos/MasterCard_early_1990s_logo.svg.png', alt: 'Mastercard', h: 28 },
                { src: '/images/logos/M-PESA_LOGO-01.svg.png',             alt: 'M-Pesa',      h: 22 },
              ].map(({ src, alt, h }) => (
                <img key={alt} src={src} alt={alt} style={{ height: h, objectFit: 'contain', opacity: 0.6, filter: 'grayscale(20%)' }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ background: Light, padding: 'clamp(64px,9vw,100px) 0' }}>
        <div className="lp-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48 }} className="lg:grid-cols-[280px_1fr] lg:gap-16">
            <div>
              <span className="lp-tag" style={{ marginBottom: 16, display: 'inline-flex' }}>FAQs</span>
              <h2 style={{ fontFamily: font, fontSize: 'clamp(24px,3vw,40px)', color: P, fontWeight: 800, margin: '16px 0 12px', lineHeight: 1.15 }}>You ask, we answer.</h2>
              <p style={{ fontFamily: fontB, fontSize: 15, color: PMuted, margin: 0, lineHeight: 1.65 }}>Everything you need before getting started.</p>
            </div>
            <div>
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i
                return (
                  <div key={i} style={{ borderBottom: `1px solid ${PBorder}`, overflow: 'hidden' }}>
                    <button onClick={() => setOpenFaq(isOpen ? null : i)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 0', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', gap: 16 }}>
                      <span style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: P, lineHeight: 1.4 }}>{faq.q}</span>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: isOpen ? P : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                        {isOpen ? <ChevronUp size={14} color="#fff" /> : <ChevronDown size={14} color={P} />}
                      </div>
                    </button>
                    <div style={{ maxHeight: isOpen ? 400 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                      <p style={{ fontFamily: fontB, fontSize: 15, lineHeight: 1.75, color: PMuted, padding: '0 0 22px', margin: 0 }}>{faq.a}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA — dark ───────────────────────────────────────────────── */}
      <section style={{ background: Dark, padding: 'clamp(72px,10vw,120px) 0', textAlign: 'center' }}>
        <div className="lp-container">
          <span className="lp-tag" style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', marginBottom: 28, display: 'inline-flex' }}>Act now</span>
          <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,5vw,64px)', color: '#fff', fontWeight: 800, maxWidth: 720, margin: '16px auto 20px', lineHeight: 1.08 }}>
            Your competitors ran ads today{' '}
            <span style={{ color: Accent }}>without knowing their ICP score.</span>
          </h2>
          <p style={{ fontFamily: fontB, fontSize: 16, color: 'rgba(255,255,255,0.45)', maxWidth: 380, margin: '0 auto 40px', lineHeight: 1.65 }}>
            Every week without a diagnosis is budget you will not get back.
          </p>
          <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: font, fontWeight: 700, fontSize: 17, color: Dark, background: '#fff', padding: '18px 48px', borderRadius: 100, textDecoration: 'none' }}>
            Get My Free ICP Score <ArrowRight size={17} color={Dark} />
          </Link>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {['Free forever', 'No credit card', '5 minutes'].map((chip, i) => (
              <span key={chip} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 18 }}>·</span>}
                <span style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{chip}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{ background: Dark, borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(36px,5vw,56px) 0 clamp(24px,4vw,36px)' }}>
        <div className="lp-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 28, alignItems: 'flex-start' }}>
            <div>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${P},${Accent})`, flexShrink: 0 }} />
                <span style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: '#fff' }}>ICP Diagnostic</span>
              </Link>
              <p style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0, maxWidth: 220, lineHeight: 1.55 }}>
                Find exactly who your buyers are. Stop wasting budget.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', margin: '0 0 12px' }}>Product</p>
                {[['How It Works', '#how-it-works'], ['Pricing', '#pricing'], ['FAQ', '#faq']].map(([label, href]) => (
                  <a key={label} href={href} style={{ display: 'block', fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', marginBottom: 8 }}>{label}</a>
                ))}
              </div>
              <div>
                <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', margin: '0 0 12px' }}>Company</p>
                {[['About', '/about'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([label, href]) => (
                  <Link key={label} href={href} style={{ display: 'block', fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', marginBottom: 8 }}>{label}</Link>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <span style={{ fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.22)' }}>2026 ICP Diagnostic. All rights reserved.</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {[
                { src: '/images/logos/paystack-logo_1.png',                alt: 'Paystack',    h: 16 },
                { src: '/images/logos/Visa_Inc._logo_(2014–2021).svg.png', alt: 'Visa',        h: 14 },
                { src: '/images/logos/MasterCard_early_1990s_logo.svg.png', alt: 'Mastercard', h: 20 },
                { src: '/images/logos/M-PESA_LOGO-01.svg.png',             alt: 'M-Pesa',      h: 16 },
              ].map(({ src, alt, h }) => (
                <img key={alt} src={src} alt={alt} style={{ height: h, objectFit: 'contain', opacity: 0.3, filter: 'brightness(10)' }} />
              ))}
            </div>
          </div>
        </div>
      </footer>

      <SocialProofToast />

      {/* Sticky bar */}
      {showStickyBar && !stickyDismissed && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999, background: '#fff', borderTop: `1px solid ${PBorder}`, padding: '12px clamp(16px,4vw,28px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, boxShadow: '0 -4px 24px rgba(0,0,0,0.07)' }}>
          <p style={{ fontFamily: fontB, fontSize: 14, color: P, fontWeight: 600, margin: 0, flex: 1 }}>
            Free ICP Score. 5 minutes. No card needed.
          </p>
          <Link href="/questionnaire" style={{ fontFamily: fontB, fontSize: 13, fontWeight: 700, background: P, color: '#fff', padding: '10px 22px', borderRadius: 100, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Get Free Score
          </Link>
          <button onClick={() => { setStickyDismissed(true); sessionStorage.setItem('sticky_dismissed', '1') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <X size={17} color={PMuted} />
          </button>
        </div>
      )}
    </>
  )
}
