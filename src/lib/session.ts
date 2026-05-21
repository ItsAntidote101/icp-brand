import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'icp_session'
const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function getSecret(): Buffer {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET env var is not set')
  return Buffer.from(s)
}

function sign(payload: object): string {
  const data = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64url')
  const sig = createHmac('sha256', getSecret()).update(data).digest('base64url')
  return `${data}.${sig}`
}

function verify(token: string): { email: string; userId: string; iat: number } | null {
  const dotIdx = token.lastIndexOf('.')
  if (dotIdx === -1) return null
  const data = token.slice(0, dotIdx)
  const sig = token.slice(dotIdx + 1)
  let expectedBuf: Buffer
  try {
    expectedBuf = Buffer.from(createHmac('sha256', getSecret()).update(data).digest('base64url'))
  } catch { return null }
  const sigBuf = Buffer.from(sig)
  if (expectedBuf.length !== sigBuf.length || !timingSafeEqual(expectedBuf, sigBuf)) return null
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString())
    if (typeof payload.iat !== 'number' || Date.now() - payload.iat > EXPIRY_MS) return null
    if (!payload.email || !payload.userId) return null
    return payload
  } catch { return null }
}

export function createSessionToken(email: string, userId: string): string {
  return sign({ email, userId })
}

export async function getSession(): Promise<{ email: string; userId: string } | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    return verify(token)
  } catch { return null }
}

export async function requireSession(): Promise<{ email: string; userId: string }> {
  const session = await getSession()
  if (!session) {
    const { NextResponse } = await import('next/server')
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return session
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: EXPIRY_MS / 1000,
    path: '/',
  }
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  }
}
