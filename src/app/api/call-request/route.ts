import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSession } from '@/lib/session'
import { sendCallRequestToFounder, sendCallConfirmationToUser } from '@/lib/email'

export const dynamic = 'force-dynamic'

// "Book a free 20-minute call with Eugene": the main ask after the free report.
// Everything about the lead (name, company, score, spend) is read server-side
// from their own report, so the browser only sends contact details.
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 })

  let body: { reportId?: unknown; whatsapp?: unknown; preferredTime?: unknown; notes?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const reportId      = typeof body.reportId === 'string' ? body.reportId : ''
  const whatsappRaw   = typeof body.whatsapp === 'string' ? body.whatsapp.trim() : ''
  const preferredTime = typeof body.preferredTime === 'string' ? body.preferredTime.slice(0, 60) : ''
  const notes         = typeof body.notes === 'string' ? body.notes.trim().slice(0, 1000) : ''

  const digits = whatsappRaw.replace(/[^\d]/g, '')
  if (digits.length < 9 || digits.length > 15) {
    return NextResponse.json({ error: 'Please enter a valid WhatsApp number, e.g. 0712 345 678.' }, { status: 400 })
  }
  if (!reportId) return NextResponse.json({ error: 'Missing report' }, { status: 400 })

  const supabase = supabaseAdmin()

  const { data: diag } = await supabase
    .from('diagnostics')
    .select('id, user_id, diagnosis, questionnaire_id, questionnaires(user_id, responses)')
    .eq('id', reportId)
    .maybeSingle()
  if (!diag) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

  const q = (Array.isArray(diag.questionnaires) ? diag.questionnaires[0] : diag.questionnaires) as
    { user_id?: string; responses?: Record<string, unknown> } | null
  const ownerId = q?.user_id ?? diag.user_id
  if (ownerId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: user } = await supabase
    .from('users')
    .select('email, full_name, company_name')
    .eq('id', session.userId)
    .maybeSingle()
  const email = user?.email ?? session.email

  // One request per person per day is enough; a double click shouldn't email twice
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: recent } = await supabase
    .from('session_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_email', email)
    .gte('created_at', since)
  if ((recent ?? 0) > 0) return NextResponse.json({ success: true, duplicate: true })

  const d = (diag.diagnosis ?? {}) as Record<string, unknown>
  const findings = (d.critical_findings ?? d.findings ?? []) as Array<{ title?: string }>
  const score = typeof d.overall_score === 'number' ? d.overall_score
    : typeof d.health_score === 'number' ? d.health_score : null
  const waste = typeof d.monthly_waste_estimate === 'string' ? d.monthly_waste_estimate : ''
  const topFinding = findings[0]?.title ?? ''
  const responses = q?.responses ?? {}
  const industry = typeof responses['2'] === 'string' ? (responses['2'] as string) : ''
  const adSpend  = typeof responses['13'] === 'string' ? (responses['13'] as string) : ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://idealicp.com'
  const reportUrl = `${appUrl}/report/${diag.id}`

  const { error: insertErr } = await supabase.from('session_requests').insert({
    user_email: email,
    user_name: user?.full_name ?? '',
    company_name: user?.company_name ?? '',
    session_format: 'Free 20-min review call',
    preferred_time: preferredTime,
    additional_notes: `WhatsApp: ${whatsappRaw}${notes ? `\n\n${notes}` : ''}`,
    diagnostic_summary: { score, waste, topFinding, reportId: diag.id, industry, adSpend },
    status: 'pending',
  })
  if (insertErr) {
    console.error('[call-request] insert error:', insertErr.message)
    return NextResponse.json({ error: 'Could not save your request. Please try again.' }, { status: 500 })
  }

  const [founder, confirm] = await Promise.allSettled([
    sendCallRequestToFounder({
      userName: user?.full_name ?? '', userEmail: email, companyName: user?.company_name ?? '',
      whatsapp: whatsappRaw, preferredTime, notes, reportUrl, score, waste, topFinding, industry, adSpend,
    }),
    sendCallConfirmationToUser({ to: email, name: user?.full_name ?? '' }),
  ])
  if (founder.status === 'rejected') console.error('[call-request] founder email failed:', founder.reason)
  if (confirm.status === 'rejected') console.error('[call-request] confirmation email failed:', confirm.reason)

  return NextResponse.json({ success: true })
}
