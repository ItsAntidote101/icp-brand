'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileSearch, ArrowRight, TrendingUp, TrendingDown,
  BarChart2, User, FileText, LayoutDashboard, Zap, AlertCircle,
  Check, ChevronDown, ChevronUp,
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'

// ─── Tokens ───────────────────────────────────────────────────────────────────
const P       = '#302161'
const Pmuted  = 'rgba(48,33,97,0.45)'
const Pborder = 'rgba(48,33,97,0.08)'
const BgAlt   = '#f8f7ff'
const font    = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontB   = "'PolySans Neutral', -apple-system, system-ui, sans-serif"

// ─── Currency ─────────────────────────────────────────────────────────────────
const USD_RATES: Record<string, number> = { KES: 129, NGN: 1580, ZAR: 18.5, USD: 1, GBP: 0.79, EUR: 0.92 }
const CURRENCIES = ['KES', 'NGN', 'ZAR', 'USD', 'GBP', 'EUR']

function convertAmount(amount: number, fromCurrency: string, toCurrency: string): string {
  const inUSD     = amount / (USD_RATES[fromCurrency] ?? 1)
  const converted = inUSD * (USD_RATES[toCurrency] ?? 1)
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: toCurrency, maximumFractionDigits: 0 }).format(converted)
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'reports' | 'account'

type UserData = {
  id: string; email: string; full_name: string | null
  company_name: string | null; subscription_tier: string
  billing_status: string; renewal_date: string | null; created_at: string
}

type ReportRow = {
  id: string; questionnaire_id: string
  report_summary: string; generated_at: string
}

type Finding  = { title: string; severity: string; explanation: string }
type QuickWin = { action: string; impact: string; timeline?: string }

type DiagnosisData = {
  overall_score?: number; health_score?: number
  executive_summary?: string
  critical_findings?: Finding[]; findings?: Finding[]
  quick_wins?: QuickWin[]
  landing_page_assessment?: string
  monthly_waste_estimate?: string
  is_deep_research?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseDiagnosis = (s: string): DiagnosisData => { try { return JSON.parse(s) } catch { return {} } }
const getScore = (d: DiagnosisData): number | null => {
  const s = d.overall_score ?? d.health_score ?? null
  return typeof s === 'number' ? s : null
}
const getFindings = (d: DiagnosisData): Finding[] => d.critical_findings ?? d.findings ?? []
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const daysBetween = (iso: string) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)

const scoreColor   = (s: number) => s >= 71 ? '#22c55e' : s >= 41 ? '#f59e0b' : '#ef4444'
const scoreLabel   = (s: number) => s >= 71 ? 'Healthy' : s >= 41 ? 'At Risk' : 'Critical'
const scoreLabelBg = (s: number) => s >= 71 ? '#dcfce7' : s >= 41 ? '#fef3c7' : '#fee2e2'
const sevColor     = (s: string) => s === 'Critical' ? '#ef4444' : s === 'Warning' ? '#f59e0b' : '#22c55e'
const sevBg        = (s: string) => s === 'Critical' ? '#fee2e2' : s === 'Warning' ? '#fef3c7' : '#dcfce7'
const impactColor  = (i: string) => i === 'High' ? '#ef4444' : i === 'Medium' ? '#d97706' : '#16a34a'
const impactBg     = (i: string) => i === 'High' ? '#fee2e2' : i === 'Medium' ? '#fef3c7' : '#dcfce7'

function greeting(name: string | null) {
  const h = new Date().getHours()
  const t = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'
  return `Good ${t}, ${name?.split(' ')[0] ?? 'there'}.`
}

function parseWaste(text: string | undefined): { fromCurrency: string; amount: number; raw: string } {
  if (!text || text.startsWith('Upgrade')) return { fromCurrency: 'KES', amount: 0, raw: '—' }
  const symMap: Record<string, string> = { '$': 'USD', '€': 'EUR', '£': 'GBP' }
  const m = text.match(/(KES|NGN|ZAR|USD|GBP|EUR|\$|€|£)\s*([\d,]+)/i)
  if (m) {
    const fromCurrency = symMap[m[1]] ?? m[1].toUpperCase()
    return { fromCurrency, amount: parseInt(m[2].replace(/,/g, ''), 10), raw: text }
  }
  return { fromCurrency: 'KES', amount: 0, raw: text.length > 28 ? text.slice(0, 28) + '…' : text }
}

const DIMS = ['Audience Targeting', 'Landing Page', 'Message-Market Fit', 'Budget Allocation', 'Funnel Conversion', 'Creative Relevance']
const DVAR = [10, -15, 5, -8, 12, -5]
const DPEN = [0.8, 1.2, 0.6, 1.0, 0.9, 0.7]

function deriveDimensions(diag: DiagnosisData, base: number) {
  const fs = getFindings(diag)
  const cn = fs.filter(f => f.severity === 'Critical').length
  const wn = fs.filter(f => f.severity === 'Warning').length
  return DIMS.map((name, i) => {
    const penalty = (cn * 10 + wn * 5) * DPEN[i]
    const score   = Math.max(5, Math.min(95, Math.round(base + DVAR[i] - penalty / DIMS.length)))
    return { name, score }
  })
}

const TIER_LABEL: Record<string, string> = { starter: 'Starter', pro: 'Pro', agency: 'Agency', free: 'Free' }
// Base prices in KES
const TIER_PRICE_KES: Record<string, number> = { starter: 6500, pro: 13000, agency: 26000, free: 0 }
const TIER_DESC: Record<string, string> = {
  starter: 'Monthly ICP diagnostic with full report, findings, and quick wins.',
  pro:     'Everything in Starter plus priority re-diagnosis and campaign CSV analysis.',
  agency:  'Everything in Pro plus multi-client reporting and dedicated strategy review.',
  free:    'Basic ICP diagnostic based on questionnaire answers only.',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skel({ style }: { style?: React.CSSProperties }) {
  return <div className="animate-pulse" style={{ background: 'rgba(48,33,97,0.07)', borderRadius: 8, ...style }} />
}

function Card({ children, style, delay = 0 }: { children: React.ReactNode; style?: React.CSSProperties; delay?: number }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: 28,
      border: `1px solid ${Pborder}`,
      boxShadow: '0 2px 16px rgba(48,33,97,0.06)',
      animation: 'fadeUp 0.4s ease both',
      animationDelay: `${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  )
}

function AnimatedGauge({ score, size = 140 }: { score: number; size?: number }) {
  const [cur, setCur] = useState(0)
  useEffect(() => { const t = setTimeout(() => setCur(score), 80); return () => clearTimeout(t) }, [score])
  const r = (size / 2) * 0.72; const circ = 2 * Math.PI * r; const fill = (cur / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={Pborder} strokeWidth={9} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={scoreColor(score)} strokeWidth={9}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: font, fontSize: 38, fontWeight: 800, color: P, lineHeight: 1 }}>{cur}</div>
        <div style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, marginTop: 2 }}>/100</div>
      </div>
    </div>
  )
}

function CountUp({ target, display }: { target: number; display: string }) {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const steps = 40; let i = 0
    const id = setInterval(() => { i++; setPct(i >= steps ? 1 : i / steps); if (i >= steps) clearInterval(id) }, 28)
    return () => clearInterval(id)
  }, [target])
  if (pct < 1) {
    const approx = Math.round(target * pct)
    return <>{approx.toLocaleString()}</>
  }
  return <>{display}</>
}

// ─── Widgets ──────────────────────────────────────────────────────────────────

function HealthScoreWidget({ diag, report, delay }: { diag: DiagnosisData; report: ReportRow; delay: number }) {
  const score = getScore(diag)
  if (score === null) return null
  return (
    <Card delay={delay} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
      <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: Pmuted, margin: 0 }}>ICP Health Score</p>
      <AnimatedGauge score={score} />
      <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, background: scoreLabelBg(score), color: scoreColor(score), padding: '4px 14px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {scoreLabel(score)}
      </span>
      <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, margin: 0 }}>Updated {formatDate(report.generated_at)}</p>
    </Card>
  )
}

function MonthlyWasteWidget({ diag, currency, delay }: { diag: DiagnosisData; currency: string; delay: number }) {
  const waste = parseWaste(diag.monthly_waste_estimate)
  const fs    = getFindings(diag)
  const topF  = fs.find(f => f.severity === 'Critical') ?? fs[0]

  const displayStr = waste.amount > 0 ? convertAmount(waste.amount, waste.fromCurrency, currency) : waste.raw
  const displayNum = waste.amount > 0
    ? Math.round(waste.amount / (USD_RATES[waste.fromCurrency] ?? 1) * (USD_RATES[currency] ?? 1))
    : 0
  const col = displayNum > 50000 ? '#ef4444' : displayNum > 10000 ? '#f59e0b' : P

  return (
    <Card delay={delay}>
      <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: Pmuted, margin: '0 0 10px' }}>Estimated Waste</p>
      <div style={{ fontFamily: font, fontSize: 44, fontWeight: 800, color: col, lineHeight: 1, margin: '0 0 4px' }}>
        {waste.amount > 0 ? <CountUp target={displayNum} display={displayStr} /> : waste.raw}
      </div>
      <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: '0 0 18px' }}>per month</p>
      {topF && (
        <>
          <div style={{ height: 1, background: Pborder, margin: '0 0 14px' }} />
          <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Primary cause</p>
          <p style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: P, margin: '0 0 10px', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
            {topF.title}
          </p>
        </>
      )}
      <a href="#findings" style={{ fontFamily: fontB, fontSize: 13, color: P, textDecoration: 'none', fontWeight: 600, opacity: 0.65 }}>
        See all findings →
      </a>
    </Card>
  )
}

function QuickWinsWidget({ diag, delay }: { diag: DiagnosisData; delay: number }) {
  const wins = (diag.quick_wins ?? []).slice(0, 3)
  const [checked, setChecked] = useState<boolean[]>(() => wins.map(() => false))
  const done   = checked.filter(Boolean).length
  const toggle = (i: number) => setChecked(p => { const n = [...p]; n[i] = !n[i]; return n })
  return (
    <Card delay={delay}>
      <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: Pmuted, margin: '0 0 16px' }}>This Week</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        {wins.map((w, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <button onClick={() => toggle(i)} style={{
              width: 22, height: 22, borderRadius: '50%',
              border: `2px solid ${checked[i] ? P : 'rgba(48,33,97,0.25)'}`,
              background: checked[i] ? P : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s', marginTop: 1,
            }}>
              {checked[i] && <Check size={12} color="#fff" strokeWidth={3} />}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: impactBg(w.impact), color: impactColor(w.impact), padding: '2px 8px', borderRadius: 100, display: 'inline-block', marginBottom: 5 }}>
                {w.impact}
              </span>
              <p style={{ fontFamily: fontB, fontSize: 13, color: checked[i] ? Pmuted : P, margin: 0, lineHeight: 1.4, textDecoration: checked[i] ? 'line-through' : 'none', transition: 'all 0.2s' }}>
                {w.action}
              </p>
            </div>
          </div>
        ))}
        {wins.length === 0 && <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: 0 }}>No quick wins in this report.</p>}
      </div>
      {wins.length > 0 && (
        <div>
          <p style={{ fontFamily: fontB, fontSize: 12, color: Pmuted, margin: '0 0 6px' }}>{done}/{wins.length} completed</p>
          <div style={{ height: 6, background: Pborder, borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: P, borderRadius: 100, width: `${(done / wins.length) * 100}%`, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}
    </Card>
  )
}

function PerformanceBreakdownWidget({ diag, score, delay }: { diag: DiagnosisData; score: number; delay: number }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 120); return () => clearTimeout(t) }, [])
  const dims = deriveDimensions(diag, score)
  return (
    <Card delay={delay}>
      <p style={{ fontFamily: font, fontSize: 17, fontWeight: 700, color: P, margin: '0 0 4px' }}>Performance Breakdown</p>
      <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: '0 0 22px' }}>6 dimensions of your ICP health</p>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {dims.map((d, i) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ fontFamily: fontB, fontSize: 15, color: P, width: 150, flexShrink: 0 }}>{d.name}</span>
            <div style={{ flex: 1, height: 10, background: '#f3f4f6', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 100, background: scoreColor(d.score),
                width: mounted ? `${d.score}%` : '0%',
                transition: `width 900ms cubic-bezier(0.16,1,0.3,1) ${i * 80}ms`,
              }} />
            </div>
            <span style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: scoreColor(d.score), width: 32, textAlign: 'right', flexShrink: 0 }}>{d.score}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ScoreHistoryWidget({ reports, latestReport, renewalDate, delay }: {
  reports: ReportRow[]; latestReport: ReportRow; renewalDate: string | null; delay: number
}) {
  const hasHistory = reports.length >= 2
  const nextDate   = renewalDate
    ? new Date(renewalDate)
    : new Date(new Date(latestReport.generated_at).getTime() + 30 * 86_400_000)
  const latestScore = getScore(parseDiagnosis(latestReport.report_summary))

  if (!hasHistory) {
    return (
      <Card delay={delay} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <p style={{ fontFamily: font, fontSize: 17, fontWeight: 700, color: P, margin: '0 0 20px' }}>Score History</p>
        {latestScore !== null && (
          <div style={{ background: BgAlt, borderRadius: 12, padding: '14px 18px', marginBottom: 18, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: fontB, fontSize: 12, color: Pmuted }}>Baseline</span>
            <span style={{ fontFamily: font, fontSize: 22, fontWeight: 800, color: P }}>{latestScore}<span style={{ fontSize: 13, fontWeight: 500, color: Pmuted }}>/100</span></span>
            <span style={{ fontFamily: fontB, fontSize: 11, color: Pmuted }}>— {formatDate(latestReport.generated_at)}</span>
          </div>
        )}
        <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, lineHeight: 1.6, margin: '0 0 6px' }}>
          Your score trend will appear here after your next diagnosis.
        </p>
        <p style={{ fontFamily: fontB, fontSize: 12, color: Pmuted, margin: '0 0 20px' }}>
          Next diagnosis due {formatDate(nextDate.toISOString())}
        </p>
        <Link href="/questionnaire"
          style={{ fontFamily: font, fontWeight: 600, fontSize: 13, color: P, border: `1.5px solid ${Pborder}`, borderRadius: 10, padding: '9px 18px', textDecoration: 'none', display: 'inline-block', width: 'fit-content' }}>
          Run New Diagnosis →
        </Link>
      </Card>
    )
  }

  const chartData = [...reports].reverse().map(r => {
    const d = parseDiagnosis(r.report_summary)
    return { date: formatDate(r.generated_at), score: getScore(d) ?? 0 }
  })

  return (
    <Card delay={delay}>
      <p style={{ fontFamily: font, fontSize: 17, fontWeight: 700, color: P, margin: '0 0 18px' }}>Score History</p>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={P} stopOpacity={0.18} />
              <stop offset="95%" stopColor={P} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="score" stroke={P} strokeWidth={2.5} fill="url(#sg)" dot={{ fill: P, r: 4 }} isAnimationActive />
          <Tooltip
            contentStyle={{ fontFamily: fontB, fontSize: 12, border: `1px solid ${Pborder}`, borderRadius: 10, color: P }}
            formatter={(v) => [`Score: ${v}`, '']}
            labelStyle={{ color: Pmuted, marginBottom: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}

function LandingPageWidget({ diag, delay }: { diag: DiagnosisData; delay: number }) {
  const [expanded, setExpanded] = useState(false)

  if (!diag.is_deep_research) {
    return (
      <Card delay={delay}>
        <p style={{ fontFamily: font, fontSize: 17, fontWeight: 700, color: P, margin: '0 0 12px' }}>Landing Page Assessment</p>
        <p style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(48,33,97,0.75)', lineHeight: 1.75, margin: '0 0 20px' }}>
          Your landing page assessment will appear in your next report. Pro subscribers get a live AI review of their actual page — competitors, friction points, and conversion fixes.
        </p>
        <Link href="/#pricing"
          style={{ fontFamily: font, fontWeight: 600, fontSize: 13, color: P, textDecoration: 'none', opacity: 0.75 }}>
          See what Pro includes →
        </Link>
      </Card>
    )
  }

  const text = diag.landing_page_assessment ?? ''
  return (
    <Card delay={delay}>
      <p style={{ fontFamily: font, fontSize: 17, fontWeight: 700, color: P, margin: '0 0 12px' }}>Your Landing Page</p>
      <p style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(48,33,97,0.8)', lineHeight: 1.75, margin: 0,
        ...(!expanded ? { display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties : {}) }}>
        {text}
      </p>
      {text.length > 200 && (
        <button onClick={() => setExpanded(e => !e)}
          style={{ marginTop: 10, fontFamily: fontB, fontSize: 13, color: P, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4, opacity: 0.7 }}>
          {expanded ? <>Show less <ChevronUp size={13} /></> : <>Read more <ChevronDown size={13} /></>}
        </button>
      )}
    </Card>
  )
}

function NextDiagnosisWidget({ lastReport, renewalDate, delay }: { lastReport: ReportRow; renewalDate: string | null; delay: number }) {
  const nextDate = renewalDate
    ? new Date(renewalDate)
    : new Date(new Date(lastReport.generated_at).getTime() + 30 * 86_400_000)
  const daysLeft = Math.ceil((nextDate.getTime() - Date.now()) / 86_400_000)
  const overdue  = daysLeft <= 0
  const dueSoon  = daysLeft > 0 && daysLeft <= 7
  const bg       = overdue ? '#fee2e2' : dueSoon ? '#fef3c7' : '#fff'
  const col      = overdue ? '#ef4444' : dueSoon ? '#d97706' : P

  return (
    <Card delay={delay} style={{ background: bg, textAlign: 'center' }}>
      <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: col, opacity: 0.7, margin: '0 0 10px' }}>Next Diagnosis</p>
      {overdue ? (
        <>
          <span style={{ fontFamily: fontB, fontSize: 12, fontWeight: 700, background: '#ef4444', color: '#fff', padding: '3px 12px', borderRadius: 100, display: 'inline-block' }}>Overdue</span>
          <p style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: '#ef4444', margin: '12px 0' }}>Your diagnosis is overdue</p>
          <Link href="/questionnaire" style={{ fontFamily: font, fontWeight: 600, fontSize: 13, background: '#ef4444', color: '#fff', padding: '10px 20px', borderRadius: 12, textDecoration: 'none', display: 'inline-block' }}>
            Run Now →
          </Link>
        </>
      ) : (
        <>
          <div style={{ fontFamily: font, fontSize: 52, fontWeight: 800, color: col, lineHeight: 1, margin: '8px 0 4px' }}>{daysLeft}</div>
          <p style={{ fontFamily: fontB, fontSize: 13, color: col, opacity: 0.7, margin: '0 0 16px' }}>days remaining</p>
          {dueSoon ? (
            <>
              <span style={{ fontFamily: fontB, fontSize: 12, fontWeight: 700, background: '#f59e0b', color: '#fff', padding: '3px 12px', borderRadius: 100, display: 'inline-block', marginBottom: 12 }}>Due soon</span>
              <br />
              <Link href="/questionnaire" style={{ fontFamily: font, fontWeight: 600, fontSize: 13, background: '#d97706', color: '#fff', padding: '10px 20px', borderRadius: 12, textDecoration: 'none', display: 'inline-block', marginTop: 8 }}>
                Schedule Now →
              </Link>
            </>
          ) : (
            <Link href="/questionnaire" style={{ fontFamily: fontB, fontSize: 13, color: col, textDecoration: 'none', border: `1.5px solid ${col}`, borderRadius: 10, padding: '8px 16px', display: 'inline-block', opacity: 0.75 }}>
              Run Early →
            </Link>
          )}
        </>
      )}
    </Card>
  )
}

function CampaignInsightsWidget({ delay }: { delay: number }) {
  return (
    <Card delay={delay} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 180 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <BarChart2 size={22} color={P} />
      </div>
      <p style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: P, margin: '0 0 8px' }}>Campaign data analysis</p>
      <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: '0 0 20px', maxWidth: 200, lineHeight: 1.6 }}>
        Upload your Google Ads or Meta export to get a media buyer breakdown of your actual spend.
      </p>
      <Link href="/dashboard/csv" style={{ fontFamily: font, fontWeight: 600, fontSize: 13, color: P, border: `1.5px solid ${Pborder}`, borderRadius: 10, padding: '9px 18px', textDecoration: 'none' }}>
        Upload CSV →
      </Link>
    </Card>
  )
}

function FindingsSection({ diag }: { diag: DiagnosisData }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const findings = getFindings(diag)
  if (findings.length === 0) return null
  return (
    <div id="findings" style={{ animation: 'fadeUp 0.4s ease both', animationDelay: '350ms' }}>
      <p style={{ fontFamily: font, fontSize: 20, fontWeight: 700, color: P, margin: '0 0 14px', letterSpacing: '-0.02em' }}>All Findings</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {findings.map((f, i) => (
          <div key={i} style={{ background: '#fff', border: `1px solid ${Pborder}`, borderLeft: `4px solid ${sevColor(f.severity)}`, borderRadius: '0 14px 14px 0', padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span style={{ fontFamily: font, fontSize: 26, fontWeight: 700, color: P, opacity: 0.1, lineHeight: 1, flexShrink: 0, minWidth: 34 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 5 }}>
                  <h3 style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: P, margin: 0 }}>{f.title}</h3>
                  <span style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: sevColor(f.severity), background: sevBg(f.severity), padding: '2px 8px', borderRadius: 100, flexShrink: 0 }}>
                    {f.severity}
                  </span>
                </div>
                <p style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(48,33,97,0.8)', lineHeight: 1.65, margin: 0,
                  ...(expandedIdx !== i ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties : {}) }}>
                  {f.explanation}
                </p>
                <button onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                  style={{ marginTop: 7, fontFamily: fontB, fontSize: 12, fontWeight: 600, color: P, background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {expandedIdx === i ? <>Show less <ChevronUp size={12} /></> : <>Read more <ChevronDown size={12} /></>}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  const previews = [
    { icon: <Zap size={15} color={P} />, label: 'ICP Health Score' },
    { icon: <AlertCircle size={15} color={P} />, label: 'Monthly Waste' },
    { icon: <Check size={15} color={P} />, label: 'Quick Wins' },
    { icon: <BarChart2 size={15} color={P} />, label: 'Breakdown' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, paddingBottom: 80 }}>
      <div style={{ width: 80, height: 80, borderRadius: 24, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <FileSearch size={36} color={P} />
      </div>
      <h2 style={{ fontFamily: font, fontSize: 28, fontWeight: 700, color: P, margin: '0 0 12px', letterSpacing: '-0.02em', textAlign: 'center' }}>
        Your cockpit is ready.
      </h2>
      <p style={{ fontFamily: fontB, fontSize: 15, color: Pmuted, margin: '0 0 32px', maxWidth: 340, textAlign: 'center', lineHeight: 1.7 }}>
        Run your first ICP diagnostic to unlock your performance dashboard. Takes 5 minutes.
      </p>
      <Link href="/questionnaire"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: P, color: '#fff', textDecoration: 'none', fontFamily: font, fontWeight: 600, fontSize: 15, padding: '16px 32px', borderRadius: 14, marginBottom: 60 }}>
        Run My First Diagnosis <ArrowRight size={16} />
      </Link>
      <div style={{ width: '100%', maxWidth: 720 }}>
        <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, textAlign: 'center', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Unlocks after first diagnosis
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {previews.map((p, i) => (
            <div key={i} style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${Pborder}` }}>
              <div style={{ filter: 'blur(4px)', pointerEvents: 'none', background: '#fff', padding: 20, height: 108 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                  {p.icon}
                  <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 600, color: P }}>{p.label}</span>
                </div>
                <div style={{ height: 28, background: BgAlt, borderRadius: 8, marginBottom: 8 }} />
                <div style={{ height: 14, background: BgAlt, borderRadius: 6, width: '70%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function WelcomeBanner({ user }: { user: UserData }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg,#302161 0%,#4c1d95 100%)',
      borderRadius: 20, padding: 'clamp(22px,4vw,36px) clamp(20px,5vw,48px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 20, flexWrap: 'wrap',
      animation: 'fadeUp 0.4s ease both',
    }}>
      <div>
        <h2 style={{ fontFamily: font, fontSize: 'clamp(18px,3vw,24px)', fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
          {greeting(user.full_name)}
        </h2>
        {user.company_name && (
          <p style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 3px' }}>{user.company_name}</p>
        )}
        <p style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
          Here is where your marketing stands today.
        </p>
      </div>
      <Link href="/questionnaire"
        style={{ fontFamily: font, fontWeight: 600, fontSize: 13, background: '#fff', color: P, padding: '12px 22px', borderRadius: 12, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
        + Run New Diagnosis
      </Link>
    </div>
  )
}

// ─── Reports tab ──────────────────────────────────────────────────────────────

function ReportsTab({ reports, dataLoading }: { reports: ReportRow[]; dataLoading: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: font, fontSize: 'clamp(20px,4vw,28px)', fontWeight: 700, color: P, margin: 0, letterSpacing: '-0.02em' }}>Reports</h2>
        <Link href="/questionnaire"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: P, color: '#fff', textDecoration: 'none', fontFamily: font, fontWeight: 600, fontSize: 12, padding: '9px 16px', borderRadius: 100 }}>
          + New Diagnosis
        </Link>
      </div>
      {dataLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2].map(i => <Skel key={i} style={{ height: 80, borderRadius: 16 }} />)}
        </div>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: BgAlt, borderRadius: 20 }}>
          <p style={{ fontFamily: fontB, fontSize: 15, color: Pmuted, margin: '0 0 20px' }}>No reports yet.</p>
          <Link href="/questionnaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: P, color: '#fff', textDecoration: 'none', fontFamily: font, fontWeight: 600, fontSize: 14, padding: '14px 24px', borderRadius: 12 }}>
            Run First Diagnosis <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports.map((r, i) => {
            const d     = parseDiagnosis(r.report_summary)
            const s     = getScore(d)
            const fs    = getFindings(d)
            const prevD = reports[i + 1] ? parseDiagnosis(reports[i + 1].report_summary) : null
            const prevS = prevD ? getScore(prevD) : null
            const diff  = s !== null && prevS !== null ? s - prevS : null
            return (
              <div key={r.id} style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 16, padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ textAlign: 'center', flexShrink: 0, width: 52 }}>
                    {s !== null ? (
                      <>
                        <span style={{ fontFamily: font, fontSize: 26, fontWeight: 800, color: scoreColor(s), lineHeight: 1 }}>{s}</span>
                        <p style={{ fontFamily: fontB, fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: Pmuted, margin: '2px 0 0' }}>/100</p>
                      </>
                    ) : (
                      <span style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: Pmuted }}>—</span>
                    )}
                  </div>
                  <div style={{ width: 1, height: 40, background: Pborder, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: P }}>{formatDate(r.generated_at)}</span>
                      {i === 0 && <span style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, background: '#ede9fe', color: P, padding: '2px 8px', borderRadius: 100 }}>Latest</span>}
                    </div>
                    {fs[0] && (
                      <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fs[0].title}</p>
                    )}
                  </div>
                  {diff !== null && (
                    <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 3, flexShrink: 0 }}>
                      {diff > 0 ? <TrendingUp size={13} color="#22c55e" /> : <TrendingDown size={13} color="#ef4444" />}
                      <span style={{ fontFamily: fontB, fontSize: 12, fontWeight: 600, color: diff > 0 ? '#22c55e' : '#ef4444' }}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    </div>
                  )}
                  <Link href={`/report/${r.id}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: P, color: '#fff', textDecoration: 'none', fontFamily: font, fontWeight: 600, fontSize: 12, padding: '8px 14px', borderRadius: 10, flexShrink: 0, whiteSpace: 'nowrap' }}>
                    <span className="hidden sm:inline">View Report</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Account tab ──────────────────────────────────────────────────────────────

function AccountTab({ user, currency, onSignOut }: { user: UserData; currency: string; onSignOut: () => void }) {
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const tierLabel  = TIER_LABEL[user.subscription_tier] ?? user.subscription_tier
  const priceKES   = TIER_PRICE_KES[user.subscription_tier] ?? 0
  const priceStr   = priceKES > 0 ? `${convertAmount(priceKES, 'KES', currency)} / month` : 'Free'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 640 }}>
      <h2 style={{ fontFamily: font, fontSize: 'clamp(20px,4vw,28px)', fontWeight: 700, color: P, margin: 0, letterSpacing: '-0.02em' }}>Account</h2>

      <Card style={{ padding: '24px 28px' }}>
        <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: Pmuted, margin: '0 0 14px' }}>Profile</p>
        {[
          { label: 'Full name', value: user.full_name ?? '—' },
          { label: 'Email',     value: user.email },
          { label: 'Company',   value: user.company_name ?? '—' },
        ].map((row, i, arr) => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${Pborder}` : 'none' }}>
            <span style={{ fontFamily: fontB, fontSize: 13, color: Pmuted }}>{row.label}</span>
            <span style={{ fontFamily: fontB, fontSize: 13, fontWeight: 600, color: P }}>{row.value}</span>
          </div>
        ))}
      </Card>

      <Card style={{ padding: '24px 28px' }}>
        <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: Pmuted, margin: '0 0 14px' }}>Subscription</p>
        {([
          { label: 'Plan',           value: <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, background: P, color: '#fff', padding: '3px 12px', borderRadius: 100 }}>{tierLabel}</span> },
          { label: 'Description',    value: TIER_DESC[user.subscription_tier] ?? '' },
          { label: 'Monthly price',  value: priceStr },
          { label: 'Billing status', value: (
            <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, background: user.billing_status === 'active' ? '#dcfce7' : '#fee2e2', color: user.billing_status === 'active' ? '#16a34a' : '#ef4444', padding: '3px 12px', borderRadius: 100 }}>
              {user.billing_status}
            </span>
          )},
          { label: 'Renewal date', value: user.renewal_date ? formatDate(user.renewal_date) : '—' },
        ] as { label: string; value: React.ReactNode }[]).map((row, i, arr) => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${Pborder}` : 'none', gap: 16 }}>
            <span style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, flexShrink: 0 }}>{row.label}</span>
            <span style={{ fontFamily: fontB, fontSize: 13, fontWeight: 500, color: P, textAlign: 'right' }}>{row.value}</span>
          </div>
        ))}
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {user.subscription_tier !== 'agency' && (
          <Link href="/#pricing"
            style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: P, color: '#fff', fontFamily: font, fontWeight: 600, fontSize: 14, padding: 15, borderRadius: 14 }}>
            Upgrade Plan →
          </Link>
        )}
        <a href="mailto:support@icpbrand.co"
          style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: BgAlt, border: `1px solid ${Pborder}`, color: 'rgba(48,33,97,0.8)', fontFamily: fontB, fontWeight: 500, fontSize: 14, padding: 15, borderRadius: 14 }}>
          Manage Subscription
        </a>
        <button onClick={onSignOut}
          style={{ background: BgAlt, border: `1px solid ${Pborder}`, borderRadius: 14, padding: 15, fontSize: 14, fontFamily: fontB, fontWeight: 500, color: Pmuted, cursor: 'pointer' }}>
          Sign out
        </button>
      </div>

      <div style={{ border: '1px solid #fecaca', borderRadius: 16, padding: '22px 26px' }}>
        <p style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: '#ef4444', margin: '0 0 5px' }}>Cancel Subscription</p>
        {!cancelConfirm ? (
          <>
            <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: '0 0 12px', lineHeight: 1.6 }}>
              Your access continues until your renewal date. This cannot be undone.
            </p>
            <button onClick={() => setCancelConfirm(true)}
              style={{ background: 'none', border: 'none', fontFamily: fontB, fontSize: 13, color: '#ef4444', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              Cancel my subscription
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontFamily: fontB, fontSize: 13, color: P, margin: 0 }}>Are you sure? You will lose access at your next renewal date.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <a href={`mailto:support@icpbrand.co?subject=Cancel subscription — ${user.email}`}
                style={{ fontFamily: fontB, fontSize: 13, fontWeight: 600, background: '#fee2e2', color: '#ef4444', padding: '9px 18px', borderRadius: 10, textDecoration: 'none' }}>
                Yes, cancel
              </a>
              <button onClick={() => setCancelConfirm(false)}
                style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, background: 'none', border: 'none', cursor: 'pointer', padding: '9px' }}>
                Keep my subscription
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()

  const [authStep,    setAuthStep]    = useState<'checking' | 'gate' | 'dashboard'>('checking')
  const [emailInput,  setEmailInput]  = useState('')
  const [authError,   setAuthError]   = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [user,        setUser]        = useState<UserData | null>(null)
  const [reports,     setReports]     = useState<ReportRow[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [activeTab,   setActiveTab]   = useState<Tab>('overview')
  const [currency,    setCurrency]    = useState('KES')

  // Load currency preference on mount
  useEffect(() => {
    const stored = localStorage.getItem('preferred_currency')
    if (stored && CURRENCIES.includes(stored)) setCurrency(stored)
  }, [])

  const handleCurrencyChange = (c: string) => {
    setCurrency(c)
    localStorage.setItem('preferred_currency', c)
  }

  const loadReports = useCallback(async (email: string) => {
    try {
      const res = await fetch(`/api/user/reports?email=${encodeURIComponent(email)}`)
      if (res.ok) { const j = await res.json(); setReports(j.reports ?? []) }
    } finally { setDataLoading(false) }
  }, [])

  const verifyEmail = useCallback(async (email: string, silent = false) => {
    if (!silent) setAuthLoading(true)
    setAuthError('')
    try {
      const res  = await fetch('/api/auth/check-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const json = await res.json()
      if (json.status === 'active') {
        localStorage.setItem('dashboard_email', email)
        setUser(json.user); setAuthStep('dashboard'); loadReports(email)
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
    setUser(null); setReports([]); setDataLoading(true); setAuthStep('gate'); setEmailInput('')
  }

  // ── Checking ────────────────────────────────────────────────────────────────
  if (authStep === 'checking') {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 32, height: 32, border: `3px solid ${P}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  // ── Auth gate ────────────────────────────────────────────────────────────────
  if (authStep === 'gate') {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${P},#6c4ddd)` }} />
            <span style={{ fontFamily: font, fontWeight: 700, fontSize: 18, color: P }}>ICP Diagnostic</span>
          </div>
          <h1 style={{ fontFamily: font, fontSize: 28, fontWeight: 700, color: P, textAlign: 'center', margin: '0 0 8px', letterSpacing: '-0.03em' }}>Welcome back</h1>
          <p style={{ fontFamily: fontB, color: Pmuted, textAlign: 'center', fontSize: 15, margin: '0 0 32px' }}>Enter your email to access your dashboard</p>
          <form onSubmit={e => { e.preventDefault(); if (emailInput.trim()) verifyEmail(emailInput.trim()) }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)}
              placeholder="you@company.com" required
              style={{ width: '100%', background: BgAlt, border: `1.5px solid ${Pborder}`, borderRadius: 12, padding: '14px 16px', fontSize: 15, color: P, outline: 'none', fontFamily: fontB, boxSizing: 'border-box' }} />
            {authError && (
              <p style={{ fontFamily: fontB, color: '#ef4444', fontSize: 14, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', margin: 0 }}>{authError}</p>
            )}
            <button type="submit" disabled={authLoading}
              style={{ background: P, color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 600, cursor: authLoading ? 'not-allowed' : 'pointer', opacity: authLoading ? 0.7 : 1, fontFamily: font }}>
              {authLoading ? 'Checking…' : 'Access Dashboard →'}
            </button>
          </form>
          <p style={{ fontFamily: fontB, textAlign: 'center', fontSize: 14, color: Pmuted, marginTop: 24 }}>
            No account?{' '}
            <Link href="/questionnaire" style={{ color: P, fontWeight: 600, textDecoration: 'none' }}>Run a free diagnostic</Link>
          </p>
        </div>
      </div>
    )
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────
  const latestReport        = reports[0]
  const diag: DiagnosisData = latestReport ? parseDiagnosis(latestReport.report_summary) : {}
  const score               = getScore(diag)
  const hasReports          = reports.length >= 1
  const tierLabel           = user ? (TIER_LABEL[user.subscription_tier] ?? user.subscription_tier) : ''

  const TAB_ICONS: Record<Tab, React.ReactNode> = {
    overview: <LayoutDashboard size={20} />,
    reports:  <FileText size={20} />,
    account:  <User size={20} />,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: fontB }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {/* ── Top nav ───────────────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${Pborder}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, padding: '0 16px', gap: 10 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: `linear-gradient(135deg,${P},#6c4ddd)` }} />
            <span style={{ fontFamily: font, fontWeight: 700, fontSize: 14, color: P }}>ICP Diagnostic</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Currency selector */}
            <div style={{ position: 'relative' }}>
              <select
                value={currency}
                onChange={e => handleCurrencyChange(e.target.value)}
                style={{
                  appearance: 'none', WebkitAppearance: 'none',
                  fontFamily: fontB, fontSize: 12, fontWeight: 600, color: P,
                  background: BgAlt, border: `1px solid ${Pborder}`,
                  borderRadius: 100, padding: '5px 28px 5px 12px',
                  cursor: 'pointer', outline: 'none',
                }}
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 9, color: P }}>▾</span>
            </div>

            {tierLabel && (
              <span className="hidden sm:inline-block" style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, background: P, color: '#fff', padding: '3px 10px', borderRadius: 100 }}>{tierLabel}</span>
            )}
            <span className="hidden md:block" style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(48,33,97,0.8)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name ?? user?.email}
            </span>
            <button onClick={handleSignOut}
              style={{ background: 'none', border: `1px solid ${Pborder}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, color: Pmuted, cursor: 'pointer', fontFamily: fontB, whiteSpace: 'nowrap' }}>
              Sign out
            </button>
          </div>
        </div>

        {/* Desktop tab row */}
        <div className="hidden md:block" style={{ borderTop: `1px solid ${Pborder}`, padding: '0 16px' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex' }}>
            {(['overview', 'reports', 'account'] as Tab[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                fontFamily: fontB, fontSize: 13, fontWeight: 500, padding: '11px 20px',
                border: 'none', cursor: 'pointer', background: 'transparent',
                color: activeTab === tab ? P : Pmuted,
                borderBottom: `2px solid ${activeTab === tab ? P : 'transparent'}`,
                marginBottom: -1, transition: 'all 0.15s',
              }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(20px,4vw,36px) clamp(14px,4vw,24px) 100px' }}>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            {dataLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <Skel style={{ height: 120, borderRadius: 20 }} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[0, 1, 2].map(i => <Skel key={i} style={{ height: 200, borderRadius: 20 }} />)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2"><Skel style={{ height: 240, borderRadius: 20 }} /></div>
                  <Skel style={{ height: 240, borderRadius: 20 }} />
                </div>
              </div>
            )}

            {!dataLoading && !hasReports && <EmptyState />}

            {!dataLoading && hasReports && user && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <WelcomeBanner user={user} />

                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <HealthScoreWidget diag={diag} report={latestReport} delay={80} />
                  <MonthlyWasteWidget diag={diag} currency={currency} delay={140} />
                  <QuickWinsWidget diag={diag} delay={200} />
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    {score !== null && <PerformanceBreakdownWidget diag={diag} score={score} delay={260} />}
                  </div>
                  <ScoreHistoryWidget reports={reports} latestReport={latestReport} renewalDate={user.renewal_date} delay={300} />
                </div>

                {/* All Findings */}
                <FindingsSection diag={diag} />

                {/* Row 3 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <LandingPageWidget diag={diag} delay={400} />
                  <NextDiagnosisWidget lastReport={latestReport} renewalDate={user.renewal_date} delay={450} />
                  <CampaignInsightsWidget delay={500} />
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'reports' && <ReportsTab reports={reports} dataLoading={dataLoading} />}
        {activeTab === 'account' && user && <AccountTab user={user} currency={currency} onSignOut={handleSignOut} />}
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────────────────────── */}
      <div className="md:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)', borderTop: `1px solid ${Pborder}`, display: 'flex', zIndex: 50 }}>
        {(['overview', 'reports', 'account'] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 4, padding: '10px 0', border: 'none', background: 'transparent', cursor: 'pointer',
            color: activeTab === tab ? P : Pmuted, transition: 'color 0.15s',
          }}>
            {TAB_ICONS[tab]}
            <span style={{ fontFamily: fontB, fontSize: 10, fontWeight: activeTab === tab ? 700 : 500 }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
