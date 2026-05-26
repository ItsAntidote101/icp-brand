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

  // ── Ownership check ────────────────────────────────────────────────────
  const session = await getSession()
  if (session) {
    const questionnaire = diagnostic.questionnaires as Record<string, unknown> | null
    const reportEmail = (questionnaire?.email as string | undefined)?.toLowerCase()
    if (reportEmail && reportEmail !== session.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // ── Resolve the diagnosis object ───────────────────────────────────────
  // diagnosis may be a JS object (JSONB from Supabase) or a string
  let diagnosisObj: Record<string, unknown> =
    typeof diagnostic.diagnosis === 'string'
      ? (() => { try { return JSON.parse(diagnostic.diagnosis) } catch { return { raw: diagnostic.diagnosis } } })()
      : (diagnostic.diagnosis as Record<string, unknown>) ?? {}

  // ── Auto-repair: if diagnosis has no score but has a raw text field,
  //    attempt to re-extract JSON from the raw Claude output
  const hasScore = diagnosisObj.overall_score != null || diagnosisObj.health_score != null
  if (!hasScore && typeof diagnosisObj.raw === 'string' && diagnosisObj.raw.length > 100) {
    const recovered = tryExtractJSON(diagnosisObj.raw)
    if (recovered && (recovered.overall_score != null || recovered.health_score != null)) {
      console.log('[report] auto-repaired diagnosis from raw text for diagnostic', params.id)
      diagnosisObj = recovered as Record<string, unknown>
      // Patch the diagnostics row so future loads don't need repair
      await supabase
        .from('diagnostics')
        .update({ diagnosis: diagnosisObj })
        .eq('id', params.id)
    }
  }

  // ── Upsert to reports table ────────────────────────────────────────────
  const userId: string | null =
    (diagnostic.questionnaires as Record<string, unknown> | null)?.user_id as string ?? null

  const { error: reportError } = await supabase
    .from('reports')
    .upsert({
      questionnaire_id: diagnostic.questionnaire_id ?? null,
      user_id:          userId,
      report_summary:   JSON.stringify(diagnosisObj),
      generated_at:     new Date().toISOString(),
    }, { onConflict: 'questionnaire_id' })

  if (reportError) {
    console.error('[report] reports upsert error:', JSON.stringify(reportError))
  }

  // ── Subscription check ─────────────────────────────────────────────────
  let viewerIsSubscribed = false
  if (session) {
    const { data: viewer } = await supabase
      .from('users')
      .select('subscription_tier, billing_status')
      .eq('email', session.email)
      .single()
    viewerIsSubscribed = !!(
      viewer &&
      viewer.billing_status === 'active' &&
      viewer.subscription_tier !== 'free'
    )
  }

  // Return the repaired diagnosis object so the report page renders correctly
  return NextResponse.json({
    report: { ...diagnostic, diagnosis: diagnosisObj },
    isSubscribed: viewerIsSubscribed,
  }, { status: 200 })
}

function tryExtractJSON(text: string): Record<string, unknown> | null {
  // ```json ... ``` block
  const codeBlock = text.match(/```json\s*([\s\S]*?)```/)
  if (codeBlock) {
    try { return JSON.parse(codeBlock[1].trim()) as Record<string, unknown> } catch { /* continue */ }
  }
  // Any ``` block
  const anyBlock = text.match(/```\s*([\s\S]*?)```/)
  if (anyBlock) {
    try { return JSON.parse(anyBlock[1].trim()) as Record<string, unknown> } catch { /* continue */ }
  }
  // Outermost { ... }
  const start = text.indexOf('{')
  const end   = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && start < end) {
    try { return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown> } catch { /* continue */ }
  }
  return null
}
