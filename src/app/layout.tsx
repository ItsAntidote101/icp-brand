import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'ICP Diagnostic | Free ICP Audit Tool for Marketing Teams in Africa and Beyond',
  description: 'Get a free AI-powered ICP diagnostic report in 5 minutes. Identify targeting gaps, funnel friction, and budget waste. Used by marketing teams across Kenya, Nigeria, South Africa, UK and US.',
  metadataBase: new URL('https://idealicp.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ICP Diagnostic | Free ICP Audit Tool for Marketing Teams',
    description: 'Get a free AI-powered ICP diagnostic in 5 minutes. Used by marketing teams across Africa, UK and US.',
    url: 'https://idealicp.com',
    type: 'website',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ICP Diagnostic | Free ICP Audit Tool',
    description: 'Get a free AI-powered ICP diagnostic in 5 minutes.',
    images: ['/images/og-image.png'],
  },
}

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ICP Diagnostic',
  description: 'AI-powered ICP diagnostic tool for marketing teams. Get a free audit of your targeting, funnel, and ad spend in 5 minutes.',
  url: 'https://idealicp.com',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free ICP diagnostic report',
  },
  provider: {
    '@type': 'Organization',
    name: 'ICP Diagnostic',
    url: 'https://idealicp.com',
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the difference between the free report and the subscriber report?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The free report diagnoses your ICP based on questionnaire answers. The subscriber report includes live landing page assessment, competitor research, and regional benchmarks.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you need access to my ad accounts?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. We never ask for access to your Google or Meta accounts. You answer our diagnostic questions and optionally upload a CSV export.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is this different from hiring a marketing consultant?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A consultant charges KES 50,000 or more for a strategy session. We give you a living diagnostic that updates every month and tells you what to fix next automatically.',
      },
    },
  ],
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
      </body>
    </html>
  )
}
