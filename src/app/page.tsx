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
    annualMonthly: 'KES 5,400',
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
    annualMonthly: 'KES 10,800',
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
    annualMonthly: 'KES 21,600',
    desc: 'A retained team of B2B media buyers working on your accounts. White-label reports, unlimited diagnoses, and a dedicated account manager.',
    bullets: ['Everything in Pro', 'Team of B2B media buyers on your account', 'White-label reports and multi-client coordination'],
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
  const [activeTestimonial, setActiveTestimonial] = useState(0)
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
  const [calcPhase,       setCalcPhase]       = useState<'idle' | 'running' | 'done'>('idle')
  const [calcStep,        setCalcStep]        = useState(0)
  const pendingMetrics = useRef<typeof calcMetrics>(null)
  const [showStickyBar,   setShowStickyBar]   = useState(false)
  const [stickyDismissed, setStickyDismissed] = useState(false)
  const [liveCount,       setLiveCount]       = useState(480)

  const [activeNow,       setActiveNow]       = useState(4)

  const countRef        = useRef<HTMLSpanElement>(null)
  const hasAnimated     = useRef(false)
  const [diagnosisCount,  setDiagnosisCount]  = useState(9400)
  const diagCountRef    = useRef<HTMLSpanElement>(null)
  const prevDiagCount   = useRef(9400)
  const outputCanvasRef = useRef<HTMLCanvasElement>(null)

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

  const animateWaste = (from: number, to: number, duration = 1800) => {
    const el = diagCountRef.current
    if (!el) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      el.textContent = 'KES ' + Math.floor(from + (to - from) * ease).toLocaleString()
      if (t < 1) requestAnimationFrame(tick)
      else el.textContent = 'KES ' + to.toLocaleString()
    }
    requestAnimationFrame(tick)
  }

  useEffect(() => {
    // Animate on first mount (count up from 0)
    animateWaste(0, diagnosisCount * 47000, 2800)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Animate when count changes after mount
    const prev = prevDiagCount.current
    if (prev !== diagnosisCount) {
      animateWaste(prev * 47000, diagnosisCount * 47000, 900)
      prevDiagCount.current = diagnosisCount
    }
  }, [diagnosisCount]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/stats')
        if (!res.ok) return
        const { count } = await res.json()
        if (typeof count === 'number' && count !== prevDiagCount.current) {
          setDiagnosisCount(count)
        }
      } catch { /* keep current value */ }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setActiveNow(Math.floor(Math.random() * 6) + 2), 11000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const canvas = outputCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf: number
    const DOT_COUNT = 60
    const MAX_SPEED = 0.5
    const REPEL_PAD = 10   // extra clearance around each pill rect
    const REPEL_FORCE = 0.18

    type Dot = { x: number; y: number; vx: number; vy: number; r: number }
    const dots: Dot[] = Array.from({ length: DOT_COUNT }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.4 + 0.7,
    }))

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // Collect pill rects relative to canvas each frame
      const canvasRect = canvas.getBoundingClientRect()
      const pills = canvas.parentElement?.querySelectorAll('.pill-item') ?? []
      const rects = Array.from(pills).map(el => {
        const r = el.getBoundingClientRect()
        return { l: r.left - canvasRect.left - REPEL_PAD, t: r.top - canvasRect.top - REPEL_PAD, r: r.right - canvasRect.left + REPEL_PAD, b: r.bottom - canvasRect.top + REPEL_PAD }
      })

      for (const d of dots) {
        // Repel from pill rects
        for (const rect of rects) {
          // Find closest point on rect to dot
          const cx = Math.max(rect.l, Math.min(d.x, rect.r))
          const cy = Math.max(rect.t, Math.min(d.y, rect.b))
          const dx = d.x - cx
          const dy = d.y - cy
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 18) {
            const push = dist === 0 ? 1 : dist
            d.vx += (dx / push) * REPEL_FORCE
            d.vy += (dy / push) * REPEL_FORCE
          }
        }

        // Clamp speed
        const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy)
        if (speed > MAX_SPEED) { d.vx = d.vx / speed * MAX_SPEED; d.vy = d.vy / speed * MAX_SPEED }

        d.x += d.vx; d.y += d.vy

        // Bounce off walls
        if (d.x < 0)  { d.x = 0;  d.vx =  Math.abs(d.vx) }
        if (d.x > W)  { d.x = W;  d.vx = -Math.abs(d.vx) }
        if (d.y < 0)  { d.y = 0;  d.vy =  Math.abs(d.vy) }
        if (d.y > H)  { d.y = H;  d.vy = -Math.abs(d.vy) }

        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(24,17,10,0.15)'
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  const CALC_STEP_DELAYS = [550, 650, 750, 650, 600, 500]

  useEffect(() => {
    if (calcPhase !== 'running') return
    if (calcStep < CALC_STEP_DELAYS.length) {
      const t = setTimeout(() => setCalcStep(s => s + 1), CALC_STEP_DELAYS[calcStep])
      return () => clearTimeout(t)
    } else {
      setCalcMetrics(pendingMetrics.current)
      setCalcPhase('done')
    }
  }, [calcPhase, calcStep])

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

    pendingMetrics.current = {
      cacCurrent:                 Math.round(cacCurrent),
      cacProjected:               Math.round(cacProjected),
      ltvCacCurrent:              Math.round(ltvCacCurrent * 10) / 10,
      ltvCacProjected:            Math.round(ltvCacProjected * 10) / 10,
      monthlyCustomers:           Math.round(monthlyCustomers * 10) / 10,
      monthlyCustomersProjected:  Math.round(monthlyCustomersProjected * 10) / 10,
      monthlyRevenueOpportunity:  Math.round(monthlyRevenueOpportunity),
      paybackMonths:              Math.round(paybackMonths * 10) / 10,
    }
    setCalcMetrics(null)
    setCalcStep(0)
    setCalcPhase('running')
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
        /* Mobile responsive fixes */
        @media (max-width: 767px) {
          .testimonial-left { border-right: none !important; }
          .proof-chart-col { border-right: none !important; border-bottom: 1.5px solid rgba(255,255,255,0.12); }
        }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: Warm, borderBottom: `1.5px solid ${Border}`, padding: '0 clamp(20px,5vw,56px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: Orange, flexShrink: 0 }} />
            <span style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: Text }}>ICP Diagnostic</span>
          </Link>
          <div className="hidden md:flex" style={{ gap: 28 }}>
            {[['How It Works', '#how-it-works'], ['Results', '#results'], ['Pricing', '/pricing'], ['FAQ', '#faq']].map(([label, href]) => (
              href.startsWith('/') ? (
                <Link key={href} href={href} className="nav-link" style={{ fontFamily: fontB, fontSize: 14, color: Muted, textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}>{label}</Link>
              ) : (
                <a key={href} href={href} className="nav-link" style={{ fontFamily: fontB, fontSize: 14, color: Muted, textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}>{label}</a>
              )
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 49, background: Warm, display: 'flex', flexDirection: 'column', padding: 'clamp(64px,12vh,80px) clamp(20px,5vw,32px) 40px' }}>
          {[['How It Works', '#how-it-works'], ['Results', '#results'], ['Pricing', '/pricing'], ['FAQ', '#faq']].map(([label, href]) => (
            href.startsWith('/') ? (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                style={{ fontFamily: font, fontSize: 22, color: Text, textDecoration: 'none', fontWeight: 700, padding: '18px 0', borderBottom: `1.5px solid ${Border}` }}>{label}</Link>
            ) : (
              <a key={href} href={href} onClick={() => setMobileOpen(false)}
                style={{ fontFamily: font, fontSize: 22, color: Text, textDecoration: 'none', fontWeight: 700, padding: '18px 0', borderBottom: `1.5px solid ${Border}` }}>{label}</a>
            )
          ))}
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href="/questionnaire" onClick={() => setMobileOpen(false)} style={{ ...btnPrimary, justifyContent: 'center', fontSize: 17 }}>Get free diagnostic</Link>
            <Link href="/auth?tab=login" onClick={() => setMobileOpen(false)} style={{ fontFamily: fontB, fontSize: 15, fontWeight: 500, color: Muted, textDecoration: 'none', textAlign: 'center', padding: '12px 0' }}>Log in</Link>
          </div>
        </div>
      )}

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={{ background: Warm, borderBottom: `1.5px solid ${Border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', gridTemplateColumns: '1fr 1fr' }} className="block md:grid">
          {/* Left */}
          <div style={{ padding: 'clamp(48px,8vw,96px) clamp(20px,5vw,56px)' }}>
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
          {/* Right — hidden on mobile, visible on md+ */}
          <div className="hidden md:flex" style={{ padding: 'clamp(48px,8vw,96px) clamp(20px,5vw,56px)', flexDirection: 'column', justifyContent: 'center', gap: 32, borderLeft: `1.5px solid ${Border}` }}>
            <p style={{ fontFamily: fontB, fontSize: 'clamp(16px,2vw,20px)', color: Muted, lineHeight: 1.7, margin: 0 }}>
              Most B2B teams waste 30 to 60 percent of their ad budget targeting people who will never buy. The ICP Diagnostic finds the exact misalignment, scores your targeting, and gives you a ranked fix list in 5 minutes.
            </p>
            <div className="grid grid-cols-3" style={{ gap: 0, borderTop: `1.5px solid ${Border}`, borderLeft: `1.5px solid ${Border}` }}>
              {[
                { stat: '5 min', label: 'To complete' },
                { stat: 'Instant', label: 'Results' },
                { stat: '0', label: 'Ad access needed' },
              ].map(({ stat, label }) => (
                <div key={label} style={{ padding: '20px 16px', borderBottom: `1.5px solid ${Border}`, borderRight: `1.5px solid ${Border}` }}>
                  <p style={{ fontFamily: fontSerif, fontSize: 24, fontWeight: 700, color: Text, margin: '0 0 4px' }}>{stat}</p>
                  <p style={{ fontFamily: fontB, fontSize: 12, color: Muted, margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Mobile stats strip — visible only on mobile */}
          <div className="md:hidden" style={{ display: 'flex', borderTop: `1.5px solid ${Border}` }}>
            {[
              { stat: '5 min', label: 'To complete' },
              { stat: 'Instant', label: 'Results' },
              { stat: '0', label: 'Ad access' },
            ].map(({ stat, label }, i) => (
              <div key={label} style={{ flex: 1, padding: '16px 12px', borderRight: i < 2 ? `1.5px solid ${Border}` : 'none', textAlign: 'center' }}>
                <p style={{ fontFamily: fontSerif, fontSize: 20, fontWeight: 700, color: Text, margin: '0 0 3px' }}>{stat}</p>
                <p style={{ fontFamily: fontB, fontSize: 11, color: Muted, margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM DIAGRAM ───────────────────────────────────────────── */}
      <section style={{ background: Warm, borderBottom: `1.5px solid ${Border}` }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes stepIn { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: translateX(0); } }
          @media (prefers-reduced-motion: reduce) { .calc-spinner { animation: none !important; } .calc-results { animation: none !important; } .calc-step { animation: none !important; } }
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
          @keyframes marqueeLeft  { from { transform: translateX(0); }    to { transform: translateX(-50%); } }
          @keyframes marqueeRight { from { transform: translateX(-50%); } to { transform: translateX(0); } }
          @media (prefers-reduced-motion: reduce) {
            .plat-scan-dot  { animation: none !important; }
            .plat-pulse     { animation: none !important; }
            .pill-row-track { animation: none !important; }
          }
        `}</style>
        <div className="container" style={{ paddingTop: 'clamp(56px,8vw,96px)', paddingBottom: 'clamp(56px,8vw,96px)' }}>
          <p style={{ fontFamily: fontB, fontSize: 12, color: Muted, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 16px', textAlign: 'center' }}>How the platform works</p>
          <h2 style={{ fontFamily: fontSerif, fontSize: 'clamp(28px,4vw,52px)', fontWeight: 700, color: Dark, textAlign: 'center', margin: '0 0 56px', lineHeight: 1.1, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
            22 questions. A complete <span style={{ color: Orange }}>growth diagnosis.</span>
          </h2>

          {/* 6-column analysis grid */}
          <div style={{ border: `1.5px solid ${Border}`, borderRadius: 0, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', maxWidth: 1100, margin: '0 auto', overflow: 'hidden' }}
               className="hidden md:grid">
            {[
              { Icon: Target,       title: 'ICP Foundation',          sub: 'Who you are targeting and whether it is right' },
              { Icon: Crosshair,    title: 'Ad Targeting',            sub: 'Channel and audience alignment signals' },
              { Icon: Layout,       title: 'Landing Page',            sub: 'Copy, CTA, and conversion clarity' },
              { Icon: BarChart2,    title: 'Regional Benchmarks',     sub: 'How your metrics compare locally' },
              { Icon: TrendingDown, title: 'CAC Analysis',            sub: 'Cost per customer relative to LTV' },
              { Icon: Eye,          title: 'Competitive Intel',       sub: 'Market positioning and gap identification' },
            ].map(({ Icon, title, sub }, i) => (
              <div key={title} style={{ padding: '28px 18px 28px', borderLeft: i > 0 ? `1.5px solid ${Border}` : 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ width: 36, height: 36, border: `1.5px solid ${Border}`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
          <div className="md:hidden" style={{ border: `1.5px solid ${Border}`, borderRadius: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
            {[
              { Icon: Target,       title: 'ICP Foundation' },
              { Icon: Crosshair,    title: 'Ad Targeting' },
              { Icon: Layout,       title: 'Landing Page' },
              { Icon: BarChart2,    title: 'Benchmarks' },
              { Icon: TrendingDown, title: 'CAC Analysis' },
              { Icon: Eye,          title: 'Competitive Intel' },
            ].map(({ Icon, title }, i) => (
              <div key={title} style={{ padding: '20px 16px', borderLeft: i % 2 === 1 ? `1.5px solid ${Border}` : 'none', borderTop: i >= 2 ? `1.5px solid ${Border}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, border: `1.5px solid ${Border}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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

          {/* Output pills panel — particle canvas + three ticker rows */}
          {(() => {
            const pillStyle = (bg = 'rgba(255,255,255,0.9)'): React.CSSProperties => ({
              fontFamily: fontB, fontSize: 13, color: Dark, fontWeight: 600,
              border: `1.5px solid ${Border}`, borderRadius: 6, padding: '9px 16px',
              background: bg, backdropFilter: 'blur(4px)',
              display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0,
              boxShadow: '0 2px 6px rgba(24,17,10,0.06)',
            })
            const rows: string[][] = [
              ['ICP Health Score', 'Critical Findings', 'CAC Before / After', 'LTV:CAC Ratio', 'Quick Wins', 'Weekly Intelligence', 'Executive Summary', 'Improvement Roadmap', 'Budget Efficiency', 'Close Rate Uplift'],
              ['Audience Gaps', 'Landing Page Score', 'Funnel Leak Analysis', 'Benchmark Comparison', 'Lead Quality Score', 'Competitor Positioning', 'Ad Copy Audit', 'CTA Effectiveness', 'Targeting Fit Score', 'Regional Insights'],
              ['Monthly Waste Estimate', 'Revenue Opportunity', 'ICP Segment Map', 'Growth Action Plan', 'Conversion Diagnosis', 'Spend Efficiency', 'Market Positioning', 'Buyer Persona Gaps', 'Sales Alignment Score', 'Channel Breakdown'],
            ]
            const speeds = ['75s', '90s', '65s']
            const dirs   = ['marqueeLeft', 'marqueeRight', 'marqueeLeft']
            return (
              <div style={{ border: `1.5px solid ${Border}`, borderRadius: 0, maxWidth: 1100, margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
                <canvas ref={outputCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 1, padding: '28px 0 32px' }}>
                  <p style={{ fontFamily: fontB, fontSize: 11, color: Orange, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 24px', paddingLeft: 28 }}>Your outputs</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {rows.map((row, ri) => (
                      <div key={ri} style={{ overflow: 'hidden', width: '100%' }}>
                        <div className="pill-row-track" style={{ display: 'flex', gap: 10, width: 'max-content', animation: `${dirs[ri]} ${speeds[ri]} linear infinite` }}>
                          {[...row, ...row].map((pill, i) => (
                            <span key={`${pill}-${i}`} className="pill-item" style={pillStyle()}>
                              <Check size={12} color={Orange} strokeWidth={2.5} />
                              {pill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* ── 4-COLUMN TRUST GRID ────────────────────────────────────────── */}
      <section style={{ background: Warm, borderBottom: `1.5px solid ${Border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', borderLeft: `1.5px solid ${Border}` }}>
          {[
            { Icon: Shield, title: 'No ad account access', body: 'No Google OAuth. No Meta permissions. Zero.' },
            { Icon: Globe,  title: '10+ markets covered',  body: 'Kenya, Nigeria, South Africa, UK, US and more.' },
            { Icon: Users,  title: 'Built by media buyers', body: 'USD 2M+ in ad spend managed. Real practitioners built every rule.' },
            { Icon: Lock,   title: 'Your data is private',  body: 'Stored securely. Never shared. Never sold.' },
          ].map(({ Icon, title, body }) => (
            <div key={title} style={{ padding: 'clamp(24px,3vw,36px)', borderRight: `1.5px solid ${Border}`, borderBottom: `1.5px solid ${Border}` }}>
              <Icon size={20} color={Orange} style={{ marginBottom: 14 }} />
              <h3 style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: Text, margin: '0 0 8px' }}>{title}</h3>
              <p style={{ fontFamily: fontB, fontSize: 14, color: Muted, lineHeight: 1.6, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROOF OF CONCEPT ─────────────────────────────────────────────── */}
      <section style={{ background: Dark, borderBottom: `1.5px solid ${DarkBorder}` }}>
        <style>{`
          @keyframes livePulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%       { opacity: 0.4; transform: scale(0.85); }
          }
          @keyframes liveRing {
            0%   { transform: scale(1);   opacity: 0.6; }
            100% { transform: scale(2.2); opacity: 0; }
          }
          @media (prefers-reduced-motion: reduce) {
            .live-dot, .live-ring { animation: none !important; }
          }
        `}</style>
        <div className="container" style={{ paddingTop: 'clamp(56px,8vw,96px)', paddingBottom: 0 }}>

          {/* Header row */}
          <div style={{ borderBottom: `1.5px solid ${DarkBorder}`, paddingBottom: 'clamp(40px,6vw,64px)' }}>
            <p style={{ fontFamily: fontB, fontSize: 13, color: DarkMuted, fontWeight: 400, margin: '0 0 28px' }}>
              No guesswork here. <span style={{ color: Orange }}>Just real data.</span>
            </p>

            {/* Live indicator */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 100, padding: '6px 14px 6px 10px' }}>
              <span style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
                <span className="live-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#22c55e', animation: 'liveRing 1.4s ease-out infinite' }} />
                <span className="live-dot" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#22c55e', animation: 'livePulse 1.4s ease-in-out infinite' }} />
              </span>
              <span style={{ fontFamily: fontB, fontSize: 13, color: '#22c55e', fontWeight: 600 }}>
                {activeNow} diagnoses running right now
              </span>
            </div>

            {/* Giant counter */}
            <span ref={diagCountRef} style={{ fontFamily: fontSerif, fontSize: 'clamp(48px,10vw,112px)', fontWeight: 700, color: '#fff', lineHeight: 1, display: 'block', marginBottom: 12, letterSpacing: '-0.02em' }}>KES 0</span>
            <p style={{ fontFamily: fontB, fontSize: 15, color: Orange, fontWeight: 500, margin: '0 0 8px' }}>
              in monthly ad spend waste identified across East Africa (and counting)
            </p>
            <p style={{ fontFamily: fontB, fontSize: 13, color: DarkMuted, margin: 0 }}>
              Across {diagnosisCount.toLocaleString()}+ B2B diagnoses completed on the platform
            </p>
          </div>

          {/* Chart + description row */}
          <div style={{ gridTemplateColumns: '1fr 1fr', borderBottom: `1.5px solid ${DarkBorder}` }} className="block md:grid">

            {/* Growth chart */}
            <div className="proof-chart-col" style={{ borderRight: `1.5px solid ${DarkBorder}`, padding: 'clamp(28px,4vw,48px)' }}>
              <p style={{ fontFamily: fontB, fontSize: 11, color: DarkMuted, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>Diagnoses completed over time</p>
              <svg viewBox="0 0 540 200" style={{ width: '100%', height: 'auto', display: 'block' }} aria-hidden="true">
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={Orange} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={Orange} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[40, 80, 120, 160].map(y => (
                  <line key={y} x1="0" y1={y} x2="540" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                ))}
                {/* Fill area */}
                <path d="M 20,182 C 80,178 140,170 200,155 C 270,135 330,108 390,75 C 440,48 490,28 520,14 L 520,190 L 20,190 Z"
                  fill="url(#chartFill)" />
                {/* Line */}
                <path d="M 20,182 C 80,178 140,170 200,155 C 270,135 330,108 390,75 C 440,48 490,28 520,14"
                  fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
                {/* Orange tip dot */}
                <circle cx="520" cy="14" r="5" fill={Orange} />
                <circle cx="520" cy="14" r="9" fill={Orange} fillOpacity="0.25" />
                {/* Axis labels */}
                <text x="20" y="198" fill="rgba(255,255,255,0.3)" fontSize="11" fontFamily="sans-serif">Jan 2024</text>
                <text x="480" y="198" fill="rgba(255,255,255,0.3)" fontSize="11" fontFamily="sans-serif" textAnchor="end">Today</text>
              </svg>
            </div>

            {/* Description */}
            <div style={{ padding: 'clamp(28px,4vw,56px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
              <p style={{ fontFamily: fontSerif, fontSize: 'clamp(18px,2.5vw,26px)', color: '#fff', lineHeight: 1.45, margin: 0, fontWeight: 600 }}>
                ICP Diagnostic is where B2B marketers stop guessing and start knowing. Real answers from your numbers, benchmarked against your market.
              </p>
              <div style={{ display: 'flex', gap: 32 }}>
                {[['78%', 'of businesses have critical targeting gaps'], ['5 min', 'to a complete ICP health score']].map(([val, label]) => (
                  <div key={val}>
                    <p style={{ fontFamily: fontSerif, fontSize: 28, fontWeight: 700, color: Orange, margin: '0 0 4px' }}>{val}</p>
                    <p style={{ fontFamily: fontB, fontSize: 12, color: DarkMuted, margin: 0, lineHeight: 1.5 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4 tiles */}
          <div style={{ gridTemplateColumns: 'repeat(2, 1fr)', borderLeft: `1.5px solid ${DarkBorder}` }} className="block md:grid">
            {[
              { Icon: Zap,       title: '22 questions across 3 targeting layers', body: 'No ad account access. No agency. Takes 5 minutes from sign-up to your first scored finding.' },
              { Icon: BarChart2, title: '43% average CAC reduction after fixing ICP', body: 'Reported by businesses that completed their first diagnosis and acted on the top two findings.' },
              { Icon: Target,    title: 'KES 47,000 average monthly waste identified', body: 'Per business, per month. Found in audience mismatch, landing page friction, and funnel leaks.' },
              { Icon: TrendingDown, title: 'LTV:CAC ratio below 3:1 in 6 out of 10 audits', body: 'The B2B benchmark is 3:1. Most businesses we see are between 1.2 and 2.1 before the fix.' },
            ].map(({ Icon, title, body }, i) => (
              <div key={i} style={{ padding: 'clamp(24px,3vw,36px)', borderRight: `1.5px solid ${DarkBorder}`, borderTop: `1.5px solid ${DarkBorder}`, borderBottom: `1.5px solid ${DarkBorder}` }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, border: `1.5px solid ${DarkBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Icon size={16} color={Orange} strokeWidth={1.5} />
                </div>
                <h3 style={{ fontFamily: font, fontSize: 'clamp(14px,1.5vw,16px)', fontWeight: 700, color: '#fff', margin: '0 0 10px', lineHeight: 1.3 }}>{title}</h3>
                <p style={{ fontFamily: fontB, fontSize: 13, color: DarkMuted, lineHeight: 1.65, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── USE CASE TICKER ─────────────────────────────────────────────── */}
      <div style={{ background: Warm, borderBottom: `1.5px solid ${Border}`, overflow: 'hidden', padding: '14px 0' }}>
        <div className="ticker-track">
          {[...USE_CASES, ...USE_CASES].map((item, i) => (
            <span key={i} style={{ fontFamily: fontB, fontSize: 13, color: Muted, whiteSpace: 'nowrap', padding: '4px 16px', border: `1.5px solid ${Border}`, borderRadius: 4 }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ background: Warm, borderBottom: `1.5px solid ${Border}` }}>
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
          <div style={{ border: `1.5px solid ${Border}`, borderRadius: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', overflow: 'hidden', marginBottom: 0 }}
               className="hidden md:grid">
            {[
              { num: '01', Icon: FileText, title: 'Answer 22 questions', body: 'Tell us about your targeting and funnel. No ad account access needed. Takes around 5 minutes.', chip: '5 minutes', chipBg: 'rgba(232,51,10,0.1)' },
              { num: '02', Icon: Zap,      title: 'Get your report',      body: 'Your ICP health score, monthly waste estimate, CAC analysis, and top findings ranked by revenue impact.', chip: 'Instant',   chipBg: 'rgba(232,51,10,0.1)' },
              { num: '03', Icon: ArrowRight, title: 'Fix what is broken', body: 'Follow the prioritised action plan. Subscribe for ongoing monitoring, weekly intelligence, and CAC tracking.', chip: 'Start today', chipBg: 'rgba(232,51,10,0.1)' },
            ].map(({ num, Icon, title, body, chip, chipBg }, i) => (
              <div key={i} style={{ borderLeft: i > 0 ? `1.5px solid ${Border}` : 'none', padding: '36px 28px 36px', display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', overflow: 'hidden' }}>
                {/* Ghost number watermark */}
                <span style={{ position: 'absolute', top: 12, right: 20, fontFamily: fontSerif, fontSize: 72, fontWeight: 700, color: Orange, opacity: 0.07, lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>{num}</span>
                {/* Icon */}
                <div style={{ width: 40, height: 40, borderRadius: 0, border: `1.5px solid ${Border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, flexShrink: 0 }}>
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
          <div className="md:hidden" style={{ border: `1.5px solid ${Border}`, borderRadius: 0, overflow: 'hidden' }}>
            {[
              { num: '01', Icon: FileText,  title: 'Answer 22 questions', body: 'No ad account needed. Takes 5 minutes.', chip: '5 minutes' },
              { num: '02', Icon: Zap,       title: 'Get your report',      body: 'Health score, CAC analysis, and ranked findings instantly.', chip: 'Instant' },
              { num: '03', Icon: ArrowRight, title: 'Fix what is broken',  body: 'Follow the action plan and track your progress.', chip: 'Start today' },
            ].map(({ num, Icon, title, body, chip }, i) => (
              <div key={i} style={{ borderTop: i > 0 ? `1.5px solid ${Border}` : 'none', padding: '24px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
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
          <div style={{ borderTop: `1.5px solid ${Border}`, marginTop: 48, paddingTop: 40, display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'center', justifyContent: 'space-between' }}>
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
      {(() => {
        const testimonials = [
          {
            company:   'GREENFIELD DIGITAL',
            quote:     'I did not need a new campaign. I needed someone to tell me my landing page was broken. The diagnosis did that in 5 minutes, and gave me a ranked list of exactly what to fix first.',
            name:      'James M.',
            title:     'Marketing Manager, Nairobi',
            stats:     [{ val: '14 to 3', label: 'Form fields cut after diagnosis' }, { val: '+12', label: 'Qualified leads in week one' }],
            image:     '/images/Holder-2.png',
          },
          {
            company:   'NOVA CONSULTING',
            quote:     'We were spending KES 180,000 a month on ads and getting maybe four good leads. After the ICP fix, same budget, nineteen leads. The difference was just knowing who we were actually talking to.',
            name:      'Aisha K.',
            title:     'Head of Growth, Mombasa',
            stats:     [{ val: '4x', label: 'Lead volume on same budget' }, { val: '61%', label: 'Reduction in cost per lead' }],
            image:     '/images/Holder-3.png',
          },
          {
            company:   'APEX FINSERV',
            quote:     'The CAC analysis alone was worth it. We had no idea our LTV:CAC was sitting at 1.4:1. Now we are at 3.8:1 and the sales team finally has a clear picture of who to go after.',
            name:      'David O.',
            title:     'CEO, Apex Finserv',
            stats:     [{ val: '1.4 to 3.8', label: 'LTV:CAC ratio improvement' }, { val: '38%', label: 'Lower customer acquisition cost' }],
            image:     '/images/Holder-4.png',
          },
        ]
        const t = testimonials[activeTestimonial]
        const total = testimonials.length
        return (
          <section id="results" style={{ background: Warm, borderBottom: `1.5px solid ${Border}` }}>
            <div className="container" style={{ paddingTop: 'clamp(56px,7vw,88px)', paddingBottom: 'clamp(56px,7vw,88px)' }}>

              {/* Section header */}
              <div style={{ textAlign: 'center', marginBottom: 52 }}>
                <h2 style={{ fontFamily: fontSerif, fontSize: 'clamp(26px,4vw,48px)', fontWeight: 700, color: Text, margin: '0 0 14px', lineHeight: 1.1 }}>
                  <span style={{ color: Orange }}>Built for B2B marketers,</span><br />from first-time founders to scaling teams.
                </h2>
                <p style={{ fontFamily: fontB, fontSize: 15, color: Muted, margin: 0, lineHeight: 1.6 }}>
                  Real results from marketers who stopped guessing and started diagnosing.
                </p>
              </div>

              {/* Testimonial card */}
              <div style={{ border: `1.5px solid ${Border}`, borderRadius: 0, overflow: 'hidden', gridTemplateColumns: '1fr 1fr', background: '#fff' }} className="block md:grid">

                {/* Left: quote panel */}
                <div className="testimonial-left" style={{ display: 'flex', flexDirection: 'column' }}>

                  {/* Company tag */}
                  <div style={{ padding: '28px 36px 24px', borderBottom: `1.5px solid ${Border}` }}>
                    <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: Text, margin: 0 }}>{t.company}</p>
                  </div>

                  {/* Quote */}
                  <div style={{ padding: '32px 36px 28px', flex: 1 }}>
                    <p style={{ fontFamily: fontSerif, fontSize: 40, color: Orange, lineHeight: 1, margin: '0 0 16px', fontWeight: 700 }}>"</p>
                    <p style={{ fontFamily: fontSerif, fontSize: 'clamp(17px,2vw,22px)', color: Text, lineHeight: 1.55, margin: '0 0 28px' }}>
                      {t.quote}
                    </p>
                    <p style={{ fontFamily: fontB, fontSize: 13, color: Muted, margin: 0, lineHeight: 1.5 }}>
                      {t.name}, {t.title}
                    </p>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: `1.5px solid ${Border}` }}>
                    {t.stats.map(({ val, label }, i) => (
                      <div key={i} style={{ padding: '24px 28px', borderRight: i === 0 ? `1.5px solid ${Border}` : 'none' }}>
                        <p style={{ fontFamily: fontSerif, fontSize: 'clamp(22px,2.5vw,32px)', fontWeight: 700, color: Orange, margin: '0 0 5px' }}>{val}</p>
                        <p style={{ fontFamily: fontB, fontSize: 12, color: Muted, margin: 0, lineHeight: 1.5 }}>{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* CTA row */}
                  <div style={{ padding: '20px 28px', borderTop: `1.5px solid ${Border}` }}>
                    <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                      <span style={{ width: 36, height: 36, borderRadius: '50%', border: `1.5px solid ${Border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ArrowRight size={15} color={Text} />
                      </span>
                      <span style={{ fontFamily: fontB, fontSize: 14, fontWeight: 600, color: Text }}>Get your free diagnosis</span>
                    </Link>
                  </div>
                </div>

                {/* Right: image — hidden on mobile */}
                <div className="hidden md:block" style={{ position: 'relative', minHeight: 420, background: '#e8e0d8', overflow: 'hidden' }}>
                  <Image
                    src={t.image}
                    alt={t.company}
                    fill
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                  />
                  {/* Company overlay */}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(24,17,10,0.18)' }}>
                    <p style={{ fontFamily: fontSerif, fontSize: 'clamp(18px,2.5vw,28px)', fontWeight: 700, color: '#fff', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', margin: 0, textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
                      {t.company}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nav row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <span style={{ fontFamily: fontB, fontSize: 13, color: Muted, marginRight: 8 }}>{activeTestimonial + 1} / {total}</span>
                {[{ dir: -1, icon: <ArrowRight size={16} color={Text} style={{ transform: 'rotate(180deg)' }} /> }, { dir: 1, icon: <ArrowRight size={16} color={Text} /> }].map(({ dir, icon }, i) => (
                  <button key={i} onClick={() => setActiveTestimonial(n => (n + dir + total) % total)}
                    style={{ width: 40, height: 40, borderRadius: '50%', border: `1.5px solid ${Border}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    {icon}
                  </button>
                ))}
              </div>

            </div>
          </section>
        )
      })()}

      {/* ── BUSINESS OUTCOMES CALCULATOR ────────────────────────────────── */}
      <section id="calculator" style={{ background: Dark, borderBottom: `1.5px solid ${DarkBorder}` }}>
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

          <div style={{ gridTemplateColumns: '1fr 1fr', gap: 0, border: `1.5px solid ${DarkBorder}`, borderRadius: 0, overflow: 'hidden' }} className="block md:grid">
            {/* Left: Inputs */}
            <div style={{ padding: 'clamp(24px,4vw,40px)', borderRight: `1.5px solid ${DarkBorder}` }}>
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

              {/* IDLE: empty prompt */}
              {calcPhase === 'idle' && (
                <div style={{ height: '100%', minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, opacity: 0.35 }}>
                  <BarChart2 size={40} color="#fff" strokeWidth={1} />
                  <p style={{ fontFamily: fontB, fontSize: 14, color: '#fff', margin: 0, textAlign: 'center', lineHeight: 1.6 }}>
                    Fill in your numbers on the left<br />to see your projected outcomes.
                  </p>
                </div>
              )}

              {/* RUNNING: step-by-step animation */}
              {calcPhase === 'running' && (
                <div style={{ height: '100%', minHeight: 280, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0 }}>
                  <p style={{ fontFamily: fontB, fontSize: 11, color: DarkMuted, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 28px' }}>Running analysis</p>
                  {[
                    'Reading your budget and lead volume',
                    'Computing your current CAC',
                    'Modelling 35% lead quality improvement',
                    'Applying 30% close rate uplift',
                    'Projecting your LTV:CAC ratio',
                    'Calculating monthly revenue opportunity',
                  ].map((label, i) => {
                    const done    = i < calcStep
                    const active  = i === calcStep
                    const pending = i > calcStep
                    return (
                      <div key={i} className="calc-step" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderTop: i > 0 ? `1.5px solid ${DarkBorder}` : 'none', opacity: pending ? 0.25 : 1, animation: active || done ? `stepIn 0.25s ease both` : 'none' }}>
                        {/* Icon: spinner / check / circle */}
                        <div className={active ? 'calc-spinner' : ''} style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: done ? 'none' : active ? `2px solid rgba(255,255,255,0.12)` : `1.5px solid ${DarkBorder}`,
                          borderTopColor: active ? Orange : undefined,
                          background: done ? '#22c55e' : 'transparent',
                          animation: active ? 'spin 0.8s linear infinite' : 'none',
                        }}>
                          {done && <Check size={12} color="#fff" strokeWidth={3} />}
                        </div>
                        <span style={{ fontFamily: fontB, fontSize: 13, color: done ? '#fff' : active ? '#fff' : DarkMuted, fontWeight: active ? 600 : 400, lineHeight: 1.4 }}>{label}</span>
                        {active && <span style={{ marginLeft: 'auto', fontFamily: fontB, fontSize: 11, color: Orange }}>Running</span>}
                        {done   && <span style={{ marginLeft: 'auto', fontFamily: fontB, fontSize: 11, color: '#22c55e' }}>Done</span>}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* DONE: results */}
              {calcPhase === 'done' && calcMetrics && (
                <div className="calc-results" style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%', animation: 'fadeUp 0.4s ease both' }}>
                  <p style={{ fontFamily: fontB, fontSize: 11, color: DarkMuted, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>Your projected outcomes</p>

                  {/* 4 metric cells in a 2x2 grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: `1.5px solid ${DarkBorder}`, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
                    {[
                      { label: 'CAC today',    value: `KES ${calcMetrics.cacCurrent.toLocaleString()}`,   accent: false },
                      { label: 'CAC after fix', value: `KES ${calcMetrics.cacProjected.toLocaleString()}`, accent: true, sub: `${Math.round((1 - calcMetrics.cacProjected / calcMetrics.cacCurrent) * 100)}% lower` },
                      { label: 'LTV:CAC now',  value: `${calcMetrics.ltvCacCurrent}:1`,                  accent: false, warn: calcMetrics.ltvCacCurrent < 3 },
                      { label: 'LTV:CAC after', value: `${calcMetrics.ltvCacProjected}:1`,               accent: true, sub: calcMetrics.ltvCacCurrent < 3 ? 'Toward 3:1 benchmark' : 'Compounding gains' },
                    ].map(({ label, value, accent, sub, warn }, i) => (
                      <div key={i} style={{ padding: '18px 16px', borderLeft: i % 2 === 1 ? `1.5px solid ${DarkBorder}` : 'none', borderTop: i >= 2 ? `1.5px solid ${DarkBorder}` : 'none' }}>
                        <p style={{ fontFamily: fontB, fontSize: 11, color: warn ? '#f59e0b' : accent ? '#22c55e' : DarkMuted, fontWeight: 700, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
                        <p style={{ fontFamily: fontSerif, fontSize: 20, fontWeight: 700, color: accent ? '#22c55e' : '#fff', margin: '0 0 3px' }}>{value}</p>
                        {sub && <p style={{ fontFamily: fontB, fontSize: 11, color: DarkMuted, margin: 0 }}>{sub}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Customers row */}
                  <div style={{ border: `1.5px solid ${DarkBorder}`, borderRadius: 6, padding: '16px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
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

                  {/* Revenue opportunity */}
                  <div style={{ borderRadius: 6, padding: '20px', background: Orange, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <p style={{ fontFamily: fontB, fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Monthly revenue opportunity</p>
                      <p style={{ fontFamily: fontSerif, fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: '#fff', margin: '0 0 6px', lineHeight: 1 }}>KES {calcMetrics.monthlyRevenueOpportunity.toLocaleString()}</p>
                      <p style={{ fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.6 }}>
                        {Math.round(calcMetrics.monthlyRevenueOpportunity / 6500)}x ROI on the KES 6,500/mo plan.
                      </p>
                    </div>
                    <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: Dark, borderRadius: 6, padding: '12px 18px', fontFamily: font, fontSize: 14, fontWeight: 700, textDecoration: 'none', alignSelf: 'flex-start' }}>
                      Get my free diagnosis <ArrowRight size={14} />
                    </Link>
                  </div>

                  <p style={{ fontFamily: fontB, fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '12px 0 0', textAlign: 'center' }}>
                    35% lead efficiency gain and 30% close rate lift from observed ICP alignment improvements.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: Warm, borderBottom: `1.5px solid ${Border}` }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 0, border: `1.5px solid ${Border}`, borderRadius: 0, overflow: 'hidden' }}>
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
                <p style={{ fontFamily: fontSerif, fontSize: 32, fontWeight: 700, color: tier.highlight ? '#fff' : Text, margin: '0 0 2px' }}>
                  {billingAnnual ? (tier as typeof tier & { annualMonthly: string }).annualMonthly + '/mo' : tier.monthly + '/mo'}
                </p>
                {billingAnnual && (
                  <p style={{ fontFamily: fontB, fontSize: 12, color: tier.highlight ? 'rgba(255,255,255,0.4)' : Muted, margin: '0 0 4px' }}>
                    Billed as {(tier as typeof tier & { annual: string }).annual}/year
                  </p>
                )}
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

          {/* Full comparison CTA */}
          <div style={{ marginTop: 28, textAlign: 'center' }}>
            <Link href="/pricing" style={{ fontFamily: fontB, fontSize: 14, color: Muted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, borderBottom: `1px solid ${Border}`, paddingBottom: 2, transition: 'color 0.15s' }}>
              See full feature comparison <ArrowRight size={14} />
            </Link>
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
      <section id="faq" style={{ background: '#fff', borderBottom: `1.5px solid ${Border}` }}>
        <div className="container" style={{ paddingTop: 'clamp(56px,8vw,80px)', paddingBottom: 'clamp(56px,8vw,80px)' }}>
          <div style={{ gridTemplateColumns: '280px 1fr', gap: 'clamp(24px,6vw,80px)', alignItems: 'start' }} className="block md:grid">
            <div style={{ marginBottom: 'clamp(28px,0vw,0px)' }} className="mb-7 md:mb-0">
              <p style={{ fontFamily: fontB, fontSize: 12, color: Muted, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>FAQ</p>
              <h2 style={{ fontFamily: fontSerif, fontSize: 'clamp(24px,3vw,36px)', color: Text, fontWeight: 700, margin: '0 0 12px', lineHeight: 1.15 }}>You ask, we answer.</h2>
              <p style={{ fontFamily: fontB, fontSize: 15, color: Muted, margin: 0 }}>Everything you need before getting started.</p>
            </div>
            <div>
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i
                return (
                  <div key={i} style={{ borderTop: `1.5px solid ${Border}`, overflow: 'hidden' }}>
                    <button onClick={() => setOpenFaq(isOpen ? null : i)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', gap: 16 }}>
                      <span style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: Text, lineHeight: 1.4 }}>{faq.q}</span>
                      <div style={{ width: 28, height: 28, borderRadius: 4, background: isOpen ? Dark : Warm, border: `1.5px solid ${Border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                        {isOpen ? <ChevronUp size={14} color="#fff" /> : <ChevronDown size={14} color={Text} />}
                      </div>
                    </button>
                    <div style={{ maxHeight: isOpen ? 300 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                      <p style={{ fontFamily: fontB, fontSize: 14, lineHeight: 1.75, color: Muted, padding: '0 0 20px', margin: 0 }}>{faq.a}</p>
                    </div>
                  </div>
                )
              })}
              <div style={{ borderTop: `1.5px solid ${Border}` }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section style={{ background: Dark, borderBottom: `1.5px solid ${DarkBorder}` }}>
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
      <footer style={{ background: Dark, borderTop: `1.5px solid ${DarkBorder}`, padding: 'clamp(32px,5vw,48px) 0 clamp(24px,4vw,32px)' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center', borderTop: `1.5px solid ${DarkBorder}`, paddingTop: 20 }}>
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
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999, background: '#fff', borderTop: `1.5px solid ${Border}`, padding: '12px clamp(16px,4vw,24px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
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
