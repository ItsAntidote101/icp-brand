import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false }, { status: 401 })

  const { questionsAnswered } = await req.json() as { questionsAnswered?: number }
  if (typeof questionsAnswered !== 'number') {
    return NextResponse.json({ error: 'questionsAnswered required' }, { status: 400 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', serviceKey)

  const { error } = await supabase
    .from('users')
    .update({
      questionnaire_questions_answered: questionsAnswered,
      last_active_at: new Date().toISOString(),
    })
    .eq('email', session.email.toLowerCase())

  if (error) console.error('[save-progress] update error:', error.message)

  return NextResponse.json({ ok: true })
}
