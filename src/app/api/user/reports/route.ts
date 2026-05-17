import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')

  if (!email) {
    return NextResponse.json({ reports: [] }, { status: 200 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
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

  console.log('[user-reports] found', reports?.length ?? 0, 'reports for user:', user.id)

  return NextResponse.json({ reports: reports ?? [] }, { status: 200 })
}
