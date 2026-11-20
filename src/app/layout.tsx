import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import GoogleTagManager from '@/components/GoogleTagManager'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#fffefb',
}

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Ideal ICP | Why Your Ad Leads Don\'t Buy, Free Diagnosis for Kenyan Businesses',
  description: 'Getting leads that never buy? Answer 10 questions and find out where your ad budget is leaking, what it costs you in KES and what to fix first. Free, reviewed by a Nairobi media buyer.',
  metadataBase: new URL('https://www.idealicp.com'),
  openGraph: {
    title: 'Ideal ICP | Getting leads that never buy?',
    description: 'Free 3-minute diagnosis for Kenyan businesses running ads for leads. Find where your budget is leaking.',
    url: 'https://www.idealicp.com',
    type: 'website',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ideal ICP | Getting leads that never buy?',
    description: 'Free 3-minute diagnosis for Kenyan businesses running ads for leads.',
    images: ['/images/og-image.png'],
  },
}

// Tells search engines and AI assistants who is behind the site: a business
// in Nairobi, founded and run by a named person.
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': 'https://www.idealicp.com/#organization',
  name: 'Ideal ICP',
  url: 'https://www.idealicp.com',
  description: 'Diagnosis and tracking for Kenyan businesses that run ads to get leads: why leads are not buying, what it costs and what to fix first.',
  areaServed: { '@type': 'Country', name: 'Kenya' },
  address: { '@type': 'PostalAddress', addressLocality: 'Nairobi', addressCountry: 'KE' },
  founder: {
    '@type': 'Person',
    '@id': 'https://www.idealicp.com/about#eugene',
    name: 'Eugene Kwata',
    jobTitle: 'Media buyer',
    url: 'https://www.idealicp.com/about',
    worksFor: { '@id': 'https://www.idealicp.com/#organization' },
  },
  priceRange: 'KES 0 to KES 26,000 a month',
}

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ideal ICP',
  description: 'Free diagnosis for Kenyan businesses running ads for leads: why leads are not converting, what it costs and what to fix first. Reviewed by a media buyer.',
  url: 'https://www.idealicp.com',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KES',
    description: 'Free diagnosis and a free 20 minute call',
  },
  provider: { '@id': 'https://www.idealicp.com/#organization' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
      </head>
      <body className={geistMono.variable}>
        {children}
        <GoogleTagManager />
      </body>
    </html>
  )
}
