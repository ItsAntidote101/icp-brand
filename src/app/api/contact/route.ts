import { NextRequest, NextResponse } from 'next/server'
import { sendContactToFounder } from '@/lib/email'

// The public contact form. Nothing is stored: the message is emailed to the
// founder inbox and that is all. Kept deliberately small because anyone can
// reach it without logging in.

const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 3
const seen = new Map<string, number[]>()   // per server instance; a second line of defence, not the only one

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B-\u001F]/g, '').trim().slice(0, max) : '')

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }

  // A hidden field people never see. Bots fill it; we answer as if it worked.
  if (clean(body.website, 200)) return NextResponse.json({ ok: true })

  const name = clean(body.name, 80)
  const phone = clean(body.phone, 30)
  const message = clean(body.message, 2000)
  const digits = phone.replace(/\D/g, '')
  if (name.length < 2) return NextResponse.json({ error: 'name', message: 'Add your name.' }, { status: 400 })
  if (digits.length < 9 || digits.length > 15) return NextResponse.json({ error: 'phone', message: 'Add a WhatsApp number we can reply to.' }, { status: 400 })
  if (message.length < 10) return NextResponse.json({ error: 'message', message: 'Tell us a little more about what you need.' }, { status: 400 })

  const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()
  const recent = (seen.get(ip) ?? []).filter(t => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    return NextResponse.json({ error: 'rate_limited', message: 'You have sent a few messages already. Give us time to answer those first.' }, { status: 429 })
  }
  seen.set(ip, [...recent, now])
  if (seen.size > 5000) seen.clear()

  const { error } = await sendContactToFounder({ name, phone, message })
  if (error) return NextResponse.json({ error: 'send_failed', message: 'That did not send. Please try again in a minute.' }, { status: 502 })
  return NextResponse.json({ ok: true })
}
