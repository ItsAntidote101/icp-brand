import type { MetadataRoute } from 'next'
import { allCopy } from '@/lib/site-copy'

const BASE = 'https://www.idealicp.com'

// Public pages only: every published copy page (content/copy/pages), plus the
// diagnosis and the legal pages. Pages held back as samples are left out.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const weight = (path: string) =>
    path === '/' ? 1
    : path === '/pricing' || path === '/how-it-works' ? 0.8
    : path.startsWith('/for') || path.startsWith('/services') || path.startsWith('/guides') ? 0.7
    : 0.5
  return [
    ...allCopy().map(c => ({ url: `${BASE}${c.path === '/' ? '/' : c.path}`, lastModified: now, changeFrequency: (c.path === '/' || c.path === '/resources' ? 'weekly' : 'monthly') as 'weekly' | 'monthly', priority: weight(c.path) })),
    { url: `${BASE}/questionnaire`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/privacy`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${BASE}/terms`,         lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
  ]
}
