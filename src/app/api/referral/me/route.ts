import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

// Unambiguous characters — no 0/O, 1/I confusion
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  return Array.from({ length: 8 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
}

export async function GET() {
  let session
  try { session = await requireSession() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  )

  const { data: user } = await supabase
    .from('users')
    .select('id, user_badges')
    .eq('id', session.userId)
    .single()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const badges = (user.user_badges as Record<string, unknown>) ?? {}
  let code = badges.referral_code as string | undefined

  if (!code) {
    // Generate a collision-free code (8 chars = 32^8 = ~1T combinations, collisions negligible)
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateCode()
      const { data: clash } = await supabase
        .from('users')
        .select('id')
        .filter('user_badges->>referral_code', 'eq', candidate)
        .maybeSingle()
      if (!clash) { code = candidate; break }
    }
    if (!code) code = generateCode() // ultra-unlikely fallback

    await supabase
      .from('users')
      .update({ user_badges: { ...badges, referral_code: code } })
      .eq('id', user.id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://idealicp.com'

  return NextResponse.json({
    code,
    referralCount:   (badges.referral_count as number)            ?? 0,
    bonusDiagnoses:  (badges.referral_bonus_diagnoses as number)   ?? 0,
    shareUrl:        `${appUrl}/ref/${code}`,
  })
}
