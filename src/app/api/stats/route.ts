import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// Real platform numbers only. This used to fall back to a hardcoded 9,400
// whenever the query failed, which then showed on the site as "9,400+ teams".
export async function GET() {
  try {
    const supabase = supabaseAdmin()

    const [{ count, error }, { data: waste }] = await Promise.all([
      supabase.from('diagnostics').select('*', { count: 'exact', head: true }),
      supabase.from('social_proof_events').select('waste_amount').eq('event_type', 'waste_found'),
    ])
    if (error) throw error

    const wasteKes = (waste ?? []).reduce(
      (sum: number, r: { waste_amount: number | null }) => sum + (Number(r.waste_amount) || 0),
      0,
    )

    return NextResponse.json({ count: count ?? 0, wasteKes }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('[stats] error:', err)
    return NextResponse.json({ count: null, wasteKes: null }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}
