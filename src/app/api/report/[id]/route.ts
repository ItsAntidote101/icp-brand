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

  // ── Resolve diagnostic: params.id may be a diagnostics.id (post-questionnaire)
  //    or a reports.id (dashboard "View Report" link) — handle both
  let diagnostic: Record<string, unknown> | null = null

  // 1. Try diagnostics table directly
  const { data: diagDirect, error: diagErr } = await supabase
    .from('diagnostics')
    .select('*, questionnaires(*)')
    .eq('id', params.id)
    .maybeSingle()

  if (diagDirect) {
    diagnostic = diagDirect as Record<string, unknown>
  } else {
    // 2. params.id is a reports.id — look up the questionnaire_id then find the diagnostic
    const { data: reportRow } = await supabase
      .from('reports')
      .select('questionnaire_id, report_summary, user_id')
      .eq('id', params.id)
      .maybeSingle()

    if (reportRow?.questionnaire_id) {
      const { data: diagViaQ } = await supabase
        .from('diagnostics')
        .select('*, questionnaires(*)')
        .eq('questionnaire_id', reportRow.questionnaire_id)
        .maybeSingle()

      if (diagViaQ) {
        diagnostic = diagViaQ as Record<string, unknown>
      } else if (reportRow.report_summary) {
        // No diagnostic row but report_summary exists — synthesise a minimal diagnostic object
        const summaryObj = typeof reportRow.report_summary === 'string'
          ? (() => { try { return JSON.parse(reportRow.report_summary) } catch { return {} } })()
          : reportRow.report_summary
        diagnostic = { id: params.id, diagnosis: summaryObj, questionnaire_id: reportRow.questionnaire_id, questionnaires: null }
      }
    }

    if (!diagnostic) {
      console.error('[report] could not resolve diagnostic for id:', params.id, 'diagErr:', JSON.stringify(diagErr))
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
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
  let diagnosisObj: Record<string, unknown> =
    typeof diagnostic.diagnosis === 'string'
      ? (() => { try { return JSON.parse(diagnostic.diagnosis) } catch { return { raw: diagnostic.diagnosis } } })()
      : (diagnostic.diagnosis as Record<string, unknown>) ?? {}

  // ── Auto-repair: re-extract from raw Claude text if score is missing ───
  const hasScore = diagnosisObj.overall_score != null || diagnosisObj.health_score != null
  if (!hasScore && typeof diagnosisObj.raw === 'string' && diagnosisObj.raw.length > 100) {
    const recovered = tryExtractJSON(diagnosisObj.raw)
    if (recovered && (recovered.overall_score != null || recovered.health_score != null)) {
      console.log('[report] auto-repaired diagnosis from raw text for diagnostic', diagnostic.id)
      diagnosisObj = recovered as Record<string, unknown>
      await supabase
        .from('diagnostics')
        .update({ diagnosis: diagnosisObj })
        .eq('id', diagnostic.id)
    }
  }

  // ── Upsert to reports table ────────────────────────────────────────────
  const userId: string | null =
    (diagnostic.questionnaires as Record<string, unknown> | null)?.user_id as string ?? null

  if (diagnostic.questionnaire_id) {
    const { error: reportError } = await supabase
      .from('reports')
      .upsert({
        questionnaire_id: diagnostic.questionnaire_id,
        user_id:          userId,
        report_summary:   JSON.stringify(diagnosisObj),
        generated_at:     new Date().toISOString(),
      }, { onConflict: 'questionnaire_id' })

    if (reportError) {
      console.error('[report] reports upsert error:', JSON.stringify(reportError))
    }
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

  return NextResponse.json({
    report: { ...diagnostic, diagnosis: diagnosisObj },
    isSubscribed: viewerIsSubscribed,
  }, { status: 200 })
}

function tryExtractJSON(text: string): Record<string, unknown> | null {
  const codeBlock = text.match(/```json\s*([\s\S]*?)```/)
  if (codeBlock) {
    try { return JSON.parse(codeBlock[1].trim()) as Record<string, unknown> } catch { /* continue */ }
  }
  const anyBlock = text.match(/```\s*([\s\S]*?)```/)
  if (anyBlock) {
    try { return JSON.parse(anyBlock[1].trim()) as Record<string, unknown> } catch { /* continue */ }
  }
  const start = text.indexOf('{')
  const end   = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && start < end) {
    try { return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown> } catch { /* continue */ }
  }
  return null
}
