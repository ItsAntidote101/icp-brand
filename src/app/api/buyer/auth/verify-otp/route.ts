import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createBuyerSessionToken, buyerSessionCookieOptions } from '@/lib/buyerSession'

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
    const { email, token } = await req.json() as { email: string; token: string }

    if (!email || !token) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAuth.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token: token.trim(),
      type: 'email',
    })

    if (error || !data.user?.email) {
      console.error('[buyer/auth/verify-otp] verification failed:', error?.message)
      const msg = error?.message?.toLowerCase() ?? ''
      if (msg.includes('expired') || msg.includes('invalid') || msg.includes('not found')) {
        return NextResponse.json({ error: 'Incorrect or expired code. Please check and try again.' }, { status: 401 })
      }
      return NextResponse.json({ error: 'Verification failed. Please request a new code.' }, { status: 401 })
    }

    const verifiedEmail = data.user.email.toLowerCase().trim()

    const { data: buyer, error: buyerErr } = await db
      .from('media_buyers')
      .select('id, active')
      .eq('email', verifiedEmail)
      .maybeSingle()

    if (buyerErr || !buyer || !buyer.active) {
      console.error('[buyer/auth/verify-otp] buyer lookup:', {
        verifiedEmail,
        buyer,
        buyerErr,
        supabaseProjectRef: process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/(.+)\.supabase\.co/)?.[1],
      })
      return NextResponse.json({ error: 'This email is not registered as a media buyer.' }, { status: 403 })
    }

    const sessionToken = createBuyerSessionToken(verifiedEmail, buyer.id)
    const res = NextResponse.json({ success: true })
    res.cookies.set(buyerSessionCookieOptions(sessionToken))
    return res
  } catch (err) {
    console.error('[buyer/auth/verify-otp] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
