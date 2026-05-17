'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Types ──────────────────────────────────────────────────────────────────

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

type CsvAnalysis = {
  summary?: string
  top_performers?: Array<{ name: string; metric: string; insight: string }>
  underperformers?: Array<{ name: string; metric: string; insight: string }>
  budget_waste?: { estimated_waste_pct: number; explanation: string }
  audience_insights?: string[]
  recommendations?: Array<{ action: string; impact: string; effort: string }>
  raw?: string
}

type Tab = 'overview' | 'reports' | 'csv' | 'benchmarks' | 'account'

// ─── Constants ───────────────────────────────────────────────────────────────

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

const NAV: Array<{ id: Tab; label: string }> = [
  { id: 'overview',   label: 'Overview' },
  { id: 'reports',    label: 'Reports' },
  { id: 'csv',        label: 'CSV Upload' },
  { id: 'benchmarks', label: 'Benchmarks' },
  { id: 'account',    label: 'Account' },
]

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
  if (score >= 70) return '#22c55e'
  if (score >= 45) return '#f59e0b'
  return '#ef4444'
}

function simpleParseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map(line =>
    line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
  )
  return { headers, rows }
}

// ─── Small shared components ──────────────────────────────────────────────────

function CircleScore({ score }: { score: number }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="relative w-36 h-36">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1e1e2e" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={scoreColor(score)} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-gray-400">/ 100</span>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  )
}

function BenchmarkRow({
  label, unit, userValue, industryAvg, goodTarget, higherIsBetter,
}: {
  label: string; unit: string; userValue: number
  industryAvg: number; goodTarget: number; higherIsBetter: boolean
}) {
  const max = Math.max(goodTarget, industryAvg, userValue) * 1.3
  const userPct = Math.min((userValue / max) * 100, 100)
  const indPct  = Math.min((industryAvg / max) * 100, 100)
  const goodPct = Math.min((goodTarget / max) * 100, 100)
  const isGood  = higherIsBetter ? userValue >= goodTarget : userValue <= goodTarget
  const isMid   = higherIsBetter
    ? userValue >= industryAvg && !isGood
    : userValue <= industryAvg && !isGood
  const barColor = isGood ? '#22c55e' : isMid ? '#f59e0b' : '#ef4444'
  const fmt = (v: number) => unit === '$' ? `$${v}` : `${v}${unit}`

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className="text-white font-medium" style={{ color: barColor }}>{fmt(userValue)}</span>
      </div>
      <div className="relative h-2.5 bg-white/5 rounded-full">
        <div
          className="absolute top-0 bottom-0 w-px bg-amber-400/60 z-10"
          style={{ left: `${indPct}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-emerald-400/60 z-10"
          style={{ left: `${goodPct}%` }}
        />
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${userPct}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400/60 inline-block" />
          Industry avg: {fmt(industryAvg)}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400/60 inline-block" />
          Target: {fmt(goodTarget)}
        </span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()

  // Auth state
  const [authStep, setAuthStep]       = useState<'checking' | 'gate' | 'dashboard'>('checking')
  const [emailInput, setEmailInput]   = useState('')
  const [authError, setAuthError]     = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Dashboard state
  const [user, setUser]                   = useState<User | null>(null)
  const [reports, setReports]             = useState<ReportRow[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [activeTab, setActiveTab]         = useState<Tab>('overview')
  const [sidebarOpen, setSidebarOpen]     = useState(false)

  // CSV state
  const [csvFile, setCsvFile]           = useState<File | null>(null)
  const [csvText, setCsvText]           = useState('')
  const [csvParsed, setCsvParsed]       = useState<{ headers: string[]; rows: string[][] } | null>(null)
  const [csvLoading, setCsvLoading]     = useState(false)
  const [csvAnalysis, setCsvAnalysis]   = useState<CsvAnalysis | null>(null)
  const [csvError, setCsvError]         = useState('')
  const [dragOver, setDragOver]         = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Auth ────────────────────────────────────────────────────────────────

  const loadReports = useCallback(async (email: string) => {
    setReportsLoading(true)
    try {
      const res = await fetch(`/api/user/reports?email=${encodeURIComponent(email)}`)
      if (res.ok) {
        const json = await res.json()
        setReports(json.reports ?? [])
      }
    } finally {
      setReportsLoading(false)
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
        if (!silent) {
          router.push('/report/demo?message=Subscribe+to+unlock+your+dashboard')
        } else {
          setAuthStep('gate')
        }
      } else {
        localStorage.removeItem('dashboard_email')
        if (!silent) setAuthError('No active account found with that email. Please subscribe first.')
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
    const stored = localStorage.getItem('dashboard_email')
    if (stored) {
      verifyEmail(stored, true)
    } else {
      setAuthStep('gate')
    }
  }, [verifyEmail])

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (emailInput.trim()) verifyEmail(emailInput.trim())
  }

  const handleSignOut = () => {
    localStorage.removeItem('dashboard_email')
    setUser(null)
    setReports([])
    setAuthStep('gate')
    setEmailInput('')
  }

  // ── CSV handlers ─────────────────────────────────────────────────────────

  const readFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => resolve((e.target?.result as string) ?? '')
      reader.onerror = reject
      reader.readAsText(file)
    })

  const handleFileSelect = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvError('Please upload a .csv file.')
      return
    }
    setCsvError('')
    setCsvAnalysis(null)
    setCsvFile(file)
    const text = await readFile(file)
    setCsvText(text)
    setCsvParsed(simpleParseCSV(text))
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleAnalyse = async () => {
    if (!csvText) return
    setCsvLoading(true)
    setCsvError('')
    try {
      const res = await fetch('/api/csv-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: csvText.slice(0, 10000), fileName: csvFile?.name }),
      })
      const json = await res.json()
      if (json.analysis) setCsvAnalysis(json.analysis)
      else setCsvError('Analysis failed. Please try again.')
    } catch {
      setCsvError('Connection error. Please try again.')
    } finally {
      setCsvLoading(false)
    }
  }

  // ── Derived data ─────────────────────────────────────────────────────────

  const latestReport   = reports[0]
  const prevReport     = reports[1]
  const latestDiag: DiagnosisData = latestReport ? parseDiagnosis(latestReport.report_summary) : {}
  const prevDiag: DiagnosisData   = prevReport   ? parseDiagnosis(prevReport.report_summary)   : {}

  const latestScore = latestDiag.health_score ?? null
  const prevScore   = prevDiag.health_score ?? null
  const scoreDiff   = latestScore !== null && prevScore !== null ? latestScore - prevScore : null

  const daysActive = user
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const getBreakdown = (label: string) =>
    latestDiag.breakdown?.find(b => b.label === label)?.score ?? 50

  const channelScore = getBreakdown('Channel Efficiency')
  const funnelScore  = getBreakdown('Funnel Friction Index')
  const icpScore     = getBreakdown('ICP Alignment')

  const estCTR = Number(((channelScore / 100) * 3.5 + 0.5).toFixed(2))
  const estCPC = Number((3.5 - (channelScore / 100) * 2).toFixed(2))
  const estCVR = Number(((funnelScore / 100) * 5.5 + 0.5).toFixed(2))
  const estCPL = Number((80 - (icpScore / 100) * 50).toFixed(0))

  const tierLabel = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

  // ── Email Gate ───────────────────────────────────────────────────────────

  if (authStep === 'checking') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (authStep === 'gate') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-indigo-300 text-xs font-medium tracking-widest uppercase">Subscriber Portal</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-gray-400">Enter your email to access your dashboard</p>
          </div>

          <form onSubmit={handleEmailSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email address</label>
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            {authError && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                {authError}
              </p>
            )}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {authLoading ? 'Checking...' : 'Access Dashboard →'}
            </button>
            <p className="text-center text-sm text-gray-500">
              No account?{' '}
              <Link href="/questionnaire" className="text-indigo-400 hover:text-indigo-300">
                Run your free diagnostic →
              </Link>
            </p>
          </form>
        </div>
      </div>
    )
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-[#0d0d17] border-r border-white/5 z-30 flex flex-col
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shrink-0" />
            <span className="text-white font-bold text-lg">ICP Brand</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-0.5">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
              className={`
                w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${activeTab === item.id
                  ? 'bg-indigo-500/15 text-indigo-300'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }
              `}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.full_name ?? user?.email}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              {user?.subscription_tier && (
                <span className={`mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[user.subscription_tier] ?? ''}`}>
                  {tierLabel(user.subscription_tier)}
                </span>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-600 hover:text-gray-300 shrink-0 mt-0.5 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center gap-4">
          <button
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-white">
            {NAV.find(n => n.id === activeTab)?.label}
          </h1>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Welcome back, {user?.full_name?.split(' ')[0] ?? 'there'}
                </h2>
                <p className="text-gray-400 mt-1 text-sm">Here&apos;s a snapshot of your ICP performance</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Score gauge */}
                <div className="col-span-2 lg:col-span-1 bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center gap-2">
                  {latestScore !== null ? (
                    <>
                      <CircleScore score={latestScore} />
                      <p className="text-xs text-gray-400 text-center">ICP Health Score</p>
                      {scoreDiff !== null && (
                        <p className={`text-sm font-medium ${scoreDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {scoreDiff >= 0 ? '↑' : '↓'} {Math.abs(scoreDiff)} vs last report
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-500 text-sm mb-2">No diagnostic yet</p>
                      <Link href="/questionnaire" className="text-indigo-400 text-sm hover:underline">
                        Run one now →
                      </Link>
                    </div>
                  )}
                </div>

                <StatCard
                  label="Total Reports"
                  value={String(reports.length)}
                  sub={reports.length === 1 ? '1 diagnostic run' : `${reports.length} diagnostics run`}
                />
                <StatCard
                  label="Days Active"
                  value={String(daysActive)}
                  sub={user?.created_at ? `since ${formatDate(user.created_at)}` : ''}
                />
                <StatCard
                  label="Next Renewal"
                  value={user?.renewal_date ? formatDate(user.renewal_date) : '—'}
                  sub={user?.subscription_tier ? TIER_PRICES[user.subscription_tier] : ''}
                />
              </div>

              {latestDiag.findings && latestDiag.findings.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Latest Findings</h3>
                    {latestReport && (
                      <Link href={`/report/${latestReport.id}`} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                        Full report →
                      </Link>
                    )}
                  </div>
                  <div className="space-y-3">
                    {latestDiag.findings.map((f, i) => (
                      <div key={i} className="flex gap-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 self-start mt-0.5 ${
                          f.severity === 'Critical' ? 'bg-red-500/15 text-red-400' :
                          f.severity === 'Warning'  ? 'bg-amber-500/15 text-amber-400' :
                                                      'bg-emerald-500/15 text-emerald-400'
                        }`}>
                          {f.severity}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-white">{f.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{f.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {latestDiag.quick_wins && latestDiag.quick_wins.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="font-semibold text-white mb-4">Quick Wins</h3>
                  <div className="space-y-3">
                    {latestDiag.quick_wins.map((qw, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          qw.impact === 'High'   ? 'bg-indigo-500/15 text-indigo-400' :
                          qw.impact === 'Medium' ? 'bg-purple-500/15 text-purple-400' :
                                                   'bg-gray-500/15 text-gray-400'
                        }`}>
                          {qw.impact}
                        </span>
                        <p className="text-sm text-gray-300">{qw.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── REPORTS ── */}
          {activeTab === 'reports' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Your Reports</h2>
                <Link
                  href="/questionnaire"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                >
                  + Run New Diagnosis
                </Link>
              </div>

              {reportsLoading && (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!reportsLoading && reports.length === 0 && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                  <p className="text-gray-400 mb-4">No diagnostic reports yet.</p>
                  <Link
                    href="/questionnaire"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors inline-block"
                  >
                    Run your first diagnostic →
                  </Link>
                </div>
              )}

              {!reportsLoading && reports.length > 0 && (
                <div className="space-y-3">
                  {reports.map((report, i) => {
                    const d = parseDiagnosis(report.report_summary)
                    const topFinding = d.findings?.[0]
                    const circ = 2 * Math.PI * 20
                    const score = d.health_score
                    return (
                      <Link
                        key={report.id}
                        href={`/report/${report.id}`}
                        className="block bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-white/[0.07] rounded-xl p-5 transition-all"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 shrink-0 relative">
                              <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                                <circle cx="24" cy="24" r="20" fill="none" stroke="#1e1e2e" strokeWidth="4" />
                                {score !== undefined && (
                                  <circle
                                    cx="24" cy="24" r="20" fill="none"
                                    stroke={scoreColor(score)} strokeWidth="4"
                                    strokeDasharray={`${(score / 100) * circ} ${circ}`}
                                    strokeLinecap="round"
                                  />
                                )}
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold text-white">{score ?? '?'}</span>
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium text-white">
                                  {i === 0 ? 'Latest Report' : `Report #${reports.length - i}`}
                                </p>
                                {i === 0 && (
                                  <span className="text-xs bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-full">
                                    Latest
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{formatDate(report.generated_at)}</p>
                              {topFinding && (
                                <p className="text-xs text-gray-400 mt-1 truncate">
                                  Top finding: {topFinding.title}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-gray-600 shrink-0">→</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── CSV UPLOAD ── */}
          {activeTab === 'csv' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-bold text-white">CSV Analysis</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Upload your ad campaign export and get AI-powered insights instantly.
                </p>
              </div>

              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors
                  ${dragOver
                    ? 'border-indigo-400 bg-indigo-500/5'
                    : 'border-white/10 hover:border-white/25 bg-white/[0.02]'}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <svg className="w-10 h-10 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {csvFile ? (
                  <div>
                    <p className="text-white font-medium">{csvFile.name}</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {csvParsed ? `${csvParsed.rows.length} rows · ${csvParsed.headers.length} columns` : 'Parsing…'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-300 font-medium">Drop your CSV here, or click to browse</p>
                    <p className="text-gray-500 text-sm mt-2">
                      Supported: Google Ads export, Meta Ads export, custom CSV
                    </p>
                  </div>
                )}
              </div>

              {csvError && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                  {csvError}
                </p>
              )}

              {csvParsed && csvParsed.headers.length > 0 && !csvAnalysis && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Preview (first 5 rows)</p>
                  <div className="overflow-x-auto">
                    <table className="text-xs text-gray-300 w-full">
                      <thead>
                        <tr>
                          {csvParsed.headers.slice(0, 8).map((h, i) => (
                            <th key={i} className="text-left pb-2 pr-6 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvParsed.rows.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-t border-white/5">
                            {row.slice(0, 8).map((cell, j) => (
                              <td key={j} className="py-1.5 pr-6 whitespace-nowrap">{cell || '—'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvParsed.headers.length > 8 && (
                      <p className="text-xs text-gray-600 mt-2">+ {csvParsed.headers.length - 8} more columns</p>
                    )}
                  </div>
                </div>
              )}

              {csvFile && !csvAnalysis && (
                <button
                  onClick={handleAnalyse}
                  disabled={csvLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
                >
                  {csvLoading && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {csvLoading ? 'Analysing…' : 'Analyse with AI'}
                </button>
              )}

              {csvAnalysis && (
                <div className="space-y-4">
                  {csvAnalysis.summary && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-5">
                      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Summary</p>
                      <p className="text-gray-200 text-sm leading-relaxed">{csvAnalysis.summary}</p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    {csvAnalysis.top_performers && csvAnalysis.top_performers.length > 0 && (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">Top Performers</p>
                        <div className="space-y-3">
                          {csvAnalysis.top_performers.map((p, i) => (
                            <div key={i}>
                              <p className="text-sm text-white font-medium">{p.name}</p>
                              <p className="text-xs text-emerald-400">{p.metric}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{p.insight}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {csvAnalysis.underperformers && csvAnalysis.underperformers.length > 0 && (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Underperformers</p>
                        <div className="space-y-3">
                          {csvAnalysis.underperformers.map((p, i) => (
                            <div key={i}>
                              <p className="text-sm text-white font-medium">{p.name}</p>
                              <p className="text-xs text-red-400">{p.metric}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{p.insight}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {csvAnalysis.budget_waste && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Budget Waste</p>
                        <span className="text-2xl font-bold text-amber-400">
                          {csvAnalysis.budget_waste.estimated_waste_pct}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{csvAnalysis.budget_waste.explanation}</p>
                    </div>
                  )}

                  {csvAnalysis.audience_insights && csvAnalysis.audience_insights.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                      <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">Audience Insights</p>
                      <ul className="space-y-2">
                        {csvAnalysis.audience_insights.map((insight, i) => (
                          <li key={i} className="text-sm text-gray-300 flex gap-2">
                            <span className="text-purple-400 shrink-0">•</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {csvAnalysis.recommendations && csvAnalysis.recommendations.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                      <p className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Recommendations</p>
                      <div className="space-y-3">
                        {csvAnalysis.recommendations.map((rec, i) => (
                          <div key={i} className="flex gap-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                              rec.impact === 'High'   ? 'bg-indigo-500/15 text-indigo-400' :
                              rec.impact === 'Medium' ? 'bg-purple-500/15 text-purple-400' :
                                                        'bg-gray-500/15 text-gray-400'
                            }`}>
                              {rec.impact}
                            </span>
                            <p className="text-sm text-gray-300">{rec.action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setCsvFile(null); setCsvText(''); setCsvParsed(null); setCsvAnalysis(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="text-sm text-gray-500 hover:text-gray-300 underline transition-colors"
                  >
                    Upload a different file
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── BENCHMARKS ── */}
          {activeTab === 'benchmarks' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-bold text-white">Industry Benchmarks</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Estimated performance metrics derived from your ICP diagnostic scores.
                </p>
              </div>

              {latestScore === null ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                  <p className="text-gray-400 mb-4">Run a diagnostic to unlock your benchmark comparison.</p>
                  <Link
                    href="/questionnaire"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors inline-block"
                  >
                    Run diagnostic →
                  </Link>
                </div>
              ) : (
                <>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-8">
                    <BenchmarkRow
                      label="Click-Through Rate"
                      unit="%"
                      userValue={estCTR}
                      industryAvg={2.5}
                      goodTarget={3.5}
                      higherIsBetter
                    />
                    <BenchmarkRow
                      label="Cost Per Click"
                      unit="$"
                      userValue={estCPC}
                      industryAvg={2.2}
                      goodTarget={1.5}
                      higherIsBetter={false}
                    />
                    <BenchmarkRow
                      label="Conversion Rate"
                      unit="%"
                      userValue={estCVR}
                      industryAvg={3.2}
                      goodTarget={5.0}
                      higherIsBetter
                    />
                    <BenchmarkRow
                      label="Cost Per Lead"
                      unit="$"
                      userValue={estCPL}
                      industryAvg={45}
                      goodTarget={30}
                      higherIsBetter={false}
                    />
                  </div>

                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                    <p className="text-xs text-indigo-300 leading-relaxed">
                      These estimates are derived from your ICP breakdown scores (Channel Efficiency: {channelScore},
                      Funnel Friction: {funnelScore}, ICP Alignment: {icpScore}).
                      Upload a CSV in the CSV tab for personalised comparisons against your actual campaign data.
                    </p>
                  </div>

                  {latestDiag.breakdown && latestDiag.breakdown.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-sm font-semibold text-white mb-5">ICP Score Breakdown</h3>
                      <div className="space-y-5">
                        {latestDiag.breakdown.map((b, i) => (
                          <div key={i}>
                            <div className="flex justify-between text-sm mb-1.5">
                              <span className="text-gray-300">{b.label}</span>
                              <span className="font-medium" style={{ color: scoreColor(b.score) }}>{b.score}/100</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${b.score}%`, backgroundColor: scoreColor(b.score) }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{b.found}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── ACCOUNT ── */}
          {activeTab === 'account' && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-xl font-bold text-white">Account</h2>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Profile</p>
                <InfoRow label="Full name"    value={user?.full_name   ?? '—'} />
                <InfoRow label="Email"        value={user?.email       ?? '—'} />
                <InfoRow label="Company"      value={user?.company_name ?? '—'} />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Subscription</p>
                <InfoRow
                  label="Current plan"
                  value={
                    user?.subscription_tier ? (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TIER_COLORS[user.subscription_tier] ?? ''}`}>
                        {tierLabel(user.subscription_tier)}
                      </span>
                    ) : '—'
                  }
                />
                <InfoRow label="Price"         value={user?.subscription_tier ? TIER_PRICES[user.subscription_tier] : '—'} />
                <InfoRow
                  label="Billing status"
                  value={
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      user?.billing_status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-red-500/15 text-red-400'
                    }`}>
                      {user?.billing_status ?? '—'}
                    </span>
                  }
                />
                <InfoRow label="Renewal date" value={user?.renewal_date ? formatDate(user.renewal_date) : '—'} />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/questionnaire"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm text-center"
                >
                  Upgrade Plan
                </Link>
                <button
                  onClick={handleSignOut}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm"
                >
                  Sign out
                </button>
              </div>

              <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-5">
                <p className="text-sm font-medium text-red-400 mb-1">Cancel Subscription</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  To cancel, contact{' '}
                  <a href="mailto:support@icpbrand.co" className="text-indigo-400 hover:underline">
                    support@icpbrand.co
                  </a>
                  . Your access continues until your renewal date.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
