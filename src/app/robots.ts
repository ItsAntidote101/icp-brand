import type { MetadataRoute } from 'next'

// Search engines and AI assistants may read the public pages. Everything
// behind a login, every personal report and the API stay out.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/admin', '/api/', '/auth', '/report/', '/success', '/cancel', '/ref/'],
    }],
    sitemap: 'https://www.idealicp.com/sitemap.xml',
  }
}
