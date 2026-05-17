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

  let userId: string | null = null

  if (profile?.email) {
    // Check whether the user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', profile.email)
      .single()

    if (existing) {
      // User exists — only update safe profile fields, never touch billing columns
      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update({
          full_name:    profile.name    ?? null,
          company_name: profile.company ?? null,
          updated_at:   new Date().toISOString(),
        })
        .eq('email', profile.email)
        .select('id')
        .single()

      if (updateError) {
        console.error('[questionnaire] users update error:', updateError)
      } else {
        userId = updated?.id ?? null
      }
    } else {
      // New user — insert with free/inactive defaults
      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert({
          email:             profile.email,
          full_name:         profile.name    ?? null,
          company_name:      profile.company ?? null,
          subscription_tier: 'free',
          billing_status:    'inactive',
          updated_at:        new Date().toISOString(),
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('[questionnaire] users insert error:', insertError)
      } else {
        userId = inserted?.id ?? null
      }
    }
  }

  // Save questionnaire answers linked to the user
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
