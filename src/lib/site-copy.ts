import fs from 'node:fs'
import path from 'node:path'

// The public pages are built from the copy files in content/copy/pages.
// The format is described in .claude/agents/idealicp-copy.md. Keeping copy
// in files means a wording change never needs a layout change.

export type Block =
  | { t: 'h1' | 'h3' | 'p' | 'quote'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'button' | 'link'; text: string; href: string }
  | { t: 'image'; alt: string; ratio: string }
  | { t: 'video'; src: string; alt: string; ratio: string }
  | { t: 'table'; head: string[]; rows: string[][] }

export interface Item { title: string; blocks: Block[] }
export interface Section {
  kind: string
  meta: Record<string, string>   // eyebrow, period, attribution, fields
  blocks: Block[]                 // everything before the first item
  items: Item[]                   // "#### title" groups
}
export interface CopyPage {
  slug: string
  path: string
  title: string
  description: string
  question: string
  status: 'ready' | 'sample'
  sections: Section[]
}

const DIR = path.join(process.cwd(), 'content', 'copy', 'pages')
const META_KEYS = ['eyebrow', 'period', 'attribution', 'fields', 'rotate']
export const KINDS = ['hero', 'opener', 'split', 'cards', 'steps', 'ladder', 'receipts', 'quote', 'faq', 'plans', 'prose', 'form', 'map', 'band']

const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())

function parseBlocks(lines: string[], meta: Record<string, string>): Block[] {
  const out: Block[] = []
  let para: string[] = []
  const flush = () => { if (para.length) { out.push({ t: 'p', text: para.join(' ') }); para = [] } }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) { flush(); continue }
    const kv = line.match(/^([a-z]+):\s*(.+)$/)
    if (kv && META_KEYS.includes(kv[1])) { flush(); meta[kv[1]] = kv[2]; continue }
    const mark = line.match(/^\[(BUTTON|LINK|IMAGE|VIDEO):\s*(.+)\]$/)
    if (mark) {
      flush()
      if (mark[1] === 'VIDEO') {
        const [src, ratio, alt] = mark[2].split('|').map(s => s.trim())
        if (src?.startsWith('/')) out.push({ t: 'video', src, alt: alt ?? '', ratio: /^\d+:\d+$/.test(ratio ?? '') ? ratio : '4:3' })
      } else if (mark[1] === 'IMAGE') {
        const [alt, ratio] = mark[2].split('|').map(s => s.trim())
        out.push({ t: 'image', alt, ratio: /^\d+:\d+$/.test(ratio ?? '') ? ratio : '4:3' })
      } else {
        const [text, href] = mark[2].split('->').map(s => s.trim())
        if (text && href) out.push({ t: mark[1] === 'BUTTON' ? 'button' : 'link', text, href })
      }
      continue
    }
    if (line.startsWith('# ')) { flush(); out.push({ t: 'h1', text: line.slice(2).trim() }); continue }
    if (line.startsWith('### ')) { flush(); out.push({ t: 'h3', text: line.slice(4).trim() }); continue }
    if (line.startsWith('> ')) { flush(); out.push({ t: 'quote', text: line.slice(2).trim() }); continue }
    if (line.startsWith('- ')) {
      flush()
      const last = out[out.length - 1]
      if (last?.t === 'ul') last.items.push(line.slice(2).trim()); else out.push({ t: 'ul', items: [line.slice(2).trim()] })
      continue
    }
    if (line.startsWith('|')) {
      flush()
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(cells(lines[i])); i++ }
      i--
      const body = rows.filter(r => !r.every(c => /^:?-+:?$/.test(c)))
      if (body.length > 1) out.push({ t: 'table', head: body[0], rows: body.slice(1) })
      continue
    }
    para.push(line)
  }
  flush()
  return out
}

export function parseCopy(slug: string, raw: string): CopyPage {
  const fm: Record<string, string> = {}
  let body = raw
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/)
  if (m) {
    body = raw.slice(m[0].length)
    for (const line of m[1].split('\n')) {
      const i = line.indexOf(':')
      if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim()
    }
  }
  const sections: Section[] = []
  let current: { kind: string; lines: string[] } | null = null
  const close = () => {
    if (!current || !KINDS.includes(current.kind)) return    // unknown kinds, including notes, are never shown
    const meta: Record<string, string> = {}
    const groups: { title: string | null; lines: string[] }[] = [{ title: null, lines: [] }]
    for (const line of current.lines) {
      if (line.startsWith('#### ')) groups.push({ title: line.slice(5).trim(), lines: [] })
      else groups[groups.length - 1].lines.push(line)
    }
    sections.push({
      kind: current.kind,
      meta,
      blocks: parseBlocks(groups[0].lines, meta),
      items: groups.slice(1).map(g => ({ title: g.title ?? '', blocks: parseBlocks(g.lines, meta) })),
    })
  }
  for (const line of body.split('\n')) {
    const h = line.match(/^##\s+([a-z]+)\b.*$/)
    if (h && !line.startsWith('###')) { close(); current = { kind: h[1], lines: [] }; continue }
    current?.lines.push(line)
  }
  close()
  return {
    slug,
    path: fm.path || `/${slug.replace(/__/g, '/')}`,
    title: fm.title || 'Ideal ICP',
    description: fm.description || '',
    question: fm.question || '',
    status: fm.status === 'sample' ? 'sample' : 'ready',
    sections,
  }
}

let cache: CopyPage[] | null = null
export function allCopy(): CopyPage[] {
  if (cache) return cache
  let files: string[] = []
  try { files = fs.readdirSync(DIR).filter(f => f.endsWith('.md')) } catch { /* no copy yet */ }
  cache = files.map(f => parseCopy(f.replace(/\.md$/, ''), fs.readFileSync(path.join(DIR, f), 'utf8')))
  return cache
}
export const copyByPath = (p: string) => allCopy().find(c => c.path === p)

/** First headline and image of a page, for cards that link to it. */
export function teaser(page: CopyPage) {
  const hero = page.sections.find(s => s.kind === 'hero')
  const h1 = hero?.blocks.find(b => b.t === 'h1')
  const p = hero?.blocks.find(b => b.t === 'p')
  return { title: h1 && 'text' in h1 ? h1.text : page.question || page.title, text: p && 'text' in p ? p.text : page.description }
}
