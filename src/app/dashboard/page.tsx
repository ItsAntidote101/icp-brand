'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileSearch, ArrowRight, TrendingUp, TrendingDown,
  BarChart2, User, FileText, LayoutDashboard, Zap, AlertCircle,
  Check, ChevronDown, ChevronUp, CheckCircle, Target, X, FileDown,
  RefreshCw, Bell, Brain, Send, Settings, HelpCircle, LogOut,
  MessageCircle, ArrowUp, UserCheck, BrainCircuit, Clock, Lock,
  Star, Flame, AlertTriangle,
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
type Tab = 'overview' | 'intelligence' | 'reports' | 'account'

type UserData = {
  id: string; email: string; full_name: string | null
  company_name: string | null; subscription_tier: string
  billing_status: string; renewal_date: string | null
  created_at: string; paused_until?: string | null
  has_unread_reply?: boolean | null
  current_streak?: number; longest_streak?: number
  total_fixes_completed?: number
  last_seen_intelligence_at?: string | null
  last_seen_overview_at?: string | null
  scheduled_tier?: string | null
  scheduled_tier_date?: string | null
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

// ─── Milestones ───────────────────────────────────────────────────────────────

type MilestoneKey = 'first_diagnosis' | 'quick_win' | 'score_climber' | 'intelligence_reader' | 'consistent' | 'power_user'
type Milestone = { key: MilestoneKey; name: string; description: string; unlock_hint: string; earned: boolean; earned_at: string | null }
type MilestoneDef = { key: MilestoneKey; name: string; description: string; unlock_hint: string; Icon: React.ComponentType<{ size?: number | string; color?: string }>; color: string }

const MILESTONE_DEFS: MilestoneDef[] = [
  { key: 'first_diagnosis',     name: 'First Diagnosis',     description: 'Completed your first ICP diagnostic',  unlock_hint: 'Run your first diagnosis',      Icon: FileSearch, color: '#f59e0b' },
  { key: 'quick_win',           name: 'Quick Win',           description: 'Marked your first fix as complete',    unlock_hint: 'Mark a quick win as done',      Icon: Zap,        color: '#22c55e' },
  { key: 'score_climber',       name: 'Score Climber',       description: 'Improved ICP score by 10+ points',     unlock_hint: 'Improve your score 10 points',  Icon: TrendingUp, color: '#3b82f6' },
  { key: 'intelligence_reader', name: 'Intelligence Reader', description: 'Read 5 intelligence briefings',        unlock_hint: 'Open Intelligence tab 5 times', Icon: Brain,      color: '#a855f7' },
  { key: 'consistent',          name: 'Consistent',          description: 'Ran 3 or more diagnoses',              unlock_hint: 'Complete 3 total diagnoses',    Icon: RefreshCw,  color: '#f97316' },
  { key: 'power_user',          name: 'Power User',          description: 'Earned all other badges',              unlock_hint: 'Earn all other badges first',   Icon: Star,       color: '#f59e0b' },
]

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

function LandingPageWidget({ diag, delay, onUpgrade }: { diag: DiagnosisData; delay: number; onUpgrade?: () => void }) {
  const [expanded, setExpanded] = useState(false)

  if (!diag.is_deep_research) {
    return (
      <Card delay={delay}>
        <p style={{ fontFamily: font, fontSize: 17, fontWeight: 700, color: P, margin: '0 0 12px' }}>Landing Page Assessment</p>
        <p style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(48,33,97,0.75)', lineHeight: 1.75, margin: '0 0 20px' }}>
          Your landing page assessment will appear in your next report. Pro subscribers get a live AI review of their actual page — competitors, friction points, and conversion fixes.
        </p>
        <button onClick={onUpgrade}
          style={{ fontFamily: font, fontWeight: 600, fontSize: 13, color: P, background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.75 }}>
          See what Pro includes →
        </button>
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

// ─── New Overview Components ──────────────────────────────────────────────────

function DailyBriefCard({ diag, reports, score, hasIntelligence, onTabChange }: {
  diag: DiagnosisData; reports: ReportRow[]; score: number | null
  hasIntelligence: boolean; onTabChange: (tab: Tab) => void
}) {
  const findings   = getFindings(diag)
  const topFinding = findings[0]
  const secondF    = findings[1]
  const waste      = parseWaste(diag.monthly_waste_estimate)
  const daysSince  = reports[0] ? daysBetween(reports[0].generated_at) : 0
  const dailyWaste = Math.round(waste.amount / 30)
  const costAccum  = dailyWaste * daysSince

  const prevScore  = reports.length >= 2 ? getScore(parseDiagnosis(reports[1].report_summary)) : null
  const delta      = score !== null && prevScore !== null ? score - prevScore : null

  // Since last visit feed items
  const feedItems = [
    hasIntelligence ? { color: '#22c55e', text: 'Intelligence updated', time: 'This week' } : null,
    delta !== null && delta !== 0
      ? { color: delta > 0 ? '#22c55e' : '#ef4444', text: `Score ${delta > 0 ? '+' : ''}${delta} since last report`, time: daysSince > 0 ? `${daysSince}d ago` : 'Today' }
      : delta === 0
      ? { color: '#a855f7', text: `Score unchanged at ${score}`, time: daysSince > 0 ? `${daysSince} days` : 'Today' }
      : null,
    topFinding ? { color: '#ef4444', text: `${topFinding.title.slice(0, 32)}${topFinding.title.length > 32 ? '…' : ''} unresolved`, time: daysSince > 0 ? `${daysSince} days` : 'Today' } : null,
  ].filter(Boolean).slice(0, 3) as { color: string; text: string; time: string }[]

  let briefText: string
  if (daysSince >= 14 && score !== null && score < 50) {
    briefText = `Your ICP score has not changed in ${daysSince} days. Your top finding is still unresolved and has cost you an estimated KES ${costAccum.toLocaleString()} since your last diagnosis. One quick win below takes 10 minutes to fix today.`
  } else if (delta !== null && delta > 0 && secondF) {
    briefText = `Your ICP score improved ${delta} points since last month. Good progress on your funnel friction. Your next priority is ${secondF.title}, which is still costing you KES ${dailyWaste.toLocaleString()} per day.`
  } else if (hasIntelligence) {
    briefText = `New competitive intelligence is available for your market this week. Your industry is seeing increased ad competition. Check the Intelligence tab for your full briefing.`
  } else {
    briefText = `Welcome to your ICP Diagnostic cockpit. Your baseline score is ${score ?? '—'}/100. You are losing an estimated KES ${waste.amount.toLocaleString()} per month on misaligned targeting. Start with the quick win below.`
  }

  const statusColor = score === null ? '#f59e0b'
    : score < 41 && daysSince >= 14 ? '#ef4444'
    : score < 41 ? '#f59e0b'
    : score < 71 ? '#f59e0b'
    : '#22c55e'

  const ctaStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: P, color: '#fff', borderRadius: 12, padding: '11px 18px',
    fontFamily: fontB, fontSize: 13, fontWeight: 600,
    textDecoration: 'none', border: 'none', cursor: 'pointer',
    whiteSpace: 'nowrap', flexShrink: 0,
  }

  return (
    <div style={{ background: '#fff', borderRadius: 20, borderLeft: `4px solid ${statusColor}`, padding: '24px 32px', boxShadow: '0 2px 16px rgba(48,33,97,0.06)', animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {/* Left: brief */}
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#a855f7' }}>TODAY&apos;S BRIEF</span>
            <span style={{ fontFamily: fontB, fontSize: 12, color: Pmuted }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <p style={{ fontFamily: font, fontSize: 15, color: 'rgba(48,33,97,0.8)', lineHeight: 1.7, margin: '0 0 16px', fontWeight: 400 }}>{briefText}</p>
          {hasIntelligence && !topFinding ? (
            <button onClick={() => onTabChange('intelligence')} style={ctaStyle}>
              Read This Week&apos;s Intelligence <ArrowRight size={14} />
            </button>
          ) : topFinding ? (
            <a href="#findings" style={ctaStyle}>
              Fix Top Finding <ArrowRight size={14} />
            </a>
          ) : (
            <Link href="/questionnaire" style={ctaStyle}>
              Run New Diagnosis <ArrowRight size={14} />
            </Link>
          )}
        </div>
        {/* Right: since last visit */}
        {feedItems.length > 0 && (
          <div style={{ flex: '0 1 200px', minWidth: 160 }}>
            <p style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: Pmuted, margin: '0 0 12px' }}>SINCE YOUR LAST VISIT</p>
            {feedItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0, marginTop: 4 }} />
                <div>
                  <p style={{ fontFamily: fontB, fontSize: 12, color: P, margin: '0 0 2px', lineHeight: 1.35 }}>{item.text}</p>
                  <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, margin: 0 }}>{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function WasteTicker({ diag, report, currency }: { diag: DiagnosisData; report: ReportRow; currency: string }) {
  const waste      = parseWaste(diag.monthly_waste_estimate)
  const perTick    = (waste.amount / 30 / 24 / 3600) / 10
  const daysSince  = daysBetween(report.generated_at)
  const startAmt   = Math.round((waste.amount / 30) * daysSince)

  const [displayed,   setDisplayed]   = useState(startAmt)
  const [isPulsing,   setIsPulsing]   = useState(false)

  useEffect(() => {
    if (waste.amount === 0) return
    const id = setInterval(() => setDisplayed(v => v + perTick), 100)
    return () => clearInterval(id)
  }, [perTick, waste.amount])

  useEffect(() => {
    const id = setInterval(() => {
      setIsPulsing(true)
      setTimeout(() => setIsPulsing(false), 600)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  const displayVal = waste.amount > 0
    ? convertAmount(Math.round(displayed), waste.fromCurrency, currency)
    : '—'

  return (
    <div style={{
      background: 'linear-gradient(135deg,#1a0a2e 0%,#302161 100%)',
      borderRadius: 20,
      padding: '28px 32px',
      boxShadow: '0 2px 16px rgba(48,33,97,0.15)',
      border: isPulsing ? '1px solid rgba(239,68,68,0.5)' : '1px solid transparent',
      transition: 'border-color 0.3s ease',
      animation: 'fadeUp 0.4s ease both',
    }}>
      <p style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', margin: '0 0 10px' }}>MONEY LOST SINCE DIAGNOSIS</p>
      <div style={{ fontFamily: font, fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' as const, margin: '0 0 10px' }}>
        {displayVal}
      </div>
      <p style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 4px' }}>
        and counting. Fix your top finding to stop the leak.
      </p>
      <a href="#findings" style={{ fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.8)', textDecoration: 'underline', cursor: 'pointer' }}>
        See What To Fix →
      </a>
    </div>
  )
}

function ICPScoreCard({ diag, reports }: { diag: DiagnosisData; reports: ReportRow[] }) {
  const score     = getScore(diag)
  const prevScore = reports.length >= 2 ? getScore(parseDiagnosis(reports[1].report_summary)) : null
  const delta     = score !== null && prevScore !== null ? score - prevScore : null

  if (score === null) return null

  const nextThreshold = score < 41 ? 41 : score < 71 ? 71 : null
  const nextLabel     = score < 41 ? 'At Risk' : score < 71 ? 'Healthy' : null
  const zoneStart     = nextThreshold === 41 ? 0 : 41
  const zoneSize      = nextThreshold === 41 ? 41 : 30
  const progressToNext = nextThreshold ? Math.min(100, ((score - zoneStart) / zoneSize) * 100) : 100

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
      <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: Pmuted, margin: 0 }}>ICP Health Score</p>
      <AnimatedGauge score={score} />
      <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, background: scoreLabelBg(score), color: scoreColor(score), padding: '4px 14px', borderRadius: 100, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
        {scoreLabel(score)}
      </span>
      {delta !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {delta > 0 ? <TrendingUp size={13} color="#22c55e" /> : delta < 0 ? <TrendingDown size={13} color="#ef4444" /> : null}
          <span style={{ fontFamily: fontB, fontSize: 12, color: delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : Pmuted }}>
            {delta > 0 ? `+${delta}` : delta === 0 ? 'No change' : String(delta)} since last month
          </span>
        </div>
      )}
      {nextThreshold && nextLabel && (
        <div style={{ width: '100%' }}>
          <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, margin: '0 0 6px' }}>
            {nextThreshold - score} points to {nextLabel} ({nextThreshold})
          </p>
          <div style={{ height: 6, background: '#f3f4f6', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: scoreColor(score), borderRadius: 100, width: `${progressToNext}%`, transition: 'width 1s ease' }} />
          </div>
        </div>
      )}
    </Card>
  )
}

function FixStreakWidget({ streak }: { streak: number }) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
      <Flame size={32} color={streak > 0 ? '#f97316' : Pmuted} />
      <div style={{ fontFamily: font, fontSize: 48, fontWeight: 800, color: streak > 0 ? '#f97316' : Pmuted, lineHeight: 1 }}>{streak}</div>
      <p style={{ fontFamily: fontB, fontSize: 14, color: Pmuted, margin: 0 }}>week streak</p>
      <p style={{ fontFamily: fontB, fontSize: 12, color: Pmuted, margin: 0, lineHeight: 1.5, maxWidth: 160 }}>Weeks with at least one fix implemented</p>
      <p style={{ fontFamily: fontB, fontSize: 13, color: streak >= 3 ? '#f97316' : Pmuted, margin: 0, fontWeight: streak >= 3 ? 600 : 400 }}>
        {streak === 0 ? 'Start your streak this week' : streak === 1 ? 'Keep it going next week' : 'You are on fire'}
      </p>
      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < Math.min(streak, 8) ? '#f97316' : '#e5e7eb' }} />
        ))}
      </div>
    </Card>
  )
}

function ScoreJourneyWidget({ score, reports }: { score: number; reports: ReportRow[] }) {
  const milestones = [
    { zone: 'Critical', range: '0-40',   color: '#ef4444', bg: '#fee2e2', reached: score <= 40, text: 'Immediate action required. 40% of your budget is at risk.' },
    { zone: 'At Risk',  range: '41-70',  color: '#f59e0b', bg: '#fef3c7', reached: score > 40,  text: 'Targeting improving. Funnel optimization phase.' },
    { zone: 'Healthy',  range: '71-100', color: '#22c55e', bg: '#dcfce7', reached: score > 70,  text: 'ICP aligned. Scale with confidence.' },
  ]
  const prevScore = reports.length >= 2 ? getScore(parseDiagnosis(reports[1].report_summary)) : null

  return (
    <Card>
      <p style={{ fontFamily: font, fontSize: 20, fontWeight: 700, color: P, margin: '0 0 20px', letterSpacing: '-0.02em' }}>Your journey to Healthy.</p>

      {/* Track */}
      <div style={{ position: 'relative', height: 32, borderRadius: 16, background: '#f3f4f6', overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ position: 'absolute', left: 0, width: '40%', height: '100%', background: 'rgba(239,68,68,0.15)' }} />
        <div style={{ position: 'absolute', left: '40%', width: '30%', height: '100%', background: 'rgba(245,158,11,0.12)' }} />
        <div style={{ position: 'absolute', left: '70%', right: 0, height: '100%', background: 'rgba(34,197,94,0.12)' }} />

        {/* Previous score dot */}
        {prevScore !== null && (
          <div style={{ position: 'absolute', left: `${prevScore}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 12, height: 12, borderRadius: '50%', background: scoreColor(prevScore), opacity: 0.45, border: '2px solid #fff' }} />
        )}

        {/* Current score dot */}
        <div style={{ position: 'absolute', left: `${score}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 28, height: 28, borderRadius: '50%', background: scoreColor(score), border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <span style={{ fontFamily: font, fontSize: 9, fontWeight: 800, color: '#fff' }}>{score}</span>
        </div>
      </div>

      {/* Zone labels */}
      <div style={{ display: 'flex', marginBottom: 24 }}>
        <span style={{ flex: '0 0 40%', fontFamily: fontB, fontSize: 10, color: '#ef4444', fontWeight: 600 }}>Critical (0-40)</span>
        <span style={{ flex: '0 0 30%', fontFamily: fontB, fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>At Risk (41-70)</span>
        <span style={{ flex: '0 0 30%', fontFamily: fontB, fontSize: 10, color: '#22c55e', fontWeight: 600, textAlign: 'right' as const }}>Healthy (71-100)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {milestones.map(m => (
          <div key={m.zone} style={{ background: m.reached ? m.bg : '#f9fafb', borderRadius: 14, padding: '16px 18px', border: `1px solid ${m.reached ? m.color + '40' : '#e5e7eb'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: m.reached ? m.color : Pmuted }}>{m.zone}</span>
              <span style={{ fontFamily: fontB, fontSize: 11, color: m.reached ? m.color : Pmuted }}>{m.range}</span>
            </div>
            <p style={{ fontFamily: fontB, fontSize: 12, color: m.reached ? P : Pmuted, margin: 0, lineHeight: 1.5 }}>{m.text}</p>
            {m.reached && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={12} color={m.color} />
                <span style={{ fontFamily: fontB, fontSize: 11, color: m.color }}>Reached</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

function EnhancedQuickWinsWidget({ diag, user, onStreakUpdate, maxWins = 3 }: { diag: DiagnosisData; user: UserData; onStreakUpdate: (s: number) => void; maxWins?: number }) {
  const wins    = (diag.quick_wins ?? []).slice(0, maxWins)
  const [checked,    setChecked]    = useState<boolean[]>(() => wins.map(() => false))
  const [confirming, setConfirming] = useState<number | null>(null)
  const [saving,     setSaving]     = useState<number | null>(null)
  const [badgeToast, setBadgeToast] = useState('')

  const impactLabel = (impact: string) =>
    impact === 'High' ? 'Estimated impact: KES 8,000-15,000/month'
    : impact === 'Medium' ? 'Estimated impact: KES 3,000-6,000/month'
    : 'Estimated impact: KES 1,000-2,500/month'

  async function completeWin(i: number) {
    setSaving(i); setConfirming(null)
    try {
      const res = await fetch('/api/quick-wins/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, win_index: i, win_text: wins[i]?.action }),
      })
      if (res.ok) {
        const d = await res.json() as { streak: number; badges_unlocked: { key: string; name: string }[] }
        setChecked(p => { const n = [...p]; n[i] = true; return n })
        onStreakUpdate(d.streak)
        if (d.badges_unlocked?.length > 0) {
          setBadgeToast(`Achievement unlocked: ${d.badges_unlocked[0].name}`)
          setTimeout(() => setBadgeToast(''), 4000)
        }
        const mod = await import('canvas-confetti')
        mod.default({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: ['#302161', '#a855f7', '#22c55e'] })
      }
    } catch { /* noop */ }
    finally { setSaving(null) }
  }

  const done = checked.filter(Boolean).length

  return (
    <Card>
      {wins.map((w, i) => (
        <div key={i} style={{ marginBottom: i < wins.length - 1 ? 20 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <button
              onClick={() => !checked[i] && setConfirming(confirming === i ? null : i)}
              disabled={saving === i}
              style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${checked[i] ? P : 'rgba(48,33,97,0.25)'}`, background: checked[i] ? P : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: checked[i] ? 'default' : 'pointer', flexShrink: 0, transition: 'all 0.2s', marginTop: 1 }}>
              {checked[i] && <Check size={12} color="#fff" strokeWidth={3} />}
              {saving === i && <div style={{ width: 8, height: 8, borderRadius: '50%', border: '2px solid rgba(48,33,97,0.3)', borderTopColor: P, animation: 'spin 0.6s linear infinite' }} />}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', background: impactBg(w.impact), color: impactColor(w.impact), padding: '2px 8px', borderRadius: 100, display: 'inline-block', marginBottom: 5 }}>
                {w.impact}
              </span>
              <p style={{ fontFamily: fontB, fontSize: 13, color: checked[i] ? Pmuted : P, margin: '0 0 4px', lineHeight: 1.4, textDecoration: checked[i] ? 'line-through' : 'none', transition: 'all 0.2s' }}>
                {w.action}
              </p>
              <p style={{ fontFamily: fontB, fontSize: 12, color: '#d97706', margin: 0 }}>{impactLabel(w.impact)}</p>
            </div>
          </div>

          {confirming === i && (
            <div style={{ marginTop: 10, marginLeft: 36, background: BgAlt, border: `1px solid ${Pborder}`, borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ fontFamily: fontB, fontSize: 13, color: P, margin: '0 0 10px' }}>Mark &ldquo;{w.action.slice(0, 40)}{w.action.length > 40 ? '…' : ''}&rdquo; as complete?</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => completeWin(i)} style={{ fontFamily: fontB, fontSize: 12, fontWeight: 600, background: P, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>Yes, done</button>
                <button onClick={() => setConfirming(null)} style={{ fontFamily: fontB, fontSize: 12, background: 'none', color: Pmuted, border: `1px solid ${Pborder}`, borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>Not yet</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {wins.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontFamily: fontB, fontSize: 12, color: Pmuted, margin: '0 0 6px' }}>{done}/{wins.length} completed</p>
          <div style={{ height: 6, background: Pborder, borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: P, borderRadius: 100, width: `${(done / wins.length) * 100}%`, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}

      {wins.length === 0 && <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: 0 }}>No quick wins in this report.</p>}

      {badgeToast && (
        <div style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 300, background: P, color: '#fff', fontFamily: fontB, fontSize: 13, fontWeight: 600, padding: '12px 22px', borderRadius: 100, boxShadow: '0 8px 32px rgba(48,33,97,0.25)', whiteSpace: 'nowrap', animation: 'slideUp 0.25s ease both' }}>
          {badgeToast}
        </div>
      )}
    </Card>
  )
}

function EnhancedFindingsSection({ diag, report, maxFindings, onUpgrade }: { diag: DiagnosisData; report: ReportRow; maxFindings?: number; onUpgrade?: () => void }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const allFindings = getFindings(diag)
  const findings    = maxFindings !== undefined ? allFindings.slice(0, maxFindings) : allFindings
  const lockedCount = maxFindings !== undefined ? Math.max(0, allFindings.length - maxFindings) : 0
  const days        = daysBetween(report.generated_at)
  if (allFindings.length === 0) return null
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
                  <span style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: sevColor(f.severity), background: sevBg(f.severity), padding: '2px 8px', borderRadius: 100, flexShrink: 0 }}>
                    {f.severity}
                  </span>
                  {days > 0 && (
                    <span style={{ fontFamily: fontB, fontSize: 11, background: sevBg(f.severity), color: sevColor(f.severity), padding: '2px 8px', borderRadius: 100, flexShrink: 0 }}>
                      Unresolved {days} {days === 1 ? 'day' : 'days'}
                    </span>
                  )}
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
      {lockedCount > 0 && (
        <div style={{ marginTop: 10, background: BgAlt, border: `1.5px dashed ${Pborder}`, borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Lock size={16} color={P} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: P, margin: '0 0 3px' }}>
              {lockedCount} more {lockedCount === 1 ? 'finding' : 'findings'} locked
            </p>
            <p style={{ fontFamily: fontB, fontSize: 12, color: Pmuted, margin: 0 }}>
              Upgrade to Starter to see every finding in your diagnostic.
            </p>
          </div>
          <button onClick={onUpgrade} style={{ fontFamily: fontB, fontSize: 12, fontWeight: 600, background: P, color: '#fff', padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
            Upgrade →
          </button>
        </div>
      )}
    </div>
  )
}

function UpgradeGate({ children, requiredTier, currentTier, feature, description, onUpgrade }: {
  children: React.ReactNode
  requiredTier: 'starter' | 'pro' | 'agency'
  currentTier: string
  feature: string
  description?: string
  onUpgrade?: () => void
}) {
  const tierOrder = ['free', 'starter', 'pro', 'agency']
  const hasAccess = tierOrder.indexOf(currentTier) >= tierOrder.indexOf(requiredTier)
  if (hasAccess) return <>{children}</>
  return (
    <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ filter: 'blur(3px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.35 }} aria-hidden>
        {children}
      </div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(2px)', borderRadius: 20, padding: 28, textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Lock size={20} color={P} />
        </div>
        <p style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: P, margin: '0 0 6px', letterSpacing: '-0.01em' }}>{feature}</p>
        <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: '0 0 18px', maxWidth: 240, lineHeight: 1.55 }}>
          {description ?? `Available on ${TIER_LABEL[requiredTier]} and above.`}
        </p>
        <button onClick={onUpgrade} style={{ fontFamily: fontB, fontSize: 13, fontWeight: 600, background: P, color: '#fff', padding: '10px 22px', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Upgrade to {TIER_LABEL[requiredTier]} <ArrowRight size={13} />
        </button>
      </div>
    </div>
  )
}

function MilestonesSection({ milestones }: { milestones: Milestone[] }) {
  return (
    <div style={{ animation: 'fadeUp 0.4s ease both', animationDelay: '450ms' }}>
      <p style={{ fontFamily: font, fontSize: 20, fontWeight: 700, color: P, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Your achievements.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        {MILESTONE_DEFS.map(def => {
          const ms     = milestones.find(m => m.key === def.key)
          const earned = ms?.earned ?? false
          return (
            <div key={def.key} style={{ width: 140, background: '#fff', borderRadius: 16, padding: '20px 16px', textAlign: 'center', border: `1px solid ${earned ? def.color + '30' : Pborder}`, opacity: earned ? 1 : 0.5, position: 'relative', transition: 'opacity 0.2s' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: earned ? def.color + '20' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <def.Icon size={24} color={earned ? def.color : '#9ca3af'} />
              </div>
              {!earned && <div style={{ position: 'absolute', top: 8, right: 8 }}><Lock size={10} color="#9ca3af" /></div>}
              <p style={{ fontFamily: fontB, fontSize: 13, fontWeight: 600, color: earned ? P : Pmuted, margin: '0 0 4px' }}>{def.name}</p>
              <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, margin: 0, lineHeight: 1.4 }}>
                {earned ? (ms?.earned_at ? `Earned ${formatDate(ms.earned_at)}` : 'Earned') : def.unlock_hint}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Today's Priority Action card ────────────────────────────────────────────

function TodaysPriorityCard({ diag, report, user, onComplete }: {
  diag: DiagnosisData; report: ReportRow; user: UserData
  onComplete: (streak: number) => void
}) {
  const findings   = getFindings(diag)
  const topFinding = findings.find(f => f.severity === 'Critical') ?? findings[0]
  const topWin     = (diag.quick_wins ?? [])[0]
  const [done,   setDone]   = useState(false)
  const [saving, setSaving] = useState(false)
  const days = daysBetween(report.generated_at)

  if (!topFinding) return null

  const col = topFinding.severity === 'Critical' ? '#ef4444' : '#f59e0b'

  async function markDone() {
    if (done || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/quick-wins/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, win_index: 0, win_text: topWin?.action ?? topFinding.title }),
      })
      if (res.ok) {
        const d = await res.json() as { streak: number }
        setDone(true)
        onComplete(d.streak)
        const mod = await import('canvas-confetti')
        mod.default({ particleCount: 80, spread: 90, origin: { y: 0.5 }, colors: ['#302161', '#a855f7', '#22c55e', '#f59e0b'] })
      }
    } catch { /* noop */ }
    finally { setSaving(false) }
  }

  return (
    <div style={{ background: '#fafafa', borderLeft: `4px solid ${col}`, borderRadius: '0 20px 20px 0', padding: '28px 32px', boxShadow: '0 2px 16px rgba(48,33,97,0.06)', animation: 'fadeUp 0.4s ease both' }}>
      <span style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: col }}>FIX THIS TODAY</span>
      <h3 style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: P, margin: '8px 0 6px', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{topFinding.title}</h3>
      {days > 0 && (
        <span style={{ fontFamily: fontB, fontSize: 12, fontWeight: 600, background: days > 14 ? '#fee2e2' : '#fef3c7', color: days > 14 ? '#ef4444' : '#d97706', padding: '4px 12px', borderRadius: 100, display: 'inline-block', margin: '0 0 12px' }}>
          Unresolved for {days} {days === 1 ? 'day' : 'days'}
        </span>
      )}
      <p style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(48,33,97,0.75)', lineHeight: 1.65, margin: '0 0 18px', ...({ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties) }}>
        {topFinding.explanation}
      </p>
      {topWin && (
        <div style={{ background: '#ede9fe', borderRadius: 12, padding: '16px 20px', marginBottom: 18 }}>
          <p style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: Pmuted, margin: '0 0 6px' }}>HOW TO FIX THIS</p>
          <p style={{ fontFamily: fontB, fontSize: 14, color: P, margin: '0 0 8px', lineHeight: 1.55 }}>{topWin.action}</p>
          <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 600, background: '#fef3c7', color: '#d97706', padding: '3px 10px', borderRadius: 100 }}>
            {topWin.timeline ?? 'Estimated: 15 minutes'}
          </span>
        </div>
      )}
      <button
        onClick={markDone}
        disabled={done || saving}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: done ? '#22c55e' : P, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontFamily: fontB, fontSize: 14, fontWeight: 600, cursor: done || saving ? 'default' : 'pointer', opacity: saving ? 0.75 : 1, transition: 'background 0.25s' }}>
        {done ? <><Check size={15} /> Fixed</> : saving ? 'Saving…' : 'Mark as Fixed'}
      </button>
    </div>
  )
}

// ─── Achievement Modal ────────────────────────────────────────────────────────

function AchievementModal({ achievement, onDismiss }: {
  achievement: { name: string; description: string; color: string; iconName: string }
  onDismiss: () => void
}) {
  const iconMap: Record<string, React.ReactNode> = {
    FileSearch: <FileSearch size={36} color="#fff" />,
    Zap:        <Zap size={36} color="#fff" />,
    Target:     <Target size={36} color="#fff" />,
    TrendingUp: <TrendingUp size={36} color="#fff" />,
    Brain:      <Brain size={36} color="#fff" />,
    BarChart2:  <BarChart2 size={36} color="#fff" />,
  }

  useEffect(() => {
    const t = setTimeout(onDismiss, 3500)
    import('canvas-confetti').then(mod => {
      mod.default({ particleCount: 100, spread: 80, origin: { y: 0.5 }, colors: [achievement.color, '#302161', '#fff'] })
    })
    return () => clearTimeout(t)
  }, [onDismiss, achievement.color])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onDismiss}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '40px 32px', maxWidth: 360, width: '100%', textAlign: 'center', animation: 'fadeUp 0.35s ease both' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: achievement.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          {iconMap[achievement.iconName] ?? <Star size={36} color="#fff" />}
        </div>
        <p style={{ fontFamily: fontB, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: achievement.color, margin: '0 0 8px' }}>Achievement Unlocked</p>
        <h2 style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: P, margin: '0 0 8px', letterSpacing: '-0.02em' }}>{achievement.name}</h2>
        <p style={{ fontFamily: fontB, fontSize: 15, color: Pmuted, margin: '0 0 24px', lineHeight: 1.6 }}>{achievement.description}</p>
        <button onClick={onDismiss}
          style={{ background: P, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 24px', fontFamily: fontB, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Keep going
        </button>
      </div>
    </div>
  )
}

// ─── Get It Done card ─────────────────────────────────────────────────────────

function GetItDoneCard({ tier, onBook, onUpgrade }: { tier: string; onBook: () => void; onUpgrade?: () => void }) {
  const isAgency = tier === 'agency'
  const pills = [
    { icon: <CheckCircle size={20} color="#fff" />, text: 'We review your diagnostic before the session — no briefing needed' },
    { icon: <Target     size={20} color="#fff" />, text: 'We implement your top 3 fixes with you live on the call' },
    { icon: <TrendingUp size={20} color="#fff" />, text: 'Follow-up report 30 days later to measure improvement' },
  ]
  return (
    <div style={{
      background: 'linear-gradient(135deg,#302161 0%,#4c1d95 100%)',
      borderRadius: 20, animation: 'fadeUp 0.4s ease both', animationDelay: '230ms',
    }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-0"
    >
      {/* Left */}
      <div style={{ padding: 'clamp(28px,4vw,36px) clamp(24px,5vw,40px)' }}>
        <span style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '4px 12px', borderRadius: 100, display: 'inline-block', marginBottom: 14 }}>
          Agency Feature
        </span>
        <h3 style={{ fontFamily: font, fontSize: 'clamp(18px,2.5vw,22px)', fontWeight: 700, color: '#fff', margin: '0 0 14px', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
          Don&apos;t have time to fix this yourself?
        </h3>
        <p style={{ fontFamily: fontB, fontSize: 15, color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, margin: '0 0 24px' }}>
          Hand your diagnostic over to one of our media buyers. We show up already knowing your ICP score, your biggest leak, and your waste estimate. You just show up and make decisions.
        </p>
        {isAgency ? (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={onBook} style={{ fontFamily: font, fontWeight: 600, fontSize: 14, background: '#fff', color: P, border: 'none', borderRadius: 12, padding: '14px 28px', cursor: 'pointer', letterSpacing: '-0.2px' }}>
              Book a Strategy Session →
            </button>
            <a href="#get-it-done-features" style={{ fontFamily: font, fontWeight: 600, fontSize: 14, color: '#fff', background: 'transparent', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 12, padding: '14px 28px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              See what&apos;s included
            </a>
          </div>
        ) : (
          <div>
            <p style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: '0 0 16px', lineHeight: 1.6 }}>
              Upgrade to Agency to unlock strategy sessions with our media buyers.
            </p>
            <button onClick={onUpgrade} style={{ fontFamily: font, fontWeight: 600, fontSize: 14, background: '#fff', color: P, border: 'none', borderRadius: 12, padding: '14px 28px', cursor: 'pointer', display: 'inline-block' }}>
              See Agency Plan →
            </button>
          </div>
        )}
      </div>
      {/* Right */}
      <div id="get-it-done-features" style={{ padding: 'clamp(28px,4vw,36px) clamp(24px,5vw,40px)', display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
        {pills.map((pill, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, marginTop: 2 }}>{pill.icon}</div>
            <p style={{ fontFamily: fontB, fontSize: 14, color: '#fff', margin: 0, lineHeight: 1.55 }}>{pill.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Booking modal ─────────────────────────────────────────────────────────────

type BookingState = 'form' | 'submitting' | 'success'

function BookingModal({
  user, diag, score, onClose,
}: {
  user: UserData; diag: DiagnosisData; score: number | null; onClose: () => void
}) {
  const [format,  setFormat]  = useState<'Video Call' | 'Voice Call' | 'Async Review'>('Video Call')
  const [time,    setTime]    = useState('')
  const [notes,   setNotes]   = useState('')
  const [step,    setStep]    = useState<BookingState>('form')

  const findings  = getFindings(diag)
  const topFinding = findings[0]?.title ?? '—'
  const waste      = diag.monthly_waste_estimate ?? '—'

  const brief = [
    { label: 'ICP Health Score',         value: score !== null ? `${score}/100` : '—' },
    { label: 'Estimated Monthly Waste',  value: waste },
    { label: 'Top Priority',             value: topFinding },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStep('submitting')
    try {
      await fetch('/api/session-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail:     user.email,
          userName:      user.full_name ?? user.email,
          companyName:   user.company_name ?? '',
          sessionFormat: format,
          preferredTime: time,
          notes,
          diagnostic:    { score, waste, topFinding },
        }),
      })
      setStep('success')
    } catch {
      setStep('form')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 'clamp(28px,5vw,40px)', maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(48,33,97,0.4)', padding: 4 }}>
          <X size={20} />
        </button>

        {step === 'success' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'fadeUp 0.4s ease both' }}>
              <Check size={28} color="#16a34a" strokeWidth={3} />
            </div>
            <h2 style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: P, margin: '0 0 12px', letterSpacing: '-0.02em' }}>Session request received.</h2>
            <p style={{ fontFamily: fontB, fontSize: 15, color: 'rgba(48,33,97,0.65)', lineHeight: 1.7, margin: '0 0 8px' }}>
              We will confirm your booking within 2 business hours via email.
            </p>
            <p style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(48,33,97,0.5)', lineHeight: 1.6, margin: '0 0 28px' }}>
              Your media buyer will review your diagnostic before the session.
            </p>
            <button onClick={onClose} style={{ fontFamily: font, fontWeight: 600, fontSize: 14, background: P, color: '#fff', border: 'none', borderRadius: 12, padding: '13px 28px', cursor: 'pointer' }}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 style={{ fontFamily: font, fontSize: 'clamp(20px,3vw,24px)', fontWeight: 700, color: P, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Book Your Strategy Session
            </h2>
            <p style={{ fontFamily: fontB, fontSize: 15, color: 'rgba(48,33,97,0.6)', margin: '0 0 24px', lineHeight: 1.6 }}>
              Your diagnostic report will be shared with your media buyer before the session. Come ready to make decisions.
            </p>

            {/* Brief */}
            <div style={{ background: BgAlt, borderRadius: 12, padding: '18px 22px', marginBottom: 24 }}>
              <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(48,33,97,0.5)', margin: '0 0 14px' }}>Your Session Brief</p>
              {brief.map(b => (
                <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: P, flexShrink: 0 }} />
                  <span style={{ fontFamily: fontB, fontSize: 14, color: P }}>
                    <strong style={{ fontWeight: 600 }}>{b.label}:</strong> {b.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Format */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: fontB, fontSize: 13, fontWeight: 600, color: P, margin: '0 0 10px' }}>How would you like to meet?</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['Video Call', 'Voice Call', 'Async Review'] as const).map(f => (
                  <button key={f} type="button" onClick={() => setFormat(f)}
                    style={{ fontFamily: fontB, fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                      background: format === f ? P : '#fff',
                      color:      format === f ? '#fff' : P,
                      border:     `1.5px solid ${format === f ? P : 'rgba(48,33,97,0.2)'}`,
                    }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Time */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: fontB, fontSize: 13, fontWeight: 600, color: P, margin: '0 0 8px' }}>When works for you?</p>
              <input type="text" value={time} onChange={e => setTime(e.target.value)}
                placeholder="e.g. Weekdays after 3pm EAT"
                style={{ width: '100%', fontFamily: fontB, fontSize: 14, color: P, background: '#fff', border: '1px solid rgba(48,33,97,0.18)', borderRadius: 10, padding: '12px 16px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontFamily: fontB, fontSize: 13, fontWeight: 600, color: P, margin: '0 0 8px' }}>Anything specific you want us to focus on?</p>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Optional — any context that would help us prepare"
                style={{ width: '100%', fontFamily: fontB, fontSize: 14, color: P, background: '#fff', border: '1px solid rgba(48,33,97,0.18)', borderRadius: 10, padding: '12px 16px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <button type="submit" disabled={step === 'submitting'}
              style={{ width: '100%', fontFamily: font, fontWeight: 600, fontSize: 15, background: P, color: '#fff', border: 'none', borderRadius: 12, padding: 16, cursor: step === 'submitting' ? 'wait' : 'pointer', opacity: step === 'submitting' ? 0.75 : 1 }}>
              {step === 'submitting' ? 'Sending request…' : 'Request Session →'}
            </button>
          </form>
        )}
      </div>
    </div>
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

function FirstRunDashboard({ user }: { user: UserData }) {
  const firstName  = user.full_name?.split(' ')[0] ?? null
  const isNewUser  = daysBetween(user.created_at) <= 1
  const reveals = [
    { icon: <Zap size={18} color={P} />,         title: 'ICP Health Score',    body: 'A 0–100 score showing how well your targeting matches your best buyers.' },
    { icon: <AlertCircle size={18} color={P} />, title: 'Monthly Waste Estimate', body: 'How much budget is leaking to audiences that will never convert.' },
    { icon: <Check size={18} color={P} />,       title: '3 Quick Wins',         body: 'Specific, ranked actions you can implement this week to improve your score.' },
    { icon: <Target size={18} color={P} />,      title: 'Landing Page Review',  body: 'AI assessment of your page against your ICP and what to fix first.' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp 0.4s ease both' }}>

      {/* Hero CTA — full-width, impossible to miss */}
      <div style={{
        background: 'linear-gradient(135deg,#302161 0%,#4c1d95 100%)',
        borderRadius: 20, padding: 'clamp(28px,5vw,48px) clamp(24px,5vw,52px)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 28 }}>
          <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)' }}>
            {isNewUser ? 'Welcome to ICP Brand' : 'Step 1 of 3'}
          </span>
          <h2 style={{ fontFamily: font, fontSize: 'clamp(22px,4vw,32px)', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {firstName ? `${firstName}, where is your ad budget actually going?` : 'Where is your ad budget actually going?'}
          </h2>
          <p style={{ fontFamily: fontB, fontSize: 15, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.65, maxWidth: 520 }}>
            Most B2B teams waste 30–60% of their budget targeting people who will never buy. Your ICP diagnostic finds the leak, scores your targeting, and gives you a ranked fix list. Takes 5 minutes.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <Link href="/questionnaire"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: P, textDecoration: 'none', fontFamily: font, fontWeight: 700, fontSize: 15, padding: '15px 28px', borderRadius: 12, letterSpacing: '-0.2px' }}>
            Run My First Diagnosis <ArrowRight size={15} />
          </Link>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[['3 layers', '20 questions'], ['5 minutes', 'Instant results']].map(([a, b]) => (
              <div key={a} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Check size={13} color="rgba(255,255,255,0.5)" />
                <span style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{a}</span>
                <span style={{ fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>·</span>
                <span style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What your dashboard reveals after the diagnostic */}
      <div>
        <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: Pmuted, margin: '0 0 14px' }}>
          Unlocks after your first diagnosis
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reveals.map((r, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', border: `1.5px solid ${Pborder}`, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: BgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {r.icon}
              </div>
              <div>
                <p style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: P, margin: '0 0 4px' }}>{r.title}</p>
                <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: 0, lineHeight: 1.55 }}>{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress rail — shows where they are in the 3-step journey */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: `1.5px solid ${Pborder}` }}>
        <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: Pmuted, margin: '0 0 16px' }}>Your journey</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { step: 1, label: 'Run your first ICP diagnostic', done: false, active: true },
            { step: 2, label: 'Review findings and implement quick wins', done: false, active: false },
            { step: 3, label: 'Track your score improving over time', done: false, active: false },
          ].map(({ step, label, done, active }) => (
            <div key={step} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? '#22c55e' : active ? P : Pborder, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {done ? <Check size={13} color="#fff" /> : <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, color: active ? '#fff' : Pmuted }}>{step}</span>}
              </div>
              <p style={{ fontFamily: fontB, fontSize: 13, fontWeight: active ? 600 : 400, color: active ? P : Pmuted, margin: 0 }}>{label}</p>
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
        {user.scheduled_tier && user.scheduled_tier_date && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 100, padding: '4px 12px' }}>
            <AlertTriangle size={11} color="#fbbf24" />
            <span style={{ fontFamily: fontB, fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>
              Downgrade to {TIER_LABEL[user.scheduled_tier] ?? user.scheduled_tier} on {formatDate(user.scheduled_tier_date)}
            </span>
          </div>
        )}
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

const CANCEL_REASONS = [
  'Too expensive',
  'Not seeing value yet',
  'Campaign paused',
  'Using a different tool',
  'Just exploring',
  'Other',
]

const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    'Monthly ICP health check',
    'Top 3 critical findings',
    'Funnel friction score',
    'Quick wins report',
  ],
  pro: [
    'Everything in Starter',
    'Weekly performance snapshots',
    'CSV campaign analysis',
    'Benchmark comparisons',
    'Deep research reports',
    'Complete report history',
  ],
  agency: [
    'Everything in Pro',
    'Monthly strategy session',
    'Media buyer implementation',
    '30-day follow-up report',
    'Multi-client reporting',
    'White label reports',
    'Priority support',
    'Custom diagnostic frameworks',
  ],
}

type BillingRow = {
  id: string; date: string; plan: string
  amount_kes: number; status: 'paid' | 'failed' | 'pending'; invoice_url?: string
}

function CancellationModal({ user, score, reportCount, onClose, onCancelled, onUpgrade }: { user: UserData; score: number | null; reportCount: number; onClose: () => void; onCancelled: () => void; onUpgrade?: () => void }) {
  const [reason,   setReason]   = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleCancel() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email, reason: feedback ? `${reason} — ${feedback}` : reason }),
      })
      if (!res.ok) throw new Error('Request failed')
      onCancelled()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const showRetentionExpensive  = reason === 'Too expensive'
  const showRetentionNoValue    = reason === 'Not seeing value yet'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,15,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <p style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: P, margin: 0, letterSpacing: '-0.02em' }}>Cancel subscription</p>
            <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: '4px 0 0' }}>Help us understand why</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: Pmuted, padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Stats reminder */}
        <div style={{ background: BgAlt, border: `1px solid ${Pborder}`, borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
          <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: Pmuted, margin: '0 0 10px' }}>Your account at a glance</p>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <p style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: P, margin: 0 }}>{score ?? '—'}</p>
              <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, margin: '2px 0 0' }}>ICP Score</p>
            </div>
            <div>
              <p style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: P, margin: 0 }}>{reportCount}</p>
              <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, margin: '2px 0 0' }}>Diagnostics</p>
            </div>
            <div>
              <p style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: P, margin: 0 }}>{user.renewal_date ? formatDate(user.renewal_date) : '—'}</p>
              <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, margin: '2px 0 0' }}>Access until</p>
            </div>
          </div>
        </div>

        {/* Reason pills */}
        <p style={{ fontFamily: fontB, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: Pmuted, margin: '0 0 10px' }}>Reason for cancelling</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
          {CANCEL_REASONS.map(r => (
            <button key={r} onClick={() => setReason(r)}
              style={{ fontFamily: fontB, fontSize: 13, fontWeight: 500, padding: '7px 14px', borderRadius: 100, cursor: 'pointer', border: reason === r ? `1.5px solid ${P}` : `1.5px solid ${Pborder}`, background: reason === r ? P : '#fff', color: reason === r ? '#fff' : P, transition: 'all 0.15s' }}>
              {r}
            </button>
          ))}
        </div>

        {/* Retention: Too expensive */}
        {showRetentionExpensive && (
          <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 14, padding: '16px 18px', marginBottom: 18 }}>
            <p style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: P, margin: '0 0 4px' }}>Before you go — Starter plan is {convertAmount(6500, 'KES', 'KES')} / month</p>
            <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: '0 0 12px', lineHeight: 1.6 }}>Downgrade to Starter and keep running diagnostics at a fraction of the cost. No data is lost.</p>
            <button onClick={() => { onClose(); onUpgrade?.() }}
              style={{ fontFamily: fontB, fontSize: 13, fontWeight: 600, color: P, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
              See Starter plan →
            </button>
          </div>
        )}

        {/* Retention: Not seeing value */}
        {showRetentionNoValue && (
          <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 14, padding: '16px 18px', marginBottom: 18 }}>
            <p style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: P, margin: '0 0 4px' }}>Run one more diagnosis before you decide</p>
            <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: '0 0 12px', lineHeight: 1.6 }}>Most users see the biggest score jump on their second or third diagnostic. One more report could change everything.</p>
            <Link href="/questionnaire" onClick={onClose}
              style={{ fontFamily: fontB, fontSize: 13, fontWeight: 600, color: P, textDecoration: 'underline' }}>
              Run a new diagnosis →
            </Link>
          </div>
        )}

        {/* Optional feedback */}
        <textarea
          value={feedback} onChange={e => setFeedback(e.target.value)}
          placeholder="Anything else you want us to know? (optional)"
          rows={3}
          style={{ width: '100%', boxSizing: 'border-box', fontFamily: fontB, fontSize: 13, color: P, background: BgAlt, border: `1px solid ${Pborder}`, borderRadius: 10, padding: '10px 12px', resize: 'vertical', outline: 'none', marginBottom: 18 }}
        />

        {error && <p style={{ fontFamily: fontB, fontSize: 12, color: '#ef4444', margin: '0 0 12px' }}>{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onClose}
            style={{ background: P, border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 14, fontFamily: font, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
            Keep my subscription
          </button>
          <button onClick={handleCancel} disabled={!reason || loading}
            style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 0', fontSize: 13, fontFamily: fontB, fontWeight: 500, color: loading || !reason ? Pmuted : '#ef4444', cursor: reason && !loading ? 'pointer' : 'default', opacity: reason && !loading ? 1 : 0.5 }}>
            {loading ? 'Cancelling…' : 'Cancel anyway'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PauseModal({ user, onClose, onPaused }: { user: UserData; onClose: () => void; onPaused: (resumeDate: string) => void }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const priceKES = TIER_PRICE_KES[user.subscription_tier] ?? 0

  async function handlePause() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/subscription/pause', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email }),
      })
      if (!res.ok) throw new Error('failed')
      const { resumeDate } = await res.json()
      onPaused(resumeDate)
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,15,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', maxWidth: 440, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <p style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: P, margin: 0, letterSpacing: '-0.02em' }}>Pause for 1 month?</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: Pmuted, padding: 4 }}><X size={18} /></button>
        </div>
        <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: '0 0 20px', lineHeight: 1.7 }}>
          Your subscription will be paused for 30 days. You keep access to all your data and reports.
          We will not charge you this month. Your subscription resumes automatically after 30 days.
        </p>
        {priceKES > 0 && (
          <div style={{ background: BgAlt, border: `1px solid ${Pborder}`, borderRadius: 12, padding: '14px 18px', marginBottom: 20, textAlign: 'center' }}>
            <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>You will save this month</p>
            <p style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: P, margin: 0 }}>KES {priceKES.toLocaleString()}</p>
          </div>
        )}
        {error && <p style={{ fontFamily: fontB, fontSize: 12, color: '#ef4444', margin: '0 0 12px' }}>{error}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={handlePause} disabled={loading}
            style={{ background: P, border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 14, fontFamily: font, fontWeight: 600, color: '#fff', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Pausing…' : 'Confirm Pause'}
          </button>
          <button onClick={onClose}
            style={{ background: 'none', border: `1px solid ${Pborder}`, borderRadius: 12, padding: '12px 0', fontSize: 13, fontFamily: fontB, color: P, cursor: 'pointer' }}>
            Never mind
          </button>
        </div>
      </div>
    </div>
  )
}

function ChangePlanConfirmModal({ newTier, currentTier, renewalDate, onClose, onConfirmed }: {
  newTier: string; currentTier: string; renewalDate: string | null
  onClose: () => void; onConfirmed: () => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const label     = TIER_LABEL[newTier] ?? newTier
  const priceKES  = TIER_PRICE_KES[newTier] ?? 0
  const tierOrder = ['free', 'starter', 'pro', 'agency']
  const isUpgrade = tierOrder.indexOf(newTier) > tierOrder.indexOf(currentTier)

  const days = (() => {
    if (!renewalDate) return 0
    return Math.max(0, Math.ceil((new Date(renewalDate).getTime() - Date.now()) / 86_400_000))
  })()
  const topUpKes = (() => {
    const diff = priceKES - (TIER_PRICE_KES[currentTier] ?? 0)
    return Math.round((diff / 30) * days / 100) * 100
  })()
  const renewalLabel = renewalDate
    ? new Date(renewalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

  async function handleConfirm() {
    setLoading(true); setError('')
    try { await onConfirmed() }
    catch { setError('Something went wrong. Please try again.'); setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,15,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', maxWidth: 420, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <p style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: P, margin: 0, letterSpacing: '-0.02em' }}>
            {isUpgrade ? `Upgrade to ${label}?` : `Downgrade to ${label}?`}
          </p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: Pmuted, padding: 4 }}><X size={18} /></button>
        </div>

        <div style={{ background: BgAlt, border: `1px solid ${Pborder}`, borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {isUpgrade ? (
            <>
              <div>
                <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, margin: '0 0 2px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>New monthly rate</p>
                <p style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: P, margin: 0 }}>KES {priceKES.toLocaleString()} / month</p>
              </div>
              {!renewalDate ? (
                <div>
                  <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, margin: '0 0 2px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Billing starts</p>
                  <p style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: P, margin: 0 }}>Today, then monthly</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, margin: '0 0 2px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Prorated top-up due now</p>
                  <p style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: P, margin: 0 }}>
                    {topUpKes > 0 ? `KES ${topUpKes.toLocaleString()}` : 'None'}
                  </p>
                  {topUpKes > 0 && (
                    <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, margin: '3px 0 0', lineHeight: 1.4 }}>
                      Covers {days} remaining days. Full rate from {renewalLabel}.
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, margin: '0 0 2px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Charge today</p>
                <p style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: '#15803d', margin: 0 }}>None</p>
              </div>
              <div>
                <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, margin: '0 0 2px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Current features stay active until</p>
                <p style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: P, margin: 0 }}>{renewalLabel || '—'}</p>
              </div>
              <div>
                <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, margin: '0 0 2px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{label} billing starts</p>
                <p style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: P, margin: 0 }}>{renewalLabel || '—'}</p>
              </div>
            </>
          )}
        </div>

        {error && <p style={{ fontFamily: fontB, fontSize: 12, color: '#ef4444', margin: '0 0 12px' }}>{error}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={handleConfirm} disabled={loading}
            style={{ background: P, border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 14, fontFamily: font, fontWeight: 600, color: '#fff', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Confirming…' : isUpgrade ? 'Confirm Upgrade' : 'Confirm Downgrade'}
          </button>
          <button onClick={onClose}
            style={{ background: 'none', border: `1px solid ${Pborder}`, borderRadius: 12, padding: '12px 0', fontSize: 13, fontFamily: fontB, color: P, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── In-dashboard upgrade modal ──────────────────────────────────────────────

function InDashboardUpgradeModal({ user, onClose, onUpgraded }: {
  user: UserData
  onClose: () => void
  onUpgraded: (tier: string) => void
}) {
  const [loading,  setLoading]  = useState<string | null>(null)
  const [error,    setError]    = useState('')
  const [done,     setDone]     = useState<{ direction: string; tier: string; topUpKes?: number; effectiveDate?: string } | null>(null)

  const tierOrder  = ['free', 'starter', 'pro', 'agency']
  const currentIdx = tierOrder.indexOf(user.subscription_tier)

  // Proration helpers (mirrors server logic, for display only)
  function daysLeft(): number {
    if (!user.renewal_date) return 0
    const ms = new Date(user.renewal_date).getTime() - Date.now()
    return Math.max(0, Math.ceil(ms / 86_400_000))
  }
  function topUpFor(tier: string): number {
    const days = daysLeft()
    const diff = (TIER_PRICE_KES[tier] ?? 0) - (TIER_PRICE_KES[user.subscription_tier] ?? 0)
    return Math.round((diff / 30) * days / 100) * 100
  }
  function renewalLabel(): string {
    if (!user.renewal_date) return ''
    return new Date(user.renewal_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  async function handleChange(tier: string) {
    setLoading(tier); setError('')
    try {
      const res = await fetch('/api/subscription/change-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email, newTier: tier, oldTier: user.subscription_tier }),
      })
      const json = await res.json() as { direction?: string; topUpKes?: number; effectiveDate?: string; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'failed')
      setDone({ direction: json.direction ?? 'upgrade', tier, topUpKes: json.topUpKes, effectiveDate: json.effectiveDate })
      onUpgraded(json.direction === 'upgrade' ? tier : user.subscription_tier)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally { setLoading(null) }
  }

  const plans: { tier: 'starter' | 'pro' | 'agency'; popular?: boolean }[] = [
    { tier: 'starter' },
    { tier: 'pro', popular: true },
    { tier: 'agency' },
  ]

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,15,0.55)', zIndex: 1100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 560, maxHeight: '92dvh', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: Pborder }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 24px 16px' }}>
          <div>
            <p style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: P, margin: '0 0 2px', letterSpacing: '-0.02em' }}>Choose a plan</p>
            {user.renewal_date && (
              <p style={{ fontFamily: fontB, fontSize: 12, color: Pmuted, margin: 0 }}>
                Current period ends {renewalLabel()} ({daysLeft()} days left)
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ background: BgAlt, border: 'none', cursor: 'pointer', color: Pmuted, padding: 8, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Success confirmation */}
        {done && (
          <div style={{ margin: '0 16px 16px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '14px 16px' }}>
            {done.direction === 'upgrade' ? (
              <>
                <p style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: '#15803d', margin: '0 0 4px' }}>
                  Upgraded to {TIER_LABEL[done.tier]}. Features active now.
                </p>
                {(done.topUpKes ?? 0) > 0 && (
                  <p style={{ fontFamily: fontB, fontSize: 12, color: '#166534', margin: 0, lineHeight: 1.5 }}>
                    A prorated invoice of KES {done.topUpKes?.toLocaleString()} for the remaining {daysLeft()} days will be sent to you shortly.
                  </p>
                )}
              </>
            ) : (
              <>
                <p style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: '#15803d', margin: '0 0 4px' }}>
                  Downgrade scheduled for {done.effectiveDate ? new Date(done.effectiveDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : renewalLabel()}.
                </p>
                <p style={{ fontFamily: fontB, fontSize: 12, color: '#166534', margin: 0, lineHeight: 1.5 }}>
                  You keep your current {TIER_LABEL[user.subscription_tier]} features until then. No charge today.
                </p>
              </>
            )}
          </div>
        )}

        {error && (
          <div style={{ margin: '0 16px 12px', fontFamily: fontB, fontSize: 13, color: '#ef4444', background: '#fee2e2', borderRadius: 10, padding: '10px 14px' }}>{error}</div>
        )}

        {/* Plan rows */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px 20px' }}>
          {plans.map(({ tier, popular }) => {
            const idx        = tierOrder.indexOf(tier)
            const isCurrent  = tier === user.subscription_tier
            const isUpgrade  = idx > currentIdx
            const isDowngrade = idx < currentIdx
            const price      = TIER_PRICE_KES[tier]
            const features   = PLAN_FEATURES[tier] ?? []
            const topUp      = isUpgrade ? topUpFor(tier) : 0
            const days       = daysLeft()

            return (
              <div key={tier} style={{
                borderRadius: 14, padding: '14px 16px', marginBottom: 8,
                background: isCurrent ? BgAlt : '#fff',
                border: `1.5px solid ${isCurrent ? P + '30' : Pborder}`,
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {/* Left: plan info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                      <span style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: P }}>{TIER_LABEL[tier]}</span>
                      {popular && !isCurrent && (
                        <span style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, color: '#7c3aed', background: '#ede9fe', padding: '2px 7px', borderRadius: 100 }}>Popular</span>
                      )}
                      {isCurrent && (
                        <span style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, color: P, background: P + '15', padding: '2px 7px', borderRadius: 100 }}>Current</span>
                      )}
                    </div>
                    <p style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: P, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                      KES {price.toLocaleString()} <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 400, color: Pmuted }}>/ mo</span>
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {features.slice(0, 3).map(f => (
                        <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                          <Check size={11} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} />
                          <span style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, lineHeight: 1.35 }}>{f}</span>
                        </div>
                      ))}
                      {features.length > 3 && (
                        <span style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, marginTop: 1 }}>+{features.length - 3} more</span>
                      )}
                    </div>
                  </div>

                  {/* Right: action */}
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, paddingTop: 2 }}>
                    {isCurrent ? (
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: P + '12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={14} color={P} />
                      </div>
                    ) : (
                      <button
                        onClick={() => !done && handleChange(tier)}
                        disabled={loading !== null || !!done}
                        style={{
                          background: isUpgrade ? P : BgAlt, color: isUpgrade ? '#fff' : P,
                          border: 'none', borderRadius: 10, padding: '8px 14px',
                          fontFamily: fontB, fontSize: 12, fontWeight: 600,
                          cursor: (loading !== null || !!done) ? 'default' : 'pointer',
                          opacity: loading === tier ? 0.6 : 1,
                          whiteSpace: 'nowrap' as const,
                          transition: 'opacity 0.15s',
                        }}
                      >
                        {loading === tier ? '…' : isUpgrade ? 'Upgrade' : 'Downgrade'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Billing note under each non-current row */}
                {!isCurrent && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${Pborder}` }}>
                    {isUpgrade ? (
                      <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, margin: 0, lineHeight: 1.5 }}>
                        {!user.renewal_date
                          ? `Activates immediately. KES ${price.toLocaleString()} / month billed from today.`
                          : topUp > 0
                            ? `KES ${topUp.toLocaleString()} due now (prorated for ${days} days remaining), then KES ${price.toLocaleString()} / month from ${renewalLabel()}.`
                            : `Activates immediately. Next charge: KES ${price.toLocaleString()} on ${renewalLabel()}.`}
                      </p>
                    ) : isDowngrade ? (
                      <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, margin: 0, lineHeight: 1.5 }}>
                        {TIER_LABEL[user.subscription_tier]} features stay active until {renewalLabel() || 'your renewal date'}.{' '}
                        {TIER_LABEL[tier]} billing starts after that. No charge today.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, textAlign: 'center', margin: '0 24px 20px', lineHeight: 1.6 }}>
          Manage or cancel anytime from the Account tab.
        </p>
      </div>
    </div>
  )
}

function AccountTab({ user, currency, score, reportCount, onSignOut, onCancelled, onUserUpdate, showToast, onUpgrade }: {
  user: UserData; currency: string; score: number | null; reportCount: number
  onSignOut: () => void; onCancelled: () => void
  onUserUpdate: (u: Partial<UserData>) => void; showToast: (msg: string) => void
  onUpgrade?: () => void
}) {
  const [showChangePlan,       setShowChangePlan]       = useState(false)
  const [showPauseModal,       setShowPauseModal]       = useState(false)
  const [showCancelModal,      setShowCancelModal]      = useState(false)
  const [confirmPlan,          setConfirmPlan]          = useState<string | null>(null)
  const [billingHistory,       setBillingHistory]       = useState<BillingRow[]>([])
  const [billingLoading,       setBillingLoading]       = useState(true)
  const [showPaymentInfo,      setShowPaymentInfo]      = useState(false)

  const isCancelled = user.billing_status === 'cancelled'
  const isPaused    = user.billing_status === 'paused'
  const tierLabel   = TIER_LABEL[user.subscription_tier] ?? user.subscription_tier
  const priceKES    = TIER_PRICE_KES[user.subscription_tier] ?? 0

  useEffect(() => {
    fetch(`/api/subscription/billing-history?email=${encodeURIComponent(user.email)}`)
      .then(r => r.ok ? r.json() : { payments: [] })
      .then(j => setBillingHistory(j.payments ?? []))
      .catch(() => setBillingHistory([]))
      .finally(() => setBillingLoading(false))
  }, [user.email])

  async function handleChangePlan(newTier: string) {
    const res = await fetch('/api/subscription/change-plan', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail: user.email, newTier, oldTier: user.subscription_tier }),
    })
    const json = await res.json() as { direction?: string; topUpKes?: number; effectiveDate?: string; error?: string }
    if (!res.ok) throw new Error(json.error ?? 'failed')

    if (json.direction === 'upgrade') {
      onUserUpdate({ subscription_tier: newTier })
      const topUpMsg = (json.topUpKes ?? 0) > 0
        ? ` A prorated invoice of KES ${json.topUpKes?.toLocaleString()} will follow.`
        : ''
      showToast(`Upgraded to ${TIER_LABEL[newTier]}.${topUpMsg}`)
    } else {
      const switchDate = json.effectiveDate
        ? new Date(json.effectiveDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—'
      onUserUpdate({ scheduled_tier: newTier, scheduled_tier_date: json.effectiveDate })
      showToast(`Downgrade to ${TIER_LABEL[newTier]} scheduled for ${switchDate}.`)
    }

    setConfirmPlan(null)
    setShowChangePlan(false)
  }

  async function handleResume() {
    const res = await fetch('/api/subscription/resume', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail: user.email }),
    })
    if (!res.ok) return
    onUserUpdate({ billing_status: 'active', paused_until: null })
    showToast('Subscription resumed successfully.')
  }

  const renewalInfo = () => {
    if (isCancelled) return `Cancelled — access until ${user.renewal_date ? formatDate(user.renewal_date) : '—'}`
    if (isPaused)    return `Paused — resumes ${user.paused_until ? formatDate(user.paused_until) : '—'}`
    return user.renewal_date ? `Renews on ${formatDate(user.renewal_date)}` : '—'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 24, alignItems: 'start' }}>

      {/* ── LEFT: Profile + Sign out ────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Profile */}
        <Card style={{ padding: '24px 28px' }}>
          <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: Pmuted, margin: '0 0 14px' }}>Profile</p>
          {[
            { label: 'Full name', value: user.full_name ?? '—' },
            { label: 'Email',     value: user.email },
            { label: 'Company',   value: user.company_name ?? '—' },
          ].map((row, i, arr) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${Pborder}` : 'none' }}>
              <span style={{ fontFamily: fontB, fontSize: 13, color: Pmuted }}>{row.label}</span>
              <span style={{ fontFamily: fontB, fontSize: 13, fontWeight: 600, color: P, maxWidth: '55%', textAlign: 'right', wordBreak: 'break-all' }}>{row.value}</span>
            </div>
          ))}
        </Card>

        {/* Sign out */}
        <button onClick={onSignOut}
          style={{ background: BgAlt, border: `1px solid ${Pborder}`, borderRadius: 14, padding: 15, fontSize: 14, fontFamily: fontB, fontWeight: 500, color: Pmuted, cursor: 'pointer' }}>
          Sign out
        </button>
      </div>

      {/* ── RIGHT: Subscription & Billing ──────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontFamily: font, fontSize: 20, fontWeight: 700, color: P, margin: 0, letterSpacing: '-0.02em' }}>Subscription & Billing</p>

      {/* Card One: Current Plan */}
      <div style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 20, padding: '28px 32px' }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Left */}
          <div style={{ flex: '1 1 180px' }}>
            <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, background: isPaused ? '#0369a1' : P, color: '#fff', padding: '3px 12px', borderRadius: 100, display: 'inline-block', marginBottom: 12 }}>
              {isPaused ? 'Paused' : tierLabel}
            </span>
            <p style={{ fontFamily: font, fontSize: 20, fontWeight: 700, color: P, margin: '0 0 6px', letterSpacing: '-0.02em' }}>{tierLabel} Plan</p>
            <p style={{ fontFamily: font, fontSize: 32, fontWeight: 800, color: P, margin: '0 0 2px', lineHeight: 1 }}>
              {priceKES > 0 ? `KES ${priceKES.toLocaleString()}` : 'Free'}
            </p>
            {priceKES > 0 && <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: '0 0 10px' }}>per month</p>}
            <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: 0 }}>{renewalInfo()}</p>
          </div>
          {/* Right: actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 190 }}>
            {isCancelled ? (
              <button onClick={onUpgrade} style={{ display: 'block', width: '100%', textAlign: 'center', background: P, color: '#fff', fontFamily: fontB, fontWeight: 600, fontSize: 14, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
                Resubscribe →
              </button>
            ) : (
              <>
                <button onClick={() => setShowChangePlan(v => !v)}
                  style={{ background: P, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontFamily: fontB, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Change Plan
                </button>
                {isPaused ? (
                  <button onClick={handleResume}
                    style={{ background: '#fff', color: P, border: `1px solid ${P}`, borderRadius: 10, padding: '10px 20px', fontFamily: fontB, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                    Resume Now
                  </button>
                ) : (
                  <button onClick={() => setShowPauseModal(true)}
                    style={{ background: '#fff', color: P, border: `1px solid ${P}`, borderRadius: 10, padding: '10px 20px', fontFamily: fontB, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                    Pause for 1 Month
                  </button>
                )}
                {user.subscription_tier !== 'free' && (
                  <button onClick={() => setShowCancelModal(true)}
                    style={{ background: 'transparent', border: 'none', fontFamily: fontB, fontSize: 13, color: 'rgba(48,33,97,0.4)', cursor: 'pointer', textDecoration: 'underline', padding: '4px 0', textAlign: 'left' }}>
                    Cancel subscription
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pending downgrade notice */}
      {user.scheduled_tier && user.scheduled_tier_date && (
        <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: font, fontSize: 13, fontWeight: 700, color: '#92400e', margin: '0 0 2px' }}>
              Downgrade to {TIER_LABEL[user.scheduled_tier] ?? user.scheduled_tier} scheduled
            </p>
            <p style={{ fontFamily: fontB, fontSize: 12, color: '#b45309', margin: 0, lineHeight: 1.5 }}>
              Your current {TIER_LABEL[user.subscription_tier]} features stay active until{' '}
              {formatDate(user.scheduled_tier_date)}. After that, {TIER_LABEL[user.scheduled_tier] ?? user.scheduled_tier} billing begins.
            </p>
          </div>
        </div>
      )}

      {/* Change Plan Panel — slides open */}
      <div style={{ overflow: 'hidden', maxHeight: showChangePlan ? 900 : 0, opacity: showChangePlan ? 1 : 0, transition: 'max-height 0.35s ease, opacity 0.25s ease' }}>
        <div style={{ paddingTop: 4 }}>
          <p style={{ fontFamily: font, fontSize: 16, fontWeight: 600, color: P, margin: '0 0 16px', letterSpacing: '-0.01em' }}>Choose a plan</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
            {(['starter', 'pro', 'agency'] as const).map(t => {
              const isCurrent  = user.subscription_tier === t
              const tPrice     = TIER_PRICE_KES[t]
              const tFeatures  = PLAN_FEATURES[t]
              const isPopular  = t === 'pro' && !isCurrent
              const tLabel     = TIER_LABEL[t]
              const tiers      = ['free', 'starter', 'pro', 'agency']
              const isUpgrade  = tiers.indexOf(t) > tiers.indexOf(user.subscription_tier)
              const btnLabel   = isCurrent ? 'Current Plan' : isUpgrade ? `Upgrade to ${tLabel}` : `Switch to ${tLabel}`
              return (
                <div key={t} style={{ background: '#fff', border: isCurrent ? `2px solid ${P}` : '1px solid rgba(48,33,97,0.10)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ minHeight: 22 }}>
                    {isCurrent && <span style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, background: P, color: '#fff', padding: '2px 10px', borderRadius: 100 }}>Current Plan</span>}
                    {isPopular && <span style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, background: '#d946ef', color: '#fff', padding: '2px 10px', borderRadius: 100 }}>Most Popular</span>}
                  </div>
                  <div>
                    <p style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: P, margin: '0 0 4px' }}>{tLabel}</p>
                    <p style={{ fontFamily: fontB, fontSize: 14, fontWeight: 600, color: P, margin: 0 }}>KES {tPrice.toLocaleString()}/mo</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    {tFeatures.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                        <Check size={12} color={P} style={{ marginTop: 3, flexShrink: 0 }} />
                        <span style={{ fontFamily: fontB, fontSize: 12, color: P, lineHeight: 1.4 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button disabled={isCurrent} onClick={() => !isCurrent && setConfirmPlan(t)}
                    style={{ background: isCurrent ? P : 'transparent', color: isCurrent ? '#fff' : P, border: isCurrent ? 'none' : `1px solid ${P}`, borderRadius: 10, padding: '9px 0', fontFamily: fontB, fontSize: 13, fontWeight: 600, cursor: isCurrent ? 'default' : 'pointer', opacity: isCurrent ? 0.5 : 1, marginTop: 4 }}>
                    {btnLabel}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Card Two: Billing History */}
      <div style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 20, padding: '28px 32px' }}>
        <p style={{ fontFamily: font, fontSize: 16, fontWeight: 600, color: P, margin: '0 0 18px', letterSpacing: '-0.01em' }}>Billing History</p>
        {billingLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2].map(i => <Skel key={i} style={{ height: 36 }} />)}
          </div>
        ) : billingHistory.length === 0 ? (
          <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, textAlign: 'center', margin: '12px 0' }}>No payments yet.</p>
        ) : (
          <>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: fontB, fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${Pborder}` }}>
                    {['Date', 'Plan', 'Amount', 'Status', 'Invoice'].map(h => (
                      <th key={h} style={{ fontWeight: 700, color: Pmuted, textAlign: 'left', padding: '8px 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((row, i) => (
                    <tr key={row.id ?? i} style={{ borderBottom: i < billingHistory.length - 1 ? `1px solid ${Pborder}` : 'none' }}>
                      <td style={{ padding: '12px 12px', color: P }}>{formatDate(row.date)}</td>
                      <td style={{ padding: '12px 12px' }}>
                        <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, background: P, color: '#fff', padding: '2px 10px', borderRadius: 100 }}>{TIER_LABEL[row.plan] ?? row.plan}</span>
                      </td>
                      <td style={{ padding: '12px 12px', color: P, fontWeight: 600 }}>KES {row.amount_kes.toLocaleString()}</td>
                      <td style={{ padding: '12px 12px' }}>
                        <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, background: row.status === 'paid' ? '#dcfce7' : row.status === 'failed' ? '#fee2e2' : '#fef3c7', color: row.status === 'paid' ? '#16a34a' : row.status === 'failed' ? '#ef4444' : '#d97706', padding: '2px 10px', borderRadius: 100 }}>
                          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        {row.invoice_url
                          ? <a href={row.invoice_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: P, textDecoration: 'none', fontWeight: 600 }}><FileDown size={13} />Download</a>
                          : <span style={{ color: Pmuted }}>—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button onClick={() => window.print()} style={{ background: 'none', border: 'none', fontFamily: fontB, fontSize: 12, color: P, cursor: 'pointer', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <FileDown size={13} /> Download all invoices
              </button>
            </div>
          </>
        )}
      </div>

      {/* Card Three: Payment Method */}
      <div style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 20, padding: '28px 32px' }}>
        <p style={{ fontFamily: font, fontSize: 16, fontWeight: 600, color: P, margin: '0 0 18px', letterSpacing: '-0.01em' }}>Payment Method</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ background: '#00c3f3', borderRadius: 8, padding: '4px 10px' }}>
            <span style={{ fontFamily: fontB, fontSize: 12, fontWeight: 700, color: '#fff' }}>Paystack</span>
          </div>
          <p style={{ fontFamily: fontB, fontSize: 13, fontWeight: 600, color: P, margin: 0 }}>Managed securely by Paystack</p>
        </div>
        <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: '0 0 18px', lineHeight: 1.6 }}>
          Your card details are stored securely by Paystack. We never see your full card number.
        </p>
        <button onClick={() => setShowPaymentInfo(v => !v)}
          style={{ background: '#fff', color: P, border: `1px solid ${P}`, borderRadius: 10, padding: '10px 20px', fontFamily: fontB, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          Update Payment Method
        </button>
        {showPaymentInfo && (
          <div style={{ background: BgAlt, border: `1px solid ${Pborder}`, borderRadius: 12, padding: '14px 16px', marginTop: 14 }}>
            <p style={{ fontFamily: fontB, fontSize: 13, color: P, margin: 0, lineHeight: 1.6 }}>
              To update your payment method, your next payment will prompt you to enter new card details. Alternatively reach us at <strong>hello@idealicp.com</strong>
            </p>
          </div>
        )}
      </div>

      </div>{/* end right column */}

      {/* Modals (outside columns so they overlay everything) */}
      {showPauseModal && (
        <PauseModal user={user} onClose={() => setShowPauseModal(false)}
          onPaused={resumeDate => {
            setShowPauseModal(false)
            onUserUpdate({ billing_status: 'paused', paused_until: resumeDate })
            showToast('Subscription paused. It will resume automatically in 30 days.')
          }}
        />
      )}
      {showCancelModal && (
        <CancellationModal user={user} score={score} reportCount={reportCount}
          onClose={() => setShowCancelModal(false)}
          onCancelled={() => { setShowCancelModal(false); onCancelled() }}
          onUpgrade={onUpgrade}
        />
      )}
      {confirmPlan && (
        <ChangePlanConfirmModal
          newTier={confirmPlan}
          currentTier={user.subscription_tier}
          renewalDate={user.renewal_date}
          onClose={() => setConfirmPlan(null)}
          onConfirmed={() => handleChangePlan(confirmPlan)}
        />
      )}
    </div>
  )
}

// ─── Intelligence tab ─────────────────────────────────────────────────────────

type MarketInsight = {
  id: string
  type: 'market_movement' | 'competitor_strategy' | 'opportunity' | 'platform_update'
  title: string
  body: string
  source?: string
  timeLabel: string
  implication?: string
  recommendation?: string
}

type IntelBenchmark = {
  name: string
  userValue: number | null
  industryAvg: number
  top10: number
  unit: string
  higherIsBetter: boolean
}

type CompetitorPos = { label: string; x: number; y: number }

type IntelligenceBriefing = {
  weekOf: string
  updatedAt: string
  insights: MarketInsight[]
  benchmarks: IntelBenchmark[]
  competitorPositions: CompetitorPos[]
  userPosition: { x: number; y: number }
}

function BenchmarkTrack({ name, userValue, industryAvg, top10, unit, higherIsBetter }: IntelBenchmark) {
  const vals = [userValue ?? industryAvg, industryAvg, top10].filter(v => v > 0)
  const lo   = Math.min(...vals) * (higherIsBetter ? 0.5 : 0.6)
  const hi   = Math.max(...vals) * (higherIsBetter ? 1.4 : 1.5)
  const span = hi - lo || 1

  function pos(v: number) { return Math.max(4, Math.min(96, ((v - lo) / span) * 100)) }

  const uPos = pos(userValue ?? industryAvg)
  const aPos = pos(industryAvg)
  const tPos = pos(top10)

  const fmt = (v: number) => unit === '%' ? `${v}%` : unit === '$' ? `$${v.toLocaleString()}` : `${unit}${v.toLocaleString()}`

  const DOTS = [
    { p: uPos, color: '#302161', label: fmt(userValue ?? industryAvg), name: 'You', size: 14 },
    { p: aPos, color: '#a855f7', label: fmt(industryAvg), name: 'Avg', size: 12 },
    { p: tPos, color: '#22c55e', label: fmt(top10), name: 'Top 10%', size: 12 },
  ]

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontFamily: "'PolySans Median', system-ui, sans-serif", fontSize: 15, fontWeight: 600, color: '#302161', marginBottom: 20 }}>{name}</div>
      <div style={{ position: 'relative', height: 52 }}>
        {/* Track */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 6, borderRadius: 3, background: higherIsBetter ? 'linear-gradient(90deg,#ef4444,#f59e0b,#22c55e)' : 'linear-gradient(90deg,#22c55e,#f59e0b,#ef4444)', transform: 'translateY(-50%)' }} />
        {/* Dots + labels */}
        {DOTS.map(d => (
          <div key={d.name} style={{ position: 'absolute', left: `${d.p}%`, top: '50%', transform: 'translate(-50%,-50%)' }}>
            <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 4, whiteSpace: 'nowrap', textAlign: 'center' }}>
              <div style={{ fontFamily: "'PolySans Neutral', system-ui, sans-serif", fontSize: 11, fontWeight: 700, color: d.color }}>{d.label}</div>
              <div style={{ fontFamily: "'PolySans Neutral', system-ui, sans-serif", fontSize: 10, color: 'rgba(48,33,97,0.4)' }}>{d.name}</div>
            </div>
            <div style={{ width: d.size, height: d.size, borderRadius: '50%', background: d.color, border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', position: 'relative', zIndex: 1 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function InsightCard({ insight }: { insight: MarketInsight }) {
  const iconConfig = {
    market_movement:     { icon: <TrendingUp size={16} color="#fff" />,  bg: insight.title.toLowerCase().includes('declin') || insight.title.toLowerCase().includes('drop') ? '#ef4444' : '#302161' },
    competitor_strategy: { icon: <Target size={16} color="#fff" />,      bg: '#a855f7' },
    opportunity:         { icon: <Zap size={16} color="#fff" />,         bg: '#f59e0b' },
    platform_update:     { icon: <Bell size={16} color="#fff" />,        bg: '#3b82f6' },
  }
  const cfg = iconConfig[insight.type]

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(48,33,97,0.08)', borderRadius: 16, padding: '20px 24px', marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {cfg.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
            <p style={{ fontFamily: "'PolySans Median', system-ui", fontSize: 14, fontWeight: 700, color: '#302161', margin: 0, lineHeight: 1.3 }}>{insight.title}</p>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {insight.source && <span style={{ fontFamily: "'PolySans Neutral', system-ui", fontSize: 10, fontWeight: 700, background: '#f8f7ff', color: 'rgba(48,33,97,0.6)', padding: '2px 8px', borderRadius: 100, whiteSpace: 'nowrap' }}>{insight.source}</span>}
              <span style={{ fontFamily: "'PolySans Neutral', system-ui", fontSize: 10, color: 'rgba(48,33,97,0.35)' }}>{insight.timeLabel}</span>
            </div>
          </div>
          <p style={{ fontFamily: "'PolySans Neutral', system-ui", fontSize: 13, color: 'rgba(48,33,97,0.6)', margin: 0, lineHeight: 1.6 }}>{insight.body}</p>
          {insight.implication && (
            <div style={{ marginTop: 10, background: '#f8f7ff', borderRadius: 8, padding: '8px 12px' }}>
              <span style={{ fontFamily: "'PolySans Neutral', system-ui", fontSize: 12, fontWeight: 700, color: '#302161' }}>What this means for you: </span>
              <span style={{ fontFamily: "'PolySans Neutral', system-ui", fontSize: 12, color: 'rgba(48,33,97,0.65)' }}>{insight.implication}</span>
            </div>
          )}
          {insight.recommendation && (
            <p style={{ fontFamily: "'PolySans Neutral', system-ui", fontSize: 12, fontWeight: 600, color: '#22c55e', margin: '8px 0 0' }}>→ {insight.recommendation}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function CompetitiveRadar({ userPos, competitors }: { userPos: { x: number; y: number }; competitors: CompetitorPos[] }) {
  const W = 480; const H = 320; const PAD = 48
  const toSVG = (x: number, y: number) => ({ cx: PAD + (x / 100) * (W - 2 * PAD), cy: H - PAD - (y / 100) * (H - 2 * PAD) })
  const midX = W / 2; const midY = H / 2

  const quadrants = [
    { x: midX, y: PAD,    w: W - midX - PAD, h: midY - PAD,    label: 'Market Leaders',                   color: 'rgba(34,197,94,0.06)' },
    { x: PAD,  y: PAD,    w: midX - PAD,     h: midY - PAD,    label: 'Targeting Well, Spending Poorly',  color: 'rgba(245,158,11,0.06)' },
    { x: midX, y: midY,   w: W - midX - PAD, h: H - midY - PAD, label: 'Spending Well, Targeting Poorly', color: 'rgba(245,158,11,0.06)' },
    { x: PAD,  y: midY,   w: midX - PAD,     h: H - midY - PAD, label: 'Needs Attention',                 color: 'rgba(239,68,68,0.06)' },
  ]
  const quadLabColors = ['#16a34a', '#d97706', '#d97706', '#ef4444']

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', borderRadius: 12, overflow: 'visible' }}>
      {/* Quadrant fills */}
      {quadrants.map((q, i) => <rect key={i} x={q.x} y={q.y} width={q.w} height={q.h} fill={q.color} />)}
      {/* Center lines */}
      <line x1={midX} y1={PAD} x2={midX} y2={H - PAD} stroke="rgba(48,33,97,0.1)" strokeWidth={1} strokeDasharray="4 3" />
      <line x1={PAD}  y1={midY} x2={W - PAD} y2={midY} stroke="rgba(48,33,97,0.1)" strokeWidth={1} strokeDasharray="4 3" />
      {/* Border */}
      <rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} fill="none" stroke="rgba(48,33,97,0.12)" strokeWidth={1} rx={4} />
      {/* Axis labels */}
      <text x={W / 2} y={H - 8}  textAnchor="middle" fill="rgba(48,33,97,0.45)" fontSize={11} fontFamily="sans-serif">Ad Spend Efficiency →</text>
      <text x={10}    y={H / 2}   textAnchor="middle" fill="rgba(48,33,97,0.45)" fontSize={11} fontFamily="sans-serif" transform={`rotate(-90,10,${H / 2})`}>ICP Alignment →</text>
      {/* Quadrant labels */}
      {quadrants.map((q, i) => (
        <text key={i} x={q.x + q.w / 2} y={q.y + q.h / 2} textAnchor="middle" fill={quadLabColors[i]} fontSize={10} fontFamily="sans-serif" fontWeight="600" opacity={0.8}>{q.label}</text>
      ))}
      {/* Competitor dots */}
      {competitors.map(c => {
        const { cx, cy } = toSVG(c.x, c.y)
        return (
          <g key={c.label}>
            <circle cx={cx} cy={cy} r={7} fill="rgba(160,160,180,0.5)" stroke="#fff" strokeWidth={1.5} />
            <text x={cx} y={cy - 11} textAnchor="middle" fill="rgba(48,33,97,0.5)" fontSize={9} fontFamily="sans-serif">{c.label}</text>
          </g>
        )
      })}
      {/* Industry avg */}
      {(() => { const { cx, cy } = toSVG(45, 45); return <g><circle cx={cx} cy={cy} r={9} fill="rgba(100,100,120,0.4)" stroke="#fff" strokeWidth={2} /><text x={cx} y={cy - 13} textAnchor="middle" fill="rgba(48,33,97,0.5)" fontSize={9} fontFamily="sans-serif">Industry Avg</text></g> })()}
      {/* User dot */}
      {(() => { const { cx, cy } = toSVG(userPos.x, userPos.y); return <g><circle cx={cx} cy={cy} r={13} fill="#302161" stroke="#fff" strokeWidth={2.5} /><text x={cx} y={cy + 4} textAnchor="middle" fill="#fff" fontSize={9} fontFamily="sans-serif" fontWeight="700">You</text></g> })()}
    </svg>
  )
}

function IntelligenceTab({ user, score, hasNewIntelligence, onUpgrade }: { user: UserData; score: number | null; hasNewIntelligence: boolean; onUpgrade?: () => void }) {
  const [briefing,        setBriefing]        = useState<IntelligenceBriefing | null>(null)
  const [loading,         setLoading]         = useState(true)
  const [refreshing,      setRefreshing]      = useState(false)
  const [nextRefresh,     setNextRefresh]     = useState<string | null>(null)
  const [rateLimitModal,  setRateLimitModal]  = useState<{ tier: string; nextAt: string; agencyLimit: boolean } | null>(null)
  const [question,        setQuestion]        = useState('')
  const [questionLoading, setQuestionLoading] = useState(false)
  const [answers,         setAnswers]         = useState<{ q: string; a: string; sources?: string[] }[]>([])
  const [qError,          setQError]          = useState('')
  const [, setTick]                           = useState(0)

  // Countdown tick — updates every 60s so displayed time stays fresh
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fetch('/api/intelligence/research', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, type: 'fetch' }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setBriefing(d.briefing); setNextRefresh(d.nextRefreshAvailable) } })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [user.email])

  async function handleRefresh() {
    const tier = user.subscription_tier
    if (tier === 'free') {
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    setRefreshing(true)
    try {
      const res = await fetch('/api/intelligence/research', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, type: 'refresh' }),
      })
      if (res.ok) {
        const d = await res.json()
        setBriefing(d.briefing)
        setNextRefresh(d.nextRefreshAvailable)
      } else if (res.status === 429) {
        const d = await res.json()
        setRateLimitModal({ tier: d.tier ?? tier, nextAt: d.nextRefreshAt, agencyLimit: d.upgradeAvailable === false })
        setNextRefresh(d.nextRefreshAt)
      }
    } catch { /* noop */ }
    finally { setRefreshing(false) }
  }

  async function handleQuestion(q: string) {
    if (!q.trim() || questionLoading) return
    setQuestionLoading(true); setQError(''); setQuestion('')
    try {
      const res = await fetch('/api/intelligence/research', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, type: 'question', question: q }),
      })
      if (!res.ok) throw new Error('failed')
      const d = await res.json()
      setAnswers(prev => [{ q, a: d.answer, sources: d.sources }, ...prev])
    } catch { setQError('Something went wrong. Please try again.') }
    finally { setQuestionLoading(false) }
  }

  const SUGGESTED = [
    'What CPCs should I expect in my region?',
    'What landing page patterns work in my industry?',
    'What are top performers spending on?',
    'What platforms dominate my ICP?',
  ]

  const font  = "'PolySans Median', -apple-system, system-ui, sans-serif"
  const fontB = "'PolySans Neutral', -apple-system, system-ui, sans-serif"
  const P     = '#302161'
  const Pmuted  = 'rgba(48,33,97,0.45)'
  const Pborder = 'rgba(48,33,97,0.08)'
  const BgAlt   = '#f8f7ff'

  const tier = user.subscription_tier as 'free' | 'starter' | 'pro' | 'agency'

  const msRemaining   = nextRefresh ? Math.max(0, new Date(nextRefresh).getTime() - Date.now()) : 0
  const hoursLeft     = Math.floor(msRemaining / 3_600_000)
  const minsLeft      = Math.ceil((msRemaining % 3_600_000) / 60_000)
  const canRefresh    = !nextRefresh || msRemaining === 0

  const TIER_BADGE: Record<string, { label: string; color: string; icon: JSX.Element }> = {
    starter: { label: 'Starter: 1 refresh per week',   color: '#d97706', icon: <Clock size={12} /> },
    pro:     { label: 'Pro: 1 refresh per day',         color: P,         icon: <Clock size={12} /> },
    agency:  { label: 'Agency: 3 refreshes per day',    color: '#22c55e', icon: <Zap  size={12} /> },
  }
  const tierBadge = TIER_BADGE[tier]

  // ── Q&A card (shared between columns) ────────────────────────────────
  const QACard = (
    <div style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 8px rgba(48,33,97,0.04)' }}>
      <p style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: P, margin: '0 0 4px', letterSpacing: '-0.02em' }}>Ask your market.</p>
      <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: '0 0 16px' }}>Ask anything about your market or competitive landscape.</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
        {SUGGESTED.map(q => (
          <button key={q} onClick={() => handleQuestion(q)}
            style={{ fontFamily: fontB, fontSize: 11, color: P, background: BgAlt, border: `1px solid ${Pborder}`, borderRadius: 100, padding: '5px 12px', cursor: 'pointer' }}>
            {q}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleQuestion(question)}
          placeholder="Ask anything about your market…"
          style={{ flex: 1, fontFamily: fontB, fontSize: 13, color: P, background: BgAlt, border: `1px solid ${Pborder}`, borderRadius: 10, padding: '10px 14px', outline: 'none' }}
        />
        <button onClick={() => handleQuestion(question)} disabled={!question.trim() || questionLoading}
          style={{ background: P, border: 'none', borderRadius: 10, padding: '0 16px', cursor: question.trim() && !questionLoading ? 'pointer' : 'default', opacity: question.trim() && !questionLoading ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {questionLoading
            ? <RefreshCw size={16} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
            : <Send size={16} color="#fff" />
          }
        </button>
      </div>
      {qError && <p style={{ fontFamily: fontB, fontSize: 12, color: '#ef4444', margin: '8px 0 0' }}>{qError}</p>}

      {answers.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {answers.map((a, i) => (
            <div key={i} style={{ background: BgAlt, border: `1px solid ${Pborder}`, borderRadius: 12, padding: '16px 18px' }}>
              <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, color: Pmuted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Your question</p>
              <p style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: P, margin: '0 0 10px' }}>{a.q}</p>
              <p style={{ fontFamily: fontB, fontSize: 13, color: P, margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{a.a}</p>
              {a.sources && a.sources.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {a.sources.map(s => (
                    <span key={s} style={{ fontFamily: fontB, fontSize: 10, background: 'rgba(48,33,97,0.08)', color: Pmuted, padding: '2px 8px', borderRadius: 100 }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      {hasNewIntelligence && (
        <div style={{ background: 'linear-gradient(135deg,#302161 0%,#4c1d95 100%)', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Bell size={16} color="#fff" />
          <span style={{ fontFamily: fontB, fontSize: 13, fontWeight: 600, color: '#fff' }}>New market intelligence is available since your last visit.</span>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-[65%_35%]" style={{ gap: 24, alignItems: 'start' }}>

      {/* ── Rate limit modal ───────────────────────────────────────────────── */}
      {rateLimitModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px 36px', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <Clock size={28} color={P} />
              <button onClick={() => setRateLimitModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={18} color={Pmuted} />
              </button>
            </div>
            {rateLimitModal.agencyLimit ? (
              <>
                <p style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: P, margin: '0 0 8px' }}>All 3 refreshes used today.</p>
                <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: '0 0 24px', lineHeight: 1.6 }}>
                  Your next refresh is available at midnight.
                </p>
                <button onClick={() => setRateLimitModal(null)}
                  style={{ width: '100%', background: P, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontFamily: fontB, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Got it
                </button>
              </>
            ) : (
              <>
                <p style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: P, margin: '0 0 8px' }}>Refresh not available yet.</p>
                <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: '0 0 8px', lineHeight: 1.6 }}>
                  Want more frequent intelligence updates? Agency subscribers refresh up to 3 times per day.
                </p>
                <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: '0 0 24px' }}>
                  Next available: {new Date(rateLimitModal.nextAt).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { setRateLimitModal(null); onUpgrade?.() }}
                    style={{ flex: 1, background: P, color: '#fff', borderRadius: 12, padding: '12px 0', fontFamily: fontB, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', textAlign: 'center' as const }}>
                    Upgrade to Agency
                  </button>
                  <button onClick={() => setRateLimitModal(null)}
                    style={{ flex: 1, background: 'none', color: P, border: `1px solid ${Pborder}`, borderRadius: 12, padding: '12px 0', fontFamily: fontB, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    I will wait
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── LEFT COLUMN: briefing header + benchmarks + feed ─────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Weekly Briefing header card */}
        <div style={{ background: 'linear-gradient(135deg,#302161 0%,#4c1d95 100%)', borderRadius: 20, padding: 'clamp(24px,4vw,36px) clamp(20px,5vw,40px)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'space-between', alignItems: 'center', marginBottom: tierBadge || !canRefresh ? 16 : 0 }}>
            <div>
              <span style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '3px 12px', borderRadius: 100, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'inline-block', marginBottom: 12 }}>
                Weekly Intelligence Briefing
              </span>
              <h2 style={{ fontFamily: font, fontSize: 'clamp(20px,3vw,26px)', fontWeight: 700, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Your market this week.</h2>
              <p style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                {briefing?.updatedAt
                  ? `Updated ${new Date(briefing.updatedAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`
                  : 'No briefing yet'}
              </p>
            </div>

            {/* Refresh button — 4 states */}
            {tier === 'free' ? (
              <button onClick={handleRefresh}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(248,247,255,0.12)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '11px 22px', fontFamily: fontB, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <Lock size={14} />
                Upgrade for on-demand refresh
              </button>
            ) : refreshing ? (
              <button disabled
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: P, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 22px', fontFamily: fontB, fontSize: 13, fontWeight: 600, cursor: 'default', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                Researching your market...
              </button>
            ) : canRefresh ? (
              <button onClick={handleRefresh}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', color: P, border: 'none', borderRadius: 12, padding: '11px 22px', fontFamily: fontB, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <RefreshCw size={15} />
                Refresh Intelligence
              </button>
            ) : (
              <button disabled
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', border: 'none', borderRadius: 12, padding: '11px 22px', fontFamily: fontB, fontSize: 13, fontWeight: 600, cursor: 'default', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <Clock size={14} />
                {`Next refresh in ${hoursLeft}h ${minsLeft}m`}
              </button>
            )}
          </div>

          {/* Countdown display when rate-limited */}
          {!canRefresh && tier !== 'free' && (
            <div style={{ marginTop: 4 }}>
              <p style={{ fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '0 0 4px' }}>Research refreshes in:</p>
              <p style={{ fontFamily: font, fontSize: 24, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                {hoursLeft}h {minsLeft}m
              </p>
            </div>
          )}

          {/* Tier badge + upgrade nudge */}
          {tierBadge && (
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: fontB, fontSize: 11, fontWeight: 600, color: tierBadge.color, background: 'rgba(255,255,255,0.1)', border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 100, padding: '3px 10px' }}>
                {tierBadge.icon}
                {tierBadge.label}
              </span>
              {tier !== 'agency' && (
                <p style={{ fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                  Agency subscribers get 3 refreshes per day.{' '}
                  <button onClick={onUpgrade} style={{ color: '#a855f7', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: fontB, fontSize: 12 }}>Upgrade</button>
                </p>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[200, 160, 120].map(h => (
              <div key={h} className="animate-pulse" style={{ height: h, borderRadius: 16, background: 'rgba(48,33,97,0.06)' }} />
            ))}
          </div>
        ) : !briefing ? (
          <div style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 16, padding: '40px 28px', textAlign: 'center', boxShadow: '0 1px 8px rgba(48,33,97,0.04)' }}>
            <Brain size={32} color={Pmuted} style={{ marginBottom: 14 }} />
            <p style={{ fontFamily: font, fontSize: 17, fontWeight: 700, color: P, margin: '0 0 8px' }}>Your first briefing will be ready next Monday.</p>
            <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: '0 0 20px' }}>{"Can't wait? Click Refresh for an on-demand briefing now."}</p>
            <button onClick={handleRefresh} disabled={refreshing}
              style={{ background: P, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 22px', fontFamily: fontB, fontSize: 13, fontWeight: 600, cursor: refreshing ? 'default' : 'pointer', opacity: refreshing ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              {refreshing ? 'Researching…' : 'Get My Briefing Now'}
            </button>
          </div>
        ) : (
          <>
            {/* Benchmark Comparison */}
            <div style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 8px rgba(48,33,97,0.04)' }}>
              <p style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: P, margin: '0 0 4px', letterSpacing: '-0.02em' }}>How you compare.</p>
              <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: '0 0 24px' }}>Your metrics vs industry average vs top 10% performers.</p>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 16 }}>
                {[
                  { color: '#302161', label: 'You' },
                  { color: '#a855f7', label: 'Industry Avg' },
                  { color: '#22c55e', label: 'Top 10%' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
                    <span style={{ fontFamily: fontB, fontSize: 12, color: Pmuted }}>{l.label}</span>
                  </div>
                ))}
              </div>
              {briefing.benchmarks.map(b => <BenchmarkTrack key={b.name} {...b} />)}
            </div>

            {/* Competitor Activity Feed */}
            <div>
              <p style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: P, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{"What's moving in your market."}</p>
              <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: '0 0 16px' }}>Intelligence gathered for your industry and region this week.</p>
              {briefing.insights.map(ins => <InsightCard key={ins.id} insight={ins} />)}
            </div>
          </>
        )}

        {/* Q&A on mobile (hidden on lg) */}
        <div className="lg:hidden">
          {QACard}
        </div>
      </div>

      {/* ── RIGHT COLUMN: Ask + Radar (desktop only, sticky) ─────────────── */}
      <div className="hidden lg:block">
        <div style={{ position: 'sticky', top: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {QACard}

          {briefing && (
            <div style={{ background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 8px rgba(48,33,97,0.04)' }}>
              <p style={{ fontFamily: font, fontSize: 17, fontWeight: 700, color: P, margin: '0 0 4px', letterSpacing: '-0.02em' }}>Your competitive position.</p>
              <p style={{ fontFamily: fontB, fontSize: 12, color: Pmuted, margin: '0 0 20px' }}>Approximate positioning based on ICP alignment and ad spend efficiency.</p>
              <CompetitiveRadar userPos={briefing.userPosition} competitors={briefing.competitorPositions} />
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// ─── Chat Widget ──────────────────────────────────────────────────────────────

type ChatMsg = {
  id: string
  role: 'user' | 'assistant' | 'media_buyer'
  content: string
  timestamp: Date
}

function ChatWidget({ user, score, diag }: { user: UserData; score: number | null; diag: DiagnosisData }) {
  const [isOpen,          setIsOpen]          = useState(false)
  const [messages,        setMessages]        = useState<ChatMsg[]>([])
  const [input,           setInput]           = useState('')
  const [loading,         setLoading]         = useState(false)
  const [hasUnread,       setHasUnread]       = useState(!!(user.has_unread_reply))
  const [initialized,     setInitialized]     = useState(false)
  const [needsEscalation, setNeedsEscalation] = useState(false)
  const [showEscalation,  setShowEscalation]  = useState(false)
  const [urgency,         setUrgency]         = useState('')
  const [escalationNote,  setEscalationNote]  = useState('')
  const [escalating,      setEscalating]      = useState(false)
  const [escalated,       setEscalated]       = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)

  const font  = "'PolySans Median', -apple-system, system-ui, sans-serif"
  const fontB = "'PolySans Neutral', -apple-system, system-ui, sans-serif"

  const waste = diag?.monthly_waste_estimate ?? '—'
  const firstName = user.full_name?.split(' ')[0] ?? 'there'
  const findings  = getFindings(diag)

  const SUGGESTED = [
    `Why is my score ${score ?? '—'}?`,
    'How do I fix my top finding?',
    'Write ad copy for my ICP',
    'What should I do this week?',
  ]

  useEffect(() => {
    if (isOpen && !initialized) {
      const welcome: ChatMsg = {
        id: 'welcome',
        role: 'assistant',
        content: `Hi ${firstName}. I'm your ICP media buyer AI.\n\nI've read your full diagnostic — your score is ${score ?? '?'}/100 and you're losing an estimated ${waste} per month.\n\nWhat would you like to work on today?`,
        timestamp: new Date(),
      }
      setMessages([welcome])
      setInitialized(true)
      setHasUnread(false)
    }
    if (isOpen) {
      setHasUnread(false)
    }
  }, [isOpen, initialized, firstName, score, waste])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const autoResize = () => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 96) + 'px'
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const userMsg: ChatMsg = { id: Date.now() + 'u', role: 'user', content: text.trim(), timestamp: new Date() }
    const typingMsg: ChatMsg = { id: 'typing', role: 'assistant', content: '', timestamp: new Date() }
    setMessages(prev => [...prev, userMsg, typingMsg])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)

    const history = messages
      .filter(m => m.role !== 'media_buyer' && m.id !== 'typing')
      .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })) as { role: 'user' | 'assistant'; content: string }[]

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, message: text.trim(), conversationHistory: history }),
      })
      const data = await res.json()
      const reply = data.reply ?? 'Something went wrong. Please try again.'
      setMessages(prev => prev.filter(m => m.id !== 'typing').concat([{ id: Date.now() + 'a', role: 'assistant', content: reply, timestamp: new Date() }]))
      if (data.needsEscalation) setNeedsEscalation(true)
    } catch {
      setMessages(prev => prev.filter(m => m.id !== 'typing').concat([{ id: Date.now() + 'e', role: 'assistant', content: 'Connection error. Please try again.', timestamp: new Date() }]))
    } finally {
      setLoading(false)
    }
  }

  async function handleEscalate() {
    if (!urgency || escalating) return
    setEscalating(true)
    try {
      const transcript = messages
        .filter(m => m.id !== 'typing')
        .map(m => `${m.role === 'user' ? 'User' : m.role === 'media_buyer' ? 'Eugene' : 'AI'}: ${m.content}`)
        .join('\n')
      await fetch('/api/chat/escalate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, urgency, note: escalationNote, conversationHistory: transcript }),
      })
      setEscalated(true)
      setShowEscalation(false)
      const confirmMsg: ChatMsg = {
        id: Date.now() + 'confirm',
        role: 'assistant',
        content: `Request sent. Eugene will review your diagnostic and respond via this chat and email. You'll get a notification when he replies.`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, confirmMsg])
    } finally {
      setEscalating(false)
    }
  }

  function formatTime(d: Date) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const URGENCY_OPTIONS = ['Same day', 'Within 24h', 'This week']

  return (
    <>
      {/* ── Chat Panel ──────────────────────────────────────────────────── */}
      {isOpen && (
        <div style={{
          position: 'fixed', zIndex: 1000, overflow: 'hidden',
          background: '#fff',
          boxShadow: '0 8px 48px rgba(48,33,97,0.15)',
          display: 'flex', flexDirection: 'column',
          // mobile: full width, 70vh, bottom sheet
          bottom: 0, right: 0, left: 0,
          height: '70vh',
          borderRadius: '24px 24px 0 0',
        }} className="chat-panel-container">
          <style>{`
            @media (min-width: 1024px) {
              .chat-panel-container {
                width: 380px !important;
                height: 520px !important;
                border-radius: 24px !important;
                bottom: 100px !important;
                right: 32px !important;
                left: auto !important;
              }
            }
            @keyframes bounce-dot {
              0%, 80%, 100% { transform: translateY(0) }
              40% { transform: translateY(-6px) }
            }
          `}</style>

          {/* Header */}
          <div style={{ background: P, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BrainCircuit size={18} color={P} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: '#fff', margin: 0 }}>ICP Media Buyer</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Online</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: BgAlt, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {messages.map(msg => {
              const isUser       = msg.role === 'user'
              const isMediaBuyer = msg.role === 'media_buyer'
              const isTyping     = msg.id === 'typing'

              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 4 }}>
                  {isMediaBuyer && (
                    <span style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, paddingLeft: 4 }}>Eugene · Media Buyer</span>
                  )}

                  <div style={{
                    maxWidth: '85%',
                    background: isUser ? P : isMediaBuyer ? '#ede9fe' : '#fff',
                    color: isUser ? '#fff' : P,
                    borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    padding: '12px 16px',
                    fontSize: 14,
                    fontFamily: fontB,
                    lineHeight: 1.6,
                    boxShadow: '0 1px 4px rgba(48,33,97,0.08)',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {isTyping ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
                        {[0, 1, 2].map(i => (
                          <div key={i} style={{
                            width: 7, height: 7, borderRadius: '50%', background: Pmuted,
                            animation: 'bounce-dot 0.6s infinite',
                            animationDelay: `${i * 0.2}s`,
                          }} />
                        ))}
                      </div>
                    ) : msg.content}
                  </div>

                  {!isTyping && (
                    <span style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, paddingLeft: isUser ? 0 : 4, paddingRight: isUser ? 4 : 0 }}>
                      {formatTime(msg.timestamp)}
                    </span>
                  )}
                </div>
              )
            })}

            {/* Suggested pills — show after welcome message only */}
            {messages.length === 1 && messages[0].id === 'welcome' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {SUGGESTED.map(q => (
                  <button key={q} onClick={() => sendMessage(q)}
                    style={{ background: '#fff', border: `1px solid rgba(48,33,97,0.15)`, borderRadius: 100, padding: '8px 16px', fontFamily: fontB, fontSize: 13, color: P, cursor: 'pointer' }}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Escalation card */}
            {needsEscalation && !escalated && !showEscalation && (
              <div style={{ background: '#ede9fe', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserCheck size={18} color={P} />
                  <span style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: P }}>Connect with Eugene</span>
                </div>
                <p style={{ fontFamily: fontB, fontSize: 13, color: P, margin: 0, lineHeight: 1.6 }}>
                  {"I'll package this conversation and your diagnostic for Eugene to review. He typically responds within 24 hours for Pro subscribers and same-day for Agency subscribers."}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowEscalation(true)} style={{ flex: 1, background: P, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', fontFamily: fontB, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Request Human Review</button>
                  <button onClick={() => setNeedsEscalation(false)} style={{ flex: 1, background: 'transparent', color: P, border: `1px solid ${Pborder}`, borderRadius: 10, padding: '10px 0', fontFamily: fontB, fontSize: 13, cursor: 'pointer' }}>Keep chatting</button>
                </div>
              </div>
            )}

            {/* Escalation form */}
            {showEscalation && !escalated && (
              <div style={{ background: '#ede9fe', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontFamily: fontB, fontSize: 13, fontWeight: 700, color: P, margin: 0 }}>How urgent is this?</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {URGENCY_OPTIONS.map(u => (
                    <button key={u} onClick={() => setUrgency(u)}
                      style={{ background: urgency === u ? P : '#fff', color: urgency === u ? '#fff' : P, border: `1px solid ${urgency === u ? P : Pborder}`, borderRadius: 100, padding: '7px 14px', fontFamily: fontB, fontSize: 12, cursor: 'pointer' }}>
                      {u}
                    </button>
                  ))}
                </div>
                <textarea
                  value={escalationNote}
                  onChange={e => setEscalationNote(e.target.value)}
                  placeholder="Anything specific for Eugene? (optional)"
                  rows={2}
                  style={{ fontFamily: fontB, fontSize: 13, color: P, background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 10, padding: '10px 12px', resize: 'none', outline: 'none' }}
                />
                <button onClick={handleEscalate} disabled={!urgency || escalating}
                  style={{ background: P, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontFamily: fontB, fontSize: 13, fontWeight: 600, cursor: !urgency || escalating ? 'default' : 'pointer', opacity: !urgency || escalating ? 0.6 : 1 }}>
                  {escalating ? 'Sending…' : 'Send Request'}
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div style={{ background: '#fff', borderTop: `1px solid ${Pborder}`, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => { setInput(e.target.value); autoResize() }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
                }}
                placeholder="Ask anything about your marketing..."
                rows={1}
                style={{ flex: 1, fontFamily: fontB, fontSize: 14, color: P, background: BgAlt, border: `1px solid rgba(48,33,97,0.15)`, borderRadius: 12, padding: '10px 14px', outline: 'none', resize: 'none', lineHeight: 1.5 }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                style={{ width: 40, height: 40, borderRadius: '50%', background: P, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !loading ? 'pointer' : 'default', opacity: input.trim() && !loading ? 1 : 0.4, flexShrink: 0 }}>
                <ArrowUp size={18} color="#fff" />
              </button>
            </div>
            <button onClick={() => { setNeedsEscalation(true); setShowEscalation(true) }}
              style={{ background: 'none', border: 'none', fontFamily: fontB, fontSize: 12, color: 'rgba(48,33,97,0.4)', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
              Escalate to media buyer
            </button>
          </div>
        </div>
      )}

      {/* ── Floating button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(v => !v)}
        style={{
          position: 'fixed', bottom: 32, right: 32, zIndex: 1001,
          width: 56, height: 56, borderRadius: '50%',
          background: P,
          border: 'none',
          boxShadow: '0 4px 24px rgba(48,33,97,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transform: isOpen ? 'scale(0.95)' : 'scale(1)',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = isOpen ? 'scale(0.95)' : 'scale(1)' }}
      >
        <MessageCircle size={24} color="#fff" />
        {hasUnread && !isOpen && (
          <div style={{ position: 'absolute', top: 4, right: 4, width: 12, height: 12, borderRadius: '50%', background: '#ef4444', border: '2px solid #fff' }} />
        )}
      </button>
    </>
  )
}

export default function DashboardPage() {
  const router = useRouter()

  const [authStep, setAuthStep] = useState<'checking' | 'dashboard'>('checking')
  const [user,     setUser]     = useState<UserData | null>(null)
  const [reports,     setReports]     = useState<ReportRow[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [activeTab,   setActiveTab]   = useState<Tab>('overview')
  const [currency,    setCurrency]    = useState('KES')
  const [showModal,         setShowModal]         = useState(false)
  const [showUpgradeModal,  setShowUpgradeModal]  = useState(false)
  const [cancelToast, setCancelToast] = useState('')
  const [milestones,      setMilestones]      = useState<Milestone[]>([])
  const [streak,          setStreak]          = useState(0)
  const [newAchievement,  setNewAchievement]  = useState<{ name: string; description: string; color: string; iconName: string } | null>(null)

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

  const verifyEmail = useCallback(async (email: string) => {
    try {
      const res  = await fetch('/api/auth/check-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const json = await res.json() as { status?: string; user?: UserData }
      if (json.status === 'active' && json.user) {
        localStorage.setItem('dashboard_email', email)
        setUser(json.user); setAuthStep('dashboard'); loadReports(email)
      } else {
        localStorage.removeItem('dashboard_email')
        router.replace('/auth?tab=login')
      }
    } catch {
      router.replace('/auth?tab=login')
    }
  }, [router, loadReports])

  // Fallback for OAuth users: no localStorage key, but session cookie exists
  const verifySession = useCallback(async () => {
    try {
      const res  = await fetch('/api/auth/me')
      const json = await res.json() as { status?: string; user?: UserData }
      if (json.status === 'active' && json.user) {
        localStorage.setItem('dashboard_email', json.user.email)
        setUser(json.user); setAuthStep('dashboard'); loadReports(json.user.email)
      } else {
        router.replace('/auth?tab=login')
      }
    } catch {
      router.replace('/auth?tab=login')
    }
  }, [router, loadReports])

  useEffect(() => {
    const stored = localStorage.getItem('dashboard_email')
    if (stored) verifyEmail(stored)
    else verifySession()
  }, [verifyEmail, verifySession, router])

  useEffect(() => {
    if (!user?.email) return
    setStreak(user.current_streak ?? 0)
    const email = user.email
    void fetch(`/api/milestones?email=${encodeURIComponent(email)}`)
      .then(r => r.ok ? r.json() : { milestones: [] })
      .then((j: { milestones: Milestone[] }) => { setMilestones(j.milestones ?? []) }, () => {})
    void fetch('/api/milestones', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).then(() => {}, () => {})
    // Check achievements and surface any newly earned
    void fetch('/api/achievements/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
      .then(r => r.ok ? r.json() : null)
      .then((d: { newlyEarned?: string[] } | null) => {
        if (d?.newlyEarned && d.newlyEarned.length > 0) {
          const ACHIEVEMENT_DEFS_MAP: Record<string, { name: string; description: string; color: string; iconName: string }> = {
            first_diagnosis:     { name: 'First Diagnosis',     description: 'Completed your first ICP diagnostic',     color: '#302161', iconName: 'FileSearch' },
            quick_win:           { name: 'Quick Win',           description: 'Marked your first fix as complete',       color: '#f59e0b', iconName: 'Zap' },
            consistent:          { name: 'Consistent',          description: 'Completed 3 ICP diagnoses',               color: '#22c55e', iconName: 'Target' },
            score_climber:       { name: 'Score Climber',       description: 'Improved your ICP score by 10+ points',  color: '#a855f7', iconName: 'TrendingUp' },
            intelligence_reader: { name: 'Intelligence Reader', description: 'Viewed 5 weekly intelligence briefings', color: '#3b82f6', iconName: 'Brain' },
            csv_analyst:         { name: 'CSV Analyst',         description: 'Uploaded and analyzed campaign data',    color: '#f97316', iconName: 'BarChart2' },
          }
          const first = ACHIEVEMENT_DEFS_MAP[d.newlyEarned[0]]
          if (first) setNewAchievement(first)
        }
      }, () => {})
  }, [user?.email, user?.current_streak])

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    localStorage.removeItem('dashboard_email')
    localStorage.removeItem('dashboard_name')
    router.push('/auth')
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

  // ── Dashboard ────────────────────────────────────────────────────────────────
  const latestReport        = reports[0]
  const diag: DiagnosisData = latestReport ? parseDiagnosis(latestReport.report_summary) : {}
  const score               = getScore(diag)
  const hasReports          = reports.length >= 1
  const tierLabel           = user ? (TIER_LABEL[user.subscription_tier] ?? user.subscription_tier) : ''

  const hasNewIntelligence  = user ? (
    !user.last_seen_intelligence_at ||
    (Date.now() - new Date(user.last_seen_intelligence_at).getTime()) > 7 * 86_400_000
  ) : false

  const TAB_ICONS: Record<Tab, React.ReactNode> = {
    overview:     <LayoutDashboard size={20} />,
    intelligence: <Brain size={20} />,
    reports:      <FileText size={20} />,
    account:      <User size={20} />,
  }

  const TAB_LABELS: Record<Tab, string> = { overview: 'Overview', intelligence: 'Intelligence', reports: 'Reports', account: 'Account' }
  const userInitials = (user?.full_name ?? user?.email ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: BgAlt, fontFamily: fontB }}>
      <style>{`
        @keyframes spin        { to { transform: rotate(360deg) } }
        @keyframes fadeUp      { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideUp     { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes wastePulse  { 0%,100% { border-color: rgba(48,33,97,0.08) } 50% { border-color: #ef4444 } }
        .sidebar-nav-item:hover { background: #f8f7ff !important; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* ── LEFT SIDEBAR (desktop only) ───────────────────────────────────── */}
      <aside className="hidden lg:flex" style={{ position: 'fixed', top: 0, left: 0, width: 240, height: '100vh', background: '#fff', borderRight: `1px solid ${Pborder}`, flexDirection: 'column', zIndex: 40 }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${Pborder}` }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${P},#6c4ddd)`, flexShrink: 0 }} />
            <span style={{ fontFamily: font, fontWeight: 700, fontSize: 15, color: P }}>ICP Diagnostic</span>
          </Link>
        </div>

        {/* User section */}
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${Pborder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg,${P},#6c4ddd)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: '#fff' }}>{userInitials}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: fontB, fontSize: 13, fontWeight: 600, color: P, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.full_name ?? user?.email}
              </p>
              {user?.company_name && (
                <p style={{ fontFamily: fontB, fontSize: 11, color: Pmuted, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.company_name}</p>
              )}
              {tierLabel && (
                <span style={{ display: 'inline-block', marginTop: 4, fontFamily: fontB, fontSize: 10, fontWeight: 700, background: P, color: '#fff', padding: '2px 10px', borderRadius: 100 }}>{tierLabel}</span>
              )}
            </div>
          </div>
          {/* Milestone badge row */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {MILESTONE_DEFS.map(def => {
              const earned = milestones.find(m => m.key === def.key)?.earned ?? false
              return (
                <div key={def.key} title={earned ? def.name : def.unlock_hint}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: earned ? def.color + '20' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: earned ? 1 : 0.4, transition: 'opacity 0.2s', flexShrink: 0 }}>
                  <def.Icon size={14} color={earned ? def.color : '#9ca3af'} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
          {(['overview', 'intelligence', 'reports', 'account'] as Tab[]).map(tab => {
            const isActive = activeTab === tab
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} className="sidebar-nav-item"
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 2, textAlign: 'left', background: isActive ? '#ede9fe' : 'transparent', color: isActive ? P : 'rgba(48,33,97,0.6)', fontFamily: fontB, fontSize: 13, fontWeight: isActive ? 600 : 500, transition: 'background 0.12s' }}>
                <span style={{ position: 'relative', flexShrink: 0, display: 'flex' }}>
                  {TAB_ICONS[tab]}
                  {tab === 'intelligence' && hasNewIntelligence && (
                    <span style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', border: '1.5px solid #fff' }} />
                  )}
                </span>
                <span style={{ flex: 1 }}>{TAB_LABELS[tab]}</span>
                {tab === 'overview' && score !== null && (
                  <span style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, background: scoreLabelBg(score), color: scoreColor(score), padding: '2px 7px', borderRadius: 100, flexShrink: 0 }}>{score}</span>
                )}
                {tab === 'reports' && reports.length > 0 && (
                  <span style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, background: Pborder, color: Pmuted, padding: '2px 7px', borderRadius: 100, flexShrink: 0 }}>{reports.length}</span>
                )}
                {tab === 'intelligence' && hasNewIntelligence && (
                  <span style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, background: '#fee2e2', color: '#ef4444', padding: '2px 7px', borderRadius: 100, flexShrink: 0 }}>New</span>
                )}
                {tab === 'account' && user?.renewal_date && (() => {
                  const days = Math.ceil((new Date(user.renewal_date).getTime() - Date.now()) / 86_400_000)
                  return days > 0 && days <= 7 ? (
                    <span style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#d97706', padding: '2px 7px', borderRadius: 100, flexShrink: 0 }}>{days}d</span>
                  ) : null
                })()}
              </button>
            )
          })}

          <div style={{ margin: '12px 0', borderTop: `1px solid ${Pborder}` }} />

          <a href="mailto:hello@idealicp.com"
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', background: 'transparent', color: 'rgba(48,33,97,0.6)', fontFamily: fontB, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
            <HelpCircle size={18} />
            Help & Support
          </a>
          <button onClick={handleSignOut} className="sidebar-nav-item"
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', marginTop: 2, textAlign: 'left', background: 'transparent', color: 'rgba(48,33,97,0.6)', fontFamily: fontB, fontSize: 13, fontWeight: 500 }}>
            <LogOut size={18} />
            Sign out
          </button>
        </nav>

        {/* Currency selector at bottom */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${Pborder}` }}>
          <p style={{ fontFamily: fontB, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: Pmuted, margin: '0 0 8px' }}>Currency</p>
          <div style={{ position: 'relative' }}>
            <select value={currency} onChange={e => handleCurrencyChange(e.target.value)}
              style={{ width: '100%', appearance: 'none', WebkitAppearance: 'none', fontFamily: fontB, fontSize: 13, fontWeight: 600, color: P, background: BgAlt, border: `1px solid ${Pborder}`, borderRadius: 8, padding: '8px 32px 8px 12px', cursor: 'pointer', outline: 'none' }}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10, color: P }}>▾</span>
          </div>
        </div>
      </aside>

      {/* ── MOBILE TOP NAV (lg:hidden) ─────────────────────────────────────── */}
      <nav className="lg:hidden" style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${Pborder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, padding: '0 16px', gap: 10 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: `linear-gradient(135deg,${P},#6c4ddd)` }} />
            <span style={{ fontFamily: font, fontWeight: 700, fontSize: 14, color: P }}>ICP Diagnostic</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <select value={currency} onChange={e => handleCurrencyChange(e.target.value)}
                style={{ appearance: 'none', WebkitAppearance: 'none', fontFamily: fontB, fontSize: 12, fontWeight: 600, color: P, background: BgAlt, border: `1px solid ${Pborder}`, borderRadius: 100, padding: '5px 28px 5px 12px', cursor: 'pointer', outline: 'none' }}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 9, color: P }}>▾</span>
            </div>
            {tierLabel && (
              <span className="hidden sm:inline-block" style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, background: P, color: '#fff', padding: '3px 10px', borderRadius: 100 }}>{tierLabel}</span>
            )}
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────────── */}
      <div className="lg:ml-[240px]">
        {/* Desktop page header */}
        <div className="hidden lg:flex" style={{ alignItems: 'center', justifyContent: 'space-between', padding: '28px 40px 0', gap: 16 }}>
          <h1 style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: P, margin: 0, letterSpacing: '-0.02em' }}>{TAB_LABELS[activeTab]}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setActiveTab('overview')} style={{ display: 'flex', alignItems: 'center', gap: 7, background: P, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontFamily: fontB, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Zap size={14} /> Run New Diagnosis
            </button>
            <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: `1px solid ${Pborder}`, borderRadius: 10, width: 38, height: 38, cursor: 'pointer' }}>
              <Bell size={16} color={Pmuted} />
            </button>
          </div>
        </div>

        <div style={{ padding: 'clamp(20px,4vw,32px) clamp(14px,4vw,40px) 100px' }}>

        {/* Daily Brief — always visible when reports exist */}
        {!dataLoading && hasReports && user && (
          <div style={{ marginBottom: 24 }}>
            <DailyBriefCard
              diag={diag}
              reports={reports}
              score={score}
              hasIntelligence={hasNewIntelligence}
              onTabChange={setActiveTab}
            />
          </div>
        )}

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

            {!dataLoading && !hasReports && user && <FirstRunDashboard user={user} />}

            {!dataLoading && hasReports && user && (() => {
              const t         = user.subscription_tier
              const tierOrder = ['free', 'starter', 'pro', 'agency']
              const tierIdx   = tierOrder.indexOf(t)
              const isStarter = tierIdx >= 1
              const isPro     = tierIdx >= 2
              const daysSinceDiag = latestReport ? daysBetween(latestReport.generated_at) : 999

              return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Re-diagnosis nudge: score may have drifted if > 30 days */}
                {daysSinceDiag > 30 && (
                  <div style={{ background: 'linear-gradient(135deg,#302161 0%,#4c1d95 100%)', borderRadius: 16, padding: '18px 24px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <RefreshCw size={16} color="#fff" />
                      </div>
                      <div>
                        <p style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>
                          Your last diagnosis was {daysSinceDiag} days ago.
                        </p>
                        <p style={{ fontFamily: fontB, fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
                          Markets shift. A fresh diagnostic will show whether your ICP score has drifted.
                        </p>
                      </div>
                    </div>
                    <Link href="/questionnaire"
                      style={{ fontFamily: fontB, fontSize: 13, fontWeight: 600, background: '#fff', color: P, padding: '10px 20px', borderRadius: 10, textDecoration: 'none', whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
                      Run New Diagnosis →
                    </Link>
                  </div>
                )}

                {/* Real-time waste ticker */}
                <WasteTicker diag={diag} report={latestReport} currency={currency} />

                {/* Score + Streak */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ICPScoreCard diag={diag} reports={reports} />
                  <UpgradeGate requiredTier="starter" currentTier={t} feature="Fix Streak" description="Track your weekly implementation streak. Available on Starter and above." onUpgrade={() => setShowUpgradeModal(true)}>
                    <FixStreakWidget streak={streak} />
                  </UpgradeGate>
                </div>

                {/* Score Journey */}
                {score !== null && <ScoreJourneyWidget score={score} reports={reports} />}

                {/* Performance Breakdown — Pro+ */}
                {isPro && score !== null && (
                  <PerformanceBreakdownWidget diag={diag} score={score} delay={200} />
                )}
                {!isPro && score !== null && (
                  <UpgradeGate requiredTier="pro" currentTier={t} feature="Performance Breakdown" description="6-dimension score breakdown across targeting, landing page, budget allocation, and more." onUpgrade={() => setShowUpgradeModal(true)}>
                    <PerformanceBreakdownWidget diag={diag} score={score} delay={0} />
                  </UpgradeGate>
                )}

                {/* Priority action + Quick Wins checklist */}
                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
                  <TodaysPriorityCard diag={diag} report={latestReport} user={user} onComplete={setStreak} />
                  <div>
                    <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: Pmuted, margin: '0 0 14px' }}>THIS WEEK</p>
                    <EnhancedQuickWinsWidget diag={diag} user={user} onStreakUpdate={setStreak} maxWins={isStarter ? 3 : 1} />
                    {!isStarter && (
                      <div style={{ marginTop: 10, background: BgAlt, border: `1.5px dashed ${Pborder}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Lock size={13} color={Pmuted} />
                        <p style={{ fontFamily: fontB, fontSize: 12, color: Pmuted, margin: 0 }}>
                          2 more quick wins on <button onClick={() => setShowUpgradeModal(true)} style={{ color: P, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: fontB, fontSize: 12 }}>Starter</button>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Findings — Free sees max 2 */}
                <EnhancedFindingsSection diag={diag} report={latestReport} maxFindings={isStarter ? undefined : 2} onUpgrade={() => setShowUpgradeModal(true)} />

                {/* Milestones — Starter+ */}
                <UpgradeGate requiredTier="starter" currentTier={t} feature="Achievements" description="Unlock badges as you implement fixes, improve your score, and use the platform consistently." onUpgrade={() => setShowUpgradeModal(true)}>
                  <MilestonesSection milestones={milestones} />
                </UpgradeGate>

                {/* Score History — Starter+ */}
                <UpgradeGate requiredTier="starter" currentTier={t} feature="Score History" description="Track your ICP score trend across every diagnosis you run." onUpgrade={() => setShowUpgradeModal(true)}>
                  <ScoreHistoryWidget reports={reports} latestReport={latestReport} renewalDate={user.renewal_date ?? null} delay={0} />
                </UpgradeGate>

                {/* Campaign CSV — Pro+ */}
                <UpgradeGate requiredTier="pro" currentTier={t} feature="Campaign Data Analysis" description="Upload your Google Ads or Meta export for a media buyer breakdown of your actual spend." onUpgrade={() => setShowUpgradeModal(true)}>
                  <CampaignInsightsWidget delay={0} />
                </UpgradeGate>

                {/* Get It Done */}
                <GetItDoneCard tier={t} onBook={() => setShowModal(true)} onUpgrade={() => setShowUpgradeModal(true)} />
              </div>
              )
            })()}
          </>
        )}

        {activeTab === 'intelligence' && user && <IntelligenceTab user={user} score={score} hasNewIntelligence={hasNewIntelligence} onUpgrade={() => setShowUpgradeModal(true)} />}
        {activeTab === 'reports' && <ReportsTab reports={reports} dataLoading={dataLoading} />}
        {activeTab === 'account' && user && (
          <AccountTab
            user={user}
            currency={currency}
            score={score}
            reportCount={reports.length}
            onSignOut={handleSignOut}
            onCancelled={() => {
              setUser(prev => prev ? { ...prev, billing_status: 'cancelled', subscription_tier: 'free' } : prev)
              const until = user.renewal_date ? formatDate(user.renewal_date) : 'your renewal date'
              setCancelToast(`Subscription cancelled. You have access until ${until}.`)
              setTimeout(() => setCancelToast(''), 5000)
            }}
            onUserUpdate={update => setUser(prev => prev ? { ...prev, ...update } : prev)}
            showToast={msg => { setCancelToast(msg); setTimeout(() => setCancelToast(''), 5000) }}
            onUpgrade={() => setShowUpgradeModal(true)}
          />
        )}
        </div>{/* end inner padding div */}
      </div>{/* end lg:ml-[240px] */}

      {/* ── Booking modal ─────────────────────────────────────────────────── */}
      {showModal && user && (
        <BookingModal user={user} diag={diag} score={score} onClose={() => setShowModal(false)} />
      )}

      {/* ── Upgrade modal ─────────────────────────────────────────────────── */}
      {showUpgradeModal && user && (
        <InDashboardUpgradeModal
          user={user}
          onClose={() => setShowUpgradeModal(false)}
          onUpgraded={tier => {
            setUser(prev => prev ? { ...prev, subscription_tier: tier } : prev)
            setShowUpgradeModal(false)
          }}
        />
      )}

      {/* ── Achievement unlock modal ───────────────────────────────────────── */}
      {newAchievement && (
        <AchievementModal achievement={newAchievement} onDismiss={() => setNewAchievement(null)} />
      )}

      {/* ── Cancellation toast ────────────────────────────────────────────── */}
      {cancelToast && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: P, color: '#fff', fontFamily: fontB, fontSize: 13, fontWeight: 500, padding: '12px 22px', borderRadius: 100, boxShadow: '0 8px 32px rgba(48,33,97,0.25)', whiteSpace: 'nowrap', animation: 'slideUp 0.25s ease both' }}>
          {cancelToast}
        </div>
      )}

      {/* ── Chat Widget ───────────────────────────────────────────────────── */}
      {user && <ChatWidget user={user} score={score} diag={diag} />}

      {/* ── Mobile bottom tab bar (lg:hidden) ─────────────────────────────── */}
      <div className="lg:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)', borderTop: `1px solid ${Pborder}`, display: 'flex', zIndex: 50 }}>
        {(['overview', 'intelligence', 'reports', 'account'] as Tab[]).map(tab => (
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
