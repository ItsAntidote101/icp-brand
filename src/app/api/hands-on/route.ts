import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getVerifiedSession } from '@/lib/session'
import { sendClientMessageToFounder } from '@/lib/email'
import { JOBS, FORMAT_PREFIX, formatFor, monthlyLimit, monthStart, type JobId } from '@/lib/hands-on'

export const dynamic = 'force-dynamic'

type Row = { id: string; session_format: string; status: string; created_at: string }

async function load(userId: string) {
  const supabase = supabaseAdmin()
  const { data: user } = await supabase.from('users').select('id, email, full_name, company_name, subscription_tier, billing_status').eq('id', userId).maybeSingle()
  if (!user) return null
  const { data } = await supabase.from('session_requests')
    .select('id, session_format, status, created_at')
    .eq('user_email', user.email).like('session_format', `${FORMAT_PREFIX}%`)
    .gte('created_at', monthStart()).neq('status', 'cancelled')
    .order('created_at', { ascending: false })
  const rows = (data ?? []) as Row[]
  const active = user.billing_status === 'active'
  const limit  = active ? monthlyLimit(user.subscription_tier) : 0
  return { supabase, user, rows, limit }
}

const view = (rows: Row[], limit: number) => ({
  limit, used: rows.length,
  requests: rows.map(r => ({ id: r.id, job: r.session_format.slice(FORMAT_PREFIX.length), open: r.status === 'pending', at: r.created_at })),
})

// GET  what this plan includes and what has been asked for this month
export async function GET() {
  const session = await getVerifiedSession()
  if (!session) return NextResponse.json({ limit: 0, used: 0, requests: [] })
  const s = await load(session.userId)
  if (!s) return NextResponse.json({ limit: 0, used: 0, requests: [] })
  return NextResponse.json(view(s.rows, s.limit))
}

// POST { job, tools, whatsapp, preferredTime, notes }  ask for a hands-on session
export async function POST(req: NextRequest) {
  const session = await getVerifiedSession()
  if (!session) return NextResponse.json({ error: 'Log in again to ask for this.' }, { status: 401 })
  let b: { job?: unknown; tools?: unknown; whatsapp?: unknown; preferredTime?: unknown; notes?: unknown }
  try { b = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const job = JOBS.find(j => j.id === b.job)?.id as JobId | undefined
  if (!job) return NextResponse.json({ error: 'Choose what you need help with.' }, { status: 400 })
  const whatsapp = typeof b.whatsapp === 'string' ? b.whatsapp.trim().slice(0, 30) : ''
  const digits = whatsapp.replace(/\D/g, '')
  if (digits.length < 9 || digits.length > 15) return NextResponse.json({ error: 'Please enter a valid WhatsApp number, e.g. 0712 345 678.' }, { status: 400 })
  const tools = typeof b.tools === 'string' ? b.tools.trim().slice(0, 200) : ''
  const notes = typeof b.notes === 'string' ? b.notes.trim().slice(0, 1000) : ''
  const preferredTime = typeof b.preferredTime === 'string' ? b.preferredTime.slice(0, 60) : ''
  if (job === 'other' && notes.length < 5) return NextResponse.json({ error: 'Tell Eugene in a line what you need.' }, { status: 400 })

  const s = await load(session.userId)
  if (!s) return NextResponse.json({ error: 'Account not found.' }, { status: 404 })
  const { supabase, user, rows, limit } = s
  if (limit === 0) return NextResponse.json({ error: 'Hands-on sessions with Eugene are included from the Pro plan.', upgrade: true }, { status: 403 })
  if (rows.length >= limit)
    return NextResponse.json({ error: `Your plan includes ${limit} hands-on ${limit === 1 ? 'session' : 'sessions'} a month, and you have used ${limit === 1 ? 'it' : 'them'}. You can still message Eugene any time.` }, { status: 429 })
  if (rows.some(r => r.status === 'pending' && r.session_format === formatFor(job)))
    return NextResponse.json({ error: 'You have already asked for this one. Eugene will be in touch.' }, { status: 409 })

  const detail = [`WhatsApp: ${whatsapp}`, tools ? `Uses today: ${tools}` : '', notes].filter(Boolean).join('\n\n')
  const { error } = await supabase.from('session_requests').insert({
    user_email: user.email, user_name: user.full_name ?? '', company_name: user.company_name ?? '',
    session_format: formatFor(job), preferred_time: preferredTime, additional_notes: detail,
    diagnostic_summary: { kind: 'hands_on', job, tier: user.subscription_tier }, status: 'pending',
  })
  if (error) {
    console.error('[hands-on] save error:', error.message)
    return NextResponse.json({ error: 'Could not send that. Please try again.' }, { status: 500 })
  }
  try {
    await sendClientMessageToFounder({
      userName: user.full_name ?? '', userEmail: user.email, companyName: user.company_name ?? '', tier: user.subscription_tier,
      message: `${formatFor(job)}\nBest time: ${preferredTime || 'not given'}\n\n${detail}`,
    })
  } catch (err) { console.error('[hands-on] email error:', err) }

  const after = await load(session.userId)
  return NextResponse.json({ success: true, ...(after ? view(after.rows, after.limit) : {}) })
}
