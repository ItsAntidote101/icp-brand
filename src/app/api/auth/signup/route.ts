import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAccountCreatedEmail } from '@/lib/email'
import { createSessionToken, sessionCookieOptions } from '@/lib/session'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, lastName } = await req.json() as {
      email: string; firstName?: string; lastName?: string
    }
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const { data: existing } = await supabase
      .from('users')
      .select('id, billing_status')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      return NextResponse.json({ success: true, isNew: false, userId: existing.id })
    }

    const fullName = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(' ') || null

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        full_name: fullName,
        subscription_tier: 'free',
        billing_status: 'active',
      })
      .select('id')
      .single()

    if (error || !newUser) {
      console.error('[auth/signup] insert error:', error)
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    void sendAccountCreatedEmail({ to: email.toLowerCase().trim(), name: fullName ?? undefined })
      .then(() => {}, (e: unknown) => { console.error('[auth/signup] email error:', e) })

    const token = createSessionToken(email.toLowerCase().trim(), newUser.id)
    const res = NextResponse.json({ success: true, isNew: true, userId: newUser.id })
    res.cookies.set(sessionCookieOptions(token))
    return res
  } catch (err) {
    console.error('[auth/signup] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
