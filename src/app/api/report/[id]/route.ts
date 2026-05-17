import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )

  console.log('[report] fetching diagnostic id:', params.id)

  // ── Fetch diagnostic + linked questionnaire ────────────────────────────
  const { data: diagnostic, error: fetchError } = await supabase
    .from('diagnostics')
    .select('*, questionnaires(*)')
    .eq('id', params.id)
    .single()

  if (fetchError) {
    console.error('[report] diagnostics fetch error:', JSON.stringify(fetchError))
    return NextResponse.json({ error: fetchError.message }, { status: 404 })
  }

  console.log('[report] diagnostics fetch success — questionnaire_id:', diagnostic.questionnaire_id)

  // ── Upsert to reports table ────────────────────────────────────────────
  const userId: string | null =
    (diagnostic.questionnaires as Record<string, unknown> | null)?.user_id as string ?? null

  const reportPayload = {
    questionnaire_id: diagnostic.questionnaire_id ?? null,
    user_id:          userId,
    report_summary:   diagnostic.diagnosis ?? null,
    generated_at:     new Date().toISOString(),
  }

  console.log('[report] upserting to reports table:', JSON.stringify({
    ...reportPayload,
    report_summary: '[omitted]',
  }))

  const { data: reportRow, error: reportError } = await supabase
    .from('reports')
    .upsert(reportPayload, { onConflict: 'questionnaire_id' })
    .select('id')
    .single()

  if (reportError) {
    console.error('[report] reports upsert error:', JSON.stringify(reportError))
    // Non-fatal — still return the diagnostic data
  } else {
    console.log('[report] reports upsert success — id:', reportRow?.id)
  }

  return NextResponse.json({ report: diagnostic }, { status: 200 })
}
