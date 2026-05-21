'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, Check, Menu, X, Filter, TrendingDown,
  Target, Shield, Globe, Users, Lock, ChevronDown, ChevronUp,
} from 'lucide-react'
import SocialProofToast from '@/components/SocialProofToast'
export const dynamic = 'force-static'

const P       = '#302161'
const Pmuted  = 'rgba(48,33,97,0.5)'
const Pborder = 'rgba(48,33,97,0.08)'
const BgAlt   = '#f8f7ff'
const font    = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontB   = "'PolySans Neutral', -apple-system, system-ui, sans-serif"
const Pbody   = 'rgba(48,33,97,0.88)'

const HERO_HEADLINES = [
  { line1: 'You are not bad at marketing.', line2: 'You are targeting the wrong people.' },
  { line1: 'Your ads are getting clicks.', line2: 'They are just not becoming leads.' },
  { line1: 'You are not spending too little.', line2: 'You are spending in the wrong places.' },
  { line1: 'Your ICP is wrong.', line2: 'That is why nothing is working.' },
]

const HERO_CARDS = [
  { stat: '40-60%', description: 'Of ad budgets wasted on wrong audience targeting' },
  { stat: 'KES 50K+', description: 'Average monthly waste found per client diagnosis' },
  { stat: '5 min', description: 'To complete your full ICP diagnostic' },
  { stat: '3x', description: 'Average improvement in lead quality after ICP fix' },
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
      setTimeout(() => { setHeroIndex(i => (i + 1) % HERO_HEADLINES.length); setHeroVisible(true) }, 600)
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
        const target   = 47000
        const duration = 2000
        const start    = performance.now()
        const tick = (now: number) => {
          const elapsed  = now - start
          const progress = Math.min(elapsed / duration, 1)
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

  const advanceHero = () => {
    setHeroVisible(false)
    setTimeout(() => { setHeroIndex(i => (i + 1) % HERO_CARDS.length); setHeroVisible(true) }, 600)
  }

  const handleCalc = () => {
    const budget = parseFloat(calcBudget.replace(/,/g, ''))
    const rate   = parseFloat(calcConvRate)
    if (isNaN(budget) || isNaN(rate) || budget <= 0 || rate < 0) return
    setCalcResult(rate < 3.5 ? Math.round(budget * (1 - rate / 3.5)) : Math.round(budget * 0.1))
  }

  return (
    <>
      <style>{`
        .container { max-width: 1320px; margin: 0 auto; padding: 0 clamp(20px,4vw,60px); }
        * { box-sizing: border-box; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', justifyContent: 'center', padding: '14px 20px', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 1320, width: '100%', background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 100, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#302161,#7c3aed)', flexShrink: 0 }} />
            <span style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: P }}>ICP Diagnostic</span>
          </Link>
          <div className="hidden md:flex" style={{ gap: 32 }}>
            {[['How It Works', '#how-it-works'], ['Results', '#results'], ['Pricing', '#pricing'], ['FAQ', '#faq']].map(([label, href]) => (
              <a key={href} href={href} style={{ fontFamily: fontB, fontSize: 14, color: Pmuted, textDecoration: 'none', fontWeight: 500 }}>{label}</a>
            ))}
          </div>
          <div className="hidden md:flex" style={{ gap: 12, alignItems: 'center' }}>
            <Link href="/auth?tab=login" style={{ fontFamily: fontB, fontSize: 14, color: P, textDecoration: 'none', fontWeight: 600 }}>Login</Link>
            <Link href="/questionnaire" style={{ fontFamily: fontB, fontSize: 14, fontWeight: 700, color: '#fff', background: P, padding: '10px 22px', borderRadius: 100, textDecoration: 'none' }}>Get Free Diagnosis</Link>
          </div>
          <button className="md:hidden" onClick={() => setMobileOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
            {mobileOpen ? <X size={22} color={P} /> : <Menu size={22} color={P} />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 49, background: '#fff', display: 'flex', flexDirection: 'column', padding: '100px 40px 40px', gap: 32 }}>
          {[['How It Works', '#how-it-works'], ['Results', '#results'], ['Pricing', '#pricing'], ['FAQ', '#faq']].map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMobileOpen(false)} style={{ fontFamily: font, fontSize: 22, color: P, textDecoration: 'none', fontWeight: 700 }}>{label}</a>
          ))}
          <Link href="/questionnaire" onClick={() => setMobileOpen(false)} style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: '#fff', background: P, padding: '18px 32px', borderRadius: 14, textDecoration: 'none', textAlign: 'center', marginTop: 16 }}>Get Free Diagnosis</Link>
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{ background: '#fff', paddingTop: 120, paddingBottom: 80 }}>
        <div className="container">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">

            {/* Left */}
            <div className="flex flex-col justify-center lg:w-1/2 lg:flex-none">
              <p style={{ fontFamily: fontB, fontSize: 12, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, margin: '0 0 16px' }}>
                ICP Diagnostic Tool
              </p>

              <div style={{ minHeight: 'clamp(170px,22vw,230px)', marginBottom: 20 }}>
                <h1 style={{ fontFamily: font, fontSize: 'clamp(40px,5.5vw,68px)', fontWeight: 800, lineHeight: 1.05, margin: 0, opacity: heroVisible ? 1 : 0, transition: 'opacity 600ms ease-in-out' }}>
                  <span style={{ color: P, display: 'block' }}>{HERO_HEADLINES[heroIndex].line1}</span>
                  <span style={{ color: '#a855f7', display: 'block' }}>{HERO_HEADLINES[heroIndex].line2}</span>
                </h1>
              </div>

              {/* Persona selector */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, fontWeight: 500, margin: '0 0 10px' }}>I am a:</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {(['Marketing Head', 'Founder', 'Agency'] as const).map(p => (
                    <button key={p} onClick={() => setPersona(p)}
                      style={{ fontFamily: fontB, fontSize: 13, fontWeight: 600, padding: '7px 18px', borderRadius: 100, background: persona === p ? P : '#fff', color: persona === p ? '#fff' : P, border: `1.5px solid ${persona === p ? P : Pborder}`, cursor: 'pointer' }}>
                      {p}
                    </button>
                  ))}
                </div>
                <p style={{ fontFamily: fontB, fontSize: 16, lineHeight: 1.6, color: Pmuted, margin: 0, maxWidth: 440 }}>
                  {PERSONA_COPY[persona] ?? PERSONA_COPY.default}
                </p>
              </div>

              {/* CTA */}
              <div style={{ marginTop: 24 }}>
                <Link href="/questionnaire"
                  className="w-full sm:w-auto"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: P, color: '#fff', textDecoration: 'none', fontFamily: font, fontWeight: 600, fontSize: 16, padding: '16px 32px', borderRadius: 14, boxShadow: '0 8px 28px rgba(48,33,97,0.22)' }}>
                  Get My Free Diagnosis <ArrowRight size={17} color="#fff" />
                </Link>
              </div>

              {/* Trust */}
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Image src="/images/Frame 245.png" alt="Marketers using ICP Diagnostic" width={64} height={28} style={{ borderRadius: 999, height: 28, width: 'auto' }} />
                <div>
                  <span style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(48,33,97,0.6)' }}>Join {liveCount.toLocaleString()} marketers</span>
                  <span style={{ fontFamily: fontB, fontSize: 12, color: 'rgba(48,33,97,0.4)', display: 'block' }}>No credit card. No ad account access.</span>
                </div>
              </div>
            </div>

            {/* Right — stat cards */}
            <div className="lg:flex-1" style={{ display: 'flex', alignItems: 'flex-end', gap: 12, overflow: 'hidden', minHeight: 420 }}>
              <div style={{ width: '38%', height: 340, borderRadius: 24, background: 'linear-gradient(135deg,#302161,#6c4ddd)', opacity: heroVisible ? 0.72 : 0, transition: 'opacity 600ms ease-in-out', position: 'relative', overflow: 'hidden', padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', flexShrink: 0 }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p style={{ fontFamily: font, fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>{HERO_CARDS[(heroIndex + 1) % HERO_CARDS.length].stat}</p>
                  <p style={{ fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5 }}>{HERO_CARDS[(heroIndex + 1) % HERO_CARDS.length].description}</p>
                </div>
              </div>
              <div style={{ flex: 1, height: 420, borderRadius: 24, background: 'linear-gradient(135deg,#4c1d95,#7c3aed)', position: 'relative', overflow: 'hidden', padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 220, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <p style={{ fontFamily: font, fontSize: 64, fontWeight: 800, color: '#fff', margin: '0 0 8px', lineHeight: 1 }}>{HERO_CARDS[heroIndex].stat}</p>
                    <p style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5, maxWidth: 200 }}>{HERO_CARDS[heroIndex].description}</p>
                  </div>
                  <button onClick={advanceHero} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ArrowRight size={18} color="#fff" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Region bar */}
      <div style={{ background: '#fff', borderTop: `1px solid ${Pborder}`, borderBottom: `1px solid ${Pborder}`, padding: '16px 0', textAlign: 'center' }}>
        <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: 0 }}>
          Used by marketing teams in Kenya, Nigeria, South Africa, UK and US
        </p>
      </div>

      {/* ── PAIN ─────────────────────────────────────────────────────────────── */}
      <section id="pain" style={{ background: '#fff', padding: '96px 0' }}>
        <div className="container">
          <h2 style={{ fontFamily: font, fontSize: 'clamp(26px,3vw,40px)', color: P, fontWeight: 700, textAlign: 'center', margin: '0 0 12px' }}>Does any of this sound familiar?</h2>
          <p style={{ fontFamily: fontB, fontSize: 15, color: Pmuted, textAlign: 'center', margin: '0 0 56px' }}>If two sound familiar, your ICP needs a fix.</p>

          {/* Pain list — short phrases, no cards */}
          <div style={{ maxWidth: 720, margin: '0 auto 56px' }}>
            {[
              'Clicks, no conversions',
              'Leads your sales team calls garbage',
              'Agency reports, no real answers',
              'Changing creatives, same flat results',
              'Budget going somewhere, you just cannot see where',
            ].map((pain, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 0', borderBottom: i < 4 ? `1px solid ${Pborder}` : 'none' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                <span style={{ fontFamily: fontB, fontSize: 17, color: P, lineHeight: 1.4 }}>{pain}</span>
              </div>
            ))}
          </div>

          {/* Dark CTA card */}
          <div style={{ background: 'linear-gradient(135deg,#302161 0%,#4c1d95 100%)', borderRadius: 20, padding: 'clamp(28px,4vw,40px) clamp(24px,5vw,48px)', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontFamily: font, fontSize: 20, color: '#fff', fontWeight: 700, margin: '0 0 6px' }}>The problem is almost never the platform or the creative.</p>
              <p style={{ fontFamily: fontB, fontSize: 15, color: 'rgba(255,255,255,0.68)', margin: 0 }}>It is your ICP. It has a score and a fix.</p>
            </div>
            <Link href="/questionnaire" style={{ fontFamily: fontB, fontSize: 15, fontWeight: 600, background: '#fff', color: P, padding: '14px 28px', borderRadius: 12, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Find My ICP Score
            </Link>
          </div>
        </div>
      </section>

      {/* ── COST ─────────────────────────────────────────────────────────────── */}
      <section id="cost" style={{ background: BgAlt, padding: '96px 0' }}>
        <div className="container">
          <h2 style={{ fontFamily: font, fontSize: 'clamp(26px,3vw,40px)', color: P, fontWeight: 700, textAlign: 'center', margin: '0 0 8px' }}>What inaction costs you every month.</h2>
          <p style={{ fontFamily: fontB, fontSize: 15, color: Pmuted, textAlign: 'center', margin: '0 0 40px' }}>Average waste found per diagnosis across the platform</p>

          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span ref={countRef} style={{ fontFamily: font, fontSize: 'clamp(56px,7vw,96px)', fontWeight: 800, color: '#ef4444' }}>KES 0</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" style={{ marginBottom: 56 }}>
            {[
              { icon: <Target size={22} color="#ef4444" />, bg: '#fee2e2', pct: '43%', label: 'Wrong audience targeting' },
              { icon: <Filter size={22} color="#f59e0b" />, bg: '#fef3c7', pct: '31%', label: 'Landing page friction' },
              { icon: <TrendingDown size={22} color="#a855f7" />, bg: '#f3e8ff', pct: '26%', label: 'Budget on wrong channels' },
            ].map((card, i) => (
              <div key={i} style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 20, padding: '28px 24px', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  {card.icon}
                </div>
                <p style={{ fontFamily: font, fontSize: 36, fontWeight: 800, color: P, margin: '0 0 6px' }}>{card.pct}</p>
                <p style={{ fontFamily: fontB, fontSize: 14, color: Pmuted, margin: 0 }}>{card.label}</p>
              </div>
            ))}
          </div>

          {/* Waste calculator */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 560, margin: '0 auto', border: `1px solid ${Pborder}` }}>
            <h3 style={{ fontFamily: font, fontSize: 17, color: P, fontWeight: 600, margin: '0 0 20px' }}>Calculate your estimated waste</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: fontB, fontSize: 13, color: Pmuted }}>KES</span>
                <input type="number" placeholder="Monthly budget" value={calcBudget} onChange={e => setCalcBudget(e.target.value)}
                  style={{ width: '100%', padding: '13px 14px 13px 52px', borderRadius: 12, border: `1.5px solid ${Pborder}`, fontFamily: fontB, fontSize: 15, color: P, outline: 'none', background: BgAlt }} />
              </div>
              <div style={{ position: 'relative' }}>
                <input type="number" placeholder="Conversion rate" value={calcConvRate} onChange={e => setCalcConvRate(e.target.value)}
                  style={{ width: '100%', padding: '13px 40px 13px 14px', borderRadius: 12, border: `1.5px solid ${Pborder}`, fontFamily: fontB, fontSize: 15, color: P, outline: 'none', background: BgAlt }} />
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: fontB, fontSize: 13, color: Pmuted }}>%</span>
              </div>
            </div>
            <button onClick={handleCalc} style={{ width: '100%', background: P, color: '#fff', fontFamily: font, fontSize: 15, fontWeight: 600, borderRadius: 12, padding: 13, border: 'none', cursor: 'pointer' }}>
              Calculate My Waste
            </button>
            {calcResult !== null && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <p style={{ fontFamily: font, fontSize: 28, color: '#ef4444', margin: '0 0 8px' }}>
                  KES {calcResult.toLocaleString()} wasted per month.
                </p>
                <p style={{ fontFamily: fontB, fontSize: 14, color: Pmuted, margin: '0 0 16px' }}>Get your free diagnosis to find out exactly where.</p>
                <Link href="/questionnaire" style={{ display: 'block', background: P, color: '#fff', fontFamily: font, fontSize: 15, fontWeight: 600, borderRadius: 12, padding: '13px 0', textDecoration: 'none', textAlign: 'center' }}>
                  Get My Free Diagnosis
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ background: '#fff', padding: '96px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span style={{ display: 'inline-block', background: '#ede9fe', color: P, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', padding: '5px 14px', borderRadius: 100 }}>How It Works</span>
          </div>
          <h2 style={{ fontFamily: font, fontSize: 'clamp(26px,3vw,40px)', color: P, fontWeight: 700, textAlign: 'center', margin: '0 0 12px' }}>Three steps to clarity.</h2>
          <p style={{ fontFamily: fontB, fontSize: 15, color: Pmuted, textAlign: 'center', margin: '0 0 56px' }}>From broken campaigns to clear answers in 5 minutes.</p>

          <div style={{ position: 'relative', marginBottom: 48 }}>
            <div className="hidden lg:block" style={{ position: 'absolute', top: 28, left: 'calc(16.67% + 28px)', right: 'calc(16.67% + 28px)', height: 1, borderTop: '1px dashed rgba(48,33,97,0.15)', zIndex: 0 }} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {[
                { num: '01', bg: P,         title: 'Answer 20 questions', body: 'Tell us about your targeting and funnel. No ad account access needed.', chip: '5 minutes' },
                { num: '02', bg: '#a855f7', title: 'Get your report',      body: 'Your ICP health score, monthly waste estimate, and top findings ranked by revenue impact.', chip: 'Instant' },
                { num: '03', bg: '#22c55e', title: 'Fix what is broken',   body: 'Follow the prioritized action plan. Subscribe for ongoing monitoring and weekly intelligence.', chip: 'Start today' },
              ].map((step, i) => (
                <div key={i} style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 56, height: 56, background: step.bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <span style={{ fontFamily: font, fontSize: 20, fontWeight: 700, color: '#fff' }}>{step.num}</span>
                  </div>
                  <h3 style={{ fontFamily: font, fontSize: 19, fontWeight: 700, color: P, margin: '0 0 10px' }}>{step.title}</h3>
                  <p style={{ fontFamily: fontB, fontSize: 14, color: Pmuted, lineHeight: 1.65, margin: '0 0 14px' }}>{step.body}</p>
                  <span style={{ display: 'inline-block', background: '#ede9fe', color: P, fontFamily: fontB, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 100 }}>{step.chip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What is included */}
          <div style={{ background: BgAlt, borderRadius: 20, padding: '28px 36px', maxWidth: 600, margin: '0 auto', border: `1px solid ${Pborder}` }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 justify-between">
              <div>
                <p style={{ fontFamily: fontB, fontSize: 12, color: Pmuted, fontWeight: 700, margin: '0 0 14px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Your free report includes</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {['ICP health score (0-100)', 'Monthly waste estimate', 'Top 3 findings with fixes', 'Quick wins for this week', 'Regional benchmark comparison'].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <Check size={15} color={P} />
                      <span style={{ fontFamily: fontB, fontSize: 14, color: P }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <p style={{ fontFamily: font, fontSize: 48, fontWeight: 800, color: '#22c55e', lineHeight: 1, margin: '0 0 4px' }}>Free</p>
                <p style={{ fontFamily: fontB, fontSize: 12, color: Pmuted, margin: 0 }}>no credit card</p>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link href="/questionnaire" style={{ display: 'inline-block', background: P, color: '#fff', fontFamily: font, fontWeight: 600, fontSize: 15, padding: '16px 36px', borderRadius: 14, textDecoration: 'none' }}>
              Get My Free ICP Report
            </Link>
          </div>
        </div>
      </section>

      {/* ── PROOF ────────────────────────────────────────────────────────────── */}
      <section id="results" style={{ background: '#fff', padding: '96px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span style={{ display: 'inline-block', background: '#d946ef', color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', padding: '5px 14px', borderRadius: 100 }}>Real Result</span>
          </div>
          <h2 style={{ fontFamily: font, fontSize: 'clamp(26px,3vw,40px)', color: P, fontWeight: 700, textAlign: 'center', margin: '0 0 56px' }}>From zero leads to converting in week one.</h2>

          <div style={{ background: BgAlt, borderRadius: 24, padding: 'clamp(36px,5vw,56px) clamp(24px,5vw,64px)', border: `1px solid ${Pborder}`, marginBottom: 48 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div>
                <div className="grid grid-cols-3 gap-4" style={{ marginBottom: 32 }}>
                  {[['14 to 3', 'Form fields cut'], ['0 to 12', 'Leads, week one'], ['5 min', 'To diagnose']].map(([num, label]) => (
                    <div key={num} style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 12, padding: '16px 20px' }}>
                      <p style={{ fontFamily: font, fontSize: 26, fontWeight: 800, color: P, margin: '0 0 4px' }}>{num}</p>
                      <p style={{ fontFamily: fontB, fontSize: 12, color: Pmuted, margin: 0, lineHeight: 1.4 }}>{label}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontFamily: fontB, fontSize: 15, color: Pmuted, lineHeight: 1.7, margin: '0 0 24px' }}>
                  A legal services firm in Nairobi: 3 months of Google Search ads, zero conversions. Diagnosis found the problem in 5 minutes. Fourteen form fields. Cut to 3. Leads came within 7 days.
                </p>
                <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: fontB, fontSize: 14, fontWeight: 600, color: P, textDecoration: 'none' }}>
                  Get your free diagnosis <ArrowRight size={15} color={P} />
                </Link>
              </div>

              <div style={{ background: P, borderRadius: 20, padding: 36 }}>
                <p style={{ fontFamily: font, fontSize: 56, color: 'rgba(255,255,255,0.18)', margin: '0 0 12px', lineHeight: 1 }}>"</p>
                <p style={{ fontFamily: fontB, fontSize: 17, color: '#fff', fontStyle: 'italic', lineHeight: 1.65, margin: '0 0 24px' }}>
                  I did not need a new campaign. I needed someone to tell me my landing page was broken. The diagnosis did that in 5 minutes.
                </p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: '#fff' }}>JM</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>James M.</p>
                    <p style={{ fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Marketing Manager, Legal Services, Nairobi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p style={{ fontFamily: fontB, fontSize: 16, color: P, fontWeight: 600, textAlign: 'center', margin: 0 }}>
            {liveCount.toLocaleString()} marketers have diagnosed their ICP this month
          </p>
        </div>
      </section>

      {/* ── TRUST ────────────────────────────────────────────────────────────── */}
      <section id="trust" style={{ background: BgAlt, padding: '72px 0' }}>
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { Icon: Shield, bg: '#dcfce7', ic: '#16a34a', title: 'No ad account access', body: 'No Google OAuth. No Meta permissions. Zero.' },
              { Icon: Globe,  bg: '#dbeafe', ic: '#3b82f6', title: '10+ markets covered',  body: 'Kenya, Nigeria, South Africa, UK, US and more. Regional benchmarks built in.' },
              { Icon: Users,  bg: '#f3e8ff', ic: '#a855f7', title: 'Built by media buyers', body: 'USD 2M+ in ad spend managed. Real buyers built every diagnostic rule.' },
              { Icon: Lock,   bg: '#fef3c7', ic: '#f59e0b', title: 'Your data is private',  body: 'Stored securely. Never shared. Never sold.' },
            ].map(({ Icon, bg, ic, title, body }, i) => (
              <div key={i} style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 20, padding: '28px 24px' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} color={ic} />
                </div>
                <h3 style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: P, margin: '14px 0 6px' }}>{title}</h3>
                <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, lineHeight: 1.6, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: '#fff', padding: '96px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span style={{ display: 'inline-block', background: '#ede9fe', color: P, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', padding: '5px 14px', borderRadius: 100 }}>Simple Pricing</span>
          </div>
          <h2 style={{ fontFamily: font, fontSize: 'clamp(26px,3vw,40px)', color: P, fontWeight: 700, textAlign: 'center', margin: '0 0 12px' }}>Start free. Upgrade when ready.</h2>
          <p style={{ fontFamily: fontB, fontSize: 15, color: Pmuted, textAlign: 'center', maxWidth: 480, margin: '0 auto 48px' }}>
            Free shows what is broken. Paid shows exactly why, backed by live research.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 48 }}>
            <span style={{ fontFamily: fontB, fontSize: 14, color: !billingAnnual ? P : Pmuted, fontWeight: !billingAnnual ? 700 : 400 }}>Monthly</span>
            <button onClick={() => setBillingAnnual(b => !b)} style={{ width: 48, height: 26, borderRadius: 100, background: billingAnnual ? P : 'rgba(48,33,97,0.2)', position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: billingAnnual ? 25 : 3, transition: 'left 0.2s' }} />
            </button>
            <span style={{ fontFamily: fontB, fontSize: 14, color: billingAnnual ? P : Pmuted, fontWeight: billingAnnual ? 700 : 400 }}>
              Annual <span style={{ color: '#22c55e', fontWeight: 700 }}>(save 2 months)</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" style={{ maxWidth: 1000, margin: '0 auto' }}>
            {TIERS.map((tier) => (
              <div key={tier.name} style={{ background: tier.highlight ? P : '#fff', border: tier.highlight ? 'none' : `1px solid ${Pborder}`, borderRadius: 20, padding: '36px 28px', position: 'relative' }}>
                {tier.highlight && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)' }}>
                    <span style={{ display: 'inline-block', background: '#a855f7', color: '#fff', fontFamily: fontB, fontSize: 12, fontWeight: 700, padding: '4px 16px', borderRadius: 100, whiteSpace: 'nowrap' }}>Most Popular</span>
                  </div>
                )}
                <h3 style={{ fontFamily: font, fontSize: 20, fontWeight: 700, color: tier.highlight ? '#fff' : P, margin: '0 0 8px' }}>{tier.name}</h3>
                <p style={{ fontFamily: fontB, fontSize: 13, color: tier.highlight ? 'rgba(255,255,255,0.65)' : Pmuted, margin: '0 0 20px', lineHeight: 1.5 }}>{tier.desc}</p>
                <p style={{ fontFamily: font, fontSize: 30, fontWeight: 800, color: tier.highlight ? '#fff' : P, margin: '0 0 4px' }}>
                  {billingAnnual ? tier.annual + '/year' : tier.monthly + '/month'}
                </p>
                <div style={{ margin: '20px 0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {tier.bullets.map((bullet, bi) => (
                    <div key={bi} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <Check size={15} color={tier.highlight ? '#a5f3fc' : '#22c55e'} />
                      <span style={{ fontFamily: fontB, fontSize: 14, color: tier.highlight ? 'rgba(255,255,255,0.85)' : P }}>{bullet}</span>
                    </div>
                  ))}
                </div>
                <Link href={tier.href} style={{ display: 'block', textAlign: 'center', fontFamily: fontB, fontSize: 15, fontWeight: 700, color: tier.highlight ? P : '#fff', background: tier.highlight ? '#fff' : P, padding: '14px 0', borderRadius: 12, textDecoration: 'none' }}>
                  {tier.cta}
                </Link>
                <p style={{ fontFamily: fontB, fontSize: 12, color: tier.highlight ? 'rgba(255,255,255,0.45)' : Pmuted, textAlign: 'center', marginTop: 8, marginBottom: 0 }}>Cancel anytime. No contracts.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ background: BgAlt, padding: '80px 0' }}>
        <div className="container flex flex-col lg:flex-row lg:gap-20 gap-12">
          <div style={{ flexShrink: 0 }} className="lg:w-1/3">
            <p style={{ fontFamily: fontB, fontSize: 13, color: '#d946ef', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '0 0 16px' }}>FAQs</p>
            <h2 style={{ fontFamily: font, fontSize: 'clamp(22px,3vw,32px)', color: P, fontWeight: 700, margin: '0 0 12px' }}>You ask, we answer.</h2>
            <p style={{ fontFamily: fontB, fontSize: 15, color: Pbody, margin: 0 }}>Everything you need before getting started.</p>
          </div>
          <div style={{ flex: 1 }}>
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i
              return (
                <div key={i} style={{ background: '#fff', borderRadius: 16, marginBottom: 8, overflow: 'hidden', border: `1px solid ${Pborder}` }}>
                  <button onClick={() => setOpenFaq(isOpen ? null : i)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: P, lineHeight: 1.4 }}>{faq.q}</span>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: isOpen ? P : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 16 }}>
                      {isOpen ? <ChevronUp size={15} color="#fff" /> : <ChevronDown size={15} color={P} />}
                    </div>
                  </button>
                  <div style={{ maxHeight: isOpen ? 400 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                    <p style={{ fontFamily: fontB, fontSize: 14, lineHeight: 1.75, color: Pbody, padding: '0 28px 24px', margin: 0 }}>{faq.a}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section id="final-cta" style={{ background: 'linear-gradient(135deg,#302161 0%,#4c1d95 100%)', padding: '120px 0', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontFamily: font, fontSize: 'clamp(26px,3.5vw,48px)', color: '#fff', fontWeight: 700, maxWidth: 640, margin: '0 auto 16px', lineHeight: 1.15 }}>
            Your competitors ran ads today without knowing their ICP score.
          </h2>
          <p style={{ fontFamily: fontB, fontSize: 17, color: 'rgba(255,255,255,0.68)', maxWidth: 400, margin: '0 auto 36px', lineHeight: 1.6 }}>
            Every week without a diagnosis is budget you will not get back.
          </p>
          <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: font, fontWeight: 700, fontSize: 17, color: P, background: '#fff', padding: '18px 44px', borderRadius: 14, textDecoration: 'none', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
            Get My Free ICP Score <ArrowRight size={18} color={P} />
          </Link>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {['Free forever', 'No credit card', '5 minutes'].map((chip, i) => (
              <span key={chip} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {i > 0 && <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>}
                <span style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{chip}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#fff', borderTop: `1px solid ${Pborder}`, padding: '48px 0 32px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32, alignItems: 'center' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#302161,#7c3aed)', flexShrink: 0 }} />
              <span style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: P }}>ICP Diagnostic</span>
            </Link>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              {[['About', '/about'], ['Privacy', '/privacy'], ['Terms', '/terms'], ['Contact', 'mailto:hello@idealicp.com']].map(([label, href]) => (
                <Link key={label} href={href} style={{ fontFamily: fontB, fontSize: 14, color: Pbody, textDecoration: 'none' }}>{label}</Link>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontFamily: fontB, fontSize: 13, color: Pmuted }}>2026 ICP Diagnostic. All rights reserved.</span>
            <span style={{ fontFamily: fontB, fontSize: 13, color: Pmuted }}>hello@idealicp.com</span>
          </div>
        </div>
      </footer>

      <SocialProofToast />

      {/* Sticky bar */}
      {showStickyBar && !stickyDismissed && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999, background: P, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, boxShadow: '0 -4px 24px rgba(0,0,0,0.15)' }}>
          <p style={{ fontFamily: fontB, fontSize: 14, color: '#fff', fontWeight: 600, margin: 0, flex: 1 }}>
            Free ICP Score. 5 minutes. No card needed.
          </p>
          <Link href="/questionnaire" style={{ fontFamily: fontB, fontSize: 14, fontWeight: 600, background: '#fff', color: P, padding: '10px 20px', borderRadius: 10, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Get My Free Score
          </Link>
          <button onClick={() => { setStickyDismissed(true); sessionStorage.setItem('sticky_dismissed', '1') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <X size={18} color="rgba(255,255,255,0.7)" />
          </button>
        </div>
      )}
    </>
  )
}
