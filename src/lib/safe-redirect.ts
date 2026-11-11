/**
 * Returns `next` only if it is a same-site relative path, otherwise `fallback`.
 * Blocks open redirects such as "//evil.com", "/\\evil.com", "@evil.com" or "https://evil.com".
 * Safe to import from both server and client code.
 */
export function safeNextPath(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next || typeof next !== 'string') return fallback
  if (!next.startsWith('/')) return fallback
  if (next.startsWith('//') || next.startsWith('/\\')) return fallback
  if (/[\u0000-\u001f]/.test(next)) return fallback
  return next
}
