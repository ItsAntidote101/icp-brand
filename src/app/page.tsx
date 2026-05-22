'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, Check, Menu, X, Filter, TrendingDown,
  Target, Shield, Globe, Users, Lock, ChevronDown, ChevronUp, Zap,
} from 'lucide-react'
import SocialProofToast from '@/components/SocialProofToast'
export const dynamic = 'force-static'

const P       = '#302161'
const Accent  = '#7c3aed'
const Dark    = '#0d0b1a'
const Cream   = '#f5f3ff'
const PMuted  = 'rgba(48,33,97,0.55)'
const PBorder = 'rgba(48,33,97,0.1)'
const font    = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontB   = "'PolySans Neutral', -apple-system, system-ui, sans-serif"

const HERO_HEADLINES = [
  { line1: 'You are not bad at marketing.', line2: 'You are targeting the wrong people.' },
  { line1: 'Your ads are getting clicks.', line2: 'They are just not becoming leads.' },
  { line1: 'You are not spending too little.', line2: 'You are spending in the wrong places.' },
  { line1: 'Your ICP is wrong.', line2: 'That is why nothing is working.' },
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
        .container { max-width: 1280px; margin: 0 auto; padding: 0 clamp(20px,5vw,64px); }
        * { box-sizing: border-box; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: Dark, borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 clamp(20px,5vw,64px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#302161,#7c3aed)', flexShrink: 0 }} />
            <span style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: '#fff' }}>ICP Diagnostic</span>
          </Link>
          <div className="hidden md:flex" style={{ gap: 28 }}>
            {[['How It Works', '#how-it-works'], ['Results', '#results'], ['Pricing', '#pricing'], ['FAQ', '#faq']].map(([label, href]) => (
              <a key={href} href={href} style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontWeight: 500 }}>{label}</a>
            ))}
          </div>
          <div className="hidden md:flex" style={{ gap: 12, alignItems: 'center' }}>
            <Link href="/auth?tab=login" style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
            <Link href="/questionnaire" style={{ fontFamily: fontB, fontSize: 13, fontWeight: 700, color: Dark, background: '#fff', padding: '9px 20px', borderRadius: 100, textDecoration: 'none' }}>Get free diagnostic</Link>
          </div>
          <button className="md:hidden" onClick={() => setMobileOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
            {mobileOpen ? <X size={22} color="#fff" /> : <Menu size={22} color="#fff" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 49, background: Dark, display: 'flex', flexDirection: 'column', padding: '80px 32px 40px' }}>
          {[['How It Works', '#how-it-works'], ['Results', '#results'], ['Pricing', '#pricing'], ['FAQ', '#faq']].map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMobileOpen(false)}
              style={{ fontFamily: font, fontSize: 22, color: '#fff', textDecoration: 'none', fontWeight: 700, padding: '18px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{label}</a>
          ))}
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href="/questionnaire" onClick={() => setMobileOpen(false)} style={{ fontFamily: font, fontSize: 17, fontWeight: 700, color: Dark, background: '#fff', padding: '16px 28px', borderRadius: 100, textDecoration: 'none', textAlign: 'center' }}>Get free diagnostic</Link>
            <Link href="/auth?tab=login" onClick={() => setMobileOpen(false)} style={{ fontFamily: fontB, fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', textAlign: 'center' }}>Log in</Link>
          </div>
        </div>
      )}

      {/* HERO */}
      <section style={{ background: Dark, padding: 'clamp(64px,10vw,120px) 0 0' }}>
        <div className="container">
          <p style={{ fontFamily: fontB, fontSize: 12, color: Accent, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: '0 0 24px', textAlign: 'center' }}>
            ICP Diagnostic Tool
          </p>

          <div style={{ minHeight: 'clamp(100px,16vw,176px)', marginBottom: 32, textAlign: 'center' }}>
            <h1 style={{ fontFamily: font, fontSize: 'clamp(34px,6vw,72px)', fontWeight: 800, lineHeight: 1.06, margin: 0, opacity: heroVisible ? 1 : 0, transition: 'opacity 600ms ease-in-out' }}>
              <span style={{ color: '#fff', display: 'block' }}>{HERO_HEADLINES[heroIndex].line1}</span>
              <span style={{ color: Accent, display: 'block' }}>{HERO_HEADLINES[heroIndex].line2}</span>
            </h1>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 40 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {(['Marketing Head', 'Founder', 'Agency'] as const).map(p => (
                <button key={p} onClick={() => setPersona(p)}
                  style={{ fontFamily: fontB, fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 100, background: persona === p ? '#fff' : 'transparent', color: persona === p ? Dark : 'rgba(255,255,255,0.65)', border: `1.5px solid ${persona === p ? '#fff' : 'rgba(255,255,255,0.18)'}`, cursor: 'pointer' }}>
                  {p}
                </button>
              ))}
            </div>
            <p style={{ fontFamily: fontB, fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)', margin: 0, textAlign: 'center', maxWidth: 480 }}>
              {PERSONA_COPY[persona] ?? PERSONA_COPY.default}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Link href="/questionnaire"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#fff', color: Dark, textDecoration: 'none', fontFamily: font, fontWeight: 700, fontSize: 16, padding: '16px 36px', borderRadius: 100 }}>
              Get My Free Diagnosis <ArrowRight size={17} color={Dark} />
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Image src="/images/Frame 245.png" alt="Marketers" width={64} height={28} style={{ borderRadius: 999, height: 28, width: 'auto' }} />
              <span style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Join {liveCount.toLocaleString()} marketers. No card needed.</span>
            </div>
          </div>

          {/* Use-case chips */}
          <div style={{ marginTop: 72, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ fontFamily: fontB, fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', margin: '28px 0 20px' }}>
              What we diagnose
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingBottom: 56 }}>
              {USE_CASES.map((chip, i) => (
                <span key={i} style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 8, padding: '10px 18px', background: 'rgba(255,255,255,0.03)' }}>
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LOGO STRIP */}
      <div style={{ background: Cream, borderBottom: `1px solid ${PBorder}`, padding: '32px 0' }}>
        <div className="container">
          <p style={{ fontFamily: fontB, fontSize: 11, color: PMuted, textAlign: 'center', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
            Used by teams at
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'clamp(16px,4vw,48px)', flexWrap: 'wrap' }}>
            {LOGOS.map(name => (
              <Image key={name} src={`/images/${name}.png`} alt="Company logo" width={120} height={32}
                style={{ height: 28, width: 'auto', opacity: 0.45, objectFit: 'contain' }} />
            ))}
          </div>
        </div>
      </div>

      {/* PAIN — dark, divider rows */}
      <section id="pain" style={{ background: Dark }}>
        <div className="container">
          <div style={{ paddingTop: 'clamp(56px,8vw,96px)', paddingBottom: 8 }}>
            <p style={{ fontFamily: fontB, fontSize: 11, color: Accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>Sound familiar?</p>
            <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,4.5vw,56px)', color: '#fff', fontWeight: 800, margin: '0 0 8px', lineHeight: 1.08 }}>
              If two of these are true,<br /><span style={{ color: Accent }}>your ICP needs a fix.</span>
            </h2>
          </div>
          {[
            'Clicks, no conversions',
            'Leads your sales team calls garbage',
            'Agency reports, no real answers',
            'Changing creatives, same flat results',
            'Budget going somewhere, you cannot see where',
          ].map((pain, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: 'clamp(20px,3vw,28px) 0', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <Zap size={18} color={Accent} style={{ flexShrink: 0 }} />
              <span style={{ fontFamily: font, fontSize: 'clamp(17px,2.5vw,24px)', color: '#fff', lineHeight: 1.25, fontWeight: 700 }}>{pain}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: 'clamp(32px,5vw,56px) 0' }}>
            <p style={{ fontFamily: fontB, fontSize: 'clamp(15px,2vw,18px)', color: 'rgba(255,255,255,0.55)', margin: '0 0 28px', maxWidth: 560, lineHeight: 1.65 }}>
              The problem is almost never the platform or the creative. It is your ICP. It has a score and a fix.
            </p>
            <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#fff', color: Dark, textDecoration: 'none', fontFamily: font, fontWeight: 700, fontSize: 15, padding: '14px 28px', borderRadius: 100 }}>
              Find My ICP Score <ArrowRight size={16} color={Dark} />
            </Link>
          </div>
        </div>
      </section>

      {/* COST STAT — dark */}
      <section id="cost" style={{ background: Dark, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="container" style={{ paddingTop: 'clamp(56px,8vw,96px)', paddingBottom: 'clamp(56px,8vw,96px)' }}>
          <p style={{ fontFamily: fontB, fontSize: 11, color: Accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>What inaction costs you</p>
          <span ref={countRef} style={{ fontFamily: font, fontSize: 'clamp(52px,10vw,112px)', fontWeight: 800, color: '#fff', lineHeight: 1, display: 'block', marginBottom: 10 }}>KES 0</span>
          <p style={{ fontFamily: fontB, fontSize: 15, color: Accent, margin: '0 0 56px', fontWeight: 600 }}>average monthly waste found per diagnosis (and growing)</p>

          {[
            { icon: <Target size={18} color="#ef4444" />, pct: '43%', label: 'Wrong audience targeting' },
            { icon: <Filter size={18} color="#f59e0b" />, pct: '31%', label: 'Landing page friction' },
            { icon: <TrendingDown size={18} color={Accent} />, pct: '26%', label: 'Budget on wrong channels' },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 'clamp(20px,3vw,28px) 0', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {row.icon}
              </div>
              <span style={{ fontFamily: font, fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 800, color: '#fff', minWidth: 70 }}>{row.pct}</span>
              <span style={{ fontFamily: fontB, fontSize: 15, color: 'rgba(255,255,255,0.55)' }}>{row.label}</span>
            </div>
          ))}

          {/* Calculator */}
          <div style={{ marginTop: 56, background: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 'clamp(24px,4vw,36px)', border: '1px solid rgba(255,255,255,0.09)', maxWidth: 520 }}>
            <h3 style={{ fontFamily: font, fontSize: 18, color: '#fff', fontWeight: 700, margin: '0 0 20px' }}>Calculate your estimated waste</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>KES</span>
                <input type="number" placeholder="Monthly budget" value={calcBudget} onChange={e => setCalcBudget(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 48px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', fontFamily: fontB, fontSize: 14, color: '#fff', outline: 'none', background: 'rgba(255,255,255,0.05)' }} />
              </div>
              <div style={{ position: 'relative' }}>
                <input type="number" placeholder="Conversion rate" value={calcConvRate} onChange={e => setCalcConvRate(e.target.value)}
                  style={{ width: '100%', padding: '12px 36px 12px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', fontFamily: fontB, fontSize: 14, color: '#fff', outline: 'none', background: 'rgba(255,255,255,0.05)' }} />
                <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>%</span>
              </div>
            </div>
            <button onClick={handleCalc} style={{ width: '100%', background: '#fff', color: Dark, fontFamily: font, fontSize: 14, fontWeight: 700, borderRadius: 100, padding: '13px 0', border: 'none', cursor: 'pointer' }}>
              Calculate My Waste
            </button>
            {calcResult !== null && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <p style={{ fontFamily: font, fontSize: 28, color: '#ef4444', margin: '0 0 6px' }}>
                  KES {calcResult.toLocaleString()} wasted per month.
                </p>
                <p style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 16px' }}>Get your free diagnosis to find out exactly where.</p>
                <Link href="/questionnaire" style={{ display: 'block', background: '#fff', color: Dark, fontFamily: font, fontSize: 14, fontWeight: 700, borderRadius: 100, padding: '12px 0', textDecoration: 'none', textAlign: 'center' }}>
                  Get My Free Diagnosis
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — cream, divider rows */}
      <section id="how-it-works" style={{ background: Cream }}>
        <div className="container" style={{ paddingTop: 'clamp(56px,8vw,96px)', paddingBottom: 'clamp(56px,8vw,96px)' }}>
          <p style={{ fontFamily: fontB, fontSize: 11, color: PMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>How It Works</p>
          <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,4.5vw,56px)', color: P, fontWeight: 800, margin: '0 0 48px', lineHeight: 1.08 }}>
            Three steps to clarity.
          </h2>
          {[
            { num: '01', title: 'Answer 20 questions', body: 'Tell us about your targeting and funnel. No ad account access needed.', chip: '5 minutes' },
            { num: '02', title: 'Get your report', body: 'Your ICP health score, monthly waste estimate, and top findings ranked by revenue impact.', chip: 'Instant' },
            { num: '03', title: 'Fix what is broken', body: 'Follow the prioritized action plan. Subscribe for ongoing monitoring and weekly intelligence.', chip: 'Start today' },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 'clamp(16px,3vw,40px)', alignItems: 'flex-start', padding: 'clamp(24px,4vw,40px) 0', borderTop: `1px solid ${PBorder}` }}>
              <Zap size={22} color={Accent} style={{ flexShrink: 0, marginTop: 6 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
                  <h3 style={{ fontFamily: font, fontSize: 'clamp(19px,3vw,28px)', fontWeight: 800, color: P, margin: 0 }}>{step.title}</h3>
                  <span style={{ display: 'inline-block', background: '#ede9fe', color: P, fontFamily: fontB, fontSize: 12, fontWeight: 600, padding: '3px 12px', borderRadius: 100 }}>{step.chip}</span>
                </div>
                <p style={{ fontFamily: fontB, fontSize: 15, color: PMuted, lineHeight: 1.65, margin: 0, maxWidth: 520 }}>{step.body}</p>
              </div>
              <span style={{ fontFamily: font, fontSize: 'clamp(32px,5vw,56px)', fontWeight: 800, color: Accent, opacity: 0.18, flexShrink: 0, lineHeight: 1 }}>{step.num}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${PBorder}`, paddingTop: 40, display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontFamily: fontB, fontSize: 11, color: PMuted, fontWeight: 700, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your free report includes</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
                {['ICP health score (0-100)', 'Monthly waste estimate', 'Top 3 findings with fixes', 'Quick wins for this week', 'Regional benchmark comparison'].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Check size={13} color={Accent} />
                    <span style={{ fontFamily: fontB, fontSize: 14, color: P }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: P, color: '#fff', textDecoration: 'none', fontFamily: font, fontWeight: 700, fontSize: 15, padding: '14px 28px', borderRadius: 100, flexShrink: 0 }}>
              Get My Free ICP Report <ArrowRight size={16} color="#fff" />
            </Link>
          </div>
        </div>
      </section>

      {/* PROOF — white, big quote */}
      <section id="results" style={{ background: '#fff' }}>
        <div className="container" style={{ paddingTop: 'clamp(56px,8vw,96px)', paddingBottom: 'clamp(56px,8vw,96px)' }}>
          <p style={{ fontFamily: fontB, fontSize: 11, color: PMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>Real Result</p>
          <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,4.5vw,56px)', color: P, fontWeight: 800, margin: '0 0 48px', lineHeight: 1.08 }}>
            From zero leads<br /><span style={{ color: Accent }}>to converting in week one.</span>
          </h2>

          {[
            ['14 to 3', 'Form fields cut'],
            ['0 to 12', 'Leads, week one'],
            ['5 min',   'To diagnose'],
          ].map(([num, label], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(20px,3vw,28px) 0', borderTop: `1px solid ${PBorder}` }}>
              <span style={{ fontFamily: font, fontSize: 'clamp(24px,4vw,48px)', fontWeight: 800, color: P }}>{num}</span>
              <span style={{ fontFamily: fontB, fontSize: 15, color: PMuted }}>{label}</span>
            </div>
          ))}

          <div style={{ borderTop: `1px solid ${PBorder}`, paddingTop: 48 }}>
            <p style={{ fontFamily: font, fontSize: 'clamp(20px,3.5vw,40px)', color: P, lineHeight: 1.3, margin: '0 0 32px', maxWidth: 720, fontStyle: 'italic' }}>
              "I did not need a new campaign. I needed someone to tell me my landing page was broken. The diagnosis did that in 5 minutes."
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: Cream }}>
                <Image src="/images/Holder-1.png" alt="James M." width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: P, margin: 0 }}>James M.</p>
                <p style={{ fontFamily: fontB, fontSize: 13, color: PMuted, margin: 0 }}>Marketing Manager, Legal Services, Nairobi</p>
              </div>
              <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: fontB, fontSize: 14, fontWeight: 600, color: P, textDecoration: 'none' }}>
                Get your free diagnosis <ArrowRight size={15} color={P} />
              </Link>
            </div>
          </div>

          <p style={{ fontFamily: fontB, fontSize: 14, color: PMuted, margin: '40px 0 0', borderTop: `1px solid ${PBorder}`, paddingTop: 24 }}>
            {liveCount.toLocaleString()} marketers have diagnosed their ICP this month
          </p>
        </div>
      </section>

      {/* TRUST — cream, divider rows */}
      <section id="trust" style={{ background: Cream }}>
        <div className="container" style={{ paddingTop: 'clamp(56px,8vw,96px)', paddingBottom: 'clamp(56px,8vw,96px)' }}>
          {[
            { Icon: Shield, color: '#16a34a', title: 'No ad account access', body: 'No Google OAuth. No Meta permissions. Zero.' },
            { Icon: Globe,  color: '#3b82f6', title: '10+ markets covered',  body: 'Kenya, Nigeria, South Africa, UK, US and more.' },
            { Icon: Users,  color: Accent,    title: 'Built by media buyers', body: 'USD 2M+ in ad spend managed. Real buyers built every rule.' },
            { Icon: Lock,   color: '#f59e0b', title: 'Your data is private',  body: 'Stored securely. Never shared. Never sold.' },
          ].map(({ Icon, color, title, body }, i) => (
            <div key={i} style={{ display: 'flex', gap: 'clamp(16px,3vw,32px)', alignItems: 'center', padding: 'clamp(20px,3vw,28px) 0', borderTop: `1px solid ${PBorder}` }}>
              <Icon size={22} color={color} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: font, fontSize: 'clamp(16px,2.5vw,20px)', fontWeight: 700, color: P, margin: '0 0 4px' }}>{title}</h3>
                <p style={{ fontFamily: fontB, fontSize: 14, color: PMuted, lineHeight: 1.55, margin: 0 }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING — white */}
      <section id="pricing" style={{ background: '#fff', padding: 'clamp(56px,8vw,96px) 0' }}>
        <div className="container">
          <p style={{ fontFamily: fontB, fontSize: 11, color: PMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>Simple Pricing</p>
          <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,4.5vw,56px)', color: P, fontWeight: 800, margin: '0 0 10px', lineHeight: 1.08 }}>Start free. Upgrade when ready.</h2>
          <p style={{ fontFamily: fontB, fontSize: 15, color: PMuted, maxWidth: 440, margin: '0 0 40px', lineHeight: 1.6 }}>
            Free shows what is broken. Paid shows exactly why, backed by live research.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <span style={{ fontFamily: fontB, fontSize: 14, color: !billingAnnual ? P : PMuted, fontWeight: !billingAnnual ? 700 : 400 }}>Monthly</span>
            <button onClick={() => setBillingAnnual(b => !b)} style={{ width: 46, height: 25, borderRadius: 100, background: billingAnnual ? P : 'rgba(48,33,97,0.18)', position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ width: 19, height: 19, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: billingAnnual ? 24 : 3, transition: 'left 0.2s' }} />
            </button>
            <span style={{ fontFamily: fontB, fontSize: 14, color: billingAnnual ? P : PMuted, fontWeight: billingAnnual ? 700 : 400 }}>
              Annual <span style={{ color: '#22c55e', fontWeight: 700 }}>(save 2 months)</span>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, maxWidth: 960, margin: '0 auto' }}>
            {TIERS.map((tier) => (
              <div key={tier.name} style={{ background: tier.highlight ? P : Cream, border: tier.highlight ? 'none' : `1px solid ${PBorder}`, borderRadius: 20, padding: 'clamp(24px,3vw,32px) clamp(20px,3vw,28px)', position: 'relative' }}>
                {tier.highlight && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)' }}>
                    <span style={{ display: 'inline-block', background: Accent, color: '#fff', fontFamily: fontB, fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 100, whiteSpace: 'nowrap' }}>Most Popular</span>
                  </div>
                )}
                <h3 style={{ fontFamily: font, fontSize: 19, fontWeight: 700, color: tier.highlight ? '#fff' : P, margin: '0 0 7px' }}>{tier.name}</h3>
                <p style={{ fontFamily: fontB, fontSize: 13, color: tier.highlight ? 'rgba(255,255,255,0.6)' : PMuted, margin: '0 0 18px', lineHeight: 1.5 }}>{tier.desc}</p>
                <p style={{ fontFamily: font, fontSize: 28, fontWeight: 800, color: tier.highlight ? '#fff' : P, margin: '0 0 4px' }}>
                  {billingAnnual ? tier.annual + '/year' : tier.monthly + '/month'}
                </p>
                <div style={{ margin: '18px 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tier.bullets.map((bullet, bi) => (
                    <div key={bi} style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                      <Check size={14} color={tier.highlight ? '#a5f3fc' : Accent} />
                      <span style={{ fontFamily: fontB, fontSize: 13, color: tier.highlight ? 'rgba(255,255,255,0.85)' : P }}>{bullet}</span>
                    </div>
                  ))}
                </div>
                <Link href={tier.href} style={{ display: 'block', textAlign: 'center', fontFamily: fontB, fontSize: 14, fontWeight: 700, color: tier.highlight ? P : '#fff', background: tier.highlight ? '#fff' : P, padding: '13px 0', borderRadius: 100, textDecoration: 'none' }}>
                  {tier.cta}
                </Link>
                <p style={{ fontFamily: fontB, fontSize: 12, color: tier.highlight ? 'rgba(255,255,255,0.4)' : PMuted, textAlign: 'center', marginTop: 8, marginBottom: 0 }}>Cancel anytime. No contracts.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — cream */}
      <section id="faq" style={{ background: Cream, padding: 'clamp(56px,8vw,80px) 0' }}>
        <div className="container">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }} className="lg:flex-row lg:gap-16">
            <div style={{ flexShrink: 0, width: '100%', maxWidth: 280 }}>
              <p style={{ fontFamily: fontB, fontSize: 11, color: PMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>FAQs</p>
              <h2 style={{ fontFamily: font, fontSize: 'clamp(22px,3vw,36px)', color: P, fontWeight: 800, margin: '0 0 10px', lineHeight: 1.15 }}>You ask, we answer.</h2>
              <p style={{ fontFamily: fontB, fontSize: 15, color: PMuted, margin: 0 }}>Everything you need before getting started.</p>
            </div>
            <div style={{ flex: 1 }}>
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i
                return (
                  <div key={i} style={{ borderTop: `1px solid ${PBorder}`, overflow: 'hidden' }}>
                    <button onClick={() => setOpenFaq(isOpen ? null : i)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}>
                      <span style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: P, lineHeight: 1.4 }}>{faq.q}</span>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: isOpen ? P : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isOpen ? <ChevronUp size={14} color="#fff" /> : <ChevronDown size={14} color={P} />}
                      </div>
                    </button>
                    <div style={{ maxHeight: isOpen ? 400 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                      <p style={{ fontFamily: fontB, fontSize: 14, lineHeight: 1.75, color: PMuted, padding: '0 0 20px', margin: 0 }}>{faq.a}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA — dark */}
      <section style={{ background: Dark, padding: 'clamp(72px,10vw,120px) 0', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontFamily: font, fontSize: 'clamp(28px,5vw,64px)', color: '#fff', fontWeight: 800, maxWidth: 700, margin: '0 auto 20px', lineHeight: 1.08 }}>
            Your competitors ran ads today<br /><span style={{ color: Accent }}>without knowing their ICP score.</span>
          </h2>
          <p style={{ fontFamily: fontB, fontSize: 16, color: 'rgba(255,255,255,0.45)', maxWidth: 360, margin: '0 auto 40px', lineHeight: 1.6 }}>
            Every week without a diagnosis is budget you will not get back.
          </p>
          <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: font, fontWeight: 700, fontSize: 16, color: Dark, background: '#fff', padding: '18px 44px', borderRadius: 100, textDecoration: 'none' }}>
            Get My Free ICP Score <ArrowRight size={17} color={Dark} />
          </Link>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {['Free forever', 'No credit card', '5 minutes'].map((chip, i) => (
              <span key={chip} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <span style={{ color: 'rgba(255,255,255,0.18)' }}>·</span>}
                <span style={{ fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{chip}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: Dark, borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(32px,5vw,48px) 0 clamp(24px,4vw,32px)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24, alignItems: 'center' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#302161,#7c3aed)', flexShrink: 0 }} />
              <span style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: '#fff' }}>ICP Diagnostic</span>
            </Link>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              {[['About', '/about'], ['Privacy', '/privacy'], ['Terms', '/terms'], ['Contact', 'mailto:info@idealicp.com']].map(([label, href]) => (
                <Link key={label} href={href} style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>{label}</Link>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.22)' }}>2026 ICP Diagnostic. All rights reserved.</span>
            <span style={{ fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.22)' }}>info@idealicp.com</span>
          </div>
        </div>
      </footer>

      <SocialProofToast />

      {/* Sticky bar */}
      {showStickyBar && !stickyDismissed && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999, background: '#fff', borderTop: `1px solid ${PBorder}`, padding: '12px clamp(16px,4vw,24px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, boxShadow: '0 -4px 24px rgba(0,0,0,0.07)' }}>
          <p style={{ fontFamily: fontB, fontSize: 14, color: P, fontWeight: 600, margin: 0, flex: 1 }}>
            Free ICP Score. 5 minutes. No card needed.
          </p>
          <Link href="/questionnaire" style={{ fontFamily: fontB, fontSize: 13, fontWeight: 700, background: P, color: '#fff', padding: '9px 20px', borderRadius: 100, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
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
