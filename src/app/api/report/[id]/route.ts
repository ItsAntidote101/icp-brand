import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    serviceKey
  )

  // ── Fetch diagnostic + linked questionnaire ────────────────────────────
  const { data: diagnostic, error: fetchError } = await supabase
    .from('diagnostics')
    .select('*, questionnaires(*)')
    .eq('id', params.id)
    .single()

  if (fetchError) {
    console.error('[report] diagnostics fetch error:', JSON.stringify(fetchError))
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // ── Ownership check: if a session exists, verify it owns this report ───
  // If no session (e.g. immediate post-questionnaire view), allow via UUID obscurity.
  const session = await getSession()
  if (session) {
    const questionnaire = diagnostic.questionnaires as Record<string, unknown> | null
    const reportEmail = (questionnaire?.email as string | undefined)?.toLowerCase()
    if (reportEmail && reportEmail !== session.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // ── Upsert to reports table ────────────────────────────────────────────
  const userId: string | null =
    (diagnostic.questionnaires as Record<string, unknown> | null)?.user_id as string ?? null

  const reportPayload = {
    questionnaire_id: diagnostic.questionnaire_id ?? null,
    user_id:          userId,
    report_summary:   diagnostic.diagnosis ?? null,
    generated_at:     new Date().toISOString(),
  }

  const { data: reportRow, error: reportError } = await supabase
    .from('reports')
    .upsert(reportPayload, { onConflict: 'questionnaire_id' })
    .select('id')
    .single()

  if (reportError) {
    console.error('[report] reports upsert error:', JSON.stringify(reportError))
  }

  return NextResponse.json({ report: diagnostic }, { status: 200 })
}
