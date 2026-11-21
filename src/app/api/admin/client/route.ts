import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { clientSnapshot } from '@/lib/client-snapshot'
import { loadAllowances } from '@/lib/allowances'
import { clientThread } from '@/lib/admin-data'

export const dynamic = 'force-dynamic'

// Everything about one client on one page.
export async function GET(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id') ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  const supabase = supabaseAdmin()

  const { data: u } = await supabase
    .from('users')
    .select('id, email, full_name, company_name, subscription_tier, billing_status, renewal_date, cancelled_at, created_at, last_active_at, total_fixes_completed')
    .eq('id', id).maybeSingle()
  if (!u) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Opening a client's page is the moment their numbers were looked at; their dashboard may say so
  await supabase.from('admin_client_views').upsert({ user_id: u.id, last_viewed_at: new Date().toISOString() }, { onConflict: 'user_id' })

  const [snapshot, thread, notesQ, payQ, privQ] = await Promise.all([
    clientSnapshot(supabase, u.id, u.total_fixes_completed ?? 0),
    clientThread(supabase, { id: u.id, email: u.email }),
    supabase.from('buyer_notes').select('body, media_url, status, sent_at, read_at, updated_at').eq('user_id', u.id).order('updated_at', { ascending: false }).limit(6),
    supabase.from('paystack_payments').select('reference, tier, kind, status, paid_amount, expected_amount, created_at, paid_at').eq('email', u.email).order('created_at', { ascending: false }).limit(12),
    supabase.from('admin_client_notes').select('body').eq('user_id', u.id).maybeSingle(),
  ])

  const notes    = notesQ.data ?? []
  const lastSent = notes.filter(n => n.status === 'sent').sort((a, b) => (b.sent_at ?? '').localeCompare(a.sent_at ?? ''))[0] ?? null
  const draft    = notes.find(n => n.status === 'draft') ?? null

  return NextResponse.json({
    client: {
      id: u.id, email: u.email, name: u.full_name, company: u.company_name,
      tier: u.subscription_tier, status: u.billing_status, cancelled: !!u.cancelled_at,
      renewalDate: u.renewal_date, joined: u.created_at, lastSeen: u.last_active_at ?? u.created_at,
    },
    snapshot, thread,
    lastSent: lastSent ? { sent_at: lastSent.sent_at, read_at: lastSent.read_at } : null,
    draft: draft ? { body: draft.body, media_url: draft.media_url } : null,
    // Paystack amounts are stored in cents; the screen shows whole shillings
    payments: (payQ.data ?? []).map(p => ({ ...p, paid_amount: p.paid_amount != null ? p.paid_amount / 100 : null, expected_amount: p.expected_amount != null ? p.expected_amount / 100 : null })),
    privateNote: privQ.data?.body ?? '',
    // What their plan includes this month, what they have used, and past months
    allowances: await loadAllowances(supabase, { id: u.id, email: u.email, subscription_tier: u.subscription_tier, billing_status: u.billing_status }),
  })
}
