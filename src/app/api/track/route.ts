import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSession } from '@/lib/session'
import { CLIENT_EVENTS, recordFunnelEvent, FunnelEvent } from '@/lib/funnel'

export const dynamic = 'force-dynamic'

const ALLOWED = new Set<string>(CLIENT_EVENTS)

export async function POST(req: NextRequest) {
  let body: { event?: unknown; anonId?: unknown; path?: unknown; utm?: unknown; meta?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ ok: false }, { status: 400 }) }

  const event = typeof body.event === 'string' ? body.event : ''
  if (!ALLOWED.has(event)) return NextResponse.json({ ok: false }, { status: 400 })

  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : null)
  const utm: Record<string, string> = {}
  if (body.utm && typeof body.utm === 'object') {
    for (const [k, v] of Object.entries(body.utm as Record<string, unknown>).slice(0, 10)) {
      if (typeof v === 'string') utm[k.slice(0, 30)] = v.slice(0, 200)
    }
  }
  const meta = body.meta && typeof body.meta === 'object' && JSON.stringify(body.meta).length < 2000
    ? (body.meta as Record<string, unknown>) : null

  const session = await getSession()
  await recordFunnelEvent(supabaseAdmin(), {
    event: event as FunnelEvent,
    userId: session?.userId ?? null,
    anonId: str(body.anonId, 80),
    path: str(body.path, 200),
    utm,
    meta,
  })
  return NextResponse.json({ ok: true })
}
