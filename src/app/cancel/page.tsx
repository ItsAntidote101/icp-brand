'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

const REASON_MESSAGES: Record<string, string> = {
  missing_reference:  'The payment reference was missing. No charge was made.',
  payment_failed:     'Your payment could not be completed. No charge was made.',
  Declined:           'Your card was declined. Please try a different payment method.',
  'Insufficient Funds': 'Insufficient funds. Please try a different card or method.',
}

function CancelContent() {
  const params = useSearchParams()
  const reason = params.get('reason') ?? 'payment_failed'
  const message = REASON_MESSAGES[reason] ?? 'Your payment was not completed. No charge was made.'

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full text-center">

        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <span className="inline-block text-[11px] font-semibold uppercase tracking-widest text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-1 rounded-full mb-4">
          Payment Unsuccessful
        </span>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          Something went wrong
        </h1>
        <p className="text-slate-400 text-base mb-8 leading-relaxed">
          {message}
        </p>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-left mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
            Common fixes
          </p>
          {[
            'Check that your card details are correct and up to date',
            'Make sure your card supports international transactions',
            'Try a different card or use M-Pesa / mobile money',
            'Contact your bank if the issue persists',
          ].map(tip => (
            <div key={tip} className="flex items-start gap-3 text-sm text-slate-400">
              <span className="text-amber-400 flex-shrink-0 mt-px">→</span>
              {tip}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all active:scale-95"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-sm font-semibold transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    }>
      <CancelContent />
    </Suspense>
  )
}
