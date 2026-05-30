import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Anon key for Supabase auth operations
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// Service role for checking our users table
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder',
)

export async function POST(req: NextRequest) {
  try {
    const { email, mode } = await req.json() as { email: string; mode: 'signup' | 'login' }
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const normalised = email.toLowerCase().trim()

    // For login: verify account exists before spending an OTP send
    if (mode === 'login') {
      const { data: existing } = await db
        .from('users')
        .select('id, billing_status')
        .eq('email', normalised)
        .maybeSingle()

      if (!existing) {
        return NextResponse.json({ notFound: true }, { status: 404 })
      }
      if (existing.billing_status === 'cancelled') {
        return NextResponse.json({ cancelled: true }, { status: 403 })
      }
    }

    const { error } = await supabaseAuth.auth.signInWithOtp({
      email: normalised,
      options: { shouldCreateUser: true },
    })

    if (error) {
      console.error('[auth/send-otp] supabase error:', error.message)
      if (error.message.toLowerCase().includes('rate limit') || error.status === 429) {
        return NextResponse.json({ error: 'Too many requests. Please wait a few minutes and try again.' }, { status: 429 })
      }
      return NextResponse.json({ error: 'Failed to send code. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[auth/send-otp] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
