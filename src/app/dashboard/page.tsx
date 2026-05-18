'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle, Calendar, Zap, ArrowRight, Lock,
  TrendingUp, TrendingDown, ChevronDown, ChevronUp, FileText,
} from 'lucide-react'

// ─── Design tokens ────────────────────────────────────────────────────────────
const P        = '#302161'
const Pbody    = 'rgba(48,33,97,0.88)'
const Pmuted   = 'rgba(48,33,97,0.5)'
const Pborder  = 'rgba(48,33,97,0.1)'
const BgAlt    = '#f8f7ff'
const font     = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontBody = "'PolySans Neutral', -apple-system, system-ui, sans-serif"

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'reports' | 'account'

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

type Finding  = { title: string; severity: string; explanation: string }
type QuickWin = { action: string; impact: string; timeline?: string }

type DiagnosisData = {
  overall_score?: number
  health_score?: number          // legacy
  executive_summary?: string
  critical_findings?: Finding[]
  findings?: Finding[]           // legacy
  quick_wins?: QuickWin[]
  landing_page_assessment?: string
  monthly_waste_estimate?: string
  is_deep_research?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseDiagnosis(s: string): DiagnosisData {
  try { return JSON.parse(s) } catch { return {} }
}
function getScore(d: DiagnosisData): number | null {
  const s = d.overall_score ?? d.health_score ?? null
  return typeof s === 'number' ? s : null
}
function getFindings(d: DiagnosisData): Finding[] {
  return d.critical_findings ?? d.findings ?? []
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function daysBetween(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}
function scoreColor(score: number): string {
  if (score >= 71) return '#22c55e'
  if (score >= 41) return '#f59e0b'
  return '#ef4444'
}
function severityColor(s: string): string {
  if (s === 'Critical') return '#ef4444'
  if (s === 'Warning')  return '#f59e0b'
  return '#22c55e'
}
function severityBg(s: string): string {
  if (s === 'Critical') return '#fee2e2'
  if (s === 'Warning')  return '#fef3c7'
  return '#dcfce7'
}
function extractWasteAmount(text: string): string {
  if (!text || text.startsWith('Upgrade')) return '—'
  const m = text.match(/(KES\s*[\d,]+|USD\s*[\d,]+|\$[\d,]+|€[\d,]+|£[\d,]+)/i)
  if (m) return m[0].replace(/\s+/, ' ').trim()
  return text.length > 28 ? text.slice(0, 28) + '…' : text
}

const TIER_LABEL: Record<string, string> = { starter: 'Starter', pro: 'Pro', agency: 'Agency', free: 'Free' }
const TIER_PRICE: Record<string, string> = { starter: 'KES 6,500', pro: 'KES 13,000', agency: 'KES 26,000', free: 'Free' }
const TIER_DESC:  Record<string, string> = {
  starter: 'Monthly ICP diagnostic with full report, findings, and quick wins.',
  pro:     'Everything in Starter plus priority re-diagnosis and campaign CSV analysis.',
  agency:  'Everything in Pro plus multi-client reporting and dedicated strategy review.',
  free:    'Basic ICP diagnostic based on questionnaire answers only.',
}

// ─── Circular health gauge ────────────────────────────────────────────────────
function HealthGauge({ score }: { score: number }) {
  const r    = 58
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const col  = scoreColor(score)
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 160, height: 160 }}>
      <svg width={160} height={160} viewBox="0 0 160 160" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <circle cx={80} cy={80} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={10} />
        <circle cx={80} cy={80} r={r} fill="none" stroke={col} strokeWidth={10}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: font, fontSize: 42, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{score}</div>
        <div style={{ fontFamily: fontBody, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>/100</div>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ style }: { style?: React.CSSProperties }) {
  return <div className="animate-pulse" style={{ background: 'rgba(48,33,97,0.07)', borderRadius: 8, ...style }} />
}

// ─── Impact badge ─────────────────────────────────────────────────────────────
function ImpactBadge({ impact }: { impact: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    High:   { bg: '#fee2e2', color: '#ef4444' },
    Medium: { bg: '#fef3c7', color: '#d97706' },
    Low:    { bg: '#dcfce7', color: '#16a34a' },
  }
  const s = map[impact] ?? map.Low
  return (
    <span style={{ fontFamily: fontBody, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 10px', borderRadius: 100, background: s.bg, color: s.color }}>
      {impact} impact
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()

  const [authStep,       setAuthStep]       = useState<'checking' | 'gate' | 'dashboard'>('checking')
  const [emailInput,     setEmailInput]     = useState('')
  const [authError,      setAuthError]      = useState('')
  const [authLoading,    setAuthLoading]    = useState(false)
  const [user,           setUser]           = useState<User | null>(null)
  const [reports,        setReports]        = useState<ReportRow[]>([])
  const [dataLoading,    setDataLoading]    = useState(true)
  const [activeTab,      setActiveTab]      = useState<Tab>('overview')
  const [expandedIdx,    setExpandedIdx]    = useState<number | null>(null)
  const [cancelConfirm,  setCancelConfirm]  = useState(false)

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
      const res  = await fetch('/api/auth/check-email', {
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
  const diag: DiagnosisData    = latestReport ? parseDiagnosis(latestReport.report_summary) : {}
  const score                  = getScore(diag)
  const findings               = getFindings(diag)
  const topFinding             = findings.find(f => f.severity === 'Critical') ?? findings[0]
  const daysSince              = latestReport ? daysBetween(latestReport.generated_at) : null
  const prevDiag: DiagnosisData = reports[1] ? parseDiagnosis(reports[1].report_summary) : {}
  const prevScore              = getScore(prevDiag)
  const scoreDiff              = score !== null && prevScore !== null ? score - prevScore : null
  const tierLabel              = user?.subscription_tier ? (TIER_LABEL[user.subscription_tier] ?? user.subscription_tier) : ''

  // ── Checking ──────────────────────────────────────────────────────────────
  if (authStep === 'checking') {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 32, height: 32, border: `3px solid ${P}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (authStep === 'gate') {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${P},#6c4ddd)` }} />
            <span style={{ fontFamily: font, fontWeight: 700, fontSize: 18, color: P }}>ICP Diagnostic</span>
          </div>
          <h1 style={{ fontFamily: font, fontSize: 28, fontWeight: 700, color: P, textAlign: 'center', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
            Welcome back
          </h1>
          <p style={{ fontFamily: fontBody, color: Pmuted, textAlign: 'center', fontSize: 15, margin: '0 0 32px' }}>
            Enter your email to access your dashboard
          </p>
          <form onSubmit={e => { e.preventDefault(); if (emailInput.trim()) verifyEmail(emailInput.trim()) }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)}
              placeholder="you@company.com" required
              style={{ width: '100%', background: BgAlt, border: `1.5px solid ${Pborder}`, borderRadius: 12, padding: '14px 16px', fontSize: 15, color: P, outline: 'none', fontFamily: fontBody, boxSizing: 'border-box' }} />
            {authError && (
              <p style={{ fontFamily: fontBody, color: '#ef4444', fontSize: 14, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', margin: 0 }}>
                {authError}
              </p>
            )}
            <button type="submit" disabled={authLoading}
              style={{ background: P, color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 600, cursor: authLoading ? 'not-allowed' : 'pointer', opacity: authLoading ? 0.7 : 1, fontFamily: font }}>
              {authLoading ? 'Checking…' : 'Access Dashboard →'}
            </button>
          </form>
          <p style={{ fontFamily: fontBody, textAlign: 'center', fontSize: 14, color: Pmuted, marginTop: 24 }}>
            No account?{' '}
            <Link href="/questionnaire" style={{ color: P, fontWeight: 600, textDecoration: 'none' }}>
              Run a free diagnostic
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: fontBody }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Top nav ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${Pborder}`, padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, gap: 16 }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: `linear-gradient(135deg,${P},#6c4ddd)` }} />
            <span style={{ fontFamily: font, fontWeight: 700, fontSize: 15, color: P, letterSpacing: '-0.2px' }}>ICP Diagnostic</span>
          </Link>

          {/* Center tabs */}
          <div style={{ display: 'flex', gap: 4, background: BgAlt, borderRadius: 100, padding: 4 }}>
            {(['overview', 'reports', 'account'] as Tab[]).map(tab => (
              <button key={tab}
                onClick={() => { setActiveTab(tab); setExpandedIdx(null); setCancelConfirm(false) }}
                style={{
                  fontFamily: fontBody, fontSize: 14, fontWeight: 500, padding: '8px 20px', borderRadius: 100,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeTab === tab ? P : 'transparent',
                  color: activeTab === tab ? '#fff' : Pbody,
                }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {tierLabel && (
              <span style={{ fontFamily: fontBody, fontSize: 12, fontWeight: 700, background: P, color: '#fff', padding: '4px 12px', borderRadius: 100 }}>
                {tierLabel}
              </span>
            )}
            <span className="hidden md:block" style={{ fontFamily: fontBody, fontSize: 14, color: Pbody, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name ?? user?.email}
            </span>
            <Link href="/questionnaire"
              style={{ background: P, color: '#fff', textDecoration: 'none', fontFamily: font, fontWeight: 600, fontSize: 13, padding: '10px 18px', borderRadius: 100, whiteSpace: 'nowrap' }}>
              Run New Diagnosis
            </Link>
            <button onClick={handleSignOut}
              style={{ background: 'none', border: `1px solid ${Pborder}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, color: Pmuted, cursor: 'pointer', fontFamily: fontBody, whiteSpace: 'nowrap' }}>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ══════════════════════════════ OVERVIEW ════════════════════════════ */}
        {activeTab === 'overview' && (
          <>
            {/* Empty state */}
            {!dataLoading && !latestReport && (
              <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: BgAlt, border: `1px solid ${Pborder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <FileText size={32} color={P} />
                </div>
                <h2 style={{ fontFamily: font, fontSize: 28, fontWeight: 700, color: P, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
                  No diagnosis yet.
                </h2>
                <p style={{ fontFamily: fontBody, fontSize: 16, color: Pmuted, margin: '0 auto 32px', maxWidth: 400, lineHeight: 1.7 }}>
                  Run your first ICP diagnostic to see where your marketing budget is going and how to fix it.
                </p>
                <Link href="/questionnaire"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: P, color: '#fff', textDecoration: 'none', fontFamily: font, fontWeight: 600, fontSize: 15, padding: '16px 32px', borderRadius: 14 }}>
                  Run My First Diagnosis <ArrowRight size={16} />
                </Link>
              </div>
            )}

            {(dataLoading || latestReport) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

                {/* ── S1: Hero card ─────────────────────────────────────── */}
                <div style={{ background: `linear-gradient(135deg,${P} 0%,#4c1d95 100%)`, borderRadius: 24, padding: 'clamp(32px,5vw,48px) clamp(24px,5vw,56px)' }}
                  className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 lg:gap-12 items-center">

                  <div>
                    <p style={{ fontFamily: fontBody, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)', margin: '0 0 16px' }}>
                      Estimated Monthly Waste
                    </p>
                    {dataLoading ? (
                      <div className="animate-pulse" style={{ height: 72, width: 260, background: 'rgba(255,255,255,0.1)', borderRadius: 12, marginBottom: 20 }} />
                    ) : (
                      <div style={{ fontFamily: font, fontSize: 'clamp(48px,6vw,80px)', fontWeight: 800, color: '#fff', lineHeight: 1, margin: '0 0 16px' }}>
                        {extractWasteAmount(diag.monthly_waste_estimate ?? '')}
                      </div>
                    )}
                    <p style={{ fontFamily: fontBody, fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: '0 0 28px', maxWidth: 480 }}>
                      being lost to wrong targeting, funnel friction, and budget misallocation every month you don&apos;t fix this.
                    </p>
                    <a href="#priority"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: P, textDecoration: 'none', fontFamily: font, fontWeight: 600, fontSize: 14, padding: '14px 28px', borderRadius: 12 }}>
                      See What To Fix First <ArrowRight size={15} />
                    </a>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    {dataLoading ? (
                      <div className="animate-pulse" style={{ width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', margin: '0 auto' }} />
                    ) : score !== null ? (
                      <HealthGauge score={score} />
                    ) : null}
                    <p style={{ fontFamily: fontBody, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: '14px 0 4px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      ICP Health Score
                    </p>
                    <p style={{ fontFamily: fontBody, fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                      Last updated {latestReport ? formatDate(latestReport.generated_at) : '—'}
                    </p>
                    {scoreDiff !== null && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 100, padding: '5px 12px' }}>
                        {scoreDiff > 0
                          ? <TrendingUp size={13} color="#22c55e" />
                          : <TrendingDown size={13} color="#ef4444" />}
                        <span style={{ fontFamily: fontBody, fontSize: 12, fontWeight: 600, color: scoreDiff > 0 ? '#86efac' : '#fca5a5' }}>
                          {scoreDiff > 0 ? '+' : ''}{scoreDiff} vs last report
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── S2: Three stat chips ──────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                  <div style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 16, padding: '24px 28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <AlertCircle size={18} color="#ef4444" />
                      <span style={{ fontFamily: fontBody, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: Pmuted }}>Critical Findings</span>
                    </div>
                    {dataLoading
                      ? <Skel style={{ height: 44, width: 64, marginBottom: 8 }} />
                      : <p style={{ fontFamily: font, fontSize: 48, fontWeight: 700, color: P, margin: '0 0 4px', lineHeight: 1 }}>{findings.length}</p>}
                    <p style={{ fontFamily: fontBody, fontSize: 13, color: Pmuted, margin: 0 }}>Issues ranked by revenue impact</p>
                  </div>

                  <div style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 16, padding: '24px 28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <Calendar size={18} color={P} />
                      <span style={{ fontFamily: fontBody, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: Pmuted }}>Days Since Diagnosis</span>
                    </div>
                    {dataLoading
                      ? <Skel style={{ height: 44, width: 64, marginBottom: 8 }} />
                      : <p style={{ fontFamily: font, fontSize: 48, fontWeight: 700, color: P, margin: '0 0 4px', lineHeight: 1 }}>{daysSince ?? '—'}</p>}
                    <p style={{ fontFamily: fontBody, fontSize: 13, color: Pmuted, margin: 0 }}>
                      {latestReport
                        ? `Next due ${formatDate(new Date(new Date(latestReport.generated_at).getTime() + 30 * 86400000).toISOString())}`
                        : 'No diagnosis yet'}
                    </p>
                  </div>

                  <div style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 16, padding: '24px 28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <Zap size={18} color="#f59e0b" />
                      <span style={{ fontFamily: fontBody, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: Pmuted }}>Quick Wins Available</span>
                    </div>
                    {dataLoading
                      ? <Skel style={{ height: 44, width: 64, marginBottom: 8 }} />
                      : <p style={{ fontFamily: font, fontSize: 48, fontWeight: 700, color: P, margin: '0 0 4px', lineHeight: 1 }}>{diag.quick_wins?.length ?? 0}</p>}
                    <p style={{ fontFamily: fontBody, fontSize: 13, color: Pmuted, margin: 0 }}>Actions you can take this week</p>
                  </div>
                </div>

                {/* ── S3: Fix this first ────────────────────────────────── */}
                {(dataLoading || topFinding) && (
                  <div id="priority">
                    <h2 style={{ fontFamily: font, fontSize: 32, fontWeight: 700, color: P, margin: '0 0 20px', letterSpacing: '-0.02em' }}>Fix this first.</h2>

                    {dataLoading ? (
                      <div style={{ background: '#fafafa', borderLeft: '4px solid #ef4444', borderRadius: '0 16px 16px 0', padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <Skel style={{ height: 20, width: 100 }} />
                        <Skel style={{ height: 30, width: '65%' }} />
                        <Skel style={{ height: 16, width: '90%' }} />
                        <Skel style={{ height: 16, width: '70%' }} />
                      </div>
                    ) : topFinding ? (
                      <div style={{ background: '#fafafa', borderLeft: `4px solid ${severityColor(topFinding.severity)}`, borderRadius: '0 16px 16px 0', padding: '36px 40px' }}>
                        <span style={{ fontFamily: fontBody, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: severityColor(topFinding.severity), background: severityBg(topFinding.severity), padding: '3px 10px', borderRadius: 100 }}>
                          {topFinding.severity}
                        </span>
                        <h3 style={{ fontFamily: font, fontSize: 24, fontWeight: 700, color: P, margin: '12px 0 8px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                          {topFinding.title}
                        </h3>
                        <p style={{ fontFamily: fontBody, fontSize: 15, color: Pbody, lineHeight: 1.7, margin: '0 0 20px' }}>
                          {topFinding.explanation}
                        </p>
                        {diag.executive_summary && (
                          <div style={{ background: '#ede9fe', borderRadius: 12, padding: '20px 24px' }}>
                            <p style={{ fontFamily: fontBody, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: P, margin: '0 0 10px' }}>
                              How to fix this
                            </p>
                            <p style={{ fontFamily: fontBody, fontSize: 15, color: P, lineHeight: 1.6, margin: 0 }}>
                              {diag.executive_summary}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* ── S4: All findings ──────────────────────────────────── */}
                {(dataLoading || findings.length > 0) && (
                  <div>
                    <h2 style={{ fontFamily: font, fontSize: 32, fontWeight: 700, color: P, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Everything we found.</h2>
                    <p style={{ fontFamily: fontBody, fontSize: 15, color: Pmuted, margin: '0 0 20px' }}>Ranked by revenue impact.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {dataLoading ? [0, 1, 2].map(i => (
                        <div key={i} style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 16, padding: '28px 32px', display: 'flex', gap: 24 }}>
                          <Skel style={{ width: 44, height: 36, flexShrink: 0 }} />
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <Skel style={{ height: 22, width: '55%' }} />
                            <Skel style={{ height: 15, width: '90%' }} />
                          </div>
                        </div>
                      )) : findings.map((f, i) => (
                        <div key={i} style={{ background: '#fff', border: `1px solid ${Pborder}`, borderLeft: `4px solid ${severityColor(f.severity)}`, borderRadius: '0 16px 16px 0', padding: '28px 32px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                            <span style={{ fontFamily: font, fontSize: 36, fontWeight: 700, color: P, opacity: 0.12, lineHeight: 1, flexShrink: 0, minWidth: 44, paddingTop: 2 }}>
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                                <h3 style={{ fontFamily: font, fontSize: 20, fontWeight: 700, color: P, margin: 0, letterSpacing: '-0.01em' }}>
                                  {f.title}
                                </h3>
                                <span style={{ fontFamily: fontBody, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: severityColor(f.severity), background: severityBg(f.severity), padding: '2px 8px', borderRadius: 100, flexShrink: 0 }}>
                                  {f.severity}
                                </span>
                              </div>
                              <p style={{
                                fontFamily: fontBody, fontSize: 14, color: Pbody, lineHeight: 1.65, margin: 0,
                                ...(expandedIdx !== i ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties : {}),
                              }}>
                                {f.explanation}
                              </p>
                              <button onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, fontFamily: fontBody, fontSize: 13, fontWeight: 600, color: P, background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.65 }}>
                                {expandedIdx === i ? <>Show less <ChevronUp size={13} /></> : <>See fix <ChevronDown size={13} /></>}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── S5: Quick wins ────────────────────────────────────── */}
                {(dataLoading || (diag.quick_wins?.length ?? 0) > 0) && (
                  <div>
                    <h2 style={{ fontFamily: font, fontSize: 32, fontWeight: 700, color: P, margin: '0 0 8px', letterSpacing: '-0.02em' }}>What to do this week.</h2>
                    <p style={{ fontFamily: fontBody, fontSize: 15, color: Pmuted, margin: '0 0 20px' }}>Small changes, immediate impact.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {dataLoading ? [0, 1, 2].map(i => (
                        <div key={i} style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <Skel style={{ height: 18, width: 80 }} />
                          <Skel style={{ height: 48, width: '90%' }} />
                          <Skel style={{ height: 24, width: 100 }} />
                        </div>
                      )) : (diag.quick_wins ?? []).map((qw, i) => (
                        <div key={i} style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <ImpactBadge impact={qw.impact} />
                          <p style={{ fontFamily: font, fontSize: 18, fontWeight: 600, color: P, margin: 0, lineHeight: 1.4, flex: 1 }}>
                            {qw.action}
                          </p>
                          {qw.timeline && (
                            <span style={{ fontFamily: fontBody, fontSize: 12, fontWeight: 600, background: '#ede9fe', color: P, padding: '4px 12px', borderRadius: 100, width: 'fit-content' }}>
                              {qw.timeline}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── S6: Landing page assessment ───────────────────────── */}
                <div>
                  <h2 style={{ fontFamily: font, fontSize: 32, fontWeight: 700, color: P, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Your landing page.</h2>
                  {dataLoading ? (
                    <div style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 16, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <Skel style={{ height: 15, width: '95%' }} />
                      <Skel style={{ height: 15, width: '82%' }} />
                      <Skel style={{ height: 15, width: '68%' }} />
                    </div>
                  ) : diag.is_deep_research ? (
                    <div style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 16, padding: '28px 32px' }}>
                      <p style={{ fontFamily: fontBody, fontSize: 15, color: Pbody, lineHeight: 1.75, margin: 0 }}>
                        {diag.landing_page_assessment}
                      </p>
                    </div>
                  ) : (
                    <div style={{ background: BgAlt, border: `1px solid ${Pborder}`, borderRadius: 16, padding: '32px 40px', display: 'flex', alignItems: 'center', gap: 24 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Lock size={22} color={P} />
                      </div>
                      <div>
                        <h3 style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: P, margin: '0 0 6px' }}>
                          Unlock your landing page assessment
                        </h3>
                        <p style={{ fontFamily: fontBody, fontSize: 14, color: Pmuted, margin: '0 0 16px', lineHeight: 1.6 }}>
                          Subscribe to Pro or Agency for a live AI assessment of your actual landing page.
                        </p>
                        <Link href="/#pricing"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: P, color: '#fff', textDecoration: 'none', fontFamily: font, fontWeight: 600, fontSize: 13, padding: '10px 20px', borderRadius: 10 }}>
                          Upgrade Now <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── S7: Next steps ────────────────────────────────────── */}
                <div style={{ background: BgAlt, borderRadius: 20, padding: 'clamp(28px,4vw,40px) clamp(24px,4vw,48px)' }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                  <div>
                    <h3 style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: P, margin: '0 0 12px', letterSpacing: '-0.01em' }}>
                      Ready for your next diagnosis?
                    </h3>
                    <p style={{ fontFamily: fontBody, fontSize: 15, color: Pbody, lineHeight: 1.65, margin: '0 0 20px' }}>
                      Run a new diagnosis to track your improvement and see if your fixes are working.
                    </p>
                    <Link href="/questionnaire"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: P, color: '#fff', textDecoration: 'none', fontFamily: font, fontWeight: 600, fontSize: 14, padding: '14px 24px', borderRadius: 12 }}>
                      Run New Diagnosis <ArrowRight size={15} />
                    </Link>
                  </div>
                  <div style={{ borderTop: `1px solid ${Pborder}`, paddingTop: 24 }} className="md:border-t-0 md:border-l md:pt-0 md:pl-12">
                    <h3 style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: P, margin: '0 0 12px', letterSpacing: '-0.01em' }}>
                      Have campaign data?
                    </h3>
                    <p style={{ fontFamily: fontBody, fontSize: 15, color: Pbody, lineHeight: 1.65, margin: '0 0 20px' }}>
                      Upload your Google or Meta CSV for a deeper spend analysis.
                    </p>
                    <Link href="/dashboard/csv"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: P, textDecoration: 'none', fontFamily: font, fontWeight: 600, fontSize: 14, padding: '14px 24px', borderRadius: 12, border: `2px solid ${P}` }}>
                      Upload CSV <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>

              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════ REPORTS ═════════════════════════════ */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: font, fontSize: 32, fontWeight: 700, color: P, margin: 0, letterSpacing: '-0.02em' }}>Reports</h2>
              <Link href="/questionnaire"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: P, color: '#fff', textDecoration: 'none', fontFamily: font, fontWeight: 600, fontSize: 13, padding: '10px 18px', borderRadius: 100 }}>
                + New Diagnosis
              </Link>
            </div>

            {dataLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[0, 1, 2].map(i => <Skel key={i} style={{ height: 88, borderRadius: 16 }} />)}
              </div>
            ) : reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', background: BgAlt, borderRadius: 20 }}>
                <p style={{ fontFamily: fontBody, fontSize: 16, color: Pmuted, margin: '0 0 20px' }}>
                  No reports yet. Run your first diagnosis to get started.
                </p>
                <Link href="/questionnaire"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: P, color: '#fff', textDecoration: 'none', fontFamily: font, fontWeight: 600, fontSize: 14, padding: '14px 24px', borderRadius: 12 }}>
                  Run First Diagnosis <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reports.map((r, i) => {
                  const d    = parseDiagnosis(r.report_summary)
                  const s    = getScore(d)
                  const fs   = getFindings(d)
                  const prevD = reports[i + 1] ? parseDiagnosis(reports[i + 1].report_summary) : null
                  const prevS = prevD ? getScore(prevD) : null
                  const diff  = s !== null && prevS !== null ? s - prevS : null
                  return (
                    <div key={r.id} style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
                      {/* Score */}
                      <div style={{ textAlign: 'center', flexShrink: 0, width: 68 }}>
                        {s !== null ? (
                          <>
                            <span style={{ fontFamily: font, fontSize: 34, fontWeight: 800, color: scoreColor(s), lineHeight: 1 }}>{s}</span>
                            <p style={{ fontFamily: fontBody, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: Pmuted, margin: '3px 0 0' }}>/100</p>
                          </>
                        ) : (
                          <span style={{ fontFamily: font, fontSize: 30, fontWeight: 700, color: Pmuted }}>—</span>
                        )}
                      </div>

                      <div style={{ width: 1, height: 52, background: Pborder, flexShrink: 0 }} />

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: P }}>
                            {formatDate(r.generated_at)}
                          </span>
                          {i === 0 && (
                            <span style={{ fontFamily: fontBody, fontSize: 11, fontWeight: 700, background: '#ede9fe', color: P, padding: '2px 10px', borderRadius: 100 }}>
                              Latest
                            </span>
                          )}
                        </div>
                        {fs[0] && (
                          <p style={{ fontFamily: fontBody, fontSize: 13, color: Pmuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Top finding: {fs[0].title}
                          </p>
                        )}
                      </div>

                      {/* Trend */}
                      {diff !== null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          {diff > 0 ? <TrendingUp size={15} color="#22c55e" /> : <TrendingDown size={15} color="#ef4444" />}
                          <span style={{ fontFamily: fontBody, fontSize: 13, fontWeight: 600, color: diff > 0 ? '#22c55e' : '#ef4444' }}>
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                        </div>
                      )}

                      {/* CTA */}
                      <Link href={`/report/${r.id}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: P, color: '#fff', textDecoration: 'none', fontFamily: font, fontWeight: 600, fontSize: 13, padding: '10px 16px', borderRadius: 10, flexShrink: 0 }}>
                        View Report <ArrowRight size={13} />
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════ ACCOUNT ═════════════════════════════ */}
        {activeTab === 'account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>
            <h2 style={{ fontFamily: font, fontSize: 32, fontWeight: 700, color: P, margin: 0, letterSpacing: '-0.02em' }}>Account</h2>

            {/* Profile */}
            <div style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 20, padding: '28px 32px' }}>
              <p style={{ fontFamily: fontBody, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: Pmuted, margin: '0 0 16px' }}>Profile</p>
              {[
                { label: 'Full name', value: user?.full_name   ?? '—' },
                { label: 'Email',     value: user?.email       ?? '—' },
                { label: 'Company',   value: user?.company_name ?? '—' },
              ].map((row, i, arr) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < arr.length - 1 ? `1px solid ${Pborder}` : 'none' }}>
                  <span style={{ fontFamily: fontBody, fontSize: 14, color: Pmuted }}>{row.label}</span>
                  <span style={{ fontFamily: fontBody, fontSize: 14, fontWeight: 600, color: P }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Subscription */}
            <div style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 20, padding: '28px 32px' }}>
              <p style={{ fontFamily: fontBody, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: Pmuted, margin: '0 0 16px' }}>Subscription</p>
              {([
                { label: 'Current plan',   value: tierLabel ? <span style={{ fontFamily: fontBody, fontSize: 12, fontWeight: 700, background: P, color: '#fff', padding: '3px 12px', borderRadius: 100 }}>{tierLabel}</span> : '—' },
                { label: 'Description',    value: user?.subscription_tier ? (TIER_DESC[user.subscription_tier] ?? '') : '—' },
                { label: 'Monthly price',  value: user?.subscription_tier ? `${TIER_PRICE[user.subscription_tier] ?? '—'} / month` : '—' },
                { label: 'Billing status', value: (
                  <span style={{ fontFamily: fontBody, fontSize: 12, fontWeight: 700, background: user?.billing_status === 'active' ? '#dcfce7' : '#fee2e2', color: user?.billing_status === 'active' ? '#16a34a' : '#ef4444', padding: '3px 12px', borderRadius: 100 }}>
                    {user?.billing_status ?? '—'}
                  </span>
                )},
                { label: 'Renewal date', value: user?.renewal_date ? formatDate(user.renewal_date) : '—' },
              ] as { label: string; value: React.ReactNode }[]).map((row, i, arr) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < arr.length - 1 ? `1px solid ${Pborder}` : 'none', gap: 16 }}>
                  <span style={{ fontFamily: fontBody, fontSize: 14, color: Pmuted, flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontFamily: fontBody, fontSize: 14, fontWeight: 500, color: P, textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {user?.subscription_tier && user.subscription_tier !== 'agency' && (
                <Link href="/#pricing"
                  style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: P, color: '#fff', fontFamily: font, fontWeight: 600, fontSize: 14, padding: 16, borderRadius: 14 }}>
                  Upgrade Plan →
                </Link>
              )}
              <a href="mailto:support@icpbrand.co"
                style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: BgAlt, border: `1px solid ${Pborder}`, color: Pbody, fontFamily: fontBody, fontWeight: 500, fontSize: 14, padding: 16, borderRadius: 14 }}>
                Manage Subscription
              </a>
              <button onClick={handleSignOut}
                style={{ background: BgAlt, border: `1px solid ${Pborder}`, borderRadius: 14, padding: 16, fontSize: 14, fontFamily: fontBody, fontWeight: 500, color: Pmuted, cursor: 'pointer' }}>
                Sign out
              </button>
            </div>

            {/* Cancel */}
            <div style={{ border: '1px solid #fecaca', borderRadius: 16, padding: '24px 28px' }}>
              <p style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: '#ef4444', margin: '0 0 6px' }}>Cancel Subscription</p>
              {!cancelConfirm ? (
                <>
                  <p style={{ fontFamily: fontBody, fontSize: 13, color: Pmuted, margin: '0 0 14px', lineHeight: 1.6 }}>
                    Your access continues until your renewal date. This cannot be undone.
                  </p>
                  <button onClick={() => setCancelConfirm(true)}
                    style={{ background: 'none', border: 'none', fontFamily: fontBody, fontSize: 14, color: '#ef4444', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                    Cancel my subscription
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontFamily: fontBody, fontSize: 14, color: P, margin: 0 }}>
                    Are you sure? You will lose access at your next renewal date.
                  </p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <a href={`mailto:support@icpbrand.co?subject=Cancel subscription — ${user?.email}`}
                      style={{ fontFamily: fontBody, fontSize: 14, fontWeight: 600, background: '#fee2e2', color: '#ef4444', padding: '10px 20px', borderRadius: 10, textDecoration: 'none' }}>
                      Yes, cancel
                    </a>
                    <button onClick={() => setCancelConfirm(false)}
                      style={{ fontFamily: fontBody, fontSize: 14, color: Pmuted, background: 'none', border: 'none', cursor: 'pointer', padding: '10px' }}>
                      Keep my subscription
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
