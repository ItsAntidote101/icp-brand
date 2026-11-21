import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSession } from '@/lib/session'
import { loadAllowances } from '@/lib/allowances'

export const dynamic = 'force-dynamic'

// GET  what this client's plan includes this month, what is used, and past months
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ allowances: null }, { status: 401 })
  const supabase = supabaseAdmin()
  const { data: user } = await supabase.from('users').select('id, email, subscription_tier, billing_status').eq('id', session.userId).maybeSingle()
  if (!user) return NextResponse.json({ allowances: null }, { status: 404 })
  return NextResponse.json({ allowances: await loadAllowances(supabase, user) })
}
