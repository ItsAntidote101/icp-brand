import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://idealicp.com'
  const res = NextResponse.redirect(new URL('/questionnaire', appUrl))
  // Store for 30 days — read at signup to attribute the referral
  res.cookies.set('icp_ref', code.toUpperCase(), {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
    httpOnly: false, // readable client-side for display purposes
  })
  return res
}
