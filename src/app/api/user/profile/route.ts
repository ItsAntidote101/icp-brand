import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost', process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder')


export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const email = session.email

  // Try named questionnaire_responses first
  const { data: qData } = await supabase
    .from('questionnaire_responses')
    .select('data')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const qd: Record<string, string> = (qData?.data as Record<string, string>) ?? {}

  // Fallback: numeric-keyed questionnaires table
  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  let r: Record<string, unknown> = {}
  if (userRow?.id) {
    const { data: rawQ } = await supabase
      .from('questionnaires')
      .select('responses')
      .eq('user_id', userRow.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    r = (rawQ?.responses as Record<string, unknown>) ?? {}
  }

  const region   = qd.region   ?? qd.country       ?? (r[11] as string) ?? ''
  const industry = qd.industry ?? qd.business_type  ?? (r[2]  as string) ?? ''
  const product  = qd.product_service ?? qd.offer   ?? (r[1]  as string) ?? ''

  return NextResponse.json({ region, industry, product })
}
