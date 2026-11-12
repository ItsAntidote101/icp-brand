import dns from 'node:dns/promises'
import net from 'node:net'

// Server-side fetching of customer-supplied URLs, with SSRF protection.
// Every hop (including redirects) is resolved and refused if it lands on a
// private, loopback, link-local or metadata address.

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

export async function isBlockedHost(hostname: string): Promise<boolean> {
  const h = hostname.replace(/^\[|\]$/g, '')
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal')) return true
  try {
    const addrs = await dns.lookup(h, { all: true })
    return addrs.length === 0 || addrs.some(a => isPrivateIp(a.address))
  } catch {
    return true
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
}

export type LandingPageSnapshot = {
  ok: true
  url: string
  title: string
  description: string
  headings: string[]
  ctas: string[]
  formCount: number
  hasWhatsApp: boolean
  hasPhone: boolean
  text: string
} | { ok: false; url: string; reason: string }

/**
 * Loads a landing page and returns what a visitor would actually read on it.
 * Never throws. Follows up to 3 redirects, checking each one.
 */
export async function fetchLandingPage(rawUrl: string): Promise<LandingPageSnapshot> {
  const input = (rawUrl ?? '').trim()
  if (!input) return { ok: false, url: '', reason: 'No URL provided' }
  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`)
  } catch {
    return { ok: false, url: input, reason: 'Not a valid URL' }
  }

  let html = ''
  try {
    for (let hop = 0; hop < 4; hop++) {
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok: false, url: url.toString(), reason: 'Only http and https pages can be checked' }
      if (await isBlockedHost(url.hostname)) return { ok: false, url: url.toString(), reason: 'The address could not be reached' }
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      const res = await fetch(url.toString(), {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; IdealICP-LandingPageCheck/1.0; +https://www.idealicp.com)',
          Accept: 'text/html,application/xhtml+xml',
        },
      }).finally(() => clearTimeout(timeout))
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location')
        if (!loc) return { ok: false, url: url.toString(), reason: `Redirect without a destination (${res.status})` }
        url = new URL(loc, url)
        continue
      }
      if (!res.ok) return { ok: false, url: url.toString(), reason: `The page returned an error (${res.status})` }
      const type = res.headers.get('content-type') ?? ''
      if (!type.includes('html')) return { ok: false, url: url.toString(), reason: 'The address is not a web page' }
      const buf = await res.arrayBuffer()
      html = new TextDecoder().decode(buf.slice(0, 400_000))
      break
    }
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError'
    return { ok: false, url: url.toString(), reason: aborted ? 'The page took too long to load' : 'The page could not be loaded' }
  }
  if (!html) return { ok: false, url: url.toString(), reason: 'Too many redirects' }

  const pick = (re: RegExp) => decodeEntities((html.match(re)?.[1] ?? '').replace(/\s+/g, ' ').trim())
  const title = pick(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const description =
    pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
    pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i)

  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')

  const strip = (s: string) => decodeEntities(s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
  const headings = Array.from(body.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi))
    .map(m => strip(m[1])).filter(Boolean).slice(0, 12)
  const ctas = Array.from(body.matchAll(/<(?:button|a)[^>]*>([\s\S]*?)<\/(?:button|a)>/gi))
    .map(m => strip(m[1])).filter(t => t.length > 1 && t.length < 40).slice(0, 25)
  const text = strip(body).slice(0, 6000)

  return {
    ok: true,
    url: url.toString(),
    title,
    description,
    headings,
    ctas: Array.from(new Set(ctas)),
    formCount: (body.match(/<form[\s>]/gi) ?? []).length,
    hasWhatsApp: /wa\.me|api\.whatsapp\.com|whatsapp/i.test(html),
    hasPhone: /href=["']tel:/i.test(html),
    text,
  }
}

/** Plain-text block for an AI prompt describing what was (or wasn't) found. */
export function describeLandingPage(s: LandingPageSnapshot): string {
  if (!s.ok) {
    return `LANDING PAGE CHECK: We tried to load ${s.url || 'the landing page'} and could not (${s.reason}). Do not guess what the page says. In landing_page_assessment, say plainly that the page could not be loaded and why, and base funnel findings only on the questionnaire answers.`
  }
  return `LANDING PAGE CHECK: We loaded ${s.url} just now. This is what a visitor sees (base landing_page_assessment ONLY on this, quote real headlines or buttons where useful, and never describe anything that is not listed here):
- Page title: ${s.title || '(none)'}
- Meta description: ${s.description || '(none)'}
- Headings: ${s.headings.length ? s.headings.join(' | ') : '(none found)'}
- Buttons and links: ${s.ctas.length ? s.ctas.join(' | ') : '(none found)'}
- Forms on page: ${s.formCount}
- WhatsApp link: ${s.hasWhatsApp ? 'yes' : 'no'}; click-to-call phone link: ${s.hasPhone ? 'yes' : 'no'}
- Visible text (first part): ${s.text.slice(0, 3500)}
Note: pages built entirely with JavaScript may show little text here. If the text is nearly empty, say the page content could not be read by our checker rather than calling the page empty.`
}
