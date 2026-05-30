import { NextRequest, NextResponse } from 'next/server'
import { promises as dns } from 'dns'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TIMEOUT_MS = 4000

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!email || !email.includes('@')) {
      return NextResponse.json({ valid: false, reason: 'invalid_format' })
    }

    const domain = email.split('@')[1]
    if (!domain || !domain.includes('.')) {
      return NextResponse.json({ valid: false, reason: 'invalid_domain' })
    }

    try {
      const mxRecords = await Promise.race([
        dns.resolveMx(domain),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS)
        ),
      ])

      if (Array.isArray(mxRecords) && mxRecords.length > 0) {
        return NextResponse.json({ valid: true })
      }
      // resolveMx returned empty array (no MX records)
      return NextResponse.json({ valid: false, reason: 'no_mx' })
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      const message = (err as { message?: string }).message
      // Domain doesn't exist or has no mail records
      if (code === 'ENOTFOUND' || code === 'ENODATA' || code === 'ESERVFAIL') {
        return NextResponse.json({ valid: false, reason: 'no_mx' })
      }
      // DNS timeout or any other transient error — fail open so real users aren't blocked
      if (message === 'timeout' || code === 'ETIMEOUT' || code === 'ECONNREFUSED') {
        return NextResponse.json({ valid: true, reason: 'timeout_passthrough' })
      }
      // Unknown error — fail open
      return NextResponse.json({ valid: true, reason: 'error_passthrough' })
    }
  } catch {
    // Malformed request body etc — fail open
    return NextResponse.json({ valid: true, reason: 'error_passthrough' })
  }
}
