import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )

  const body = await req.json()
  const { answers, profile } = body as {
    answers: Record<string, unknown>
    profile?: { name?: string; email?: string; company?: string }
  }

  // Silently capture the user before they see the report
  if (profile?.email) {
    const { error: userError } = await supabase.from('users').upsert(
      {
        email:      profile.email,
        name:       profile.name    ?? null,
        company:    profile.company ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    )
    if (userError) {
      console.error('[questionnaire] users upsert error:', userError)
    }
  }

  const { data, error } = await supabase
    .from('questionnaires')
    .insert([{ responses: answers ?? body, created_at: new Date().toISOString() }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id, message: 'Questionnaire saved' }, { status: 201 })
}
