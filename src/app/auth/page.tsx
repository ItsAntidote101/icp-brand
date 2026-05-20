'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Globe } from 'lucide-react'

const P       = '#302161'
const Pmuted  = 'rgba(48,33,97,0.45)'
const Pborder = 'rgba(48,33,97,0.08)'
const BgAlt   = '#f8f7ff'
const font    = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontB   = "'PolySans Neutral', -apple-system, system-ui, sans-serif"

const inputStyle: React.CSSProperties = {
  background: BgAlt,
  border: `1.5px solid ${Pborder}`,
  borderRadius: 10,
  padding: '13px 14px',
  fontSize: 14,
  color: P,
  outline: 'none',
  fontFamily: fontB,
  width: '100%',
  boxSizing: 'border-box',
}

function AuthInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const defaultTab   = searchParams.get('tab') === 'login' ? 'login' : 'signup'

  const [tab,    setTab]    = useState<'signup' | 'login'>(defaultTab)
  const [toast,  setToast]  = useState('')

  // Sign Up state
  const [firstName,     setFirstName]     = useState('')
  const [lastName,      setLastName]      = useState('')
  const [signupEmail,   setSignupEmail]   = useState('')
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError,   setSignupError]   = useState('')

  // Log In state
  const [loginEmail,   setLoginEmail]   = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError,   setLoginError]   = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupLoading(true)
    setSignupError('')
    try {
      const res  = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupEmail.trim(), firstName: firstName.trim(), lastName: lastName.trim() }),
      })
      const json = await res.json() as { success?: boolean; isNew?: boolean; error?: string }
      if (json.success) {
        localStorage.setItem('dashboard_email', signupEmail.trim().toLowerCase())
        router.push('/dashboard')
      } else {
        setSignupError(json.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setSignupError('Connection error. Please try again.')
    } finally {
      setSignupLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim() }),
      })
      const json = await res.json() as { success?: boolean; notFound?: boolean; inactive?: boolean; error?: string }
      if (json.success) {
        localStorage.setItem('dashboard_email', loginEmail.trim().toLowerCase())
        router.push('/dashboard')
      } else if (json.inactive) {
        router.push('/report/demo?message=Subscribe+to+unlock+your+dashboard')
      } else if (json.notFound) {
        setLoginError('No account found for that email. Sign up to get started.')
      } else {
        setLoginError(json.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setLoginError('Connection error. Please try again.')
    } finally {
      setLoginLoading(false)
    }
  }

  const switchTab = (t: 'signup' | 'login') => {
    setTab(t)
    setSignupError('')
    setLoginError('')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: fontB }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
        .auth-input:focus { border-color: ${P} !important; }
        .auth-btn-google:hover { background: ${BgAlt} !important; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* Left column */}
      <div
        className="hidden lg:flex"
        style={{ width: '44%', background: BgAlt, flexDirection: 'column', justifyContent: 'center', padding: '60px 56px' }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 52 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,${P},#6c4ddd)`, flexShrink: 0 }} />
          <span style={{ fontFamily: font, fontWeight: 700, fontSize: 18, color: P }}>ICP Brand</span>
        </Link>

        <h1 style={{ fontFamily: font, fontSize: 34, fontWeight: 800, color: P, margin: '0 0 16px', lineHeight: 1.18, letterSpacing: '-0.04em' }}>
          Diagnose and fix<br />your ICP
        </h1>
        <p style={{ fontFamily: fontB, fontSize: 15, color: Pmuted, margin: '0 0 40px', lineHeight: 1.65 }}>
          The diagnostic platform for B2B teams that want more qualified pipeline.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            'Full ICP health score with revenue impact',
            'Prioritized quick wins for your sales team',
            'Weekly market intelligence, tailored to your segment',
          ].map((text) => (
            <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <CheckCircle size={19} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontFamily: fontB, fontSize: 14, color: P, lineHeight: 1.55 }}>{text}</span>
            </div>
          ))}
        </div>

        <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, marginTop: 56 }}>
          Trusted by 200+ B2B teams
        </p>
      </div>

      {/* Right column */}
      <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 24px' }}>

        {/* Mobile logo */}
        <Link href="/" className="flex lg:hidden" style={{ alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 40 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: `linear-gradient(135deg,${P},#6c4ddd)` }} />
          <span style={{ fontFamily: font, fontWeight: 700, fontSize: 16, color: P }}>ICP Brand</span>
        </Link>

        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Tab toggle */}
          <div style={{ display: 'flex', background: BgAlt, borderRadius: 12, padding: 4, marginBottom: 32 }}>
            {(['signup', 'login'] as const).map((t) => (
              <button key={t} onClick={() => switchTab(t)}
                style={{
                  flex: 1, padding: '10px 16px', border: 'none', cursor: 'pointer',
                  borderRadius: 9, fontFamily: fontB, fontSize: 14, fontWeight: 600,
                  background: tab === t ? '#fff' : 'transparent',
                  color: tab === t ? P : Pmuted,
                  boxShadow: tab === t ? '0 1px 4px rgba(48,33,97,0.08)' : 'none',
                  transition: 'background 0.15s, color 0.15s',
                }}>
                {t === 'signup' ? 'Sign Up' : 'Log In'}
              </button>
            ))}
          </div>

          {tab === 'signup' ? (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <h2 style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: P, margin: '0 0 6px', letterSpacing: '-0.03em' }}>Create your account</h2>
              <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: '0 0 26px' }}>Start with a free ICP diagnostic. No credit card required.</p>

              <button
                className="auth-btn-google"
                onClick={() => showToast('Google sign-in coming soon')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 16px', border: `1.5px solid ${Pborder}`, borderRadius: 12, background: '#fff', cursor: 'pointer', fontFamily: fontB, fontSize: 14, fontWeight: 600, color: P, marginBottom: 20, transition: 'background 0.15s' }}>
                <Globe size={17} color={P} />
                Continue with Google
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: Pborder }} />
                <span style={{ fontFamily: fontB, fontSize: 12, color: Pmuted }}>or</span>
                <div style={{ flex: 1, height: 1, background: Pborder }} />
              </div>

              <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input className="auth-input" type="text" placeholder="First name" value={firstName}
                    onChange={e => setFirstName(e.target.value)} required style={inputStyle} />
                  <input className="auth-input" type="text" placeholder="Last name" value={lastName}
                    onChange={e => setLastName(e.target.value)} style={inputStyle} />
                </div>
                <input className="auth-input" type="email" placeholder="Work email" value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)} required style={inputStyle} />

                {signupError && (
                  <p style={{ fontFamily: fontB, color: '#ef4444', fontSize: 13, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', margin: 0 }}>{signupError}</p>
                )}

                <button type="submit" disabled={signupLoading}
                  style={{ background: P, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 16px', fontSize: 15, fontWeight: 700, cursor: signupLoading ? 'not-allowed' : 'pointer', opacity: signupLoading ? 0.7 : 1, fontFamily: font, marginTop: 4 }}>
                  {signupLoading ? 'Creating account...' : 'Get started for free'}
                </button>

                <p style={{ fontFamily: fontB, fontSize: 12, color: Pmuted, textAlign: 'center', margin: '4px 0 0', lineHeight: 1.6 }}>
                  By signing up, you agree to our{' '}
                  <Link href="/terms" style={{ color: P, textDecoration: 'none', fontWeight: 600 }}>Terms</Link>
                  {' '}and{' '}
                  <Link href="/privacy" style={{ color: P, textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>.
                </p>
              </form>

              <p style={{ fontFamily: fontB, textAlign: 'center', fontSize: 13, color: Pmuted, marginTop: 24 }}>
                Already have an account?{' '}
                <button onClick={() => switchTab('login')} style={{ color: P, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: fontB, fontSize: 13 }}>
                  Log in
                </button>
              </p>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <h2 style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: P, margin: '0 0 6px', letterSpacing: '-0.03em' }}>Log in to your account</h2>
              <p style={{ fontFamily: fontB, fontSize: 13, color: Pmuted, margin: '0 0 26px' }}>Welcome back. Enter your email to continue.</p>

              <button
                className="auth-btn-google"
                onClick={() => showToast('Google sign-in coming soon')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 16px', border: `1.5px solid ${Pborder}`, borderRadius: 12, background: '#fff', cursor: 'pointer', fontFamily: fontB, fontSize: 14, fontWeight: 600, color: P, marginBottom: 20, transition: 'background 0.15s' }}>
                <Globe size={17} color={P} />
                Continue with Google
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: Pborder }} />
                <span style={{ fontFamily: fontB, fontSize: 12, color: Pmuted }}>or</span>
                <div style={{ flex: 1, height: 1, background: Pborder }} />
              </div>

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input className="auth-input" type="email" placeholder="Work email" value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)} required autoFocus style={inputStyle} />

                {loginError && (
                  <p style={{ fontFamily: fontB, color: '#ef4444', fontSize: 13, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', margin: 0 }}>{loginError}</p>
                )}

                <button type="submit" disabled={loginLoading || !loginEmail.trim()}
                  style={{ background: P, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 16px', fontSize: 15, fontWeight: 700, cursor: (loginLoading || !loginEmail.trim()) ? 'not-allowed' : 'pointer', opacity: (loginLoading || !loginEmail.trim()) ? 0.55 : 1, fontFamily: font, marginTop: 4 }}>
                  {loginLoading ? 'Checking...' : 'Continue'}
                </button>
              </form>

              <p style={{ fontFamily: fontB, textAlign: 'center', fontSize: 13, color: Pmuted, marginTop: 24 }}>
                New to ICP Brand?{' '}
                <button onClick={() => switchTab('signup')} style={{ color: P, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: fontB, fontSize: 13 }}>
                  Sign up for free
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1a1a2e', color: '#fff', padding: '12px 20px', borderRadius: 12, fontFamily: fontB, fontSize: 14, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
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
        <div style={{ width: 32, height: 32, border: '3px solid #302161', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <AuthInner />
    </Suspense>
  )
}
