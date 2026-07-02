import { NextResponse } from 'next/server'
import { clearBuyerSessionCookie } from '@/lib/buyerSession'

export const dynamic = 'force-dynamic'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(clearBuyerSessionCookie())
  return res
}
