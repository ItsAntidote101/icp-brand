import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )

  const body = await req.json()
  const { answers, profile } = body as {
    answers: Record<string, unknown>
    profile?: { name?: string; email?: string; company?: string }
  }

  console.log('[questionnaire] received profile:', JSON.stringify(profile))
  console.log('[questionnaire] answer count:', Object.keys(answers ?? {}).length)

  let userId: string | null = null

  if (profile?.email) {
    // ── Check whether the user already exists ──────────────────────────
    const { data: existing, error: lookupError } = await supabase
      .from('users')
      .select('id')
      .eq('email', profile.email)
      .single()

    if (lookupError && lookupError.code !== 'PGRST116') {
      // PGRST116 = row not found — expected for new users, not an error
      console.error('[questionnaire] users lookup error:', JSON.stringify(lookupError))
    } else {
      console.log('[questionnaire] users lookup result — existing:', existing ? existing.id : 'none')
    }

    if (existing) {
      // ── Existing user — only update safe profile fields ────────────────
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
        console.error('[questionnaire] users update error:', JSON.stringify(updateError))
      } else {
        console.log('[questionnaire] users update success — id:', updated?.id)
        userId = updated?.id ?? null
      }
    } else {
      // ── New user — insert with free/inactive defaults ──────────────────
      const insertPayload = {
        email:             profile.email,
        full_name:         profile.name    ?? null,
        company_name:      profile.company ?? null,
        subscription_tier: 'free',
        billing_status:    'inactive',
        updated_at:        new Date().toISOString(),
      }
      console.log('[questionnaire] inserting new user:', JSON.stringify(insertPayload))

      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert(insertPayload)
        .select('id')
        .single()

      if (insertError) {
        console.error('[questionnaire] users insert error:', JSON.stringify(insertError))
      } else {
        console.log('[questionnaire] users insert success — id:', inserted?.id)
        userId = inserted?.id ?? null
      }
    }
  } else {
    console.warn('[questionnaire] no profile email — skipping users upsert')
  }

  // ── Save questionnaire answers linked to the user ───────────────────
  const qPayload = {
    user_id:    userId,
    responses:  answers ?? body,
    created_at: new Date().toISOString(),
  }
  console.log('[questionnaire] inserting questionnaire row — user_id:', userId)

  const { data, error } = await supabase
    .from('questionnaires')
    .insert([qPayload])
    .select()
    .single()

  if (error) {
    console.error('[questionnaire] questionnaires insert error:', JSON.stringify(error))
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('[questionnaire] questionnaires insert success — id:', data.id)
  return NextResponse.json({ id: data.id, message: 'Questionnaire saved' }, { status: 201 })
}
