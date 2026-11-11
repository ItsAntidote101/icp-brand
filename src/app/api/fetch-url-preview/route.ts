import { NextRequest, NextResponse } from 'next/server'
import dns from 'node:dns/promises'
import net from 'node:net'

export const dynamic = 'force-dynamic'

// Resolve the hostname and refuse anything that lands on a private,
// loopback, link-local or metadata address. Checking the resolved IP (not the
// text of the hostname) also blocks tricks like decimal IPs or DNS names that
// point at 127.0.0.1.
function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number)
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||   // CGNAT
      (a === 169 && b === 254) ||             // link-local / cloud metadata
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224                                // multicast / reserved
    )
  }
  const v6 = ip.toLowerCase()
  if (v6 === '::' || v6 === '::1') return true
  if (v6.startsWith('::ffff:')) return isPrivateIp(v6.slice(7))
  return v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80')
}

async function isBlockedHost(hostname: string): Promise<boolean> {
  const h = hostname.replace(/^\[|\]$/g, '')
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal')) return true
  try {
    const addrs = await dns.lookup(h, { all: true })
    return addrs.length === 0 || addrs.some(a => isPrivateIp(a.address))
  } catch {
    return true
  }
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

  if (await isBlockedHost(parsed.hostname)) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 400 })
  }

  let html: string
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: { 'User-Agent': 'ICPDiagnostic/1.0 (preview fetch)' },
      redirect: 'manual', // a public URL must not bounce us to an internal one
    })
    if (res.status >= 300 && res.status < 400) {
      clearTimeout(timeout)
      return NextResponse.json({ error: 'Redirects are not followed. Use the final URL.' }, { status: 422 })
    }
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
