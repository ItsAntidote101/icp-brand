'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'

type Tier = 'Starter' | 'Pro' | 'Agency'

const PRICES: Record<Tier, string> = {
  Starter: 'KES 6,500',
  Pro:     'KES 13,000',
  Agency:  'KES 26,000',
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Severity = 'Critical' | 'Warning' | 'Opportunity'
type Impact = 'High' | 'Medium' | 'Low'

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
  company: string
  date: string
  health_score: number
  findings: Finding[]
  breakdown: BreakdownCard[]
  quick_wins: QuickWin[]
  business_outcomes?: BusinessOutcomes
  executive_summary?: string
  monthly_waste_estimate?: string
}

// ── Demo / fallback data ──────────────────────────────────────────────────────

const DEMO: ReportData = {
  company: 'Your Business',
  date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  health_score: 34,
  findings: [
    {
      title: 'ICP Definition Is Too Broad',
      severity: 'Critical',
      explanation:
        "Your targeting spans multiple company sizes and industries, you're spending budget on audiences with fundamentally different buying triggers and no single message can convert them.",
    },
    {
      title: 'Ad-to-Landing Page Message Gap',
      severity: 'Critical',
      explanation:
        'Your ads promise outcome-based ROI but your landing page leads with features, this mismatch kills purchase intent the moment the click lands.',
    },
    {
      title: 'Form Friction Filtering Out Qualified Buyers',
      severity: 'Warning',
      explanation:
        'Requiring 7+ fields at the top of funnel is blocking qualified prospects before they can self-identify as a fit.',
    },
  ],
  breakdown: [
    {
      label: 'ICP Alignment',
      score: 28,
      found: 'Targeting 4 different company sizes with identical creative and offer.',
      why: 'Each segment has a different pain hierarchy, one message cannot convert all of them simultaneously.',
    },
    {
      label: 'Targeting Accuracy',
      score: 41,
      found: 'Lookalike audiences built from a mixed customer base that includes churned accounts.',
      why: "You're cloning your worst customers alongside your best, the algorithm has no signal to distinguish them.",
    },
    {
      label: 'Channel Efficiency',
      score: 55,
      found: 'Meta is receiving 70% of budget but delivering only 30% of qualified leads.',
      why: 'LinkedIn is severely underinvested given your B2B deal size and sales cycle length.',
    },
    {
      label: 'Funnel Friction Index',
      score: 22,
      found: '7-field lead form on mobile with no progress indicator and no trust signals above the fold.',
      why: 'Every additional form field drops completion rate by an estimated 8-12% on mobile devices.',
    },
    {
      label: 'Message to Market Fit',
      score: 38,
      found: 'Landing page headline focuses on features ("AI-powered") instead of outcomes ("cut churn by 30%").',
      why: "Awareness-stage buyers don't know they need your feature, they know they have a problem.",
    },
    {
      label: 'Budget Reallocation Opportunity',
      score: 61,
      found: 'Estimated 40-60% of monthly spend is reaching non-ICP audiences based on your targeting parameters.',
      why: 'Reallocating to high-intent keywords and job-title targeting could reduce CPA by 35-50%.',
    },
  ],
  quick_wins: [
    {
      action:
        'Rebuild your lookalike audiences using only your top 20% customers by LTV, exclude all churned accounts from the seed list.',
      impact: 'High',
    },
    {
      action:
        'Reduce your lead form to 3 fields (Name, Email, Company) and add a client logo strip or testimonial quote above the fold.',
      impact: 'High',
    },
    {
      action:
        "Rewrite your headline to lead with the specific outcome your best customers achieved, not your product's technology or feature set.",
      impact: 'Medium',
    },
  ],
}

// ── Small helper components ───────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  const styles: Record<Severity, string> = {
    Critical: 'bg-red-900/30 text-red-400 border-red-700/40',
    Warning: 'bg-amber-900/30 text-amber-400 border-amber-700/40',
    Opportunity: 'bg-emerald-900/30 text-emerald-400 border-emerald-700/40',
  }
  return (
    <span className={`text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full border ${styles[severity]}`}>
      {severity}
    </span>
  )
}

function ImpactBadge({ impact }: { impact: Impact }) {
  const styles: Record<Impact, string> = {
    High: 'bg-[rgba(220,38,38,0.06)] text-[#e8330a] border-[rgba(220,38,38,0.25)]',
    Medium: 'bg-[rgba(245,158,11,0.06)] text-amber-500 border-amber-600/30',
    Low: 'bg-[rgba(201,192,177,0.2)] text-[#939084] border-[#c5c0b1]',
  }
  return (
    <span className={`text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full border ${styles[impact]}`}>
      {impact} Impact
    </span>
  )
}

function ScoreBar({ score, animate }: { score: number; animate: boolean }) {
  const color =
    score >= 71 ? 'from-emerald-500 to-emerald-400'
    : score >= 41 ? 'from-amber-500 to-amber-400'
    : 'from-red-500 to-red-400'
  return (
    <div className="h-2 bg-[rgba(201,192,177,0.25)] rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`}
        style={{ width: animate ? `${score}%` : '0%' }}
      />
    </div>
  )
}

function CircleScore({ score, animate }: { score: number; animate: boolean }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const fill = animate ? (score / 100) * circ : 0
  const color =
    score >= 71 ? '#22c55e'
    : score >= 41 ? '#f59e0b'
    : '#ef4444'
  const label =
    score >= 71 ? 'Healthy'
    : score >= 41 ? 'At Risk'
    : 'Critical'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#1a1a2e" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={`${fill} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-[#201515] leading-none">{score}</span>
          <span className="text-xs text-[#939084] mt-0.5">/ 100</span>
        </div>
      </div>
      <span
        className="text-sm font-semibold px-3 py-1 rounded-full border"
        style={{ color, borderColor: color + '40', backgroundColor: color + '15' }}
      >
        {label}
      </span>
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

function mapDiagnosis(d: Record<string, unknown>): ReportData {
  return {
    company: DEMO.company,
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    health_score: (d.overall_score ?? d.health_score ?? DEMO.health_score) as number,
    findings: (d.critical_findings ?? d.findings ?? DEMO.findings) as ReportData['findings'],
    breakdown: (d.breakdown ?? DEMO.breakdown) as ReportData['breakdown'],
    quick_wins: (d.quick_wins ?? DEMO.quick_wins) as ReportData['quick_wins'],
    business_outcomes: (d.business_outcomes ?? undefined) as ReportData['business_outcomes'],
    executive_summary: (d.executive_summary ?? undefined) as string | undefined,
    monthly_waste_estimate: (d.monthly_waste_estimate ?? undefined) as string | undefined,
  }
}

export default function ReportPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [animate, setAnimate] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState<Tier>('Pro')
  const [email, setEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeError, setSubscribeError] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [enhanceDone, setEnhanceDone] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollCount = useRef(0)

  const startPolling = useCallback((diagnosticId: string) => {
    pollCount.current = 0
    pollRef.current = setInterval(async () => {
      pollCount.current++
      if (pollCount.current > 36) { // 3 min timeout
        clearInterval(pollRef.current!)
        setEnhancing(false)
        return
      }
      try {
        const r = await fetch(`/api/report/${params.id}`)
        if (!r.ok) return
        const data = await r.json()
        const d = data.report?.diagnosis ?? {}
        if (d.is_enhanced === true) {
          clearInterval(pollRef.current!)
          setEnhancing(false)
          setEnhanceDone(true)
          setReport(mapDiagnosis(d))
          setTimeout(() => setEnhanceDone(false), 4000)
        }
      } catch { /* non-fatal */ }
    }, 5000)
  }, [params.id])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/report/${params.id}`)
        if (res.ok) {
          const data = await res.json()

          if (data.isSubscribed) setIsSubscribed(true)

          const d = data.report?.diagnosis ?? {}
          setReport(mapDiagnosis(d))

          // Trigger live-research enhancement for subscriber reports not yet enhanced
          if (d.is_deep_research === true && d.is_enhanced === false) {
            const diagnosticId: string = data.report?.id ?? ''
            setEnhancing(true)
            // Fire-and-forget: server continues even if user navigates away
            fetch('/api/diagnostic/enhance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ diagnosticId }),
            }).catch(() => {})
            startPolling(diagnosticId)
          }
        } else {
          setReport(DEMO)
        }
      } catch {
        setReport(DEMO)
      } finally {
        setLoading(false)
        setTimeout(() => setAnimate(true), 100)
      }
    }
    load()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [params.id, startPolling])

  // Focus email input when modal opens
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), tier: selectedTier }),
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
  if (!report) return <LoadingSkeleton />

  return (
    <div className="min-h-screen bg-[#fffefb] text-[#201515]">
      <style>{`
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
        <div className="flex items-center gap-4">
          <span className="text-xs text-[#939084]">Report ID: {params.id.slice(0, 8)}…</span>
          <button
            onClick={() => window.print()}
            className="text-xs font-medium border border-[#c5c0b1] px-3 py-1.5 rounded-lg text-[#605d52] hover:border-[#201515] hover:text-[#201515] transition-colors"
          >
            Download PDF
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">

        {/* ── Enhancement banner ─────────────────────────────────────────── */}
        {enhancing && (
          <div className="flex items-center gap-3 bg-[rgba(232,51,10,0.06)] border border-[rgba(232,51,10,0.2)] rounded-lg px-4 py-3 no-print">
            <svg className="animate-spin h-3.5 w-3.5 text-[#e8330a] flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-[#e8330a] text-xs font-medium">Fetching live benchmarks and competitor data for your market. This report will update automatically when complete.</p>
          </div>
        )}

        {/* ── SECTION 1 · Header ─────────────────────────────────────────── */}
        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 pb-10 border-b border-[#c5c0b1]">
          <div className="flex-1">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-widest text-[#e8330a] bg-[rgba(232,51,10,0.08)] border border-[rgba(232,51,10,0.2)] px-3 py-1 rounded-full mb-4">
              ICP Diagnostic Report
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#201515] leading-tight mb-2">
              Your ICP Diagnostic Report
            </h1>
            <p className="text-[#605d52] text-sm mb-1">{report.company}</p>
            <p className="text-[#939084] text-xs">Generated {report.date}</p>

            <div className="mt-6 grid grid-cols-3 sm:grid-cols-3 gap-3 xs:gap-4">
              {[
                { label: 'Sections Analyzed', value: '6' },
                { label: 'Questions Answered', value: '30' },
                { label: 'Actions Identified', value: `${report.quick_wins.length + 9}` },
              ].map(s => (
                <div key={s.label} className="bg-[#f8f4f0] border border-[#c5c0b1] rounded px-4 py-3">
                  <p className="text-xl font-bold text-[#201515]">{s.value}</p>
                  <p className="text-[11px] text-[#939084] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0">
            <CircleScore score={report.health_score} animate={animate} />
            <p className="text-center text-xs text-[#939084] mt-3 max-w-[160px]">
              Overall ICP Health Score
            </p>
          </div>
        </section>

        {/* ── AI Executive Summary ────────────────────────────────────────── */}
        {report.executive_summary && (
          <section className="bg-[#f8f4f0] border border-[#c5c0b1] rounded p-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#e8330a]/20 border border-[#e8330a]/30 flex items-center justify-center mt-0.5">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#e8330a]">
                  <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm1 11H9v-2h2v2zm0-4H9V7h2v2z" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#e8330a] mb-2">Diagnosis Summary</p>
                <p className="text-[#605d52] text-sm leading-relaxed">{report.executive_summary}</p>
                {report.monthly_waste_estimate && (
                  <p className="text-xs text-[#939084] mt-2 pt-2 border-t border-[rgba(201,192,177,0.25)]">Estimated waste: {report.monthly_waste_estimate}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── SECTION 2 · Executive Summary ──────────────────────────────── */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#201515] mb-1">Executive Summary</h2>
            <p className="text-[#939084] text-sm">3 critical findings ranked by revenue impact</p>
          </div>
          <div className="space-y-4">
            {report.findings.map((f, i) => (
              <div
                key={i}
                className="flex gap-4 bg-[#f8f4f0] border border-[#c5c0b1] rounded p-5 hover:border-white/20 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[rgba(201,192,177,0.18)] border border-[#c5c0b1] flex items-center justify-center text-[#605d52] text-sm font-bold">
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
            ))}
          </div>
        </section>

        {/* ── SECTION 3 · Detailed Breakdown ─────────────────────────────── */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#201515] mb-1">Detailed Breakdown</h2>
            <p className="text-[#939084] text-sm">Score, finding, and revenue implication for each diagnostic dimension</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {report.breakdown.map((card, i) => {
              const scoreColor =
                card.score >= 71 ? 'text-emerald-400'
                : card.score >= 41 ? 'text-amber-400'
                : 'text-red-400'
              return (
                <div
                  key={i}
                  className="bg-[#f8f4f0] border border-[#c5c0b1] rounded p-5 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[#201515] font-semibold text-sm">{card.label}</h3>
                    <span className={`text-xl font-black ${scoreColor}`}>{card.score}</span>
                  </div>
                  <ScoreBar score={card.score} animate={animate} />
                  <div className="mt-4 space-y-2.5">
                    <div className="flex gap-2">
                      <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#939084] w-16 pt-0.5">Found</span>
                      <p className="text-[#605d52] text-xs leading-relaxed">{card.found}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#939084] w-16 pt-0.5">Why it matters</span>
                      <p className="text-[#605d52] text-xs leading-relaxed">{card.why}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── SECTION 4 · Quick Wins ──────────────────────────────────────── */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#201515] mb-1">Quick Wins</h2>
            <p className="text-[#939084] text-sm">3 actions you can implement this week, no agency required</p>
          </div>
          <div className="space-y-4">
            {report.quick_wins.map((w, i) => (
              <div
                key={i}
                className="flex gap-4 bg-[#f8f4f0] border border-[#c5c0b1] rounded p-5 hover:border-[#e8330a]/20 hover:border-opacity-100 transition-all group"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#e8330a]/20 border border-[#e8330a]/30 flex items-center justify-center text-[#e8330a] font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-[#605d52] text-sm leading-relaxed mb-2">{w.action}</p>
                  <ImpactBadge impact={w.impact} />
                </div>
                <div className="flex-shrink-0 self-start pt-0.5">
                  <span className="text-lg">
                    {''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 4.5 · Business Outcomes ───────────────────────────── */}
        {report.business_outcomes && (
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#201515] mb-1">Business Outcomes</h2>
              <p className="text-[#939084] text-sm">Projected unit economics before and after fixing your ICP</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              {/* CAC comparison */}
              <div className="bg-[#f8f4f0] border border-[#c5c0b1] rounded p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#939084] mb-3">Customer Acquisition Cost</p>
                <div className="flex items-end gap-4 mb-3">
                  <div>
                    <p className="text-[11px] text-[#939084] mb-0.5">Current</p>
                    <p className="text-lg font-black text-red-400">{report.business_outcomes.cac_current}</p>
                  </div>
                  <div className="text-slate-700 mb-1">to</div>
                  <div>
                    <p className="text-[11px] text-[#939084] mb-0.5">Projected</p>
                    <p className="text-lg font-black text-emerald-400">{report.business_outcomes.cac_projected}</p>
                  </div>
                </div>
                <p className="text-xs text-[#939084] leading-relaxed">Lower CAC means more customers from the same budget after ICP alignment.</p>
              </div>

              {/* LTV:CAC comparison */}
              <div className="bg-[#f8f4f0] border border-[#c5c0b1] rounded p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#939084] mb-3">LTV : CAC Ratio</p>
                <div className="flex items-end gap-4 mb-3">
                  <div>
                    <p className="text-[11px] text-[#939084] mb-0.5">Current</p>
                    <p className="text-lg font-black text-amber-400">{report.business_outcomes.ltv_cac_current}</p>
                  </div>
                  <div className="text-slate-700 mb-1">to</div>
                  <div>
                    <p className="text-[11px] text-[#939084] mb-0.5">Projected</p>
                    <p className="text-lg font-black text-emerald-400">{report.business_outcomes.ltv_cac_projected}</p>
                  </div>
                </div>
                <p className="text-xs text-[#939084] leading-relaxed">Healthy B2B benchmark is 3:1 or above. Below 2:1 means your acquisition model is unsustainable.</p>
              </div>
            </div>

            {/* Revenue opportunity */}
            {report.business_outcomes.monthly_revenue_opportunity && (
              <div className="bg-[#f8f4f0] border border-[#e8330a]/20 rounded p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#e8330a] mb-1">Monthly Revenue Opportunity</p>
                    <p className="text-[#605d52] text-sm leading-relaxed">{report.business_outcomes.monthly_revenue_opportunity}</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── SECTION 5 · Paywall or Dashboard CTA ───────────────────────── */}
        <section className="relative no-print">

        {isSubscribed ? (
          /* Subscribed: redirect in progress, show confirmation */
          <div className="bg-[#201515] border border-[#e8330a]/20 rounded p-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#e8330a]/15 border border-[#e8330a]/30 mb-5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-[#e8330a]">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-[#fffefb] mb-2">Report saved to your dashboard</h2>
            <p className="text-[rgba(255,255,255,0.55)] text-sm mb-6">Your full report is above. Head to your dashboard to see all reports.</p>
            <Link
              href="/dashboard"
              className="inline-block bg-[#e8330a] text-[#fffefb] font-semibold text-sm px-8 py-3 rounded-lg"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <>
          {/* Blurred locked preview */}
          <div className="relative overflow-hidden rounded border border-[#c5c0b1] bg-[#f8f4f0]">
            <div className="blur-sm pointer-events-none select-none p-8 space-y-5 opacity-50">
              <h3 className="text-[#201515] font-bold text-lg">Full Optimization Roadmap, Weeks 1-12</h3>
              {[
                'Week 1-2: Rebuild ICP definition with firmographic and psychographic filters',
                'Week 3-4: Restructure ad account with ICP-segmented campaign architecture',
                'Week 5-6: Rewrite landing page headline, sub-headline, and primary CTA',
                'Week 7-8: Implement progressive form with conditional logic',
                'Week 9-10: Launch new lookalike audiences and exclude non-ICP segments',
                'Week 11-12: A/B test value proposition variants against control',
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-[#e8330a]/30 flex-shrink-0 mt-0.5" />
                  <p className="text-[#605d52] text-sm">{item}</p>
                </div>
              ))}
              <div className="h-px bg-[rgba(201,192,177,0.25)] my-4" />
              <p className="text-[#605d52] text-xs">+ Monthly monitoring dashboards · Weekly performance snapshots · Quarterly deep-dive reports</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#fffefb/60] to-[#fffefb]" />
          </div>

          {/* Paywall card */}
          <div className="relative -mt-8 z-10">
            <div className="bg-[#201515] border border-[#e8330a]/20 rounded p-8 text-center shadow-2xl ">
              <span className="inline-block text-[11px] font-semibold uppercase tracking-widest text-[#e8330a] bg-[rgba(232,51,10,0.08)] border border-[rgba(232,51,10,0.2)] px-3 py-1 rounded-full mb-5">
                Unlock Full Access
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#fffefb] mb-3">
                Unlock Your Full Optimization Roadmap
              </h2>
              <p className="text-[rgba(255,255,255,0.65)] text-sm max-w-xl mx-auto mb-2 leading-relaxed">
                Your report identified {report.breakdown.filter(b => b.score < 50).length} critical gaps costing you leads every day.
                Get the complete week-by-week fix plan, monthly monitoring, and ongoing diagnostic updates.
              </p>
              <p className="text-xs text-[rgba(255,255,255,0.4)] mb-6">
                Monthly monitoring · Weekly snapshots · Quarterly deep-dive reports
              </p>

              {/* Pricing tiers */}
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                {(
                  [
                    {
                      name: 'Starter' as Tier,
                      highlight: false,
                      features: ['Full roadmap and all critical findings', 'Weekly ICP intelligence briefings', 'Monthly health score refresh', 'AI chat in dashboard'],
                    },
                    {
                      name: 'Pro' as Tier,
                      highlight: true,
                      features: ['Everything in Starter', 'Live landing page audit', 'Competitor and regional benchmarks', 'Monthly session with a media buyer'],
                    },
                    {
                      name: 'Agency' as Tier,
                      highlight: false,
                      features: ['Everything in Pro', 'Team of B2B media buyers on your account', 'White-label reports by account team', 'Dedicated account manager'],
                    },
                  ]
                ).map(tier => (
                  <div
                    key={tier.name}
                    className={`relative rounded p-5 text-left border transition-all ${
                      tier.highlight
                        ? 'border-[#e8330a] bg-[#e8330a]/10 shadow-lg'
                        : 'border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)]'
                    }`}
                  >
                    {tier.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-[#e8330a] text-[#201515] px-3 py-1 rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <div className="mb-3">
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${tier.highlight ? 'text-[#605d52]' : 'text-[rgba(255,255,255,0.5)]'}`}>{tier.name}</p>
                      <div className="flex items-baseline gap-0.5 flex-wrap">
                        <span className={`text-2xl font-black ${tier.highlight ? 'text-[#201515]' : 'text-[#fffefb]'}`}>{PRICES[tier.name]}</span>
                        <span className={`text-sm ${tier.highlight ? 'text-[#939084]' : 'text-[rgba(255,255,255,0.4)]'}`}>/mo</span>
                      </div>
                    </div>
                    <ul className="space-y-1.5 mb-5">
                      {tier.features.map(f => (
                        <li key={f} className={`flex items-start gap-2 text-xs ${tier.highlight ? 'text-[#605d52]' : 'text-[rgba(255,255,255,0.65)]'}`}>
                          <span className="text-[#e8330a] flex-shrink-0 mt-px">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => openSubscribe(tier.name)}
                      className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
                        tier.highlight
                          ? 'bg-[#e8330a] text-[#fffefb] shadow shadow-[#e8330a]/40'
                          : 'border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.12)] hover:text-[#fffefb]'
                      }`}
                    >
                      Subscribe
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-xs text-[rgba(255,255,255,0.4)]">
                Your competitors are already optimizing. Start today.
              </p>
            </div>
          </div>
          </>
        )}
        </section>

        {/* ── Email / Subscribe Modal ─────────────────────────────────────── */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-[#f8f4f0] border border-[#e8330a]/20 rounded p-7 shadow-2xl">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-[#939084] hover:text-[#201515] transition-colors text-xl leading-none"
              >
                ✕
              </button>

              <span className="inline-block text-[10px] font-semibold uppercase tracking-widest text-[#e8330a] bg-[rgba(232,51,10,0.08)] border border-[rgba(232,51,10,0.2)] px-2.5 py-1 rounded-full mb-4">
                {selectedTier}, {PRICES[selectedTier]}/mo
              </span>

              <h3 className="text-xl font-bold text-[#201515] mb-1">Enter your email to continue</h3>
              <p className="text-[#605d52] text-sm mb-5">
                Your receipt and subscription details will be sent here.
              </p>

              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSubscribe() }}
                placeholder="you@company.com"
                className="w-full bg-[rgba(201,192,177,0.18)] border border-[#c5c0b1] focus:border-[#e8330a] rounded px-4 py-3 text-[#201515] placeholder-[#939084] text-sm outline-none transition-colors mb-3"
              />

              {subscribeError && (
                <p className="text-xs text-red-400 mb-3">{subscribeError}</p>
              )}

              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="w-full py-3 rounded bg-[#e8330a] hover:bg-[#e8330a] disabled:opacity-50 disabled:cursor-not-allowed text-[#201515] text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
              >
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

              <p className="text-center text-xs text-[#939084] mt-3">
                Secured by Paystack · Cancel anytime
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-[#c5c0b1] pt-8 pb-4 text-center text-[#939084] text-xs">
          <span>ICP<span className="text-[#e8330a]/50">Diagnostic</span></span>
          <span className="mx-2">·</span>
          <Link href="/" className="hover:text-[#605d52] transition-colors">Back to Home</Link>
          <span className="mx-2">·</span>
          <Link href="/questionnaire" className="hover:text-[#605d52] transition-colors">Retake Diagnostic</Link>
          <span className="mx-2">·</span>
          <Link href="/privacy" className="hover:text-[#605d52] transition-colors">Privacy</Link>
          <span className="mx-2">·</span>
          <Link href="/terms" className="hover:text-[#605d52] transition-colors">Terms</Link>
        </footer>
      </div>

      {/* Live research in-progress toast */}
      {enhancing && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#201515] border border-[#e8330a]/30 rounded-xl px-5 py-4 shadow-2xl max-w-[280px] animate-in slide-in-from-bottom-4">
          <div className="flex items-start gap-3">
            <svg className="animate-spin h-4 w-4 text-[#e8330a] flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <div>
              <p className="text-[#fffefb] text-xs font-semibold leading-tight">Fetching live market data</p>
              <p className="text-[rgba(255,255,255,0.45)] text-[11px] mt-1 leading-relaxed">Researching real benchmarks and competitors for your region. Your report will update automatically.</p>
            </div>
          </div>
        </div>
      )}

      {/* Enhancement complete toast */}
      {enhanceDone && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0d2818] border border-emerald-700/40 rounded-xl px-5 py-4 shadow-2xl max-w-[280px]">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-400 flex-shrink-0">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-emerald-300 text-xs font-semibold">Live research complete</p>
              <p className="text-[rgba(255,255,255,0.45)] text-[11px] mt-0.5">Report updated with real market data.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
