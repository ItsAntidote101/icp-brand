// Single source of truth for the media buyer roster. IDs must match the
// `media_buyers` rows seeded in supabase/migrations/20260702_message_centre.sql.

export type MediaBuyer = {
  id:           string
  email:        string
  name:         string
  firstName:    string
  title:        string
  speciality:   string
  regions:      string[]
  industries:   string[]
  avatarColor:  string
  initials:     string
  yearsExp:     number
  bio:          string
  calLink:      string
}

export const MEDIA_BUYERS: MediaBuyer[] = [
  {
    id: '11111111-0000-4000-8000-000000000001',
    email: 'eugene@idealicp.com',
    name: 'Eugene Kariuki', firstName: 'Eugene', initials: 'EK', avatarColor: '#201515',
    title: 'B2B Media Buyer', speciality: 'B2B SaaS, Fintech, East Africa paid acquisition',
    regions: ['Kenya', 'Uganda', 'Tanzania', 'East Africa'],
    industries: ['SaaS', 'Fintech', 'B2B', 'Technology'],
    yearsExp: 7,
    bio: '7 years running Meta and Google for B2B SaaS and fintech companies across East Africa. Specialist in M-Pesa-integrated funnels and WhatsApp lead qualification.',
    calLink: 'https://calendly.com/idealicp/eugene-review',
  },
  {
    id: '11111111-0000-4000-8000-000000000002',
    email: 'aisha@idealicp.com',
    name: 'Aisha Mensah', firstName: 'Aisha', initials: 'AM', avatarColor: '#7c3aed',
    title: 'E-commerce Media Buyer', speciality: 'DTC, e-commerce, West Africa performance',
    regions: ['West Africa (Nigeria, Ghana)', 'Nigeria', 'Ghana'],
    industries: ['E-commerce', 'DTC', 'Retail', 'FMCG', 'Consumer'],
    yearsExp: 6,
    bio: '6 years scaling DTC and e-commerce brands in Nigeria and Ghana. Built Meta Shopping and Google Performance Max campaigns generating 4x+ ROAS for over 40 brands.',
    calLink: 'https://calendly.com/idealicp/aisha-review',
  },
  {
    id: '11111111-0000-4000-8000-000000000003',
    email: 'david@idealicp.com',
    name: 'David Osei', firstName: 'David', initials: 'DO', avatarColor: '#0369a1',
    title: 'Growth Media Buyer', speciality: 'B2B services, professional services, Southern Africa',
    regions: ['South Africa', 'Global/Multiple Regions'],
    industries: ['Professional Services', 'Consulting', 'Finance', 'Insurance', 'B2B Services'],
    yearsExp: 8,
    bio: '8 years in B2B lead generation for professional services firms. Managed LinkedIn and Google budgets from KES 50,000 to KES 2M per month across South Africa and global markets.',
    calLink: 'https://calendly.com/idealicp/david-review',
  },
  {
    id: '11111111-0000-4000-8000-000000000004',
    email: 'grace@idealicp.com',
    name: 'Grace Nakato', firstName: 'Grace', initials: 'GN', avatarColor: '#065f46',
    title: 'Local & SME Media Buyer', speciality: 'Local businesses, healthcare, education, SMEs',
    regions: ['Kenya', 'Uganda', 'Tanzania'],
    industries: ['Healthcare', 'Education', 'Local Services', 'Hospitality', 'Real Estate'],
    yearsExp: 5,
    bio: '5 years growing local and SME brands in East Africa. Expert in Google Local, Meta lead ads, and low-budget high-efficiency campaigns for businesses under KES 200,000/month.',
    calLink: 'https://calendly.com/idealicp/grace-review',
  },
  {
    id: '11111111-0000-4000-8000-000000000005',
    email: 'marcus@idealicp.com',
    name: 'Marcus Webb', firstName: 'Marcus', initials: 'MW', avatarColor: '#9a3412',
    title: 'International Media Buyer', speciality: 'UK, Europe, North America B2B and SaaS',
    regions: ['UK & Ireland', 'Europe (non-UK)', 'North America (US/Canada)', 'Middle East', 'Southeast Asia', 'South Asia (India/Pakistan)', 'Latin America', 'Australia & New Zealand'],
    industries: [],
    yearsExp: 9,
    bio: '9 years managing international paid acquisition for B2B and SaaS companies across the UK, Europe, and North America. Specialist in multi-market funnel optimisation and LinkedIn ABM.',
    calLink: 'https://calendly.com/idealicp/marcus-review',
  },
]

export function getAssignedBuyer(region: string, industry: string, tier: string): MediaBuyer {
  const reg = region ?? ''
  const ind = industry ?? ''

  const byRegion = MEDIA_BUYERS.filter(b =>
    b.regions.some(r => reg.includes(r) || r.includes(reg))
  )

  if (byRegion.length === 1) return byRegion[0]

  if (byRegion.length > 1) {
    const byIndustry = byRegion.find(b =>
      b.industries.length === 0 || b.industries.some(i => ind.toLowerCase().includes(i.toLowerCase()))
    )
    if (byIndustry) return byIndustry
    return byRegion[0]
  }

  if (tier === 'agency' || tier === 'pro') return MEDIA_BUYERS[0]
  return MEDIA_BUYERS[4]
}

export function getBuyerById(id: string | null | undefined): MediaBuyer | undefined {
  if (!id) return undefined
  return MEDIA_BUYERS.find(b => b.id === id)
}

export function getBuyerByEmail(email: string | null | undefined): MediaBuyer | undefined {
  if (!email) return undefined
  const norm = email.toLowerCase().trim()
  return MEDIA_BUYERS.find(b => b.email.toLowerCase() === norm)
}
