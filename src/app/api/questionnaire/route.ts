import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSessionToken, sessionCookieOptions } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      serviceKey
    )

    const body = await req.json()
    const { answers, profile } = body as {
      answers: Record<string, unknown>
      profile?: { name?: string; email?: string; company?: string }
    }

    let userId: string | null = null

    if (profile?.email) {
      // ── Check whether the user already exists ──────────────────────────
      const { data: existing, error: lookupError } = await supabase
        .from('users')
        .select('id')
        .eq('email', profile.email)
        .single()

      if (lookupError && lookupError.code !== 'PGRST116') {
        // PGRST116 = row not found, expected for new users, not an error
        console.error('[questionnaire] users lookup error:', JSON.stringify(lookupError))
      }

      if (existing) {
        // ── Existing user, only update safe profile fields ────────────────
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
          userId = updated?.id ?? null
        }
      } else {
        // ── New user, insert with free/inactive defaults ──────────────────
        const insertPayload = {
          email:             profile.email,
          full_name:         profile.name    ?? null,
          company_name:      profile.company ?? null,
          subscription_tier: 'free',
          billing_status:    'inactive',
          updated_at:        new Date().toISOString(),
        }

        const { data: inserted, error: insertError } = await supabase
          .from('users')
          .insert(insertPayload)
          .select('id')
          .single()

        if (insertError) {
          console.error('[questionnaire] users insert error:', JSON.stringify(insertError))
        } else {
          userId = inserted?.id ?? null
        }
      }
    }

    // ── Save questionnaire answers linked to the user ───────────────────
    const qPayload = {
      user_id:    userId,
      responses:  answers ?? body,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('questionnaires')
      .insert([qPayload])
      .select()
      .single()

    if (error) {
      console.error('[questionnaire] questionnaires insert error:', JSON.stringify(error))
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }

    const res = NextResponse.json({ id: data.id, message: 'Questionnaire saved' }, { status: 201 })
    if (profile?.email && userId) {
      res.cookies.set(sessionCookieOptions(createSessionToken(profile.email, userId)))
    }
    return res
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[questionnaire] unhandled error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
