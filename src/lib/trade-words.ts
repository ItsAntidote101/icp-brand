import type { SupabaseClient } from '@supabase/supabase-js'

// The words each client's dashboard uses for "lead" and "sale", taken from the
// industry they gave in their diagnosis. A school does not close sales, it
// enrols students; a clinic takes bookings. Anything unrecognised keeps the
// plain default.

export type TradeWords = {
  trade: 'default' | 'education' | 'property' | 'insurance' | 'health' | 'travel' | 'events' | 'legal'
  lead: string; leads: string       // someone who got in touch
  sale: string; sales: string       // someone who paid
  closed: string                    // label on the form: "Sales closed"
}

const DEFAULT: TradeWords = { trade: 'default', lead: 'lead', leads: 'leads', sale: 'sale', sales: 'sales', closed: 'Sales closed' }

const RULES: [RegExp, TradeWords][] = [
  [/school|college|universit|education|training|academy|tuition|course|e-?learning/i,
    { trade: 'education', lead: 'inquiry', leads: 'inquiries', sale: 'enrolment', sales: 'enrolments', closed: 'Students enrolled' }],
  [/real estate|property|propert|realt|housing|apartment|\bland\b|\bplots?\b|developer/i,
    { trade: 'property', lead: 'inquiry', leads: 'inquiries', sale: 'sale', sales: 'sales', closed: 'Sales or lettings closed' }],
  [/insur|assurance|underwrit/i,
    { trade: 'insurance', lead: 'inquiry', leads: 'inquiries', sale: 'policy', sales: 'policies', closed: 'Policies sold' }],
  [/clinic|hospital|dental|dentist|medical|health|wellness|physio|optic|pharma|\bspa\b|salon|beauty/i,
    { trade: 'health', lead: 'inquiry', leads: 'inquiries', sale: 'booking', sales: 'bookings', closed: 'Bookings made' }],
  [/travel|\btours?\b|tourism|safari|hotel|hospitality|lodge|airbnb|accommodation|restaurant/i,
    { trade: 'travel', lead: 'inquiry', leads: 'inquiries', sale: 'booking', sales: 'bookings', closed: 'Bookings made' }],
  [/event|wedding|catering|photograph/i,
    { trade: 'events', lead: 'inquiry', leads: 'inquiries', sale: 'booking', sales: 'bookings', closed: 'Bookings confirmed' }],
  [/\blaw\b|lawyer|legal|advocate|attorney|accounting|audit|consult/i,
    { trade: 'legal', lead: 'inquiry', leads: 'inquiries', sale: 'client', sales: 'clients', closed: 'Clients signed' }],
]

export function tradeWords(industry: string | null | undefined): TradeWords {
  if (!industry) return DEFAULT
  for (const [re, words] of RULES) if (re.test(industry)) return words
  return DEFAULT
}

/** The industry a client gave in their latest diagnosis, from either store. */
export async function loadIndustry(supabase: SupabaseClient, userId: string, email: string): Promise<string | null> {
  const [named, raw] = await Promise.all([
    supabase.from('questionnaire_responses').select('data').eq('email', email).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('questionnaires').select('responses').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  const d = (named.data?.data ?? {}) as Record<string, unknown>
  const r = (raw.data?.responses ?? {}) as Record<string, unknown>
  // What they sell is often more telling than the industry box, so read both
  const parts = [d.industry, d.business_type, r[2], d.product_service, r[1]].filter(v => typeof v === 'string') as string[]
  return parts.length ? parts.join(' | ') : null
}
