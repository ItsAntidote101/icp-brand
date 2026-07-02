'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, ArrowLeft } from 'lucide-react'

const Warm   = '#fffefb'
const Dark   = '#201515'
const Orange = '#e8330a'
const Muted  = '#605d52'
const Border = '#c5c0b1'
const font   = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontB  = "'PolySans Neutral', -apple-system, system-ui, sans-serif"

const inputStyle: React.CSSProperties = {
  background: Warm, border: `1.5px solid ${Border}`, borderRadius: 6,
  padding: '13px 14px', fontSize: 14, color: Dark, outline: 'none',
  fontFamily: fontB, width: '100%', boxSizing: 'border-box',
}

const RESEND_COOLDOWN = 60

export default function BuyerLoginPage() {
  const router = useRouter()
  const [email,      setEmail]      = useState('')
  const [otpSent,    setOtpSent]    = useState(false)
  const [otp,        setOtp]        = useState('')
  const [sending,    setSending]    = useState(false)
  const [verifying,  setVerifying]  = useState(false)
  const [formError,  setFormError]  = useState('')
  const [cooldown,   setCooldown]   = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const otpInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (otpSent) setTimeout(() => otpInputRef.current?.focus(), 80)
  }, [otpSent])

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }, [])

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN)
    cooldownRef.current = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(cooldownRef.current!); return 0 }
        return c - 1
      })
    }, 1000)
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setFormError('')
    try {
      const res  = await fetch('/api/buyer/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const json = await res.json() as { ok?: boolean; notFound?: boolean; error?: string }
      if (json.ok) {
        setOtpSent(true)
        startCooldown()
      } else if (json.notFound) {
        setFormError('This email is not registered as a media buyer.')
      } else {
        setFormError(json.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setFormError('Connection error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  async function handleVerifyOtp(code: string) {
    if (code.length !== 6 || verifying) return
    setVerifying(true)
    setFormError('')
    try {
      const res  = await fetch('/api/buyer/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), token: code }),
      })
      const json = await res.json() as { success?: boolean; error?: string }
      if (json.success) {
        router.push('/buyer')
      } else {
        setFormError(json.error ?? 'Verification failed. Please try again.')
        setOtp('')
        otpInputRef.current?.focus()
      }
    } catch {
      setFormError('Connection error. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  function handleOtpChange(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 6)
    setOtp(digits)
    setFormError('')
    if (digits.length === 6) handleVerifyOtp(digits)
  }

  function handleBack() {
    setOtpSent(false)
    setOtp('')
    setFormError('')
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    setCooldown(0)
  }

  return (
    <div style={{ minHeight: '100vh', background: Dark, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: fontB }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .buyer-input:focus { border-color: ${Orange} !important; }
        .otp-input { letter-spacing: 0.35em; font-size: 28px; text-align: center; }
      `}</style>

      <div style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 12, padding: 32 }}>
        {otpSent ? (
          <>
            <button onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: Muted, fontFamily: fontB, fontSize: 13, padding: 0, marginBottom: 24 }}>
              <ArrowLeft size={14} /> Back
            </button>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(232,51,10,0.08)', border: `1px solid rgba(232,51,10,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <Mail size={18} color={Orange} />
            </div>
            <h1 style={{ fontFamily: font, fontSize: 20, fontWeight: 700, color: Dark, margin: '0 0 6px' }}>Enter your code</h1>
            <p style={{ fontSize: 13, color: Muted, margin: '0 0 22px' }}>Sent a 6-digit code to <strong style={{ color: Dark }}>{email}</strong></p>
            <input
              ref={otpInputRef} className="buyer-input otp-input" type="text" inputMode="numeric"
              autoComplete="one-time-code" maxLength={6} placeholder="000000" value={otp}
              onChange={e => handleOtpChange(e.target.value)} disabled={verifying}
              style={{ ...inputStyle, opacity: verifying ? 0.6 : 1, borderColor: formError ? '#dc2626' : Border }}
            />
            {formError && (
              <p style={{ color: '#dc2626', fontSize: 13, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', padding: '10px 14px', margin: '10px 0 0', borderRadius: 4 }}>{formError}</p>
            )}
            <p style={{ fontSize: 13, color: Muted, textAlign: 'center', marginTop: 18 }}>
              {cooldown > 0 ? <>Resend available in <strong style={{ color: Dark }}>{cooldown}s</strong></> : (
                <button onClick={handleSendOtp} disabled={sending} style={{ background: 'none', border: 'none', cursor: sending ? 'not-allowed' : 'pointer', color: Orange, fontWeight: 600, fontSize: 13, padding: 0 }}>
                  {sending ? 'Sending...' : 'Resend code'}
                </button>
              )}
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: font, fontSize: 20, fontWeight: 700, color: Dark, margin: '0 0 6px' }}>Media Buyer Login</h1>
            <p style={{ fontSize: 13, color: Muted, margin: '0 0 22px' }}>We&apos;ll send a one-time code to your registered email.</p>
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input className="buyer-input" type="email" placeholder="you@idealicp.com" value={email}
                onChange={e => setEmail(e.target.value)} required autoFocus style={inputStyle} />
              {formError && (
                <p style={{ color: '#dc2626', fontSize: 13, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', padding: '10px 14px', margin: 0, borderRadius: 4 }}>{formError}</p>
              )}
              <button type="submit" disabled={sending || !email.trim()}
                style={{ background: Orange, color: '#fff', border: 'none', borderRadius: 6, padding: '13px 16px', fontSize: 15, fontWeight: 700, cursor: (sending || !email.trim()) ? 'not-allowed' : 'pointer', opacity: (sending || !email.trim()) ? 0.45 : 1, fontFamily: font, marginTop: 4 }}>
                {sending ? 'Sending...' : 'Send login code'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
