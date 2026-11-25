import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { allCopy, copyByPath } from '@/lib/site-copy'
import { CopyPageView } from '../new/render'

// Every public page that is written as a copy file (content/copy/pages),
// apart from the home page, which has its own route.
// Only the addresses listed below exist; anything else is a 404, and the
// app's own routes (questionnaire, dashboard, auth and so on) come first.
export const dynamic = 'force-static'
export const dynamicParams = false

type Props = { params: { slug: string[] } }
const pathOf = (p: Props['params']) => '/' + p.slug.join('/')

export function generateStaticParams() {
  return allCopy().filter(c => c.path !== '/').map(c => ({ slug: c.path.slice(1).split('/') }))
}

export function generateMetadata({ params }: Props): Metadata {
  const path = pathOf(params)
  const page = copyByPath(path)
  return {
    title: page?.title, description: page?.description,
    alternates: { canonical: path },
    openGraph: { title: page?.title, description: page?.description, url: `https://www.idealicp.com${path}`, type: 'website', images: [{ url: '/images/og-image.png', width: 1200, height: 630 }] },
  }
}

export default function CopyRoute({ params }: Props) {
  const page = copyByPath(pathOf(params))
  if (!page) notFound()
  return <CopyPageView page={page} />
}
