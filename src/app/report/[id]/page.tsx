'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type Tier = 'Starter' | 'Pro' | 'Agency'

const PRICES: Record<Tier, string> = {
  Starter: 'KES 6,500',
  Pro:     'KES 13,000',
  Agency:  'KES 26,000',
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Severity = 'Critical' | 'Warning' | 'Opportunity'
type Impact   = 'High' | 'Medium' | 'Low'

interface Finding {
  title: string
  severity: Severity
  explanation: string
}

interface BreakdownCard {
  label: string
  score: number
  found: string
  why: string
}

interface QuickWin {
  action: string
  impact: Impact
}

interface BusinessOutcomes {
  cac_current: string
  cac_projected: string
  ltv_cac_current: string
  ltv_cac_projected: string
  monthly_revenue_opportunity: string
}

interface ReportData {
  company:                  string
  date:                     string
  health_score:             number
  findings:                 Finding[]
  breakdown:                BreakdownCard[]
  quick_wins:               QuickWin[]
  business_outcomes?:       BusinessOutcomes
  executive_summary?:       string
  monthly_waste_estimate?:  string
}

interface BuyerIntro {
  buyer_name:     string
  buyer_initials: string
  message:        string
}

// ── Demo / fallback data ──────────────────────────────────────────────────────

const DEMO: ReportData = {
  company:      'Your Business',
  date:         new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  health_score: 34,
  findings: [
    { title: 'ICP Definition Is Too Broad',         severity: 'Critical', explanation: "Your targeting spans multiple company sizes and industries, spending budget on audiences with fundamentally different buying triggers." },
    { title: 'Ad-to-Landing Page Message Gap',      severity: 'Critical', explanation: 'Your ads promise outcome-based ROI but your landing page leads with features, killing purchase intent the moment the click lands.' },
    { title: 'Form Friction Filtering Out Buyers',  severity: 'Warning',  explanation: 'Requiring 7+ fields at the top of funnel is blocking qualified prospects before they can self-identify as a fit.' },
  ],
  breakdown: [
    { label: 'ICP Alignment',               score: 28, found: 'Targeting 4 different company sizes with identical creative.',           why: 'Each segment has a different pain hierarchy — one message cannot convert all of them.' },
    { label: 'Targeting Accuracy',          score: 41, found: 'Lookalike audiences built from a mixed base including churned accounts.', why: "You're cloning your worst customers alongside your best." },
    { label: 'Channel Efficiency',          score: 55, found: 'Meta receiving 70% of budget but delivering only 30% of qualified leads.', why: 'LinkedIn is severely underinvested given your B2B deal size.' },
    { label: 'Funnel Friction Index',       score: 22, found: '7-field lead form on mobile with no progress indicator.',                  why: 'Every additional form field drops completion by ~8-12% on mobile.' },
    { label: 'Message to Market Fit',       score: 38, found: 'Landing page headline focuses on features instead of outcomes.',           why: "Buyers don't know they need your feature — they know they have a problem." },
    { label: 'Budget Reallocation Opportunity', score: 61, found: 'Estimated 40-60% of spend reaching non-ICP audiences.',             why: 'High-intent keywords and job-title targeting could reduce CPA by 35-50%.' },
  ],
  quick_wins: [
    { action: 'Rebuild lookalike audiences using only your top 20% customers by LTV, exclude all churned accounts from the seed list.', impact: 'High' },
    { action: 'Reduce your lead form to 3 fields and add a client logo strip or testimonial quote above the fold.',                     impact: 'High' },
    { action: 'Rewrite your headline to lead with the specific outcome your best customers achieved, not your product features.',        impact: 'Medium' },
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapDiagnosis(d: Record<string, unknown>): ReportData {
  return {
    company:                 DEMO.company,
    date:                    new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    health_score:            (d.overall_score ?? d.health_score ?? DEMO.health_score) as number,
    findings:                (d.critical_findings ?? d.findings ?? DEMO.findings) as ReportData['findings'],
    breakdown:               (d.breakdown ?? DEMO.breakdown) as ReportData['breakdown'],
    quick_wins:              (d.quick_wins ?? DEMO.quick_wins) as ReportData['quick_wins'],
    business_outcomes:       (d.business_outcomes ?? undefined) as ReportData['business_outcomes'],
    executive_summary:       (d.executive_summary ?? undefined) as string | undefined,
    monthly_waste_estimate:  (d.monthly_waste_estimate ?? undefined) as string | undefined,
  }
}

function scoreLabel(s: number) {
  return s >= 71 ? 'Healthy' : s >= 41 ? 'At Risk' : 'Critical'
}
function scoreColor(s: number) {
  return s >= 71 ? '#22c55e' : s >= 41 ? '#f59e0b' : '#ef4444'
}
function scoreContext(s: number): string {
  if (s >= 71) return 'Your targeting is well-aligned. Focus on scale and efficiency.'
  if (s >= 41) return 'Significant budget is likely reaching the wrong audiences.'
  return 'Most of your ad spend is reaching people who will never convert.'
}

function extractShortMoney(text: string | undefined): string {
  if (!text) return '—'
  const m = text.match(/(?:KES|USD|\$|£|€)\s*[\d,]+(?:\.\d+)?(?:\s*[KMBkmb])?/i)
  return m ? m[0].trim() : text.slice(0, 25)
}
function extractShortRatio(text: string | undefined): string {
  if (!text) return '—'
  const m = text.match(/\d+\.?\d*\s*:\s*1/)
  return m ? m[0] : text.slice(0, 15)
}

// ── Components ────────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  const styles: Record<Severity, string> = {
    Critical:    'bg-red-50 text-red-600 border-red-200',
    Warning:     'bg-amber-50 text-amber-600 border-amber-200',
    Opportunity: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  }
  return (
    <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full border ${styles[severity]}`}>
      {severity}
    </span>
  )
}

function ImpactBadge({ impact }: { impact: Impact }) {
  const styles: Record<Impact, string> = {
    High:   'bg-[rgba(232,51,10,0.06)] text-[#e8330a] border-[rgba(232,51,10,0.25)]',
    Medium: 'bg-amber-50 text-amber-600 border-amber-200',
    Low:    'bg-[rgba(201,192,177,0.2)] text-[#939084] border-[#c5c0b1]',
  }
  return (
    <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full border ${styles[impact]}`}>
      {impact} Impact
    </span>
  )
}

function ScoreBar({ score, animate }: { score: number; animate: boolean }) {
  const color = score >= 71 ? '#22c55e' : score >= 41 ? '#f59e0b' : '#ef4444'
  return (
    <div className="h-1.5 bg-[rgba(201,192,177,0.3)] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: animate ? `${score}%` : '0%', background: color }}
      />
    </div>
  )
}

function CircleScore({ score, animate }: { score: number; animate: boolean }) {
  const r    = 54
  const circ = 2 * Math.PI * r
  const fill = animate ? (score / 100) * circ : 0
  const col  = scoreColor(score)
  const lbl  = scoreLabel(score)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 124 124">
          <circle cx="62" cy="62" r={r} fill="none" stroke="#f0ebe4" strokeWidth="10" />
          <circle
            cx="62" cy="62" r={r} fill="none"
            stroke={col} strokeWidth="10"
            strokeDasharray={`${fill} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.3s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black text-[#201515] leading-none">{score}</span>
          <span className="text-xs text-[#939084] mt-1">/ 100</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-sm font-bold px-4 py-1.5 rounded-full border-2"
          style={{ color: col, borderColor: col + '50', backgroundColor: col + '12' }}>
          {lbl}
        </span>
        <p className="text-xs text-[#939084] text-center max-w-[180px] leading-relaxed">
          {scoreContext(score)}
        </p>
      </div>
    </div>
  )
}

function BuyerAvatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: color }}>
      {initials}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#fffefb] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin h-10 w-10 text-[#e8330a]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-[#605d52] text-sm font-medium animate-pulse">Generating your diagnostic report…</p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportPage({ params }: { params: { id: string } }) {
  const [report,           setReport]           = useState<ReportData | null>(null)
  const [loading,          setLoading]          = useState(true)
  const [animate,          setAnimate]          = useState(false)
  const [showModal,        setShowModal]        = useState(false)
  const [selectedTier,     setSelectedTier]     = useState<Tier>('Pro')
  const [email,            setEmail]            = useState('')
  const [subscribing,      setSubscribing]      = useState(false)
  const [subscribeError,   setSubscribeError]   = useState('')
  const [isSubscribed,     setIsSubscribed]     = useState(false)
  const [buyerIntro,       setBuyerIntro]       = useState<BuyerIntro | null>(null)
  const [showBreakdown,    setShowBreakdown]    = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      try {
        const [reportRes, introRes] = await Promise.all([
          fetch(`/api/report/${params.id}`),
          fetch('/api/monthly-checkin?type=intro'),
        ])

        if (reportRes.ok) {
          const data = await reportRes.json()
          if (data.isSubscribed) setIsSubscribed(true)
          const d = data.report?.diagnosis ?? {}
          setReport(mapDiagnosis(d))
        } else {
          setReport(DEMO)
        }

        if (introRes.ok) {
          const introData = await introRes.json()
          if (introData?.checkin) setBuyerIntro(introData.checkin as BuyerIntro)
        }
      } catch {
        setReport(DEMO)
      } finally {
        setLoading(false)
        setTimeout(() => setAnimate(true), 100)
      }
    }
    load()
  }, [params.id])

  useEffect(() => {
    if (showModal) setTimeout(() => emailRef.current?.focus(), 50)
  }, [showModal])

  const openSubscribe = (tier: Tier) => {
    setSelectedTier(tier)
    setSubscribeError('')
    setShowModal(true)
  }

  const handleSubscribe = async () => {
    if (!email.trim()) { setSubscribeError('Please enter your email address.'); return }
    setSubscribing(true)
    setSubscribeError('')
    try {
      const res = await fetch('/api/paystack/initialize', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), tier: selectedTier }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not initialize payment')
      window.location.href = data.authorization_url
    } catch (err) {
      setSubscribeError(err instanceof Error ? err.message : 'Something went wrong')
      setSubscribing(false)
    }
  }

  if (loading) return <LoadingSkeleton />
  if (!report)  return <LoadingSkeleton />

  const criticalCount = report.findings.filter(f => f.severity === 'Critical').length
  const weakDimensions = report.breakdown.filter(b => b.score < 50)

  // Initials color palette for buyers
  const BUYER_COLORS: Record<string, string> = {
    EK: '#201515', AM: '#7c3aed', DO: '#0369a1', GN: '#065f46', MW: '#9a3412',
  }
  const buyerColor = buyerIntro
    ? (BUYER_COLORS[buyerIntro.buyer_initials] ?? '#201515')
    : '#201515'

  return (
    <div className="min-h-screen bg-[#fffefb] text-[#201515]">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .fade-up { animation: fadeUp 0.45s ease both; }
        @media print {
          nav, .no-print { display: none !important; }
          body { background: #fff !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Nav */}
      <nav className="border-b border-[#c5c0b1] px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="text-sm font-bold tracking-tight text-[#201515]">
          ICP<span className="text-[#e8330a]">Diagnostic</span>
        </Link>
        <div className="flex items-center gap-3">
          {isSubscribed && (
            <Link href="/dashboard"
              className="text-xs font-semibold bg-[#201515] text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
              Go to Dashboard →
            </Link>
          )}
          <button
            onClick={() => window.print()}
            className="text-xs font-medium border border-[#c5c0b1] px-3 py-1.5 rounded-lg text-[#605d52] hover:border-[#201515] hover:text-[#201515] transition-colors no-print"
          >
            Save PDF
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-8 sm:space-y-12">

        {/* ── SECTION 1 · Score Header ───────────────────────────────────── */}
        <section className="fade-up flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-10 pb-8 sm:pb-10 border-b border-[#c5c0b1]">
          <div className="flex-1">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-widest text-[#e8330a] bg-[rgba(232,51,10,0.08)] border border-[rgba(232,51,10,0.2)] px-3 py-1 rounded-full mb-4">
              Ideal ICP Report
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#201515] leading-tight mb-3">
              {report.health_score < 41
                ? 'Your targeting is costing you.'
                : report.health_score < 71
                  ? 'Your targeting has significant gaps.'
                  : 'Your ICP is well-aligned.'}
            </h1>
            <p className="text-[#605d52] text-base leading-relaxed mb-1 max-w-lg">
              {report.executive_summary
                ? report.executive_summary.slice(0, 180) + (report.executive_summary.length > 180 ? '…' : '')
                : `We found ${criticalCount} critical issue${criticalCount !== 1 ? 's' : ''} in your targeting, messaging, and funnel setup.`}
            </p>
            {report.monthly_waste_estimate && (
              <p className="text-sm font-semibold text-[#e8330a] mt-2">
                Estimated monthly waste: {report.monthly_waste_estimate}
              </p>
            )}

            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3 max-w-xs sm:max-w-none">
              {[
                { label: 'Critical Issues',      value: `${criticalCount}` },
                { label: 'Dimensions Analysed',  value: `${report.breakdown.length}` },
                { label: 'Immediate Actions',    value: `${report.quick_wins.length}` },
              ].map(s => (
                <div key={s.label} className="bg-[#f8f4f0] border border-[#c5c0b1] rounded-xl px-3 sm:px-5 py-3">
                  <p className="text-2xl font-extrabold text-[#201515]">{s.value}</p>
                  <p className="text-[11px] text-[#939084] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 self-center sm:self-start">
            <CircleScore score={report.health_score} animate={animate} />
          </div>
        </section>

        {/* ── SECTION 2 · Critical Findings ─────────────────────────────── */}
        <section className="fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#201515] mb-1">Critical Findings</h2>
            <p className="text-[#939084] text-sm">Ranked by revenue impact — these are the issues hurting you most right now</p>
          </div>
          <div className="space-y-3">
            {report.findings.map((f, i) => {
              const borderColor = f.severity === 'Critical' ? '#ef4444' : f.severity === 'Warning' ? '#f59e0b' : '#22c55e'
              return (
                <div key={i} className="flex gap-4 bg-white border border-[#c5c0b1] rounded-xl p-5 hover:shadow-sm transition-shadow"
                  style={{ borderLeft: `4px solid ${borderColor}` }}>
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#f8f4f0] border border-[#c5c0b1] flex items-center justify-center text-[#605d52] text-sm font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-[#201515] font-semibold text-sm">{f.title}</h3>
                      <SeverityBadge severity={f.severity} />
                    </div>
                    <p className="text-[#605d52] text-sm leading-relaxed">{f.explanation}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── SECTION 3 · Score Breakdown ───────────────────────────────── */}
        <section className="fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#201515] mb-0.5">Score Breakdown</h2>
              <p className="text-[#939084] text-sm">Your score across {report.breakdown.length} diagnostic dimensions</p>
            </div>
            <button
              className="sm:hidden text-xs font-semibold text-[#e8330a] border border-[rgba(232,51,10,0.3)] px-3 py-1.5 rounded-lg"
              onClick={() => setShowBreakdown(v => !v)}
            >
              {showBreakdown ? 'Hide' : 'Show all'}
            </button>
          </div>
          {/* Mobile: show only top 2 worst scores unless expanded */}
          <div className="grid sm:grid-cols-2 gap-3">
            {report.breakdown
              .slice()
              .sort((a, b) => a.score - b.score)
              .filter((_, i) => showBreakdown || i < 2)
              .map((card, i) => {
                const col = scoreColor(card.score)
                return (
                  <div key={i} className="bg-white border border-[#c5c0b1] rounded-xl p-4 sm:p-5 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[#201515] font-semibold text-sm">{card.label}</h3>
                      <span className="text-xl font-black" style={{ color: col }}>{card.score}</span>
                    </div>
                    <ScoreBar score={card.score} animate={animate} />
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#939084] w-14 pt-0.5">Found</span>
                        <p className="text-[#605d52] text-xs leading-relaxed">{card.found}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#939084] w-14 pt-0.5">Why</span>
                        <p className="text-[#605d52] text-xs leading-relaxed">{card.why}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
          {!showBreakdown && report.breakdown.length > 2 && (
            <button
              className="sm:hidden mt-3 w-full text-center text-xs font-semibold text-[#605d52] border border-[#c5c0b1] px-4 py-2.5 rounded-xl"
              onClick={() => setShowBreakdown(true)}
            >
              Show {report.breakdown.length - 2} more dimensions ↓
            </button>
          )}
        </section>

        {/* ── SECTION 4 · Quick Wins ────────────────────────────────────── */}
        <section className="fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#201515] mb-1">Quick Wins</h2>
            <p className="text-[#939084] text-sm">Actions you can implement this week — no agency required</p>
          </div>
          <div className="space-y-3">
            {report.quick_wins.map((w, i) => (
              <div key={i} className="flex gap-4 bg-white border border-[#c5c0b1] rounded-xl p-5 hover:border-[rgba(232,51,10,0.3)] transition-colors">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[rgba(232,51,10,0.08)] border border-[rgba(232,51,10,0.2)] flex items-center justify-center text-[#e8330a] font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-[#605d52] text-sm leading-relaxed mb-2.5">{w.action}</p>
                  <ImpactBadge impact={w.impact} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 5 · Business Outcomes ─────────────────────────────── */}
        {report.business_outcomes && (
          <section className="fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-[#201515] mb-1">Business Outcomes</h2>
              <p className="text-[#939084] text-sm">Projected unit economics before and after fixing your ICP</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div className="bg-white border border-[#c5c0b1] rounded-xl p-4 sm:p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#939084] mb-3">Customer Acquisition Cost</p>
                <div className="flex items-center gap-4 mb-3">
                  <div>
                    <p className="text-[11px] text-[#939084] mb-0.5">Current</p>
                    <p className="text-xl font-black text-red-500">{extractShortMoney(report.business_outcomes.cac_current)}</p>
                  </div>
                  <div className="text-[#c5c0b1] text-lg">→</div>
                  <div>
                    <p className="text-[11px] text-[#939084] mb-0.5">Projected</p>
                    <p className="text-xl font-black text-emerald-500">{extractShortMoney(report.business_outcomes.cac_projected)}</p>
                  </div>
                </div>
                <p className="text-xs text-[#939084] leading-relaxed">Lower CAC means more customers from the same budget after ICP alignment.</p>
              </div>
              <div className="bg-white border border-[#c5c0b1] rounded-xl p-4 sm:p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#939084] mb-3">LTV : CAC Ratio</p>
                <div className="flex items-center gap-4 mb-3">
                  <div>
                    <p className="text-[11px] text-[#939084] mb-0.5">Current</p>
                    <p className="text-xl font-black text-amber-500">{extractShortRatio(report.business_outcomes.ltv_cac_current)}</p>
                  </div>
                  <div className="text-[#c5c0b1] text-lg">→</div>
                  <div>
                    <p className="text-[11px] text-[#939084] mb-0.5">Projected</p>
                    <p className="text-xl font-black text-emerald-500">{extractShortRatio(report.business_outcomes.ltv_cac_projected)}</p>
                  </div>
                </div>
                <p className="text-xs text-[#939084] leading-relaxed">Healthy B2B benchmark is 3:1 or above. Below 2:1 means your acquisition model is unsustainable.</p>
              </div>
            </div>
            {report.business_outcomes.monthly_revenue_opportunity && (
              <div className="bg-[rgba(232,51,10,0.04)] border border-[rgba(232,51,10,0.15)] rounded-xl p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#e8330a] mb-1">Monthly Revenue Opportunity</p>
                <p className="text-[#605d52] text-sm leading-relaxed">{report.business_outcomes.monthly_revenue_opportunity}</p>
              </div>
            )}
          </section>
        )}

        {/* ── SECTION 6 · Media Buyer Teaser ────────────────────────────── */}
        <section className="fade-up no-print" style={{ animationDelay: '0.22s' }}>
          <div className="bg-[#201515] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-shrink-0">
              {buyerIntro ? (
                <BuyerAvatar initials={buyerIntro.buyer_initials} color={buyerColor} />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[rgba(255,255,255,0.15)] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              {buyerIntro ? (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.45)] mb-1">Message from your media buyer</p>
                  <p className="text-white font-semibold text-sm mb-0.5">{buyerIntro.buyer_name} has reviewed your report</p>
                  <p className="text-[rgba(255,255,255,0.6)] text-sm leading-relaxed line-clamp-2">
                    {buyerIntro.message.slice(0, 140)}{buyerIntro.message.length > 140 ? '…' : ''}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.45)] mb-1">Your dedicated media buyer</p>
                  <p className="text-white font-semibold text-sm mb-0.5">A media buyer is reviewing your report</p>
                  <p className="text-[rgba(255,255,255,0.6)] text-sm leading-relaxed">
                    Based on your region and industry, a specialist has been assigned to your account. Expect a personalised message within the next few hours.
                  </p>
                </>
              )}
            </div>
            <div className="flex-shrink-0 w-full sm:w-auto">
              <Link href="/dashboard"
                className="block w-full sm:w-auto text-center bg-white text-[#201515] font-semibold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap">
                {buyerIntro ? 'Read full message →' : 'Go to Dashboard →'}
              </Link>
            </div>
          </div>
        </section>

        {/* ── SECTION 7 · Paywall or Dashboard CTA ──────────────────────── */}
        <section className="relative no-print fade-up" style={{ animationDelay: '0.25s' }}>

          {isSubscribed ? (
            <div className="bg-[#201515] border border-[rgba(232,51,10,0.2)] rounded-2xl p-10 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[rgba(232,51,10,0.15)] border border-[rgba(232,51,10,0.3)] mb-5">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-[#e8330a]">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-2">Your dashboard is live</h2>
              <p className="text-[rgba(255,255,255,0.55)] text-sm mb-2 max-w-sm mx-auto">
                All your findings, quick wins, and score history are waiting. Your media buyer will send you a message within the next few hours.
              </p>
              <p className="text-[rgba(255,255,255,0.35)] text-xs mb-7">Weekly intelligence briefings start on Monday.</p>
              <Link href="/dashboard"
                className="inline-block bg-[#e8330a] text-white font-semibold text-sm px-8 py-3 rounded-xl hover:opacity-90 transition-opacity">
                Open My Dashboard →
              </Link>
            </div>
          ) : (
            <>
              {/* Blurred locked preview — personalised to their actual weak dimensions */}
              <div className="relative overflow-hidden rounded-2xl border border-[#c5c0b1] bg-[#f8f4f0]">
                <div className="blur-[3px] pointer-events-none select-none p-7 space-y-4 opacity-60">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#939084]">Locked — Starter required</p>
                  <h3 className="text-[#201515] font-bold text-lg">Your Full Analysis & Fix Plan</h3>
                  {weakDimensions.slice(0, 3).map((d, i) => (
                    <div key={i} className="flex gap-3 items-start bg-white rounded-xl p-4 border border-[#c5c0b1]">
                      <div className="w-4 h-4 rounded-full bg-red-100 border border-red-200 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-[#201515]">{d.label} — Score {d.score}/100</p>
                        <p className="text-xs text-[#605d52] mt-0.5">Full remediation steps and week-by-week fix plan →</p>
                      </div>
                    </div>
                  ))}
                  {[
                    'Monthly ICP health score refresh with trend tracking',
                    'Weekly intelligence briefings from your media buyer',
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3 items-center bg-white rounded-xl px-4 py-3 border border-[#c5c0b1]">
                      <div className="w-4 h-4 rounded-full bg-[rgba(232,51,10,0.15)] flex-shrink-0" />
                      <p className="text-xs text-[#605d52]">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#fffefb]/40 to-[#fffefb]" />
              </div>

              {/* Paywall card */}
              <div className="relative -mt-10 z-10">
                <div className="bg-[#201515] border border-[rgba(232,51,10,0.2)] rounded-2xl p-7 sm:p-10 text-center shadow-2xl">
                  <span className="inline-block text-[11px] font-semibold uppercase tracking-widest text-[#e8330a] bg-[rgba(232,51,10,0.1)] border border-[rgba(232,51,10,0.25)] px-3 py-1 rounded-full mb-5">
                    Unlock Full Analysis
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 leading-tight">
                    {weakDimensions.length > 0
                      ? `${weakDimensions.length} dimension${weakDimensions.length !== 1 ? 's' : ''} below 50. Here's how to fix them.`
                      : 'Get your full optimisation roadmap'}
                  </h2>
                  <p className="text-[rgba(255,255,255,0.6)] text-sm max-w-lg mx-auto mb-7 leading-relaxed">
                    Your report surfaces the problems. Your dashboard gives you the full fix plan, progress tracking, weekly intelligence from your media buyer, and a score that updates as you improve.
                  </p>

                  {/* Pricing tiers */}
                  <div className="grid sm:grid-cols-3 gap-3 mb-8">
                    {(
                      [
                        {
                          name: 'Starter' as Tier, highlight: false,
                          features: ['Full fix plan for all findings', 'Score history and trend tracking', 'Weekly intelligence briefings', 'Buyer message each month'],
                        },
                        {
                          name: 'Pro' as Tier, highlight: true,
                          features: ['Everything in Starter', 'Live landing page audit', 'Regional and competitor benchmarks', 'Monthly session with your buyer'],
                        },
                        {
                          name: 'Agency' as Tier, highlight: false,
                          features: ['Everything in Pro', 'Team of media buyers on your account', 'White-label reports', 'Dedicated account manager'],
                        },
                      ]
                    ).map(tier => (
                      <div key={tier.name}
                        className={`relative rounded-xl p-5 text-left border transition-all ${
                          tier.highlight
                            ? 'border-[#e8330a] bg-[rgba(232,51,10,0.1)] shadow-lg shadow-[rgba(232,51,10,0.15)]'
                            : 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)]'
                        }`}>
                        {tier.highlight && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-[#e8330a] text-white px-3 py-1 rounded-full">
                              Most Popular
                            </span>
                          </div>
                        )}
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${tier.highlight ? 'text-[rgba(255,255,255,0.6)]' : 'text-[rgba(255,255,255,0.4)]'}`}>{tier.name}</p>
                        <div className="flex items-baseline gap-1 mb-4 flex-wrap">
                          <span className="text-2xl font-black text-white">{PRICES[tier.name]}</span>
                          <span className="text-sm text-[rgba(255,255,255,0.4)]">/mo</span>
                        </div>
                        <ul className="space-y-1.5 mb-5">
                          {tier.features.map(f => (
                            <li key={f} className="flex items-start gap-2 text-xs text-[rgba(255,255,255,0.65)]">
                              <span className="text-[#e8330a] flex-shrink-0 mt-px font-bold">✓</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => openSubscribe(tier.name)}
                          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                            tier.highlight
                              ? 'bg-[#e8330a] text-white shadow shadow-[rgba(232,51,10,0.4)]'
                              : 'border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.12)] hover:text-white'
                          }`}>
                          Get Started
                        </button>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-[rgba(255,255,255,0.3)]">
                    Secured by Paystack · Cancel anytime · KES pricing, billed monthly
                  </p>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ── Email / Subscribe Modal ────────────────────────────────────── */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-[#f8f4f0] border border-[rgba(232,51,10,0.2)] rounded-2xl p-7 shadow-2xl">
              <button onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-[#939084] hover:text-[#201515] transition-colors text-xl leading-none">
                ✕
              </button>
              <span className="inline-block text-[10px] font-semibold uppercase tracking-widest text-[#e8330a] bg-[rgba(232,51,10,0.08)] border border-[rgba(232,51,10,0.2)] px-2.5 py-1 rounded-full mb-4">
                {selectedTier} · {PRICES[selectedTier]}/mo
              </span>
              <h3 className="text-xl font-bold text-[#201515] mb-1">Enter your email to continue</h3>
              <p className="text-[#605d52] text-sm mb-5">Your receipt and subscription details will be sent here.</p>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSubscribe() }}
                placeholder="you@company.com"
                className="w-full bg-[rgba(201,192,177,0.18)] border border-[#c5c0b1] focus:border-[#e8330a] rounded-xl px-4 py-3.5 text-[#201515] placeholder-[#939084] text-sm outline-none transition-colors mb-3"
              />
              {subscribeError && <p className="text-xs text-red-500 mb-3">{subscribeError}</p>}
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="w-full py-3.5 rounded-xl bg-[#e8330a] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2">
                {subscribing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Redirecting to Paystack…
                  </>
                ) : (
                  `Pay ${PRICES[selectedTier]}/mo →`
                )}
              </button>
              <p className="text-center text-xs text-[#939084] mt-3">Secured by Paystack · Cancel anytime</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-[#c5c0b1] pt-8 pb-4 text-center text-[#939084] text-xs space-x-3">
          <span>ICP<span className="text-[#e8330a]/50">Diagnostic</span></span>
          <span>·</span>
          <Link href="/" className="hover:text-[#605d52] transition-colors">Back to Home</Link>
          <span>·</span>
          <Link href="/dashboard" className="hover:text-[#605d52] transition-colors">Dashboard</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-[#605d52] transition-colors">Privacy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-[#605d52] transition-colors">Terms</Link>
        </footer>
      </div>
    </div>
  )
}
