import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { copyByPath } from '@/lib/site-copy'
import { CopyPageView } from './render'

// Hidden preview of the new home page, drawn from content/copy/pages/home.md.
// The live home page (src/app/page.tsx) is untouched until this is approved.
export const dynamic = 'force-static'

export function generateMetadata(): Metadata {
  const page = copyByPath('/')
  return { title: page?.title ?? 'Preview | Ideal ICP', description: page?.description, robots: { index: false, follow: false } }
}

export default function NewHome() {
  const page = copyByPath('/')
  if (!page) notFound()
  return <CopyPageView page={page} />
}
