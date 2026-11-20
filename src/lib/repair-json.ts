// Reads JSON that an AI model wrote, including replies wrapped in ```json
// fences and replies cut off mid-sentence by the output limit.
//
// A cut-off reply used to be saved as { raw: "..." } and the dashboard then
// showed no score and no findings. This walks the text, remembers the last
// point where the JSON was still complete, cuts back to it and closes whatever
// was left open, so the customer keeps everything written before the cut.

export function parseModelJson(text: string): unknown {
  if (!text) return null
  let t = text.trim()

  try { return JSON.parse(t) } catch { /* continue */ }

  // Strip a leading code fence (the closing fence is missing when cut off)
  const fence = t.match(/```(?:json)?\s*/i)
  if (fence && fence.index !== undefined) t = t.slice(fence.index + fence[0].length)
  const closing = t.lastIndexOf('```')
  if (closing > 0) {
    try { return JSON.parse(t.slice(0, closing).trim()) } catch { /* continue */ }
  }

  const start = t.indexOf('{')
  if (start === -1) return null
  t = t.slice(start)

  const end = t.lastIndexOf('}')
  if (end > 0) {
    try { return JSON.parse(t.slice(0, end + 1)) } catch { /* continue */ }
  }

  return repairTruncated(t)
}

function repairTruncated(t: string): unknown {
  const stack: string[] = []          // open '{' and '['
  let inString = false
  let escaped  = false
  // Position just after the last complete value, with the stack at that point
  let safeEnd = 0
  let safeStack: string[] = []

  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (inString) {
      if (escaped) escaped = false
      else if (c === '\\') escaped = true
      else if (c === '"') inString = false
      continue
    }
    if (c === '"') { inString = true; continue }
    if (c === '{' || c === '[') { stack.push(c); continue }
    if (c === '}' || c === ']') {
      stack.pop()
      safeEnd = i + 1
      safeStack = stack.slice()
      if (stack.length === 0) break
      continue
    }
    if (c === ',') {
      // Everything before this comma is a complete member
      safeEnd = i
      safeStack = stack.slice()
    }
  }

  if (safeEnd === 0) return null
  let out = t.slice(0, safeEnd).replace(/,\s*$/, '')
  for (let i = safeStack.length - 1; i >= 0; i--) out += safeStack[i] === '{' ? '}' : ']'
  try { return JSON.parse(out) } catch { return null }
}

// Older reports were written in an alarmed, Title Case style with figures packed
// into the heading ("Unit Economics are Catastrophically Inverted: CAC (KES 7.5M)
// Exceeds LTV by 150:1"). Headings are shown calmly: no alarm adverbs, nothing
// after a colon, sentence case. The explanation under each heading is untouched.
const ALARM = /\b(catastrophically|completely|entirely|fundamentally|critically|severely|massively|totally|utterly|dangerously)\s+/gi
const KEEP_CAPS = new Set(['Kenya', 'Kenyan', 'Nairobi', 'Mombasa', 'Kisumu', 'Africa', 'African', 'Google', 'Meta', 'Facebook', 'Instagram', 'WhatsApp', 'TikTok', 'LinkedIn', 'YouTube', 'M-Pesa', 'Ads'])

export function calmTitle(title: string): string {
  let t = title.replace(ALARM, '').trim()
  const colon = t.indexOf(': ')
  if (colon > 12) t = t.slice(0, colon)
  const words   = t.split(/\s+/)
  const titled  = (w: string) => /^[A-Z][a-z]*(-[A-Z][a-z]+)*[,.']?s?$/.test(w)           // "Landing", "Non-Functional", "A"
  const plain   = words.filter(w => /^[A-Za-z][a-z]*(-[A-Za-z][a-z]+)*[,.']?s?$/.test(w))   // ignores ICP, LTV:CAC, 0.28:1
  if (words.length >= 3 && plain.length > 0 && plain.filter(titled).length / plain.length >= 0.5) {
    t = words.map((w, i) => i === 0 || !titled(w) || KEEP_CAPS.has(w.replace(/[^A-Za-z-]/g, '').replace(/s$/, '')) || KEEP_CAPS.has(w.replace(/[^A-Za-z-]/g, '')) ? w : w.toLowerCase()).join(' ')
  }
  return t.replace(/[.:;,]+$/, '')
}

function calmHeadings(value: unknown, depth = 0): void {
  if (!value || typeof value !== 'object' || depth > 6) return
  if (Array.isArray(value)) { value.forEach(v => calmHeadings(v, depth + 1)); return }
  const o = value as Record<string, unknown>
  for (const k of Object.keys(o)) {
    if (k === 'title' && typeof o[k] === 'string') o[k] = calmTitle(o[k] as string)
    else calmHeadings(o[k], depth + 1)
  }
}

/** Dashboard side: a stored report, including older ones saved as { raw }. */
export function readStoredReport<T extends object>(stored: string | object | null | undefined): T {
  const report = readRaw<T>(stored)
  calmHeadings(report)
  return report
}

function readRaw<T extends object>(stored: string | object | null | undefined): T {
  if (!stored) return {} as T
  let value: unknown = stored
  if (typeof stored === 'string') {
    try { value = JSON.parse(stored) } catch { value = parseModelJson(stored) }
  }
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>
    if (typeof v.raw === 'string' && !('overall_score' in v) && !('health_score' in v)) {
      const repaired = parseModelJson(v.raw)
      if (repaired && typeof repaired === 'object') {
        const { raw: _raw, ...rest } = v
        void _raw
        return { ...(repaired as object), ...rest } as T
      }
    }
    return value as T
  }
  return {} as T
}
