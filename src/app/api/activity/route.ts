import { NextResponse } from 'next/server'
import { getVerifiedSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { weekLabel } from '@/lib/weeks'

export const dynamic = 'force-dynamic'
const DAY_MS = 86_400_000

type Event = { at: string; who: 'you' | 'eugene' | 'system'; text: string }

// "What happened on your account": the last two weeks of real events, newest
// first. Every line comes from a row that exists. Nothing is implied: the media buyer
// is only said to have looked at the numbers when he opened the client's page.
export async function GET() {
  const session = await getVerifiedSession()
  if (!session) return NextResponse.json({ events: [] })
  const supabase = supabaseAdmin()
  const since = new Date(Date.now() - 14 * DAY_MS).toISOString()
  const id = session.userId

  const [weeks, briefs, notes, msgs, fixes, reports, view] = await Promise.all([
    supabase.from('weekly_checkins').select('week_start, created_at').eq('user_id', id).gte('created_at', since).order('created_at', { ascending: false }).limit(4),
    supabase.from('intelligence_briefings').select('briefing_data, research_date').eq('user_id', id).gte('research_date', since).order('research_date', { ascending: false }).limit(3),
    supabase.from('buyer_notes').select('sent_at').eq('user_id', id).eq('status', 'sent').gte('sent_at', since).order('sent_at', { ascending: false }).limit(2),
    supabase.from('client_messages').select('direction, created_at').eq('user_id', id).gte('created_at', since).order('created_at', { ascending: false }).limit(20),
    supabase.from('quick_win_completions').select('win_text, completed_at').eq('user_id', id).gte('completed_at', since).order('completed_at', { ascending: false }).limit(5),
    supabase.from('reports').select('generated_at').eq('user_id', id).gte('generated_at', since).order('generated_at', { ascending: false }).limit(2),
    supabase.from('admin_client_views').select('last_viewed_at').eq('user_id', id).gte('last_viewed_at', since).maybeSingle(),
  ])

  const events: Event[] = []
  for (const w of weeks.data ?? []) events.push({ at: w.created_at, who: 'you', text: `You logged your numbers for ${weekLabel(w.week_start)}` })
  for (const b of briefs.data ?? []) {
    const d = b.briefing_data as { version?: number; quiet?: boolean; sources?: unknown[]; items?: unknown[] } | null
    if (d?.version !== 2) continue
    const n = Array.isArray(d.sources) ? d.sources.length : 0
    events.push({ at: b.research_date, who: 'system', text: d.quiet ? 'Your market was researched. Nothing notable this week' : `Your market was researched: ${d.items?.length ?? 0} ${d.items?.length === 1 ? 'thing' : 'things'} worth knowing${n ? `, from ${n} ${n === 1 ? 'source' : 'sources'}` : ''}` })
  }
  for (const n of notes.data ?? []) if (n.sent_at) events.push({ at: n.sent_at, who: 'eugene', text: 'Your media buyer sent your monthly note' })
  // One line per day and direction, so a back-and-forth does not flood the list
  const seen = new Set<string>()
  for (const m of msgs.data ?? []) {
    const key = `${m.direction}-${m.created_at.slice(0, 10)}`
    if (seen.has(key)) continue
    seen.add(key)
    events.push({ at: m.created_at, who: m.direction === 'out' ? 'eugene' : 'you', text: m.direction === 'out' ? 'Your media buyer replied to you' : 'You wrote to your media buyer' })
  }
  for (const f of fixes.data ?? []) {
    const t = (f.win_text ?? '').trim()
    events.push({ at: f.completed_at, who: 'you', text: t ? `You finished a fix: ${t.length > 70 ? `${t.slice(0, t.lastIndexOf(' ', 70))}…` : t}` : 'You finished a fix' })
  }
  for (const r of reports.data ?? []) events.push({ at: r.generated_at, who: 'system', text: 'A new diagnosis was run' })
  if (view.data?.last_viewed_at) events.push({ at: view.data.last_viewed_at, who: 'eugene', text: 'Your media buyer looked at your numbers' })

  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  return NextResponse.json({ events: events.slice(0, 12) })
}
