import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'standardwebhooks'
import { sendOtpEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Supabase Auth "Send Email" hook: Supabase calls this instead of sending
// its own auth email, for every email_action_type (signup, magiclink,
// recovery, email_change, reauthentication, invite). Configure the hook URL
// and copy the generated secret into SUPABASE_AUTH_HOOK_SECRET at
// Authentication -> Hooks -> Send Email in the Supabase dashboard.

type SendEmailHookPayload = {
  user: { email: string }
  email_data: {
    token: string
    token_hash: string
    redirect_to: string
    email_action_type: string
    site_url: string
  }
}

export async function POST(req: NextRequest) {
  const rawSecret = process.env.SUPABASE_AUTH_HOOK_SECRET
  if (!rawSecret) {
    console.error('[auth/hooks/send-email] SUPABASE_AUTH_HOOK_SECRET is not set')
    return NextResponse.json({ error: { http_code: 500, message: 'Hook not configured' } }, { status: 500 })
  }
  // Supabase displays the secret as "v1,whsec_...", but standardwebhooks'
  // Webhook constructor only strips a leading "whsec_" — it doesn't know
  // about Supabase's "v1," prefix, so verification silently fails unless
  // that part is stripped first.
  const secret = rawSecret.replace(/^v1,/, '')

  const rawBody = await req.text()

  let payload: SendEmailHookPayload
  try {
    const wh = new Webhook(secret)
    payload = wh.verify(rawBody, {
      'webhook-id': req.headers.get('webhook-id') ?? '',
      'webhook-timestamp': req.headers.get('webhook-timestamp') ?? '',
      'webhook-signature': req.headers.get('webhook-signature') ?? '',
    }) as SendEmailHookPayload
  } catch (err) {
    console.error('[auth/hooks/send-email] signature verification failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: { http_code: 401, message: 'Invalid signature' } }, { status: 401 })
  }

  try {
    const { error } = await sendOtpEmail({
      to: payload.user.email,
      token: payload.email_data.token,
      actionType: payload.email_data.email_action_type,
    })
    if (error) {
      console.error('[auth/hooks/send-email] Resend error:', JSON.stringify(error))
      return NextResponse.json({ error: { http_code: 500, message: 'Failed to send email' } }, { status: 500 })
    }
  } catch (err) {
    console.error('[auth/hooks/send-email] unexpected error:', err)
    return NextResponse.json({ error: { http_code: 500, message: 'Internal error' } }, { status: 500 })
  }

  return NextResponse.json({})
}
