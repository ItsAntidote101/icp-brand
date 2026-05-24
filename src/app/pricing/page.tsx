'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Check, Minus, ArrowRight, Zap, BarChart2, FileText, Target, Brain, Users, Shield, TrendingDown } from 'lucide-react'

// ── Design tokens (match landing page) ───────────────────────────────────────
const Warm       = '#faf6ef'
const Dark       = '#18110a'
const Orange     = '#e8330a'
const Text       = '#18110a'
const Muted      = 'rgba(24,17,10,0.5)'
const Border     = 'rgba(24,17,10,0.12)'
const DarkMuted  = 'rgba(255,255,255,0.5)'
const DarkBorder = 'rgba(255,255,255,0.12)'
const font       = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontB      = "'PolySans Neutral', -apple-system, system-ui, sans-serif"

const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: Orange, color: '#fff', border: 'none',
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

// ── Plan data ─────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Free',
    tag: 'No card needed',
    monthly: 0, annualMonthly: 0, annual: 0,
    highlight: false,
    cta: 'Start free diagnosis',
    href: '/questionnaire',
    desc: 'Run your first ICP diagnosis and see exactly where your targeting is leaking money.',
    includes: [
      'ICP health score (0-100)',
      'Top 3 critical findings',
      '3 quick wins for this week',
      'CAC and LTV:CAC estimate',
      'Monthly waste estimate',
      '1 diagnosis per month',
    ],
  },
  {
    name: 'Starter',
    tag: 'Most popular',
    monthly: 6500, annualMonthly: 5400, annual: 65000,
    highlight: false,
    cta: 'Start with Starter',
    href: '/questionnaire',
    desc: 'For solo founders and small teams who need ongoing ICP monitoring and actionable reports.',
    includes: [
      'Everything in Free',
      'All critical findings (no limit)',
      'Full improvement roadmap',
      'Executive summary',
      'Weekly ICP intelligence briefing',
      'Monthly ICP health refresh',
      'AI chat in the dashboard',
      'PDF and CSV report export',
      '2 diagnoses per month',
      '12-month data retention',
    ],
  },
  {
    name: 'Pro',
    tag: 'Best value',
    monthly: 13000, annualMonthly: 10800, annual: 130000,
    highlight: true,
    cta: 'Go Pro',
    href: '/questionnaire',
    desc: 'For growing teams that need deep research, competitive intelligence, and campaign-level precision.',
    includes: [
      'Everything in Starter',
      'Live landing page audit (AI visits your URL)',
      'Competitor positioning analysis',
      'Regional benchmark comparison',
      'Ad copy and CTA audit',
      'Audience gap identification',
      'Daily AI market briefings',
      'Competitive landscape tracking',
      'Priority in-dashboard support',
      'Monthly strategy session (media buyer)',
      '5 diagnoses per month',
      '24-month data retention',
    ],
  },
  {
    name: 'Agency',
    tag: 'For teams',
    monthly: 26000, annualMonthly: 21600, annual: 260000,
    highlight: false,
    cta: 'Talk to our team',
    href: '/questionnaire',
    desc: 'For agencies managing multiple clients who need scale, white-label reports, and direct human support.',
    includes: [
      'Everything in Pro',
      'Up to 10 client accounts',
      'Multi-client reporting dashboard',
      'White-label PDF reports',
      'Dedicated account manager',
      'Onboarding call with media buyer',
      'Unlimited diagnoses',
      'Unlimited data retention',
      'Custom billing and invoicing',
    ],
  },
]

// ── Feature comparison table ──────────────────────────────────────────────────
type Cell = true | false | string
type Row  = { feature: string; cells: [Cell, Cell, Cell, Cell]; note?: string }
type Group = { group: string; rows: Row[] }

const COMPARISON: Group[] = [
  {
    group: 'Core Diagnosis',
    rows: [
      { feature: 'ICP health score (0-100)',          cells: [true, true, true, true] },
      { feature: 'Critical findings',                  cells: ['Top 3', 'All', 'All', 'All'] },
      { feature: 'Quick wins action plan',             cells: ['3 actions', true, true, true] },
      { feature: 'Monthly waste estimate (KES)',       cells: [true, true, true, true] },
      { feature: 'CAC before and after projection',   cells: [true, true, true, true] },
      { feature: 'LTV:CAC ratio analysis',            cells: [true, true, true, true] },
      { feature: 'Executive summary',                 cells: [false, true, true, true] },
      { feature: 'Full improvement roadmap',          cells: [false, true, true, true] },
      { feature: 'Diagnoses per month',               cells: ['1', '2', '5', 'Unlimited'] },
    ],
  },
  {
    group: 'Deep Research (AI-Powered)',
    rows: [
      { feature: 'Live landing page audit',           cells: [false, false, true, true], note: 'AI visits your actual URL and scores it' },
      { feature: 'Competitor positioning analysis',   cells: [false, false, true, true] },
      { feature: 'Regional benchmark comparison',     cells: [false, false, true, true] },
      { feature: 'Ad copy and CTA effectiveness',     cells: [false, false, true, true] },
      { feature: 'Audience gap identification',       cells: [false, true, true, true] },
      { feature: 'Funnel leak analysis',              cells: [false, true, true, true] },
      { feature: 'Market positioning gaps',           cells: [false, false, true, true] },
    ],
  },
  {
    group: 'Intelligence and Monitoring',
    rows: [
      { feature: 'Weekly ICP intelligence briefing',      cells: [false, true, true, true] },
      { feature: 'Daily AI market briefings',             cells: [false, false, true, true], note: 'Delivered to your dashboard every morning' },
      { feature: 'Monthly ICP health score refresh',      cells: [false, true, true, true] },
      { feature: 'Ongoing ICP monitoring',                cells: [false, true, true, true] },
      { feature: 'Competitive landscape tracking',        cells: [false, false, true, true] },
      { feature: 'Buyer intent signal alerts',            cells: [false, false, true, true] },
    ],
  },
  {
    group: 'Reporting and Exports',
    rows: [
      { feature: 'PDF report download',               cells: [false, true, true, true] },
      { feature: 'CSV data export',                   cells: [false, true, true, true] },
      { feature: 'Multi-client reporting dashboard',  cells: [false, false, false, true] },
      { feature: 'White-label PDF reports',           cells: [false, false, false, true] },
      { feature: 'Custom branded reports',            cells: [false, false, false, true] },
      { feature: 'Data retention',                    cells: ['30 days', '12 months', '24 months', 'Unlimited'] },
    ],
  },
  {
    group: 'Human Support and Access',
    rows: [
      { feature: 'AI chat in dashboard',                    cells: [false, true, true, true] },
      { feature: 'Priority in-dashboard support',           cells: [false, false, true, true] },
      { feature: 'Monthly strategy session (media buyer)',  cells: [false, false, true, true], note: 'A real B2B media buyer reviews your findings with you' },
      { feature: 'Onboarding call',                         cells: [false, false, false, true] },
      { feature: 'Dedicated account manager',               cells: [false, false, false, true] },
      { feature: 'Custom billing and invoicing',            cells: [false, false, false, true] },
    ],
  },
  {
    group: 'Platform',
    rows: [
      { feature: 'Client accounts',                   cells: ['1', '1', '1', 'Up to 10'] },
      { feature: 'Dashboard access',                  cells: [true, true, true, true] },
      { feature: 'Score history and trends',          cells: [false, true, true, true] },
      { feature: 'Milestone tracking',                cells: [false, true, true, true] },
      { feature: 'API access',                        cells: [false, false, false, true] },
    ],
  },
]

// ── "All paid plans include" data ─────────────────────────────────────────────
const PAID_INCLUDES = [
  {
    heading: 'Complete ICP diagnosis',
    items: ['ICP health score 0-100', 'All critical findings with fixes', 'Ranked improvement roadmap', 'CAC and LTV:CAC projections'],
  },
  {
    heading: 'Ongoing intelligence',
    items: ['Weekly ICP intelligence briefings', 'Monthly health score refresh', 'Continuous ICP monitoring', 'Audience gap tracking'],
  },
  {
    heading: 'Reports and data',
    items: ['PDF report download', 'CSV data export', 'Executive summary', '12+ months data retention'],
  },
  {
    heading: 'Platform access',
    items: ['AI chat in dashboard', 'Score history and trends', 'Milestone tracking', 'Secure HttpOnly session auth'],
  },
]

// ─────────────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  const displayPrice = (plan: typeof PLANS[0]) => {
    if (plan.monthly === 0) return 'Free'
    const price = annual ? plan.annualMonthly : plan.monthly
    return `KES ${price.toLocaleString()}`
  }

  const Col = ({ cell }: { cell: Cell }) => {
    if (cell === true)  return <Check size={16} color={Orange} strokeWidth={2.5} />
    if (cell === false) return <Minus size={16} color={`rgba(24,17,10,0.2)`} strokeWidth={1.5} />
    return <span style={{ fontFamily: fontB, fontSize: 13, color: Text, fontWeight: 600 }}>{cell}</span>
  }

  return (
    <div style={{ background: Warm, minHeight: '100vh' }}>

      {/* ── NAV ───────────────────────────────────────────────────────────── */}
      <nav style={{ borderBottom: `1.5px solid ${Border}`, position: 'sticky', top: 0, zIndex: 50, background: Warm }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,4vw,40px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, background: Orange, borderRadius: 4, flexShrink: 0 }} />
            <span style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: Dark }}>ICP Diagnostic</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link href="/" style={{ fontFamily: fontB, fontSize: 14, color: Muted, textDecoration: 'none' }}>Home</Link>
            <Link href="/questionnaire" style={btnPrimary}>Get free diagnosis</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{ borderBottom: `1.5px solid ${Border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(48px,7vw,88px) clamp(16px,4vw,40px) clamp(40px,6vw,72px)' }}>
          <p style={{ fontFamily: fontB, fontSize: 12, color: Muted, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 14px' }}>Pricing</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, marginBottom: 44 }}>
            <h1 style={{ fontFamily: font, fontSize: 'clamp(32px,5vw,60px)', fontWeight: 700, color: Text, margin: 0, lineHeight: 1.06 }}>
              ICP diagnostic plans.
            </h1>
            <p style={{ fontFamily: fontB, fontSize: 15, color: Muted, margin: 0, maxWidth: 380, lineHeight: 1.7 }}>
              Start free. Get your health score and top findings at no cost. Upgrade for ongoing intelligence, deep research, and human strategy sessions.
            </p>
          </div>

          {/* Billing toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontFamily: fontB, fontSize: 14, color: !annual ? Text : Muted, fontWeight: !annual ? 700 : 400 }}>Monthly</span>
            <button onClick={() => setAnnual(a => !a)} style={{ width: 46, height: 26, borderRadius: 100, background: annual ? Dark : Border, position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: annual ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
            <span style={{ fontFamily: fontB, fontSize: 14, color: annual ? Text : Muted, fontWeight: annual ? 700 : 400 }}>
              Annual <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 13 }}>(2 months free)</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── PLAN CARDS ────────────────────────────────────────────────────── */}
      <section style={{ borderBottom: `1.5px solid ${Border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderLeft: `1.5px solid ${Border}` }}>
          {PLANS.map((plan) => (
            <div key={plan.name} style={{ borderRight: `1.5px solid ${Border}`, borderBottom: `1.5px solid ${Border}`, position: 'relative', background: plan.highlight ? Dark : 'transparent', display: 'flex', flexDirection: 'column' }}>
              {/* Orange top bar for highlight */}
              {plan.highlight && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: Orange }} />}

              <div style={{ padding: '32px 28px', borderBottom: `1.5px solid ${plan.highlight ? DarkBorder : Border}`, flex: 1 }}>
                {/* Tag */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: plan.highlight ? DarkMuted : Muted }}>{plan.name}</span>
                  <span style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, color: plan.highlight ? Orange : Orange, background: 'rgba(232,51,10,0.1)', padding: '3px 9px', borderRadius: 4 }}>{plan.tag}</span>
                </div>

                {/* Price */}
                <p style={{ fontFamily: font, fontSize: plan.monthly === 0 ? 40 : 34, fontWeight: 700, color: plan.highlight ? '#fff' : Text, margin: '0 0 2px', lineHeight: 1 }}>
                  {displayPrice(plan)}
                </p>
                {plan.monthly > 0 && (
                  <p style={{ fontFamily: fontB, fontSize: 13, color: plan.highlight ? DarkMuted : Muted, margin: '0 0 4px' }}>/mo</p>
                )}
                {annual && plan.monthly > 0 && (
                  <p style={{ fontFamily: fontB, fontSize: 12, color: plan.highlight ? 'rgba(255,255,255,0.35)' : 'rgba(24,17,10,0.35)', margin: '0 0 0px' }}>
                    Billed as KES {plan.annual.toLocaleString()}/year
                  </p>
                )}

                <p style={{ fontFamily: fontB, fontSize: 13, color: plan.highlight ? DarkMuted : Muted, lineHeight: 1.6, margin: '20px 0 24px' }}>{plan.desc}</p>

                {/* Feature list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {plan.includes.map(item => (
                    <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Check size={13} color={Orange} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontFamily: fontB, fontSize: 13, color: plan.highlight ? 'rgba(255,255,255,0.85)' : Text, lineHeight: 1.45 }}>{item}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link href={plan.href} style={plan.highlight ? { ...btnPrimary, width: '100%', justifyContent: 'center', boxSizing: 'border-box' as const } : { ...btnGhost, width: '100%', justifyContent: 'center', boxSizing: 'border-box' as const, color: plan.highlight ? '#fff' : Text }}>
                  {plan.cta} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ALL PAID PLANS INCLUDE ────────────────────────────────────────── */}
      <section style={{ background: '#fff', borderBottom: `1.5px solid ${Border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,40px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: 'clamp(32px,5vw,64px)', alignItems: 'start' }}>
            <div>
              <h2 style={{ fontFamily: font, fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 700, color: Text, margin: 0, lineHeight: 1.2, maxWidth: 200 }}>All paid plans include</h2>
            </div>
            {PAID_INCLUDES.slice(0, 3).map(col => (
              <div key={col.heading}>
                <p style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: Text, margin: '0 0 14px' }}>{col.heading}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.items.map(item => (
                    <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Check size={13} color={Orange} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontFamily: fontB, fontSize: 13, color: Muted, lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* 4th column below on same row */}
          <div style={{ marginTop: 40, paddingTop: 40, borderTop: `1.5px solid ${Border}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'clamp(32px,5vw,64px)', alignItems: 'start' }}>
              <div style={{ maxWidth: 200 }}>
                <p style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: Text, margin: 0 }}>{PAID_INCLUDES[3].heading}</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 48px' }}>
                {PAID_INCLUDES[3].items.map(item => (
                  <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Check size={13} color={Orange} style={{ flexShrink: 0 }} />
                    <span style={{ fontFamily: fontB, fontSize: 13, color: Muted }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE COMPARISON TABLE ──────────────────────────────────────── */}
      <section style={{ borderBottom: `1.5px solid ${Border}`, overflowX: 'auto' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,40px)' }}>
          <h2 style={{ fontFamily: font, fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 700, color: Text, margin: '0 0 40px' }}>Compare all features</h2>

          <div style={{ border: `1.5px solid ${Border}`, minWidth: 700 }}>

            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', borderBottom: `1.5px solid ${Border}`, background: Warm }}>
              <div style={{ padding: '16px 20px' }} />
              {['Free', 'Starter', 'Pro', 'Agency'].map((name, i) => (
                <div key={name} style={{ padding: '16px 20px', borderLeft: `1.5px solid ${Border}`, background: i === 2 ? Dark : 'transparent', textAlign: 'center' }}>
                  <p style={{ fontFamily: fontB, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: i === 2 ? DarkMuted : Muted, margin: '0 0 4px' }}>{name}</p>
                  <p style={{ fontFamily: font, fontSize: 17, fontWeight: 700, color: i === 2 ? '#fff' : Text, margin: 0 }}>
                    {i === 0 ? 'Free' : `KES ${(annual ? [5400, 10800, 21600] : [6500, 13000, 26000])[i - 1].toLocaleString()}`}
                  </p>
                  {i > 0 && <p style={{ fontFamily: fontB, fontSize: 11, color: i === 2 ? DarkMuted : Muted, margin: '2px 0 0' }}>/mo</p>}
                </div>
              ))}
            </div>

            {/* Groups and rows */}
            {COMPARISON.map((group, gi) => (
              <div key={gi}>
                {/* Group header */}
                <div style={{ padding: '14px 20px', background: 'rgba(24,17,10,0.03)', borderBottom: `1.5px solid ${Border}` }}>
                  <span style={{ fontFamily: fontB, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: Text }}>{group.group}</span>
                </div>
                {/* Rows */}
                {group.rows.map((row, ri) => (
                  <div key={ri} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', borderBottom: ri < group.rows.length - 1 || gi < COMPARISON.length - 1 ? `1.5px solid ${Border}` : 'none' }}>
                    <div style={{ padding: '14px 20px' }}>
                      <span style={{ fontFamily: fontB, fontSize: 14, color: Text }}>{row.feature}</span>
                      {row.note && <p style={{ fontFamily: fontB, fontSize: 12, color: Muted, margin: '3px 0 0', lineHeight: 1.4 }}>{row.note}</p>}
                    </div>
                    {row.cells.map((cell, ci) => (
                      <div key={ci} style={{ padding: '14px 20px', borderLeft: `1.5px solid ${Border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: ci === 2 ? 'rgba(24,17,10,0.04)' : 'transparent' }}>
                        <Col cell={cell} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT YOU GET IN EACH LAYER ────────────────────────────────────── */}
      <section style={{ background: Dark, borderBottom: `1.5px solid ${DarkBorder}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(48px,7vw,88px) clamp(16px,4vw,40px)' }}>
          <h2 style={{ fontFamily: font, fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 700, color: '#fff', margin: '0 0 48px' }}>How the diagnosis layers work</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', borderLeft: `1.5px solid ${DarkBorder}`, borderTop: `1.5px solid ${DarkBorder}` }}>
            {[
              { Icon: Target,       title: 'ICP Foundation',          body: 'Who you are targeting, whether your personas match real buyers, and whether your funnel is designed for them.', tier: 'All plans' },
              { Icon: BarChart2,    title: 'Funnel and Metrics',      body: 'Your close rate, CAC, LTV, and how your monthly budget maps to qualified outcomes versus wasted spend.', tier: 'All plans' },
              { Icon: FileText,     title: 'Landing Page Audit',      body: 'Our AI visits your actual URL, scores your copy, CTA, trust signals, and conversion friction points in real time.', tier: 'Pro and Agency' },
              { Icon: Brain,        title: 'Competitive Intelligence', body: 'We research your top 3 competitors, identify their positioning gaps, and benchmark your metrics against your real market.', tier: 'Pro and Agency' },
              { Icon: TrendingDown, title: 'CAC and LTV Projections', body: 'Your exact cost per customer before and after ICP fixes, your LTV:CAC ratio, and the monthly revenue you recover.', tier: 'All plans' },
              { Icon: Users,        title: 'Human Strategy Layer',    body: 'A real B2B media buyer reviews your report with you, validates the findings, and helps you prioritise the right fixes first.', tier: 'Pro and Agency' },
              { Icon: Zap,          title: 'Weekly Intelligence',     body: 'Every week your dashboard updates with new signals: audience drift, competitive moves, benchmark changes, and fresh quick wins.', tier: 'Starter and above' },
              { Icon: Shield,       title: 'Ongoing Monitoring',      body: 'Your ICP health score refreshes monthly. If your targeting drifts or the market shifts, you find out before your CAC spikes.', tier: 'Starter and above' },
            ].map(({ Icon, title, body, tier }) => (
              <div key={title} style={{ borderRight: `1.5px solid ${DarkBorder}`, borderBottom: `1.5px solid ${DarkBorder}`, padding: 'clamp(24px,3vw,32px)' }}>
                <div style={{ width: 32, height: 32, border: `1.5px solid ${DarkBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <Icon size={15} color={Orange} strokeWidth={1.5} />
                </div>
                <p style={{ fontFamily: fontB, fontSize: 11, color: Orange, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>{tier}</p>
                <h3 style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 10px' }}>{title}</h3>
                <p style={{ fontFamily: fontB, fontSize: 13, color: DarkMuted, lineHeight: 1.65, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section style={{ borderBottom: `1.5px solid ${Border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(48px,7vw,88px) clamp(16px,4vw,40px)', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'clamp(32px,5vw,80px)', alignItems: 'start' }}>
          <h2 style={{ fontFamily: font, fontSize: 'clamp(22px,3vw,36px)', fontWeight: 700, color: Text, margin: 0, lineHeight: 1.15 }}>Pricing questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { q: 'Can I upgrade or downgrade at any time?', a: 'Yes. Changes take effect immediately. If you upgrade mid-cycle you are charged the prorated difference. If you downgrade, the change applies at the next billing date.' },
              { q: 'What happens if I exceed my monthly diagnosis limit?', a: 'You can purchase additional diagnoses at KES 3,000 each, or upgrade to the next plan. Your existing data and reports are never deleted.' },
              { q: 'Is the media buyer session a real human?', a: 'Yes. Pro and Agency subscribers get a monthly 45-minute video call with a B2B media buyer from our team who reviews your diagnosis findings and helps you act on them.' },
              { q: 'How does the annual discount work?', a: 'Annual billing gives you 10 months for the price of 12 (two months free). You pay the full annual amount upfront. Refunds are available within the first 14 days.' },
              { q: 'What does the free diagnosis include exactly?', a: 'Your ICP health score (0-100), your top 3 critical findings with brief descriptions, 3 quick wins you can act on this week, a CAC estimate, and a monthly waste estimate. No credit card required.' },
              { q: 'Can agencies white-label the reports for clients?', a: 'Yes. Agency subscribers can generate PDF reports without ICP Diagnostic branding and add their own logo and colour scheme. This is available for all client accounts on the plan.' },
            ].map(({ q, a }, i) => (
              <div key={i} style={{ borderTop: `1.5px solid ${Border}`, padding: '24px 0' }}>
                <p style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: Text, margin: '0 0 10px' }}>{q}</p>
                <p style={{ fontFamily: fontB, fontSize: 14, color: Muted, lineHeight: 1.7, margin: 0 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section style={{ background: Dark }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(56px,8vw,96px) clamp(16px,4vw,40px)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
          <div>
            <p style={{ fontFamily: fontB, fontSize: 12, color: DarkMuted, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 14px' }}>Get started today</p>
            <h2 style={{ fontFamily: font, fontSize: 'clamp(26px,4vw,48px)', fontWeight: 700, color: '#fff', margin: '0 0 12px', lineHeight: 1.1 }}>
              Stop guessing. <span style={{ color: Orange }}>Start diagnosing.</span>
            </h2>
            <p style={{ fontFamily: fontB, fontSize: 15, color: DarkMuted, margin: 0, lineHeight: 1.65, maxWidth: 440 }}>
              Your first diagnosis is free. No card, no setup, no agency. Just 22 questions and a complete picture of where your ad spend is going.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            <Link href="/questionnaire" style={btnPrimary}>
              Get my free ICP report <ArrowRight size={16} />
            </Link>
            <Link href="/" style={{ ...btnGhost, color: '#fff', borderColor: DarkBorder }}>
              Back to home
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
