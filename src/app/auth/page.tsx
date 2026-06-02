'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, ArrowLeft, Mail } from 'lucide-react'

const Warm   = '#fffefb'
const Dark   = '#201515'
const Orange = '#e8330a'
const Muted  = '#605d52'
const Border = '#c5c0b1'
const font   = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontB  = "'PolySans Neutral', -apple-system, system-ui, sans-serif"

const inputStyle: React.CSSProperties = {
  background: Warm,
  border: `1.5px solid ${Border}`,
  borderRadius: 6,
  padding: '13px 14px',
  fontSize: 14,
  color: Dark,
  outline: 'none',
  fontFamily: fontB,
  width: '100%',
  boxSizing: 'border-box',
}

const RESEND_COOLDOWN = 60

function AuthInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const defaultTab   = searchParams.get('tab') === 'login' ? 'login' : 'signup'
  const nextPath     = searchParams.get('next') ?? '/dashboard'

  const [tab,    setTab]    = useState<'signup' | 'login'>(defaultTab)
  const [toast,  setToast]  = useState('')

  // Signup fields
  const [firstName,   setFirstName]   = useState('')
  const [lastName,    setLastName]    = useState('')
  const [signupEmail, setSignupEmail] = useState('')

  // Login field
  const [loginEmail, setLoginEmail] = useState('')

  // OTP step (shared between signup and login)
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

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN)
    cooldownRef.current = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(cooldownRef.current!); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const activeEmail = tab === 'signup' ? signupEmail : loginEmail

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setFormError('')
    try {
      const res  = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: activeEmail.trim(), mode: tab }),
      })
      const json = await res.json() as { ok?: boolean; notFound?: boolean; cancelled?: boolean; error?: string }

      if (json.ok) {
        setOtpSent(true)
        startCooldown()
      } else if (json.notFound) {
        setFormError('No account found for that email. Sign up to get started.')
      } else if (json.cancelled) {
        setFormError('This account has been cancelled. Contact us if you think this is a mistake.')
      } else {
        setFormError(json.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setFormError('Connection error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  async function handleResend() {
    if (cooldown > 0 || sending) return
    setSending(true)
    setFormError('')
    setOtp('')
    try {
      const res  = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: activeEmail.trim(), mode: tab }),
      })
      const json = await res.json() as { ok?: boolean; error?: string }
      if (json.ok) {
        startCooldown()
        showToast('New code sent. Check your inbox.')
      } else {
        setFormError(json.error ?? 'Failed to resend. Please try again.')
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
      const res  = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: activeEmail.trim(),
          token: code,
          firstName: firstName.trim() || undefined,
          lastName:  lastName.trim()  || undefined,
        }),
      })
      const json = await res.json() as { success?: boolean; isNew?: boolean; error?: string }
      if (json.success) {
        localStorage.setItem('dashboard_email', activeEmail.trim().toLowerCase())
        router.push(nextPath)
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

  function switchTab(t: 'signup' | 'login') {
    setTab(t)
    setOtpSent(false)
    setOtp('')
    setFormError('')
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    setCooldown(0)
  }

  // ── OTP step (shared) ──────────────────────────────────────────────────────
  if (otpSent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', fontFamily: fontB }}>
        <style>{`
          @keyframes spin   { to { transform: rotate(360deg) } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
          .auth-input:focus { border-color: ${Orange} !important; }
          .otp-input { letter-spacing: 0.35em; font-size: 28px; text-align: center; font-family: ${fontB}; }
          .otp-input:focus { border-color: ${Orange} !important; box-shadow: 0 0 0 3px rgba(232,51,10,0.08); }
        `}</style>

        <div className="hidden lg:flex" style={{ width: '44%', background: Dark, flexDirection: 'column', justifyContent: 'center', padding: '60px 56px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 52 }}>
            <div style={{ width: 30, height: 30, background: Orange, flexShrink: 0 }} />
            <span style={{ fontFamily: font, fontWeight: 700, fontSize: 18, color: '#fff' }}>ICP Brand</span>
          </Link>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(232,51,10,0.15)', border: '1px solid rgba(232,51,10,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
            <Mail size={24} color={Orange} />
          </div>
          <h2 style={{ fontFamily: font, fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.03em' }}>Check your inbox</h2>
          <p style={{ fontFamily: fontB, fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}>
            We sent a 6-digit code to<br />
            <strong style={{ color: '#fff' }}>{activeEmail}</strong>
          </p>
          <p style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 40 }}>
            The code expires in 10 minutes. Check your spam folder if you don&apos;t see it.
          </p>
        </div>

        <div style={{ flex: 1, background: '#fffefb', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 24px' }}>
          <div style={{ width: '100%', maxWidth: 400, animation: 'fadeIn 0.25s ease' }}>

            <button onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: Muted, fontFamily: fontB, fontSize: 13, padding: 0, marginBottom: 32 }}>
              <ArrowLeft size={14} /> Back
            </button>

            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(232,51,10,0.08)', border: `1px solid rgba(232,51,10,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Mail size={20} color={Orange} />
            </div>

            <h2 style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: Dark, margin: '0 0 6px', letterSpacing: '-0.03em' }}>Enter your code</h2>
            <p style={{ fontFamily: fontB, fontSize: 13, color: Muted, margin: '0 0 28px', lineHeight: 1.6 }}>
              We sent a 6-digit code to <strong style={{ color: Dark }}>{activeEmail}</strong>
            </p>

            <input
              ref={otpInputRef}
              className="auth-input otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={e => handleOtpChange(e.target.value)}
              disabled={verifying}
              style={{
                ...inputStyle,
                letterSpacing: '0.35em',
                fontSize: 28,
                textAlign: 'center',
                opacity: verifying ? 0.6 : 1,
                borderColor: formError ? '#dc2626' : Border,
              }}
            />

            {formError && (
              <p style={{ fontFamily: fontB, color: '#dc2626', fontSize: 13, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', padding: '10px 14px', margin: '10px 0 0', borderRadius: 4 }}>{formError}</p>
            )}

            <button
              onClick={() => handleVerifyOtp(otp)}
              disabled={otp.length !== 6 || verifying}
              style={{ width: '100%', background: Orange, color: '#fff', border: 'none', borderRadius: 6, padding: '14px 16px', fontSize: 15, fontWeight: 700, cursor: (otp.length !== 6 || verifying) ? 'not-allowed' : 'pointer', opacity: (otp.length !== 6 || verifying) ? 0.45 : 1, fontFamily: font, marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {verifying ? (
                <>
                  <svg style={{ animation: 'spin 0.8s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" opacity="0.75"/></svg>
                  Verifying...
                </>
              ) : 'Verify and continue'}
            </button>

            <p style={{ fontFamily: fontB, fontSize: 13, color: Muted, textAlign: 'center', marginTop: 20 }}>
              {cooldown > 0 ? (
                <>Resend available in <strong style={{ color: Dark }}>{cooldown}s</strong></>
              ) : (
                <>
                  Didn&apos;t receive it?{' '}
                  <button onClick={handleResend} disabled={sending} style={{ background: 'none', border: 'none', cursor: sending ? 'not-allowed' : 'pointer', color: Orange, fontWeight: 600, fontFamily: fontB, fontSize: 13, padding: 0 }}>
                    {sending ? 'Sending...' : 'Resend code'}
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {toast && (
          <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: Dark, color: '#fff', padding: '12px 20px', fontFamily: fontB, fontSize: 14, zIndex: 100, boxShadow: '0 8px 32px rgba(32,21,21,0.2)', whiteSpace: 'nowrap', borderRadius: 4 }}>
            {toast}
          </div>
        )}
      </div>
    )
  }

  // ── Email entry step ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: fontB }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
        .auth-input:focus  { border-color: ${Orange} !important; }
        .auth-btn-switch:hover { color: ${Orange} !important; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* Left column */}
      <div className="hidden lg:flex" style={{ width: '44%', background: Dark, flexDirection: 'column', justifyContent: 'center', padding: '60px 56px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 52 }}>
          <div style={{ width: 30, height: 30, background: Orange, flexShrink: 0 }} />
          <span style={{ fontFamily: font, fontWeight: 700, fontSize: 18, color: '#fff' }}>ICP Brand</span>
        </Link>

        <h1 style={{ fontFamily: font, fontSize: 34, fontWeight: 700, color: '#fff', margin: '0 0 16px', lineHeight: 1.18, letterSpacing: '-0.04em' }}>
          Diagnose and fix<br />your ICP
        </h1>
        <p style={{ fontFamily: fontB, fontSize: 15, color: 'rgba(255,255,255,0.55)', margin: '0 0 40px', lineHeight: 1.65 }}>
          The diagnostic platform for B2B teams that want more qualified pipeline.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[
            'Full ICP health score with revenue impact',
            'Prioritized quick wins for your sales team',
            'Weekly market intelligence, tailored to your segment',
          ].map((text) => (
            <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Check size={17} color={Orange} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontFamily: fontB, fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>{text}</span>
            </div>
          ))}
        </div>

        <p style={{ fontFamily: fontB, fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 52 }}>
          Trusted by 200+ B2B teams
        </p>
      </div>

      {/* Right column */}
      <div style={{ flex: 1, background: '#fffefb', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 24px' }}>

        {/* Mobile logo */}
        <Link href="/" className="flex lg:hidden" style={{ alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 40 }}>
          <div style={{ width: 26, height: 26, background: Orange }} />
          <span style={{ fontFamily: font, fontWeight: 700, fontSize: 16, color: Dark }}>ICP Brand</span>
        </Link>

        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Tab toggle */}
          <div style={{ display: 'flex', background: Warm, border: `1.5px solid ${Border}`, padding: 3, marginBottom: 32 }}>
            {(['signup', 'login'] as const).map((t) => (
              <button key={t} onClick={() => switchTab(t)}
                style={{
                  flex: 1, padding: '10px 16px', border: 'none', cursor: 'pointer',
                  fontFamily: fontB, fontSize: 14, fontWeight: 600,
                  background: tab === t ? '#f8f4f0' : 'transparent',
                  color: tab === t ? Dark : Muted,
                  boxShadow: tab === t ? '0 1px 3px rgba(201,192,177,0.3)' : 'none',
                  transition: 'background 0.15s, color 0.15s',
                }}>
                {t === 'signup' ? 'Sign Up' : 'Log In'}
              </button>
            ))}
          </div>

          {tab === 'signup' ? (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <h2 style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: Dark, margin: '0 0 6px', letterSpacing: '-0.03em' }}>Create your account</h2>
              <p style={{ fontFamily: fontB, fontSize: 13, color: Muted, margin: '0 0 26px' }}>Start with a free ICP diagnostic. No credit card required.</p>

              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input className="auth-input" type="text" placeholder="First name" value={firstName}
                    onChange={e => setFirstName(e.target.value)} required style={inputStyle} />
                  <input className="auth-input" type="text" placeholder="Last name" value={lastName}
                    onChange={e => setLastName(e.target.value)} style={inputStyle} />
                </div>
                <input className="auth-input" type="email" placeholder="Work email" value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)} required style={inputStyle} />

                {formError && (
                  <p style={{ fontFamily: fontB, color: '#dc2626', fontSize: 13, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', padding: '10px 14px', margin: 0, borderRadius: 4 }}>{formError}</p>
                )}

                <button type="submit" disabled={sending}
                  style={{ background: Orange, color: '#fff', border: 'none', borderRadius: 6, padding: '14px 16px', fontSize: 15, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1, fontFamily: font, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {sending ? (
                    <>
                      <svg style={{ animation: 'spin 0.8s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" opacity="0.75"/></svg>
                      Sending code...
                    </>
                  ) : 'Get started — send me a code'}
                </button>

                <p style={{ fontFamily: fontB, fontSize: 12, color: Muted, textAlign: 'center', margin: '4px 0 0', lineHeight: 1.6 }}>
                  By signing up, you agree to our{' '}
                  <Link href="/terms" style={{ color: Dark, textDecoration: 'none', fontWeight: 600 }}>Terms</Link>
                  {' '}and{' '}
                  <Link href="/privacy" style={{ color: Dark, textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>.
                </p>
              </form>

              <p style={{ fontFamily: fontB, textAlign: 'center', fontSize: 13, color: Muted, marginTop: 24 }}>
                Already have an account?{' '}
                <button className="auth-btn-switch" onClick={() => switchTab('login')} style={{ color: Dark, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: fontB, fontSize: 13, transition: 'color 0.15s' }}>
                  Log in
                </button>
              </p>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <h2 style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: Dark, margin: '0 0 6px', letterSpacing: '-0.03em' }}>Log in to your account</h2>
              <p style={{ fontFamily: fontB, fontSize: 13, color: Muted, margin: '0 0 26px' }}>We&apos;ll send a one-time code to your email.</p>

              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input className="auth-input" type="email" placeholder="Work email" value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)} required autoFocus style={inputStyle} />

                {formError && (
                  <p style={{ fontFamily: fontB, color: '#dc2626', fontSize: 13, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', padding: '10px 14px', margin: 0, borderRadius: 4 }}>{formError}</p>
                )}

                <button type="submit" disabled={sending || !loginEmail.trim()}
                  style={{ background: Orange, color: '#fff', border: 'none', borderRadius: 6, padding: '14px 16px', fontSize: 15, fontWeight: 700, cursor: (sending || !loginEmail.trim()) ? 'not-allowed' : 'pointer', opacity: (sending || !loginEmail.trim()) ? 0.45 : 1, fontFamily: font, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {sending ? (
                    <>
                      <svg style={{ animation: 'spin 0.8s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" opacity="0.75"/></svg>
                      Sending code...
                    </>
                  ) : 'Send login code'}
                </button>
              </form>

              <p style={{ fontFamily: fontB, textAlign: 'center', fontSize: 13, color: Muted, marginTop: 24 }}>
                New to ICP Brand?{' '}
                <button className="auth-btn-switch" onClick={() => switchTab('signup')} style={{ color: Dark, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: fontB, fontSize: 13, transition: 'color 0.15s' }}>
                  Sign up for free
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: Dark, color: '#fff', padding: '12px 20px', fontFamily: fontB, fontSize: 14, zIndex: 100, boxShadow: '0 8px 32px rgba(32,21,21,0.2)', whiteSpace: 'nowrap', borderRadius: 4 }}>
          {toast}
        </div>
      )}
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 32, height: 32, border: `3px solid ${Orange}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <AuthInner />
    </Suspense>
  )
}
