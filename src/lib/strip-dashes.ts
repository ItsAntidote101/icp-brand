/**
 * Replaces em and en dashes in AI output (strings, arrays and nested objects).
 * " — " and "— " become ", ", any other dash becomes a hyphen.
 * Shared by every route that post-processes Claude responses.
 */
export function stripDashes(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .replace(/ — /g, ', ')
      .replace(/— /g, ', ')
      .replace(/—/g, '-')
      .replace(/ – /g, ', ')
      .replace(/–/g, '-')
  }
  if (Array.isArray(value)) return value.map(stripDashes)
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = stripDashes(v)
    return out
  }
  return value
}
