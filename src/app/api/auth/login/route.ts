import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// This endpoint has been replaced by /api/auth/send-otp + /api/auth/verify-otp.
// Returning 410 Gone so any stale client gets a clear signal rather than silent auth.
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is no longer active. Use /api/auth/send-otp and /api/auth/verify-otp.' },
    { status: 410 },
  )
}
