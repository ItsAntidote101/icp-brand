import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Temporary — remove once the /buyer/login "not registered" bug is
// confirmed fixed. Exposes no secrets: NEXT_PUBLIC_SUPABASE_URL is already
// public, and only a boolean presence check is done on the service role key.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null
  const projectRef = url?.match(/https:\/\/(.+)\.supabase\.co/)?.[1] ?? null
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? null
  const hasServiceRoleKey = !!serviceRoleKey
  const serviceKeyLength = serviceRoleKey?.length ?? 0
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let buyerQuery: Record<string, unknown> = { ok: false, skipped: true }
  if (url && serviceRoleKey) {
    const db = createClient(url, serviceRoleKey)
    const { count, error } = await db
      .from('media_buyers')
      .select('id', { count: 'exact', head: true })
      .eq('email', 'eugenemybizz@gmail.com')
    buyerQuery = error
      ? { ok: false, message: error.message, code: error.code, details: error.details, hint: error.hint }
      : { ok: true, count: count ?? 0 }
  }

  // Bypass supabase-js entirely so we see the real HTTP status/body — a
  // swallowed empty error message from the client usually means the
  // response wasn't the JSON shape it expected (bad/rotated key, wrong
  // host, gateway error page, etc).
  let rawFetch: Record<string, unknown> = { ok: false, skipped: true }
  if (url && serviceRoleKey) {
    try {
      const res = await fetch(
        `${url}/rest/v1/media_buyers?select=id,email,active&email=eq.eugenemybizz@gmail.com`,
        { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } },
      )
      const text = await res.text()
      rawFetch = { status: res.status, statusText: res.statusText, body: text.slice(0, 800) }
    } catch (err) {
      rawFetch = { fetchThrew: err instanceof Error ? err.message : String(err) }
    }
  }

  return NextResponse.json({ projectRef, hasServiceRoleKey, serviceKeyLength, hasAnonKey, buyerQuery, rawFetch })
}
