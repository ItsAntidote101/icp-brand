import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSessionRequestToFounder, sendSessionConfirmationToUser } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    userEmail: string
    userName: string
    companyName: string
    sessionFormat: string
    preferredTime: string
    notes: string
    diagnostic: { score: number | null; waste: string; topFinding: string }
  }

  const { userEmail, userName, companyName, sessionFormat, preferredTime, notes, diagnostic } = body

  if (!userEmail) {
    return NextResponse.json({ error: 'Missing user email' }, { status: 400 })
  }

  // Save to Supabase (non-fatal if table doesn't exist yet)
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    )
    const { error } = await supabase.from('session_requests').insert({
      user_email: userEmail,
      user_name: userName,
      company_name: companyName,
      session_format: sessionFormat,
      preferred_time: preferredTime,
      additional_notes: notes,
      diagnostic_summary: diagnostic,
      status: 'pending',
    })
    if (error) console.warn('[session-request] DB insert warning:', error.message)
  } catch (err) {
    console.warn('[session-request] DB error (non-fatal):', err)
  }

  // Send both emails (errors are non-fatal individually)
  const [founderResult, userResult] = await Promise.allSettled([
    sendSessionRequestToFounder({ userName, userEmail, companyName, sessionFormat, preferredTime, notes, diagnostic }),
    sendSessionConfirmationToUser({ to: userEmail, name: userName }),
  ])

  if (founderResult.status === 'rejected') console.error('[session-request] founder email failed:', founderResult.reason)
  if (userResult.status === 'rejected') console.error('[session-request] user email failed:', userResult.reason)

  return NextResponse.json({ success: true }, { status: 200 })
}
