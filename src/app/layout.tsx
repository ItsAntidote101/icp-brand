import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'ICP Brand — Know Exactly Why Your Ads Aren\'t Converting',
  description: 'Get a free AI-powered ICP diagnostic report in 5 minutes. Pinpoint your targeting gaps, funnel friction, and messaging mismatch with a clear action plan.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geistMono.variable}>
        {children}
      </body>
    </html>
  )
}
