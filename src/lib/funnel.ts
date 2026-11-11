import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Funnel events for measuring the ad test (table: funnel_events).
 * Steps: landing_view → questionnaire_started → questionnaire_completed →
 * report_viewed → call_requested / checkout_started → paid
 */
export const CLIENT_EVENTS = [
  'landing_view',
  'questionnaire_started',
  'questionnaire_completed',
  'report_viewed',
  'call_requested',
  'checkout_started',
] as const
export type FunnelEvent = (typeof CLIENT_EVENTS)[number] | 'paid'

export async function recordFunnelEvent(
  db: SupabaseClient,
  e: { event: FunnelEvent; userId?: string | null; anonId?: string | null; path?: string | null; utm?: Record<string, string> | null; meta?: Record<string, unknown> | null },
): Promise<void> {
  try {
    const { error } = await db.from('funnel_events').insert({
      event:   e.event,
      user_id: e.userId ?? null,
      anon_id: e.anonId ?? null,
      path:    e.path ?? null,
      utm:     e.utm && Object.keys(e.utm).length ? e.utm : null,
      meta:    e.meta ?? null,
    })
    if (error) console.error('[funnel] insert error:', error.message)
  } catch (err) {
    // Tracking must never break the product
    console.error('[funnel] error:', err)
  }
}
