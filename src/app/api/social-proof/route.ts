import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const revalidate = 30

const supabase = supabaseAdmin()

type EventType = 'diagnosis' | 'subscription' | 'waste_found' | 'score_improved' | 'weekly_stat'

interface SocialProofEvent {
  id: string
  type: EventType
  message: string
  subtext: string
  iconColor: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  if (mins < 60)       return `${Math.max(1, mins)} minute${mins !== 1 ? 's' : ''} ago`
  if (hours < 24)      return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  return 'Yesterday'
}

function regionToCity(region: string | undefined): string {
  if (!region) return 'their region'
  if (/kenya|east africa/i.test(region))  return 'Nairobi'
  if (/nigeria|west africa/i.test(region)) return 'Lagos'
  if (/south africa/i.test(region))       return 'Johannesburg'
  if (/uk|ireland/i.test(region))         return 'London'
  if (/north america|usa|us\b/i.test(region)) return 'New York'
  if (/europe/i.test(region))             return 'Amsterdam'
  if (/uganda/i.test(region))             return 'Kampala'
  if (/ghana/i.test(region))              return 'Accra'
  return 'their region'
}

// Only real events are ever shown. The old seeded list ("Someone in Nairobi
// just...", "63 diagnoses this week") was invented activity, which is
// misleading advertising. No real events means no toast at all.

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function GET() {
  try {
    const since48h = new Date(Date.now() - 48 * 3_600_000).toISOString()
    const since7d  = new Date(Date.now() - 7 * 86_400_000).toISOString()

    const [
      { data: recentDiagnoses },
      { data: recentSubs },
      { count: weeklyCount },
      { data: wasteEvents },
    ] = await Promise.all([
      supabase
        .from('questionnaires')
        .select('id, created_at, layer_two_data')
        .gte('created_at', since48h)
        .order('created_at', { ascending: false })
        .limit(10),

      supabase
        .from('users')
        .select('id, created_at, subscription_tier')
        .eq('billing_status', 'active')
        .neq('subscription_tier', 'free')
        .gte('created_at', since48h)
        .order('created_at', { ascending: false })
        .limit(5),

      supabase
        .from('questionnaires')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since7d),

      supabase
        .from('social_proof_events')
        .select('id, created_at, region, waste_amount')
        .eq('event_type', 'waste_found')
        .gte('created_at', since48h)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const realEvents: SocialProofEvent[] = []

    // Diagnoses
    for (const q of recentDiagnoses ?? []) {
      const raw  = q.layer_two_data as Record<string, string> | null
      const city = regionToCity(raw?.targetRegion)
      realEvents.push({
        id: `diag-${q.id}`,
        type: 'diagnosis',
        message: `Someone in ${city} just completed their ICP diagnosis`,
        subtext: timeAgo(q.created_at as string),
        iconColor: '#302161',
      })
    }

    // Subscriptions
    for (const u of recentSubs ?? []) {
      const tier = (u.subscription_tier as string | null) ?? 'Pro'
      const label = tier.charAt(0).toUpperCase() + tier.slice(1)
      realEvents.push({
        id: `sub-${u.id}`,
        type: 'subscription',
        message: `A marketing team just subscribed to ${label}`,
        subtext: timeAgo(u.created_at as string),
        iconColor: '#22c55e',
      })
    }

    // Weekly stat
    if ((weeklyCount ?? 0) > 0) {
      realEvents.push({
        id: 'weekly-stat',
        type: 'weekly_stat',
        message: `${weeklyCount} ICP diagnoses completed this week`,
        subtext: 'Join them today',
        iconColor: '#302161',
      })
    }

    // Waste found events from social_proof_events table
    for (const ev of wasteEvents ?? []) {
      const city   = regionToCity(ev.region as string | undefined)
      const amount = ev.waste_amount as number | null
      const fmt    = amount ? `KES ${amount.toLocaleString()}` : 'significant waste'
      realEvents.push({
        id: `waste-${ev.id}`,
        type: 'waste_found',
        message: `A business in ${city} just found ${fmt} in wasted ad spend`,
        subtext: timeAgo(ev.created_at as string),
        iconColor: '#ef4444',
      })
    }

    const events = shuffle(realEvents).slice(0, 15)

    return NextResponse.json({ events })
  } catch (err) {
    console.error('[social-proof] error:', err)
    return NextResponse.json({ events: [] })
  }
}
