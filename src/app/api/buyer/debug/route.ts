import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Temporary — remove once the /buyer/login "not registered" bug is
// confirmed fixed. Exposes no secrets: NEXT_PUBLIC_SUPABASE_URL is already
// public, and only a boolean presence check is done on the service role key.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null
  const projectRef = url?.match(/https:\/\/(.+)\.supabase\.co/)?.[1] ?? null
  const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let buyerQuery: { ok: boolean; count?: number; error?: string } = { ok: false }
  if (url && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { count, error } = await db
      .from('media_buyers')
      .select('id', { count: 'exact', head: true })
      .eq('email', 'eugenemybizz@gmail.com')
    buyerQuery = error ? { ok: false, error: error.message } : { ok: true, count: count ?? 0 }
  }

  return NextResponse.json({ projectRef, hasServiceRoleKey, hasAnonKey, buyerQuery })
}
