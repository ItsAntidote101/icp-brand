import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSessionToken, sessionCookieOptions } from '@/lib/session'
import { sendAccountCreatedEmail, sendNewSignupToFounder } from '@/lib/email'

export const dynamic = 'force-dynamic'

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder',
)

export async function POST(req: NextRequest) {
  try {
    const { email, token, firstName, lastName } = await req.json() as {
      email: string
      token: string
      firstName?: string
      lastName?: string
    }

    if (!email || !token) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
    }

    // Verify the OTP with Supabase — this is the only gate
    const { data, error } = await supabaseAuth.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token: token.trim(),
      type: 'email',
    })

    if (error || !data.user?.email) {
      console.error('[auth/verify-otp] verification failed:', error?.message)
      const msg = error?.message?.toLowerCase() ?? ''
      if (msg.includes('expired') || msg.includes('invalid') || msg.includes('not found')) {
        return NextResponse.json({ error: 'Incorrect or expired code. Please check and try again.' }, { status: 401 })
      }
      return NextResponse.json({ error: 'Verification failed. Please request a new code.' }, { status: 401 })
    }

    const verifiedEmail = data.user.email.toLowerCase().trim()

    // Look up user in our table; create if first time
    const { data: existing } = await db
      .from('users')
      .select('id, billing_status')
      .eq('email', verifiedEmail)
      .maybeSingle()

    let userId: string
    let isNew = false

    if (existing) {
      if (existing.billing_status === 'cancelled') {
        return NextResponse.json({ error: 'This account has been cancelled. Contact support if you think this is a mistake.' }, { status: 403 })
      }
      userId = existing.id
    } else {
      const fullName = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(' ') || null

      const { data: newUser, error: insertErr } = await db
        .from('users')
        .insert({
          email: verifiedEmail,
          full_name: fullName,
          subscription_tier: 'free',
          billing_status: 'active',
        })
        .select('id')
        .single()

      if (insertErr || !newUser) {
        console.error('[auth/verify-otp] insert error:', insertErr)
        return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 })
      }

      userId = newUser.id
      isNew = true

      void Promise.allSettled([
        sendAccountCreatedEmail({ to: verifiedEmail, name: fullName ?? undefined }),
        sendNewSignupToFounder({ userEmail: verifiedEmail, userName: fullName ?? undefined, source: 'email' }),
      ])

      // Attribute referral if a ref code was stored before signup
      const refCode = req.cookies.get('icp_ref')?.value
      if (refCode) {
        void db.from('users')
          .update({ user_badges: { referred_by: refCode.toUpperCase() } })
          .eq('id', userId)
      }
    }

    const sessionToken = createSessionToken(verifiedEmail, userId)
    const res = NextResponse.json({ success: true, isNew })
    res.cookies.set(sessionCookieOptions(sessionToken))
    if (req.cookies.get('icp_ref')) {
      res.cookies.set({ name: 'icp_ref', value: '', maxAge: 0, path: '/' })
    }
    return res
  } catch (err) {
    console.error('[auth/verify-otp] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
