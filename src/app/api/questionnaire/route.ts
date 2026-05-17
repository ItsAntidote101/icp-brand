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

  // Upsert user record — every questionnaire completion lands in users table
  let userId: string | null = null
  if (profile?.email) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert(
        {
          email:             profile.email,
          full_name:         profile.name    ?? null,
          company_name:      profile.company ?? null,
          subscription_tier: 'free',
          billing_status:    'inactive',
          updated_at:        new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select('id')
      .single()

    if (userError) {
      console.error('[questionnaire] users upsert error:', userError)
    } else {
      userId = userData?.id ?? null
    }
  }

  // Save questionnaire answers, linked to user if we have their id
  const { data, error } = await supabase
    .from('questionnaires')
    .insert([{
      user_id:    userId,
      responses:  answers ?? body,
      created_at: new Date().toISOString(),
    }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id, message: 'Questionnaire saved' }, { status: 201 })
}
