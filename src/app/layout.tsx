import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-dm-sans',
  display: 'swap',
})

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
      <body className={`${dmSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  )
}
