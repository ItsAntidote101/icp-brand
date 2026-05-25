'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'

const Warm   = '#fffefb'
const Dark   = '#201515'
const Orange = '#e8330a'
const Muted  = '#605d52'
const Border = '#c5c0b1'
const font   = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontB  = "'PolySans Neutral', -apple-system, system-ui, sans-serif"

const REASON_MESSAGES: Record<string, string> = {
  missing_reference:    'The payment reference was missing. No charge was made.',
  payment_failed:       'Your payment could not be completed. No charge was made.',
  Declined:             'Your card was declined. Please try a different payment method.',
  'Insufficient Funds': 'Insufficient funds. Please try a different card or method.',
}

function CancelContent() {
  const params  = useSearchParams()
  const reason  = params.get('reason') ?? 'payment_failed'
  const message = REASON_MESSAGES[reason] ?? 'Your payment was not completed. No charge was made.'

  return (
    <div style={{ minHeight: '100vh', background: Warm, color: Dark, fontFamily: fontB, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
        .cancel-btn-back:hover { background: rgba(201,192,177,0.18) !important; }
        .cancel-btn-retry:hover { opacity: 0.88; }
      `}</style>

      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>

        {/* Icon */}
        <div style={{ width: 72, height: 72, border: '1.5px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
          <XCircle size={32} color="#dc2626" />
        </div>

        <span style={{ display: 'inline-block', fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#dc2626', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', padding: '4px 14px', marginBottom: 20 }}>
          Payment Unsuccessful
        </span>

        <h1 style={{ fontFamily: font, fontSize: 'clamp(26px,5vw,38px)', fontWeight: 700, color: Dark, margin: '0 0 12px', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
          Something went wrong
        </h1>
        <p style={{ fontFamily: fontB, fontSize: 15, color: Muted, margin: '0 0 36px', lineHeight: 1.7 }}>
          {message}
        </p>

        {/* Common fixes */}
        <div style={{ border: `1.5px solid ${Border}`, background: '#f8f4f0', padding: '24px 28px', textAlign: 'left', marginBottom: 28 }}>
          <p style={{ fontFamily: fontB, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: Muted, margin: '0 0 14px' }}>
            Common fixes
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Check that your card details are correct and up to date',
              'Make sure your card supports international transactions',
              'Try a different card or use M-Pesa',
              'Contact your bank if the issue persists',
            ].map(tip => (
              <div key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontFamily: fontB, fontSize: 13, color: Orange, flexShrink: 0, marginTop: 2 }}>→</span>
                <span style={{ fontFamily: fontB, fontSize: 14, color: Muted, lineHeight: 1.6 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment logos */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { src: '/images/logos/paystack-logo_1.png',                 alt: 'Paystack',   h: 15 },
            { src: '/images/logos/Visa_Inc._logo_(2014-2021).svg.png',  alt: 'Visa',       h: 13 },
            { src: '/images/logos/MasterCard_early_1990s_logo.svg.png', alt: 'Mastercard', h: 18 },
            { src: '/images/logos/M-PESA_LOGO-01.svg.png',              alt: 'M-Pesa',     h: 15 },
          ].map(({ src, alt, h }) => (
            <img key={alt} src={src} alt={alt} style={{ height: h, objectFit: 'contain', opacity: 0.35 }} />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'stretch' }}>
          <button
            className="cancel-btn-retry"
            onClick={() => window.history.back()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: Orange, color: '#fff', border: 'none', borderRadius: 6, padding: '14px 28px', fontFamily: font, fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' }}
          >
            <RefreshCw size={15} />
            Try Again
          </button>
          <Link
            href="/"
            className="cancel-btn-back"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', color: Dark, border: `1.5px solid ${Border}`, borderRadius: 6, padding: '13px 28px', fontFamily: font, fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'background 0.15s' }}
          >
            <ArrowLeft size={14} />
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
      <div style={{ minHeight: '100vh', background: Warm, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 32, height: 32, border: `2px solid ${Orange}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <CancelContent />
    </Suspense>
  )
}
