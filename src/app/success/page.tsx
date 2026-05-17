'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

const TIER_FEATURES: Record<string, string[]> = {
  starter: [
    'Full 12-week ICP optimization roadmap',
    'Monthly diagnostic refresh',
    'Email report delivery',
    '1 business covered',
  ],
  pro: [
    'Everything in Starter',
    'Weekly performance snapshots',
    'Priority email support',
    'Up to 3 businesses',
  ],
  agency: [
    'Everything in Pro',
    'Quarterly deep-dive reports',
    'White-label PDF export',
    'Unlimited businesses',
  ],
}

function SuccessContent() {
  const params = useSearchParams()
  const tier   = (params.get('tier') ?? 'Starter').toLowerCase()
  const ref    = params.get('ref') ?? ''
  const features = TIER_FEATURES[tier] ?? TIER_FEATURES['starter']
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)

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

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all active:scale-95"
          >
            Go to Dashboard
          </Link>
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
