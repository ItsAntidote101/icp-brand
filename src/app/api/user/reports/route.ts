import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const email = req.nextUrl.searchParams.get('email')
  if (email && session.email !== email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!email) {
    return NextResponse.json({ reports: [] }, { status: 200 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    serviceKey
  )

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (userError || !user) {
    return NextResponse.json({ reports: [] }, { status: 200 })
  }

  const { data: reports } = await supabase
    .from('reports')
    .select('id, questionnaire_id, report_summary, generated_at')
    .eq('user_id', user.id)
    .order('generated_at', { ascending: false })

  return NextResponse.json({ reports: reports ?? [] }, { status: 200 })
}
