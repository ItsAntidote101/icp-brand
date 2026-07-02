// Single source of truth for the media buyer roster. IDs must match the
// `media_buyers` rows in Supabase (see supabase/migrations/).

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
    id: '22222222-0000-4000-8000-000000000001',
    email: 'eugenemybizz@gmail.com',
    name: 'Eugene Kwata', firstName: 'Eugene', initials: 'EK', avatarColor: '#201515',
    title: 'Media Buyer', speciality: 'Full-service paid acquisition',
    regions: [],
    industries: [],
    yearsExp: 8,
    bio: '8 years of experience in performance media buying and paid acquisition.',
    calLink: '',
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

  // No region match: prefer a buyer with no region restriction (global
  // coverage), then fall back to a tier-based pick, then just the first buyer.
  const global = MEDIA_BUYERS.find(b => b.regions.length === 0)
  if (global) return global
  if (tier === 'agency' || tier === 'pro') return MEDIA_BUYERS[0]
  return MEDIA_BUYERS[MEDIA_BUYERS.length - 1]
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
