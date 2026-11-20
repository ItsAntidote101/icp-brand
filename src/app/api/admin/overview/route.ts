import { NextResponse } from 'next/server'
import { adminEmails, getAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { callItem, escalationItems, messageItem, type ThreadItem } from '@/lib/admin-data'

export const dynamic = 'force-dynamic'
const DAY_MS = 86_400_000

type TodayItem = {
  key: string; priority: number; at: string
  type: 'escalation' | 'message' | 'call' | 'renewal' | 'note_due' | 'quiet'
  userId: string | null; who: string
  title: string; detail: string
  ref?: ThreadItem['ref']
}

// One call that feeds Today, Clients and Messages.
export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = supabaseAdmin()
  const now = Date.now()
  const since = (days: number) => new Date(now - days * DAY_MS).toISOString()

  const [usersQ, callsQ, escQ, msgQ, notesQ, weeksQ] = await Promise.all([
    supabase.from('users').select('id, email, full_name, company_name, subscription_tier, billing_status, renewal_date, cancelled_at, created_at, last_active_at').order('created_at', { ascending: false }).limit(1000),
    supabase.from('session_requests').select('id, user_email, user_name, company_name, session_format, preferred_time, additional_notes, status, created_at').gte('created_at', since(120)).order('created_at', { ascending: false }).limit(300),
    supabase.from('escalations').select('id, user_id, urgency, user_note, status, admin_reply, replied_at, created_at').gte('created_at', since(120)).order('created_at', { ascending: false }).limit(300),
    supabase.from('client_messages').select('id, user_id, direction, kind, body, created_at, handled_at').gte('created_at', since(120)).order('created_at', { ascending: false }).limit(500),
    supabase.from('buyer_notes').select('user_id, sent_at').eq('status', 'sent').gte('sent_at', since(60)),
    supabase.from('weekly_checkins').select('user_id, week_start').gte('week_start', since(90).slice(0, 10)),
  ])
  if (usersQ.error) return NextResponse.json({ error: usersQ.error.message }, { status: 500 })

  // Admin logins are not clients
  const admins  = new Set(adminEmails())
  const users   = (usersQ.data ?? []).filter(u => !admins.has(u.email.toLowerCase()))
  const byId    = new Map(users.map(u => [u.id, u]))
  const byEmail = new Map(users.map(u => [u.email.toLowerCase(), u]))
  const nameOf  = (u?: { full_name: string | null; email: string } | null, fallback = 'Someone') => u ? (u.full_name || u.email) : fallback

  const lastNote  = new Map<string, number>()
  for (const n of notesQ.data ?? []) lastNote.set(n.user_id, Math.max(lastNote.get(n.user_id) ?? 0, new Date(n.sent_at as string).getTime()))
  const weeksBy   = new Map<string, { count: number; latest: string }>()
  for (const w of weeksQ.data ?? []) {
    const cur = weeksBy.get(w.user_id) ?? { count: 0, latest: '' }
    weeksBy.set(w.user_id, { count: cur.count + 1, latest: w.week_start > cur.latest ? w.week_start : cur.latest })
  }

  // ── Conversations, per client ───────────────────────────────────────────
  const items = new Map<string, ThreadItem[]>()       // userId -> items
  const push  = (uid: string | null | undefined, it: ThreadItem) => { if (uid) items.set(uid, [...(items.get(uid) ?? []), it]) }
  const today: TodayItem[] = []

  for (const c of callsQ.data ?? []) {
    const u = byEmail.get((c.user_email ?? '').toLowerCase())
    const it = callItem(c)
    push(u?.id, it)
    if (it.open) today.push({ key: it.key, priority: 2, at: it.at, type: 'call', userId: u?.id ?? null, who: nameOf(u, c.user_name || c.user_email), title: it.label, detail: it.body, ref: it.ref })
  }
  for (const e of escQ.data ?? []) {
    const u = byId.get(e.user_id)
    const [ask, ...rest] = escalationItems(e)
    push(e.user_id, ask); rest.forEach(r => push(e.user_id, r))
    if (ask.open) today.push({ key: ask.key, priority: 0, at: ask.at, type: 'escalation', userId: e.user_id, who: nameOf(u), title: ask.label, detail: ask.body, ref: ask.ref })
  }
  for (const m of msgQ.data ?? []) {
    const u = byId.get(m.user_id)
    const it = messageItem(m)
    push(m.user_id, it)
    if (it.open) today.push({ key: it.key, priority: 1, at: it.at, type: 'message', userId: m.user_id, who: nameOf(u), title: it.label, detail: it.body, ref: it.ref })
  }

  // ── Clients, and the quieter reminders ──────────────────────────────────
  const clients = users.map(u => {
    const paid     = u.subscription_tier !== 'free' && u.billing_status === 'active'
    const renewsIn = u.renewal_date ? Math.ceil((new Date(u.renewal_date).getTime() - now) / DAY_MS) : null
    const seen     = new Date(u.last_active_at ?? u.created_at).getTime()
    const wk       = weeksBy.get(u.id)
    const thread   = items.get(u.id) ?? []
    const open     = thread.filter(i => i.open).length
    const noteAt   = lastNote.get(u.id) ?? 0
    const who      = nameOf(u)

    if (paid) {
      if (renewsIn !== null && renewsIn <= 7 && renewsIn >= -3 && !u.cancelled_at)
        today.push({ key: `renew-${u.id}`, priority: 3, at: u.renewal_date as string, type: 'renewal', userId: u.id, who, title: renewsIn < 0 ? 'Plan ended, not renewed yet' : renewsIn === 0 ? 'Plan ends today' : `Plan ends in ${renewsIn} ${renewsIn === 1 ? 'day' : 'days'}`, detail: `${u.subscription_tier.charAt(0).toUpperCase()}${u.subscription_tier.slice(1)} plan. A note or a quick message this week helps them renew.` })
      if (!noteAt || now - noteAt > 28 * DAY_MS)
        today.push({ key: `note-${u.id}`, priority: 4, at: new Date(noteAt || u.created_at).toISOString(), type: 'note_due', userId: u.id, who, title: 'Monthly note due', detail: noteAt ? `Last note ${Math.round((now - noteAt) / DAY_MS)} days ago.` : 'No note sent yet.' })
      const lastWeek = wk ? new Date(`${wk.latest}T00:00:00Z`).getTime() : 0
      if (now - seen > 21 * DAY_MS && now - lastWeek > 28 * DAY_MS)
        today.push({ key: `quiet-${u.id}`, priority: 5, at: new Date(seen).toISOString(), type: 'quiet', userId: u.id, who, title: 'Gone quiet', detail: `No login for ${Math.round((now - seen) / DAY_MS)} days and no numbers logged. Worth a personal message.` })
    }
    return {
      id: u.id, name: u.full_name, email: u.email, company: u.company_name,
      tier: u.subscription_tier, status: u.billing_status, renewsIn, cancelled: !!u.cancelled_at,
      lastSeen: new Date(seen).toISOString(), weeksLogged: wk?.count ?? 0, open,
      lastMessage: thread.length ? thread.reduce((a, b) => (a.at > b.at ? a : b)) : null,
    }
  })

  today.sort((a, b) => a.priority - b.priority || a.at.localeCompare(b.at))
  return NextResponse.json({ today, clients })
}
