import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createHmac } from 'crypto'

export const dynamic = 'force-dynamic'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost', process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder')

function verifySession(token: string): { email: string } | null {
  const secret = process.env.SESSION_SECRET ?? 'fallback-secret'
  try {
    const [payload, sig] = token.split('.')
    const expected = createHmac('sha256', secret).update(payload).digest('base64url')
    if (sig !== expected) return null
    return JSON.parse(Buffer.from(payload, 'base64url').toString())
  } catch { return null }
}

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('icp_session')?.value
  const session = token ? verifySession(token) : null
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
