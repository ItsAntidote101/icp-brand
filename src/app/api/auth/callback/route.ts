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

  if (!code) {
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
    console.error('[auth/callback] exchange error:', error?.message)
    return NextResponse.redirect(`${baseUrl}/auth?error=oauth_failed`)
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.redirect(`${baseUrl}/auth?error=server_error`)
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

  const email    = user.email.toLowerCase().trim()
  const fullName = user.user_metadata?.full_name as string | undefined
  const avatar   = user.user_metadata?.avatar_url as string | undefined

  const { data: existing } = await db
    .from('users')
    .select('id, billing_status')
    .eq('email', email)
    .single()

  let userId: string
  let isNewUser = false

  if (existing) {
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
      console.error('[auth/callback] insert error:', insertErr)
      return NextResponse.redirect(`${baseUrl}/auth?error=server_error`)
    }

    userId    = inserted.id
    isNewUser = true

    void Promise.allSettled([
      sendAccountCreatedEmail({ to: email, name: fullName }),
      sendNewSignupToFounder({ userEmail: email, userName: fullName, source: 'google' }),
    ])
  }

  response.cookies.set(sessionCookieOptions(createSessionToken(email, userId)))

  if (isNewUser) {
    return NextResponse.redirect(`${baseUrl}/dashboard`)
  }

  return response
}
