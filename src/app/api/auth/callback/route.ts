import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { createSessionToken, sessionCookieOptions } from '@/lib/session'
import { sendAccountCreatedEmail, sendNewSignupToFounder } from '@/lib/email'

export async function GET(req: NextRequest) {
  const reqUrl = new URL(req.url)
  const { searchParams } = reqUrl
  const code    = searchParams.get('code')
  const next    = searchParams.get('next') ?? '/dashboard'
  // Always use the origin of the incoming request so this works on any
  // deployment (localhost, Vercel preview, production) without configuration.
  const baseUrl = reqUrl.origin

  console.log('[auth/callback] start', { baseUrl, hasCode: !!code, next })

  if (!code) {
    console.error('[auth/callback] no code in query params')
    return NextResponse.redirect(`${baseUrl}/auth?error=no_code`)
  }

  const response = NextResponse.redirect(`${baseUrl}${next}`)

  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error } = await supabaseAuth.auth.exchangeCodeForSession(code)

  if (error || !user?.email) {
    console.error('[auth/callback] exchangeCodeForSession failed:', error?.message ?? 'no user email')
    return NextResponse.redirect(`${baseUrl}/auth?error=oauth_failed`)
  }

  console.log('[auth/callback] exchange ok, user:', user.email)

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    console.error('[auth/callback] SUPABASE_SERVICE_ROLE_KEY missing')
    return NextResponse.redirect(`${baseUrl}/auth?error=server_error`)
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

  const email    = user.email.toLowerCase().trim()
  const fullName = user.user_metadata?.full_name as string | undefined
  const avatar   = user.user_metadata?.avatar_url as string | undefined

  const { data: existing, error: lookupErr } = await db
    .from('users')
    .select('id, billing_status')
    .eq('email', email)
    .single()

  if (lookupErr && lookupErr.code !== 'PGRST116') {
    // PGRST116 = row not found (expected for new users); anything else is unexpected
    console.error('[auth/callback] DB lookup error:', lookupErr.message)
  }

  let userId: string
  let isNewUser = false

  if (existing) {
    console.log('[auth/callback] existing user, billing_status:', existing.billing_status)
    // Existing account: check it's still active
    if (existing.billing_status === 'cancelled') {
      return NextResponse.redirect(`${baseUrl}/auth?error=account_cancelled`)
    }
    userId = existing.id
    await db.from('users').update({
      full_name:  fullName ?? undefined,
      avatar_url: avatar   ?? undefined,
      updated_at: new Date().toISOString(),
    }).eq('id', userId)
  } else {
    // Brand new user: create account
    console.log('[auth/callback] new user, inserting row')
    const { data: inserted, error: insertErr } = await db
      .from('users')
      .insert({
        email,
        full_name:         fullName ?? null,
        avatar_url:        avatar   ?? null,
        subscription_tier: 'free',
        billing_status:    'active',
      })
      .select('id')
      .single()

    if (insertErr || !inserted) {
      console.error('[auth/callback] insert error:', insertErr?.message)
      return NextResponse.redirect(`${baseUrl}/auth?error=server_error`)
    }

    userId    = inserted.id
    isNewUser = true
    console.log('[auth/callback] new user created, id:', userId)

    // Send welcome email and notify founder — fire and forget
    void Promise.allSettled([
      sendAccountCreatedEmail({ to: email, name: fullName }),
      sendNewSignupToFounder({ userEmail: email, userName: fullName, source: 'google' }),
    ])
  }

  response.cookies.set(sessionCookieOptions(createSessionToken(email, userId)))
  console.log('[auth/callback] icp_session set, redirecting to', next, 'isNewUser:', isNewUser)

  // Always return the original response object — it already redirects to /dashboard
  // (next defaults to '/dashboard') and carries all auth cookies (Supabase + icp_session).
  // Previously a new NextResponse was created for new users, which silently discarded cookies.
  return response
}
