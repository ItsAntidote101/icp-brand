'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────

type User = {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  subscription_tier: string
  billing_status: string
  renewal_date: string | null
  created_at: string
}

type ReportRow = {
  id: string
  questionnaire_id: string
  report_summary: string
  generated_at: string
}

type DiagnosisData = {
  health_score?: number
  findings?: Array<{ title: string; severity: string; explanation: string }>
  breakdown?: Array<{ label: string; score: number; found: string; why: string }>
  quick_wins?: Array<{ action: string; impact: string }>
}

type Tab = 'overview' | 'progress' | 'account'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDiagnosis(summary: string): DiagnosisData {
  try { return JSON.parse(summary) } catch { return {} }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function scoreColor(score: number): string {
  if (score >= 71) return '#22c55e'
  if (score >= 41) return '#f59e0b'
  return '#ef4444'
}

function scoreBg(score: number): string {
  if (score >= 71) return 'bg-emerald-500/10 border-emerald-500/20'
  if (score >= 41) return 'bg-amber-500/10 border-amber-500/20'
  return 'bg-red-500/10 border-red-500/20'
}

function humanizeFinding(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('icp') || t.includes('alignment') || t.includes('audience') || t.includes('targeting wrong'))
    return "Your ads are reaching the wrong people — and it's costing you money"
  if (t.includes('funnel') || t.includes('friction') || t.includes('drop'))
    return "Too many steps before someone becomes a lead — most people give up"
  if (t.includes('channel') || t.includes('platform') || t.includes('media mix'))
    return "You're spending on the wrong channels for your audience"
  if (t.includes('message') || t.includes('copy') || t.includes('creative') || t.includes('offer'))
    return "Your message isn't resonating with the buyers you want"
  if (t.includes('budget') || t.includes('waste') || t.includes('spend'))
    return "A significant portion of your budget is being wasted"
  if (t.includes('landing') || t.includes('page') || t.includes('website'))
    return "Your landing page is losing leads before they convert"
  return title
}

function kesImpact(severity: string): string {
  if (severity === 'Critical') return 'Estimated waste: KES 50,000–200,000/month'
  if (severity === 'Warning')  return 'Estimated missed revenue: KES 15,000–60,000/month'
  return 'Potential gain: KES 10,000–40,000/month'
}

function getPositiveSignal(diag: DiagnosisData): string {
  const opp = diag.findings?.find(f => f.severity === 'Opportunity')
  if (opp) return opp.explanation

  const best = diag.breakdown?.reduce((a, b) => a.score > b.score ? a : b)
  if (best && best.score >= 60) {
    const labels: Record<string, string> = {
      'ICP Alignment':                   `Your target customer is clearly defined — that's your competitive edge.`,
      'Targeting Accuracy':              `Your audience targeting is above average. You're reaching the right people.`,
      'Channel Efficiency':              `Your channel selection is working. You're showing up where your audience is.`,
      'Funnel Friction Index':           `Your funnel is relatively smooth. Leads are moving through cleanly.`,
      'Message to Market Fit':           `Your messaging resonates with buyers. They understand what you're offering.`,
      'Budget Reallocation Opportunity': `Your budget allocation is solid. Spend is going to the right places.`,
    }
    return labels[best.label] ?? `Your ${best.label.toLowerCase()} is performing above average.`
  }

  return "You completed your ICP diagnostic. Most businesses never take this step — you're already ahead."
}

const TIER_COLORS: Record<string, string> = {
  starter: 'text-indigo-400 bg-indigo-400/10 border border-indigo-400/30',
  pro:     'text-purple-400 bg-purple-400/10 border border-purple-400/30',
  agency:  'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30',
}

const TIER_PRICES: Record<string, string> = {
  starter: 'KES 6,500 / month',
  pro:     'KES 13,000 / month',
  agency:  'KES 26,000 / month',
}

const TIER_FEATURES: Record<string, string> = {
  starter: 'Monthly ICP diagnostic + full report with findings and quick wins.',
  pro:     'Everything in Starter plus priority re-diagnosis and campaign CSV analysis.',
  agency:  'Everything in Pro plus multi-client reporting and dedicated strategy review.',
}

// ─── Score count-up ───────────────────────────────────────────────────────────

function ScoreDisplay({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0)
  useEffect(() => {
    let frame = 0
    const total = 70
    const id = setInterval(() => {
      frame++
      const eased = 1 - Math.pow(1 - frame / total, 3)
      setDisplayed(Math.min(Math.round(eased * score), score))
      if (frame >= total) clearInterval(id)
    }, 16)
    return () => clearInterval(id)
  }, [score])
  return <>{displayed}</>
}

// ─── Chart tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#12121f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 14px' }}>
      <p style={{ margin: 0, color: '#9ca3af', fontSize: 11 }}>{label}</p>
      <p style={{ margin: '3px 0 0', color: '#ffffff', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
        {payload[0].value}<span style={{ color: '#6b7280', fontSize: 13, fontWeight: 400 }}>/100</span>
      </p>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-2xl ${className ?? ''}`} />
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()

  const [authStep, setAuthStep]       = useState<'checking' | 'gate' | 'dashboard'>('checking')
  const [emailInput, setEmailInput]   = useState('')
  const [authError, setAuthError]     = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [user, setUser]               = useState<User | null>(null)
  const [reports, setReports]         = useState<ReportRow[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [activeTab, setActiveTab]     = useState<Tab>('overview')
  const [fixExpanded, setFixExpanded] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [mounted, setMounted] = useState(false)

  // ── Auth ──────────────────────────────────────────────────────────────────

  const loadReports = useCallback(async (email: string) => {
    try {
      const res = await fetch(`/api/user/reports?email=${encodeURIComponent(email)}`)
      if (res.ok) {
        const json = await res.json()
        setReports(json.reports ?? [])
      }
    } finally {
      setDataLoading(false)
    }
  }, [])

  const verifyEmail = useCallback(async (email: string, silent = false) => {
    if (!silent) setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (json.status === 'active') {
        localStorage.setItem('dashboard_email', email)
        setUser(json.user)
        setAuthStep('dashboard')
        loadReports(email)
      } else if (json.status === 'inactive') {
        localStorage.removeItem('dashboard_email')
        if (!silent) router.push('/report/demo?message=Subscribe+to+unlock+your+dashboard')
        else setAuthStep('gate')
      } else {
        localStorage.removeItem('dashboard_email')
        if (!silent) setAuthError('No active subscription found for that email.')
        setAuthStep('gate')
      }
    } catch {
      if (!silent) setAuthError('Connection error. Please try again.')
      setAuthStep('gate')
    } finally {
      if (!silent) setAuthLoading(false)
    }
  }, [router, loadReports])

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('dashboard_email')
    if (stored) verifyEmail(stored, true)
    else setAuthStep('gate')
  }, [verifyEmail])

  const handleSignOut = () => {
    localStorage.removeItem('dashboard_email')
    setUser(null)
    setReports([])
    setDataLoading(true)
    setAuthStep('gate')
    setEmailInput('')
  }

  // ── Derived data ───────────────────────────────────────────────────────────

  const latestReport = reports[0]
  const prevReport   = reports[1]
  const latestDiag: DiagnosisData = latestReport ? parseDiagnosis(latestReport.report_summary) : {}
  const prevDiag: DiagnosisData   = prevReport   ? parseDiagnosis(prevReport.report_summary)   : {}

  const latestScore  = latestDiag.health_score ?? null
  const prevScore    = prevDiag.health_score ?? null
  const scoreDiff    = latestScore !== null && prevScore !== null ? latestScore - prevScore : null

  const topFinding = latestDiag.findings?.find(f => f.severity === 'Critical')
    ?? latestDiag.findings?.[0]
  const positiveSignal = latestDiag.health_score !== undefined ? getPositiveSignal(latestDiag) : null

  const nextDiagDate = latestReport
    ? new Date(new Date(latestReport.generated_at).getTime() + 30 * 24 * 60 * 60 * 1000)
    : null

  const chartData = reports
    .slice()
    .reverse()
    .map(r => ({
      label: new Date(r.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      score: parseDiagnosis(r.report_summary).health_score ?? 0,
    }))
    .filter(d => d.score > 0)

  // Score-change milestones between consecutive reports (newest first)
  const scoreMilestones = reports.slice(0, -1).map((r, i) => {
    const cur  = parseDiagnosis(r.report_summary).health_score ?? 0
    const prev = parseDiagnosis(reports[i + 1].report_summary).health_score ?? 0
    return { date: r.generated_at, score: cur, diff: cur - prev }
  })

  const daysActive = user
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const tierLabel = (t: string) => t ? t.charAt(0).toUpperCase() + t.slice(1) : ''

  // ── Email Gate ─────────────────────────────────────────────────────────────

  if (authStep === 'checking') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (authStep === 'gate') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 justify-center mb-10">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg" />
            <span className="text-white font-bold text-xl">ICP Brand</span>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-1">Welcome back</h1>
          <p className="text-gray-400 text-center text-sm mb-8">Enter your email to access your dashboard</p>

          <form onSubmit={e => { e.preventDefault(); if (emailInput.trim()) verifyEmail(emailInput.trim()) }} className="space-y-3">
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
            />
            {authError && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                {authError}
              </p>
            )}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
            >
              {authLoading ? 'Checking…' : 'Access Dashboard →'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            No account?{' '}
            <Link href="/questionnaire" className="text-indigo-400 hover:text-indigo-300">
              Run a free diagnostic →
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // ── Dashboard ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0f]">

      {/* ── Top Nav ── */}
      <nav className="sticky top-0 z-20 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4">
          {/* Row 1: logo + user */}
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md shrink-0" />
              <span className="text-white font-bold text-base hidden sm:block">ICP Brand</span>
            </Link>

            <div className="flex items-center gap-3">
              {user?.subscription_tier && (
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full hidden sm:inline-flex ${TIER_COLORS[user.subscription_tier] ?? ''}`}>
                  {tierLabel(user.subscription_tier)}
                </span>
              )}
              <span className="text-sm text-gray-400 hidden sm:block truncate max-w-[140px]">
                {user?.full_name ?? user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-xs text-gray-600 hover:text-gray-300 transition-colors border border-white/10 rounded-lg px-2.5 py-1.5"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Row 2: tabs */}
          <div className="flex">
            {(['overview', 'progress', 'account'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setFixExpanded(false); setCancelConfirm(false) }}
                className={`
                  flex-1 sm:flex-none sm:px-5 py-3 text-sm font-medium border-b-2 transition-colors capitalize
                  ${activeTab === tab
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* ════════════════════════════════ OVERVIEW ════════════════════════════════ */}
        {activeTab === 'overview' && (
          <>
            {/* Section 1 — The Number That Matters */}
            <section className={`border rounded-3xl p-8 text-center ${latestScore !== null ? scoreBg(latestScore) : 'bg-white/5 border-white/10'}`}>
              {dataLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-32 mx-auto" />
                  <Skeleton className="h-5 w-64 mx-auto" />
                </div>
              ) : latestScore !== null ? (
                <>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">ICP Health Score</p>
                  <div
                    className="text-8xl font-black leading-none"
                    style={{ color: scoreColor(latestScore) }}
                  >
                    <ScoreDisplay key={latestScore} score={latestScore} />
                  </div>
                  <p className="text-lg text-gray-300 mt-5 leading-snug">
                    {scoreDiff === null
                      ? 'This is your baseline. Here\'s where to focus first.'
                      : scoreDiff > 0
                        ? `Your score increased ${scoreDiff} points since last month`
                        : scoreDiff < 0
                          ? `Your score dropped ${Math.abs(scoreDiff)} points — here's why`
                          : "Your score hasn't changed — here's what to focus on"
                    }
                  </p>
                </>
              ) : (
                <>
                  <p className="text-4xl font-black text-gray-600">—</p>
                  <p className="text-gray-500 mt-3 text-sm">No diagnostic yet</p>
                  <Link
                    href="/questionnaire"
                    className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
                  >
                    Run your first diagnostic →
                  </Link>
                </>
              )}
            </section>

            {/* Section 2 — #1 Priority */}
            {(dataLoading || topFinding) && (
              <section className="bg-white/5 border border-white/10 rounded-3xl p-7">
                <p className="text-xs text-red-400 uppercase tracking-widest mb-4 font-semibold">
                  Your #1 Priority Right Now
                </p>

                {dataLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-5 w-4/5" />
                    <Skeleton className="h-5 w-3/5" />
                    <Skeleton className="h-11 w-44 mt-2" />
                  </div>
                ) : topFinding ? (
                  <>
                    <h2 className="text-2xl font-bold text-white leading-snug">
                      {humanizeFinding(topFinding.title)}
                    </h2>
                    <p className="text-gray-400 mt-3 leading-relaxed">{topFinding.explanation}</p>
                    <p className="text-xs mt-2 font-medium" style={{ color: scoreColor(topFinding.severity === 'Critical' ? 20 : 50) }}>
                      {kesImpact(topFinding.severity)}
                    </p>

                    <button
                      onClick={() => setFixExpanded(v => !v)}
                      className="mt-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      {fixExpanded ? 'Hide fix ↑' : 'See How To Fix This →'}
                    </button>

                    {fixExpanded && (
                      <div className="mt-5 pt-5 border-t border-white/10 space-y-4">
                        {latestDiag.quick_wins && latestDiag.quick_wins.length > 0 && (
                          <div className="space-y-3">
                            {latestDiag.quick_wins.map((qw, i) => (
                              <div key={i} className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                                  {i + 1}
                                </span>
                                <div>
                                  <p className="text-sm text-white">{qw.action}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">Impact: {qw.impact}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {latestReport && (
                          <Link
                            href={`/report/${latestReport.id}`}
                            className="inline-block text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            View full analysis with all findings →
                          </Link>
                        )}
                      </div>
                    )}
                  </>
                ) : null}
              </section>
            )}

            {/* Section 3 — What's Working */}
            {(dataLoading || positiveSignal) && (
              <section className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-7">
                <p className="text-xs text-emerald-400 uppercase tracking-widest mb-3 font-semibold">
                  What&apos;s Working
                </p>
                {dataLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                  </div>
                ) : (
                  <p className="text-white text-lg leading-relaxed">{positiveSignal}</p>
                )}
              </section>
            )}

            {/* Section 4 — Next Diagnosis */}
            <section className="bg-white/5 border border-white/10 rounded-3xl p-7">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-semibold">
                Next Diagnosis
              </p>
              {dataLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-11 w-52 mt-1" />
                </div>
              ) : (
                <>
                  <p className="text-white font-medium text-lg">
                    {nextDiagDate
                      ? `Due ${formatDate(nextDiagDate.toISOString())}`
                      : 'Ready whenever you are'
                    }
                  </p>
                  <p className="text-gray-500 text-sm mt-1 mb-5">
                    {nextDiagDate && nextDiagDate > new Date()
                      ? 'Monthly re-diagnosis tracks your improvement over time.'
                      : 'Run a new diagnostic to see how much you\'ve improved.'
                    }
                  </p>
                  <Link
                    href="/questionnaire"
                    className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                  >
                    Run New Diagnosis Now →
                  </Link>
                  <p className="mt-3 text-xs text-gray-600">
                    Have campaign data?{' '}
                    <Link href="/csv-analysis" className="text-indigo-500 hover:text-indigo-400">
                      Upload a CSV for detailed analysis →
                    </Link>
                  </p>
                </>
              )}
            </section>
          </>
        )}

        {/* ════════════════════════════════ PROGRESS ════════════════════════════════ */}
        {activeTab === 'progress' && (
          <>
            <h2 className="text-2xl font-bold text-white">Your Progress</h2>

            {dataLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <>
                {/* Score chart */}
                <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-5 font-semibold">ICP Health Score Over Time</p>
                  {chartData.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-4">No diagnostic data yet.</p>
                      <Link href="/questionnaire" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors inline-block">
                        Run your first diagnosis →
                      </Link>
                    </div>
                  ) : chartData.length === 1 ? (
                    <div className="text-center py-6">
                      <p className="text-5xl font-black text-white mb-2">{chartData[0].score}</p>
                      <p className="text-gray-500 text-sm">Your baseline score — {chartData[0].label}</p>
                      <p className="text-gray-600 text-xs mt-3">Run another diagnosis to start tracking your trend.</p>
                    </div>
                  ) : mounted ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={chartData} margin={{ top: 20, right: 8, bottom: 0, left: -28 }}>
                        <defs>
                          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          fill="url(#scoreGrad)"
                          dot={{ fill: '#6366f1', r: 5, strokeWidth: 0 }}
                          activeDot={{ r: 7, fill: '#818cf8', strokeWidth: 0 }}
                          isAnimationActive
                          animationDuration={800}
                          animationEasing="ease-out"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : null}
                </section>

                {/* Milestones */}
                <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-4 font-semibold">Milestones</p>
                  <div className="space-y-3">
                    {/* First diagnosis */}
                    {reports.length > 0 && (() => {
                      const first = reports[reports.length - 1]
                      const firstScore = parseDiagnosis(first.report_summary).health_score
                      return (
                        <div className="flex items-start gap-3">
                          <span className="text-indigo-400 font-bold shrink-0 text-base">★</span>
                          <p className="text-sm text-gray-300">
                            <span className="text-gray-500">{formatDate(first.generated_at)}</span>
                            {' — '}First diagnosis completed.
                            {firstScore !== undefined && <> Starting score: <span className="text-white font-semibold">{firstScore}/100</span>.</>}
                          </p>
                        </div>
                      )
                    })()}

                    {/* Score improvements */}
                    {scoreMilestones.filter(m => m.diff !== 0).map((m, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className={`font-bold shrink-0 text-sm ${m.diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {m.diff > 0 ? `+${m.diff}` : m.diff}
                        </span>
                        <p className="text-sm text-gray-300">
                          <span className="text-gray-500">{formatDate(m.date)}</span>
                          {' — '}
                          {m.diff > 0
                            ? <>Score improved {m.diff} points to <span className="text-white font-semibold">{m.score}/100</span>. Keep applying the recommendations.</>
                            : <>Score dropped to <span className="text-white font-semibold">{m.score}/100</span>. Review the latest findings.</>
                          }
                        </p>
                      </div>
                    ))}

                    {/* Days active */}
                    {daysActive >= 1 && (
                      <div className="flex items-start gap-3">
                        <span className="text-purple-400 font-bold shrink-0 text-sm">◈</span>
                        <p className="text-sm text-gray-300">
                          <span className="text-white font-semibold">{daysActive} days</span> active on the platform
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                {/* All reports */}
                <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">All Reports</p>
                    <Link href="/questionnaire" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                      + New Diagnosis
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {reports.map((r, i) => {
                      const d = parseDiagnosis(r.report_summary)
                      const score = d.health_score
                      const topFindingTitle = d.findings?.[0]?.title
                      return (
                        <Link
                          key={r.id}
                          href={`/report/${r.id}`}
                          className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 hover:opacity-80 transition-opacity"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-white font-medium">
                                {formatDate(r.generated_at)}
                              </p>
                              {i === 0 && (
                                <span className="text-xs bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-full">Latest</span>
                              )}
                            </div>
                            {topFindingTitle && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{topFindingTitle}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {score !== undefined && (
                              <span className="text-lg font-bold" style={{ color: scoreColor(score) }}>
                                {score}
                              </span>
                            )}
                            <span className="text-gray-600 text-sm">→</span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              </>
            )}
          </>
        )}

        {/* ════════════════════════════════ ACCOUNT ════════════════════════════════ */}
        {activeTab === 'account' && (
          <>
            <h2 className="text-2xl font-bold text-white">Account</h2>

            {/* Profile */}
            <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4 font-semibold">Profile</p>
              <div className="space-y-4">
                {[
                  { label: 'Full name',    value: user?.full_name    ?? '—' },
                  { label: 'Email',        value: user?.email        ?? '—' },
                  { label: 'Company',      value: user?.company_name ?? '—' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center border-b border-white/5 pb-4 last:border-0 last:pb-0">
                    <span className="text-sm text-gray-500">{row.label}</span>
                    <span className="text-sm text-white font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Subscription */}
            <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4 font-semibold">Subscription</p>
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-white/5 pb-4">
                  <span className="text-sm text-gray-500">Current plan</span>
                  <div className="text-right">
                    {user?.subscription_tier && (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TIER_COLORS[user.subscription_tier] ?? ''}`}>
                        {tierLabel(user.subscription_tier)}
                      </span>
                    )}
                    <p className="text-xs text-gray-600 mt-1.5 max-w-48 text-right leading-snug">
                      {user?.subscription_tier ? TIER_FEATURES[user.subscription_tier] : ''}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-sm text-gray-500">Monthly price</span>
                  <span className="text-sm text-white font-medium">
                    {user?.subscription_tier ? TIER_PRICES[user.subscription_tier] : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-sm text-gray-500">Billing status</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    user?.billing_status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}>
                    {user?.billing_status ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Next renewal</span>
                  <span className="text-sm text-white font-medium">
                    {user?.renewal_date ? formatDate(user.renewal_date) : '—'}
                  </span>
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {user?.subscription_tier && user.subscription_tier !== 'agency' && (
                <Link
                  href="/questionnaire"
                  className="w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-3.5 rounded-2xl transition-colors text-sm"
                >
                  Upgrade to {user.subscription_tier === 'starter' ? 'Pro' : 'Agency'} →
                </Link>
              )}

              <button
                onClick={handleSignOut}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white font-medium px-5 py-3 rounded-2xl transition-colors text-sm"
              >
                Sign out
              </button>
            </div>

            {/* Cancel */}
            <section className="border border-red-500/15 rounded-3xl p-6">
              <p className="text-sm font-semibold text-red-400 mb-1">Cancel Subscription</p>
              {!cancelConfirm ? (
                <>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    Your access continues until your renewal date. This cannot be undone.
                  </p>
                  <button
                    onClick={() => setCancelConfirm(true)}
                    className="text-sm text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors"
                  >
                    Cancel my subscription
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-white">Are you sure? You&apos;ll lose access at your next renewal date.</p>
                  <div className="flex gap-3">
                    <a
                      href={`mailto:support@icpbrand.co?subject=Cancel subscription — ${user?.email}`}
                      className="text-sm bg-red-500/15 hover:bg-red-500/25 text-red-400 font-medium px-4 py-2 rounded-xl transition-colors"
                    >
                      Yes, cancel →
                    </a>
                    <button
                      onClick={() => setCancelConfirm(false)}
                      className="text-sm text-gray-400 hover:text-white px-4 py-2 transition-colors"
                    >
                      Keep my subscription
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

      </div>
    </div>
  )
}
