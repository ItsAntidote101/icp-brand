import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { clientSnapshot } from '@/lib/client-snapshot'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Writes a first draft for the buyer to edit. It is never sent as is:
// the client only sees a note after the buyer reads it and presses send.
export async function POST(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = supabaseAdmin()

  let b: { userId?: string }
  try { b = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
  if (!b.userId || !/^[0-9a-f-]{36}$/i.test(b.userId)) return NextResponse.json({ error: 'Pick a client' }, { status: 400 })

  const { data: user } = await supabase.from('users').select('id, full_name, company_name, subscription_tier, total_fixes_completed').eq('id', b.userId).maybeSingle()
  if (!user) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const snap  = await clientSnapshot(supabase, user.id, user.total_fixes_completed ?? 0)
  const first = (user.full_name ?? '').trim().split(' ')[0] || 'there'

  const facts = [
    `Client first name: ${first}`,
    user.company_name ? `Business: ${user.company_name}` : '',
    `ICP score: ${snap.score ?? 'no score yet'}${snap.scoreDelta !== null ? ` (${snap.scoreDelta >= 0 ? '+' : ''}${snap.scoreDelta} since the previous diagnosis)` : ''}`,
    `Fixes marked done so far: ${snap.fixesDone}`,
    snap.openFixes.length ? `This week's fixes: ${snap.openFixes.join(' | ')}` : '',
    snap.topFindings.length ? `Top findings: ${snap.topFindings.join(' | ')}` : '',
    snap.weeks.length
      ? `Weekly numbers, newest first: ${snap.weeks.map(w => `week of ${w.week_start}: ${w.currency} ${w.spend} spent, ${w.leads} leads, ${w.sales} sales, cost per lead ${w.cpl ?? 'n/a'}`).join('; ')}`
      : 'Weekly numbers: none logged yet',
  ].filter(Boolean).join('\n')

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: `You draft a short monthly note that Eugene, a media buyer in Nairobi, will edit and send to one of his clients. Write in the first person as a working draft for him.
Rules:
- 60 to 90 words, plain text, two short paragraphs at most. Start with "Hi <first name>,". No sign-off, no subject line.
- Say what moved in their numbers, what it means, and ONE thing to do next.
- Use only the facts given. Never invent numbers, results, competitors or anything about their business. If no weekly numbers are logged, say you would like them to log last week's numbers so you can give a proper read.
- Plain, direct English a busy Kenyan business owner reads on a phone. No hype, no jargon, no exclamation marks, no dashes used as punctuation.`,
      messages: [{ role: 'user', content: facts }],
    })
    const text = res.content.map(c => (c.type === 'text' ? c.text : '')).join('').trim()
    if (!text) throw new Error('empty draft')
    return NextResponse.json({ draft: text })
  } catch (e) {
    console.error('[admin/notes/draft] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not write a draft right now. You can still type the note yourself.' }, { status: 502 })
  }
}
