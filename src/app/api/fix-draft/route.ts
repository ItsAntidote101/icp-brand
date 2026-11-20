import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSession } from '@/lib/session'
import { readStoredReport } from '@/lib/repair-json'
import { DRAFT_SYSTEM, draftPrompt, cleanDraft, type Fix } from '@/lib/fix-draft'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const DAILY_LIMIT = 6
const isUuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v)

type Row = { fix_index: number; draft: string }
const unpack = (rows: Row[]) => Object.fromEntries(rows.map(r => {
  const i = r.draft.indexOf('\n\n')
  return [r.fix_index, i > 0 ? { label: r.draft.slice(0, i), body: r.draft.slice(i + 2) } : { label: 'Draft', body: r.draft }]
}))

// GET  ?reportId=  the drafts already written for this report
export async function GET(req: NextRequest) {
  const session = await getSession()
  const reportId = req.nextUrl.searchParams.get('reportId')
  if (!session || !isUuid(reportId)) return NextResponse.json({ drafts: {} })
  const { data } = await supabaseAdmin().from('fix_drafts').select('fix_index, draft').eq('user_id', session.userId).eq('report_id', reportId)
  return NextResponse.json({ drafts: unpack((data ?? []) as Row[]) })
}

// POST { reportId, index }  write the draft for one fix, once, and keep it
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Log in again to use this.' }, { status: 401 })
  let b: { reportId?: unknown; index?: unknown }
  try { b = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
  const index = typeof b.index === 'number' && Number.isInteger(b.index) ? b.index : -1
  if (!isUuid(b.reportId) || index < 0 || index > 2) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const supabase = supabaseAdmin()
  const [{ data: user }, { data: report }] = await Promise.all([
    supabase.from('users').select('id, company_name, subscription_tier, billing_status').eq('id', session.userId).maybeSingle(),
    supabase.from('reports').select('id, user_id, questionnaire_id, report_summary').eq('id', b.reportId).maybeSingle(),
  ])
  if (!user || !report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 })

  // The report must be theirs, directly or through the questionnaire it came from
  let answers: Record<string, unknown> = {}
  let owns = report.user_id === user.id
  if (report.questionnaire_id) {
    const { data: q } = await supabase.from('questionnaires').select('user_id, responses').eq('id', report.questionnaire_id).maybeSingle()
    if (q && q.user_id === user.id) owns = true
    if (q && owns) answers = (q.responses ?? {}) as Record<string, unknown>
  }
  if (!owns) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const paid = user.subscription_tier !== 'free' && user.billing_status === 'active'
  if (!paid && index > 0) return NextResponse.json({ error: 'Starter writes the wording for every fix.', upgrade: true }, { status: 403 })

  const { data: existing } = await supabase.from('fix_drafts').select('fix_index, draft').eq('user_id', user.id).eq('report_id', report.id).eq('fix_index', index).maybeSingle()
  if (existing) return NextResponse.json({ draft: unpack([existing as Row])[index] })

  const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0)
  const { count } = await supabase.from('fix_drafts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', dayStart.toISOString())
  if ((count ?? 0) >= DAILY_LIMIT) return NextResponse.json({ error: 'That is all the drafts for today. Try again tomorrow.' }, { status: 429 })

  const diag = readStoredReport<{ quick_wins?: Fix[] }>(report.report_summary as string)
  const fix  = (diag.quick_wins ?? []).slice(0, 3)[index]
  if (!fix?.action) return NextResponse.json({ error: 'That fix is not in this report.' }, { status: 404 })

  let draft: { label: string; body: string } | null = null
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: DRAFT_SYSTEM,
      messages: [{ role: 'user', content: draftPrompt(fix, answers, user.company_name ?? '') }],
    })
    draft = cleanDraft(res.content.filter(c => c.type === 'text').map(c => (c as { type: 'text'; text: string }).text).join(''))
  } catch (e) {
    console.error('[fix-draft] model call failed:', e instanceof Error ? e.message : e)
  }
  if (!draft) return NextResponse.json({ error: 'Could not write that just now. Please try again in a minute.' }, { status: 502 })

  const { error } = await supabase.from('fix_drafts').insert({ user_id: user.id, report_id: report.id, fix_index: index, draft: `${draft.label}\n\n${draft.body}` })
  if (error && error.code !== '23505') console.error('[fix-draft] save failed:', error.message)
  return NextResponse.json({ draft })
}
