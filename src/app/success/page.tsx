'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import Link from 'next/link'

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
  const params = useSearchParams()
  const router = useRouter()
  const tier   = (params.get('tier') ?? 'Starter').toLowerCase()
  const ref    = params.get('ref') ?? ''
  const email  = params.get('email') ?? ''
  const features  = TIER_FEATURES[tier] ?? TIER_FEATURES['starter']
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)

  useEffect(() => {
    if (email) {
      localStorage.setItem('dashboard_email', email)
    }
  }, [email])

  function handleDashboard() {
    if (email) localStorage.setItem('dashboard_email', email)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full text-center">

        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <span className="inline-block text-[11px] font-semibold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full mb-4">
          Payment Confirmed
        </span>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          You&apos;re on {tierLabel}.
        </h1>
        <p className="text-slate-400 text-base mb-8 leading-relaxed">
          Your subscription is active. Check your email for your receipt and
          onboarding details — your first report refresh will be sent within 24 hours.
        </p>

        {/* What's included */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-left mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
            What&apos;s included in {tierLabel}
          </p>
          <ul className="space-y-2.5">
            {features.map(f => (
              <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="text-emerald-400 flex-shrink-0 mt-px">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {ref && (
          <p className="text-xs text-slate-600 mb-6">
            Reference: <span className="font-mono text-slate-500">{ref}</span>
          </p>
        )}

        {/* Payment logos */}
        <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
          {[
            { src: '/images/logos/paystack-logo_1.png',                alt: 'Paystack',    h: 16 },
            { src: '/images/logos/Visa_Inc._logo_(2014–2021).svg.png', alt: 'Visa',        h: 14 },
            { src: '/images/logos/MasterCard_early_1990s_logo.svg.png', alt: 'Mastercard', h: 20 },
            { src: '/images/logos/M-PESA_LOGO-01.svg.png',             alt: 'M-Pesa',      h: 16 },
          ].map(({ src, alt, h }) => (
            <img key={alt} src={src} alt={alt} style={{ height: h, objectFit: 'contain', opacity: 0.3, filter: 'brightness(10)' }} />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleDashboard}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all active:scale-95"
          >
            Go to Dashboard →
          </button>
          <Link
            href="/questionnaire"
            className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-sm font-semibold transition-all"
          >
            Run Another Diagnostic
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
