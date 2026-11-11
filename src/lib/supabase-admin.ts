import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client with the service role key.
 *
 * Previously each route fell back to 'http://localhost' / 'build-placeholder'
 * when env vars were missing, so a misconfigured deploy failed silently on
 * every database call. Now a missing variable fails loudly at runtime, while
 * `next build` (which imports routes without real secrets) still works.
 */
export function supabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (url && key) return createClient(url, key)

  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return createClient('http://localhost', 'build-placeholder')
  }

  const missing = [!url && 'NEXT_PUBLIC_SUPABASE_URL', !key && 'SUPABASE_SERVICE_ROLE_KEY'].filter(Boolean).join(', ')
  console.error(`[supabase-admin] Missing environment variable(s): ${missing}`)
  throw new Error(`Missing environment variable(s): ${missing}`)
}
