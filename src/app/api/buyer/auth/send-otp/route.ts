import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const { email } = await req.json() as { email: string }
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const normalised = email.toLowerCase().trim()

    // Buyer accounts are provisioned by hand (media_buyers table), not self-signup.
    const { data: buyer } = await db
      .from('media_buyers')
      .select('id, active')
      .eq('email', normalised)
      .maybeSingle()

    if (!buyer || !buyer.active) {
      return NextResponse.json({ notFound: true }, { status: 404 })
    }

    // shouldCreateUser: true mirrors the customer OTP flow — Supabase creates
    // the auth identity on first login. Access is still gated by the
    // media_buyers row check above and again on verify.
    const { error } = await supabaseAuth.auth.signInWithOtp({
      email: normalised,
      options: { shouldCreateUser: true },
    })

    if (error) {
      console.error('[buyer/auth/send-otp] supabase error:', error.message)
      if (error.message.toLowerCase().includes('rate limit') || error.status === 429) {
        return NextResponse.json({ error: 'Too many requests. Please wait a few minutes and try again.' }, { status: 429 })
      }
      return NextResponse.json({ error: 'Failed to send code. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[buyer/auth/send-otp] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
