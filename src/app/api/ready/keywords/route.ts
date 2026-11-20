import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSession } from '@/lib/session'
import { parseModelJson } from '@/lib/repair-json'
import { KEYWORD_SYSTEM, keywordPrompt, cleanKeywordSet, type KeywordSet } from '@/lib/ready-files'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const DAILY_LIMIT = 3
const isUuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v)

// GET  ?reportId=  the keyword set already built for this report, if any
export async function GET(req: NextRequest) {
  const session = await getSession()
  const reportId = req.nextUrl.searchParams.get('reportId')
  if (!session || !isUuid(reportId)) return NextResponse.json({ set: null })
  const { data } = await supabaseAdmin().from('ready_files').select('data')
    .eq('user_id', session.userId).eq('report_id', reportId).eq('kind', 'google_keywords').maybeSingle()
  return NextResponse.json({ set: (data?.data as KeywordSet | undefined) ?? null })
}

// POST { reportId }  build the set once from their answers and keep it. Paid plans only.
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Log in again to use this.' }, { status: 401 })
  let b: { reportId?: unknown }
  try { b = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
  if (!isUuid(b.reportId)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const supabase = supabaseAdmin()
  const [{ data: user }, { data: report }] = await Promise.all([
    supabase.from('users').select('id, company_name, subscription_tier, billing_status').eq('id', session.userId).maybeSingle(),
    supabase.from('reports').select('id, user_id, questionnaire_id').eq('id', b.reportId).maybeSingle(),
  ])
  if (!user || !report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 })
  if (user.subscription_tier === 'free' || user.billing_status !== 'active')
    return NextResponse.json({ error: 'Ready to upload files are included from the Starter plan.', upgrade: true }, { status: 403 })

  let answers: Record<string, unknown> = {}
  let owns = report.user_id === user.id
  if (report.questionnaire_id) {
    const { data: q } = await supabase.from('questionnaires').select('user_id, responses').eq('id', report.questionnaire_id).maybeSingle()
    if (q && q.user_id === user.id) owns = true
    if (q && owns) answers = (q.responses ?? {}) as Record<string, unknown>
  }
  if (!owns) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (typeof answers['1'] !== 'string' || !(answers['1'] as string).trim())
    return NextResponse.json({ error: 'We need to know what you sell first. Run a new diagnosis and try again.' }, { status: 400 })

  const { data: existing } = await supabase.from('ready_files').select('data')
    .eq('user_id', user.id).eq('report_id', report.id).eq('kind', 'google_keywords').maybeSingle()
  if (existing) return NextResponse.json({ set: existing.data })

  const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0)
  const { count } = await supabase.from('ready_files').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', dayStart.toISOString())
  if ((count ?? 0) >= DAILY_LIMIT) return NextResponse.json({ error: 'That is all for today. Try again tomorrow.' }, { status: 429 })

  let set: KeywordSet | null = null
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: KEYWORD_SYSTEM,
      messages: [{ role: 'user', content: keywordPrompt(answers, user.company_name ?? '') }],
    })
    const raw = res.content.filter(c => c.type === 'text').map(c => (c as { type: 'text'; text: string }).text).join('')
    const at  = raw.indexOf('{')
    set = cleanKeywordSet(at >= 0 ? parseModelJson(raw.slice(at)) : null)
  } catch (e) {
    console.error('[ready/keywords] model call failed:', e instanceof Error ? e.message : e)
  }
  if (!set) return NextResponse.json({ error: 'Could not build the list just now. Please try again in a minute.' }, { status: 502 })

  const { error } = await supabase.from('ready_files').insert({ user_id: user.id, report_id: report.id, kind: 'google_keywords', data: set })
  if (error && error.code !== '23505') console.error('[ready/keywords] save failed:', error.message)
  return NextResponse.json({ set })
}
