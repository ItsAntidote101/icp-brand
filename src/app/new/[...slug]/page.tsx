import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { allCopy, copyByPath } from '@/lib/site-copy'
import { CopyPageView } from '../render'

// Hidden preview of the new public pages, drawn from content/copy/pages.
export const dynamic = 'force-static'
export const dynamicParams = false

type Props = { params: { slug: string[] } }
const pathOf = (p: Props['params']) => '/' + p.slug.join('/')

export function generateStaticParams() {
  return allCopy().filter(c => c.path !== '/').map(c => ({ slug: c.path.slice(1).split('/') }))
}

export function generateMetadata({ params }: Props): Metadata {
  const page = copyByPath(pathOf(params))
  return { title: page?.title, description: page?.description, robots: { index: false, follow: false } }
}

export default function PreviewPage({ params }: Props) {
  const page = copyByPath(pathOf(params))
  if (!page) notFound()
  return <CopyPageView page={page} />
}
