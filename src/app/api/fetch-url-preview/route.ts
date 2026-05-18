import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BLOCKED_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^::1$/,
  /^0\./,
  /^169\.254\./,
]

function isBlockedHost(hostname: string): boolean {
  return BLOCKED_PATTERNS.some(p => p.test(hostname))
}

function extractMeta(html: string, name: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'),
  ]
  for (const p of patterns) {
    const m = html.match(p)
    if (m?.[1]) return m[1].trim()
  }
  return ''
}

function extractOg(html: string, prop: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`, 'i'),
  ]
  for (const p of patterns) {
    const m = html.match(p)
    if (m?.[1]) return m[1].trim()
  }
  return ''
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const rawUrl = searchParams.get('url') ?? ''

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only http/https URLs are allowed' }, { status: 400 })
  }

  if (isBlockedHost(parsed.hostname)) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 400 })
  }

  let html: string
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: { 'User-Agent': 'ICPDiagnostic/1.0 (preview fetch)' },
    })
    clearTimeout(timeout)
    if (!res.ok) {
      return NextResponse.json({ error: `Fetch failed: ${res.status}` }, { status: 422 })
    }
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) {
      return NextResponse.json({ error: 'Not an HTML page' }, { status: 422 })
    }
    // Read at most 100 KB to keep it fast
    const buffer = await res.arrayBuffer()
    html = new TextDecoder().decode(buffer.slice(0, 100_000))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Fetch error'
    return NextResponse.json({ error: msg }, { status: 422 })
  }

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch?.[1]?.trim() ?? ''

  const description =
    extractMeta(html, 'description') ||
    extractOg(html, 'description') ||
    ''

  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  const h1 = h1Match?.[1]?.trim() ?? ''

  const formCount = (html.match(/<form[\s>]/gi) ?? []).length

  return NextResponse.json({ title, description, h1, formCount })
}
