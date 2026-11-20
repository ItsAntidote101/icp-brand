import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import GoogleTagManager from '@/components/GoogleTagManager'
import { FAQS } from './home-faqs'

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

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ideal ICP',
  description: 'Free diagnosis for Kenyan businesses running ads for leads: why leads are not converting, what it costs and what to fix first. Reviewed by a media buyer.',
  url: 'https://idealicp.com',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KES',
    description: 'Free diagnosis and a free 20 minute call',
  },
  provider: {
    '@type': 'Organization',
    name: 'Ideal ICP',
    url: 'https://idealicp.com',
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body className={geistMono.variable}>
        {children}
        <GoogleTagManager />
      </body>
    </html>
  )
}
