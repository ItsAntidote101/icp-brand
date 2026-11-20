import type { MetadataRoute } from 'next'
import { GUIDES } from './guides/content'

const BASE = 'https://www.idealicp.com'

// Public pages only.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${BASE}/`,              lastModified: now, changeFrequency: 'weekly',  priority: 1 },
    { url: `${BASE}/questionnaire`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/pricing`,       lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/about`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/guides`,        lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    ...GUIDES.map(g => ({ url: `${BASE}/guides/${g.slug}`, lastModified: new Date(g.updated), changeFrequency: 'monthly' as const, priority: 0.7 })),
    { url: `${BASE}/privacy`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${BASE}/terms`,         lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
  ]
}
