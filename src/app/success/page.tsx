'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import Link from 'next/link'
import { CheckCircle, ArrowRight, LayoutDashboard } from 'lucide-react'

const Warm   = '#faf6ef'
const Dark   = '#18110a'
const Orange = '#e8330a'
const Muted  = 'rgba(24,17,10,0.5)'
const Border = 'rgba(24,17,10,0.12)'
const font   = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontB  = "'PolySans Neutral', -apple-system, system-ui, sans-serif"

const TIER_FEATURES: Record<string, string[]> = {
  starter: [
    'Full improvement roadmap and all critical findings',
    'Weekly ICP intelligence briefings',
    'Monthly ICP health score refresh',
    'AI chat in your dashboard',
  ],
  pro: [
    'Everything in Starter',
    'Live landing page audit (AI visits your URL)',
    'Competitor positioning and regional benchmarks',
    'Monthly strategy session with a B2B media buyer',
  ],
  agency: [
    'Everything in Pro',
    'Team of B2B media buyers on your account',
    'White-label reports produced by your account team',
    'Dedicated account manager and unlimited diagnoses',
  ],
}

function SuccessContent() {
  const params    = useSearchParams()
  const router    = useRouter()
  const tier      = (params.get('tier') ?? 'Starter').toLowerCase()
  const ref       = params.get('ref') ?? ''
  const email     = params.get('email') ?? ''
  const features  = TIER_FEATURES[tier] ?? TIER_FEATURES['starter']
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)

  useEffect(() => {
    if (email) localStorage.setItem('dashboard_email', email)
  }, [email])

  function handleDashboard() {
    if (email) localStorage.setItem('dashboard_email', email)
    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: Warm, color: Dark, fontFamily: fontB, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
        .success-btn-primary:hover { opacity: 0.88; }
        .success-btn-ghost:hover { background: rgba(24,17,10,0.04) !important; }
      `}</style>

      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>

        {/* Icon */}
        <div style={{ width: 72, height: 72, border: '1.5px solid rgba(22,163,74,0.3)', background: 'rgba(22,163,74,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
          <CheckCircle size={32} color="#16a34a" />
        </div>

        <span style={{ display: 'inline-block', fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#16a34a', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', padding: '4px 14px', marginBottom: 20 }}>
          Payment Confirmed
        </span>

        <h1 style={{ fontFamily: font, fontSize: 'clamp(26px,5vw,38px)', fontWeight: 700, color: Dark, margin: '0 0 12px', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
          You&apos;re on {tierLabel}.
        </h1>
        <p style={{ fontFamily: fontB, fontSize: 15, color: Muted, margin: '0 0 36px', lineHeight: 1.7 }}>
          Your subscription is active. Check your email for your receipt and onboarding details. Your first report refresh will be ready within 24 hours.
        </p>

        {/* What's included */}
        <div style={{ border: `1.5px solid ${Border}`, background: '#fff', padding: '24px 28px', textAlign: 'left', marginBottom: 28 }}>
          <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: Muted, margin: '0 0 16px' }}>
            What&apos;s included in {tierLabel}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {features.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <CheckCircle size={15} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontFamily: fontB, fontSize: 14, color: Dark, lineHeight: 1.6 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {ref && (
          <p style={{ fontFamily: fontB, fontSize: 12, color: Muted, marginBottom: 20 }}>
            Reference: <span style={{ fontFamily: 'monospace', color: Dark }}>{ref}</span>
          </p>
        )}

        {/* Payment logos */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { src: '/images/logos/paystack-logo_1.png',                 alt: 'Paystack',   h: 15 },
            { src: '/images/logos/Visa_Inc._logo_(2014–2021).svg.png',  alt: 'Visa',       h: 13 },
            { src: '/images/logos/MasterCard_early_1990s_logo.svg.png', alt: 'Mastercard', h: 18 },
            { src: '/images/logos/M-PESA_LOGO-01.svg.png',              alt: 'M-Pesa',     h: 15 },
          ].map(({ src, alt, h }) => (
            <img key={alt} src={src} alt={alt} style={{ height: h, objectFit: 'contain', opacity: 0.35 }} />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'stretch' }}>
          <button
            className="success-btn-primary"
            onClick={handleDashboard}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: Orange, color: '#fff', border: 'none', borderRadius: 6, padding: '14px 28px', fontFamily: font, fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' }}
          >
            <LayoutDashboard size={15} />
            Go to Dashboard
          </button>
          <Link
            href="/questionnaire"
            className="success-btn-ghost"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', color: Dark, border: `1.5px solid ${Border}`, borderRadius: 6, padding: '13px 28px', fontFamily: font, fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'background 0.15s' }}
          >
            Run Another Diagnostic
            <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: Warm, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 32, height: 32, border: `2px solid ${Orange}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
