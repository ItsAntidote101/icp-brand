import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { copyByPath } from '@/lib/site-copy'
import { CopyPageView } from './new/render'

// The home page, drawn from content/copy/pages/home.md.
export const dynamic = 'force-static'

export function generateMetadata(): Metadata {
  const page = copyByPath('/')
  return {
    title: page?.title, description: page?.description,
    alternates: { canonical: '/' },
    openGraph: { title: page?.title, description: page?.description, url: 'https://www.idealicp.com', type: 'website', images: [{ url: '/images/og-image.png', width: 1200, height: 630 }] },
  }
}

export default function Home() {
  const page = copyByPath('/')
  if (!page) notFound()
  return <CopyPageView page={page} />
}
