import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail, sendSubscriptionEmail, sendReminderEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  const host  = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'icpbrand.co'
  const baseUrl = `${proto}://${host}`

  const body = await req.json()
  const { type, to, name, reportId, tier, renewalDate, lastScore } = body as {
    type: string; to: string; name?: string; reportId?: string
    tier?: string; renewalDate?: string; lastScore?: number
  }

  console.log('[email/send] type:', type, '| to:', to)

  if (!type || !to) {
    return NextResponse.json({ error: 'type and to are required' }, { status: 400 })
  }

  let result: { data: { id?: string } | null; error: unknown }

  if (type === 'welcome') {
    if (!reportId) return NextResponse.json({ error: 'reportId required' }, { status: 400 })
    result = await sendWelcomeEmail({ to, name, reportId, baseUrl })
  } else if (type === 'subscription') {
    if (!tier || !renewalDate) return NextResponse.json({ error: 'tier and renewalDate required' }, { status: 400 })
    result = await sendSubscriptionEmail({ to, name, tier, renewalDate, baseUrl })
  } else if (type === 'reminder') {
    result = await sendReminderEmail({ to, name, lastScore, baseUrl })
  } else {
    return NextResponse.json({ error: 'Invalid type. Use: welcome | subscription | reminder' }, { status: 400 })
  }

  if (result.error) {
    return NextResponse.json({ error: 'Email send failed', detail: result.error }, { status: 500 })
  }

  return NextResponse.json({ id: result.data?.id }, { status: 200 })
}
