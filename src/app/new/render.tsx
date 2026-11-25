import Link from 'next/link'
import { ArrowRight, Check, ChevronDown, ImageIcon } from 'lucide-react'
import { SiteStyles } from '../site'
import { allCopy, copyByPath, teaser, type Block, type CopyPage, type Item, type Section } from '@/lib/site-copy'
import Opener from './opener'
import { PLANS } from './plans'
import { MAP_DOTS, MAP_H, MAP_POINTS, MAP_W } from './world-dots'

// Draws a page from its copy file (content/copy/pages) in the Ohio look:
// Demo 23 for the home sections, with the plans beside questions block from
// Demo 27. Type and colours are the brand's own. Photos are placeholders
// until real ones are supplied; each box says what the photo should show.

/** Where the new pages live while they are a hidden preview. Set to '' at launch. */
export const BASE = '/new'

type MenuLink = [href: string, label: string, note?: string]
interface MenuItem {
  href: string
  label: string
  cols?: { title: string; links: MenuLink[] }[]
  aside?: { title: string; text: string; button: [string, string] }
}
/** The main menu. Items with columns open a wide panel on desktop; on a phone they are listed in the menu. */
const menu = (): MenuItem[] => {
  const guides = allCopy().filter(c => c.path.startsWith('/guides/')).slice(0, 5)
    .map((c): MenuLink => [c.path, teaser(c).title])
  return [
    {
      href: '/how-it-works', label: 'How it works',
      cols: [{ title: 'What you get', links: [
        ['/how-it-works', 'From first question to month three', 'The whole path on one page'],
        ['/services/diagnosis', 'The free diagnosis', 'Ten questions, no login'],
        ['/services/ready-to-upload', 'Ready to upload files', 'Keywords, Meta files and the words to paste'],
        ['/services/campaign-setup', 'Campaign setup plan', 'A starting plan your media buyer reviews'],
        ['/services/done-with-you', 'Hands-on sessions', 'Set up together, in your own accounts'],
      ] }],
      aside: { title: 'Start with your own numbers', text: 'Ten questions, about 3 minutes. No card and no login.', button: ['Start my free diagnosis', '/questionnaire'] },
    },
    {
      href: '/for', label: 'Who it is for',
      cols: [{ title: 'By trade', links: [
        ['/for/property', 'Property and real estate', 'Site visits that never happen'],
        ['/for/schools', 'Schools and colleges', 'Parents who asked and went quiet'],
        ['/for/insurance', 'Insurance and financial services', 'Quotes sent, nothing back'],
        ['/for/clinics', 'Clinics and beauty', 'Bookings that never show'],
        ['/for/professional-services', 'Law, accounting and consulting', 'Free advice, no brief'],
      ] }],
      aside: { title: 'Not on the list?', text: 'The diagnosis works for any business that pays for inquiries.', button: ['Start my free diagnosis', '/questionnaire'] },
    },
    { href: '/case-studies', label: 'Case studies' },
    {
      href: '/resources', label: 'Resources',
      cols: [
        { title: 'Guides', links: [...guides, ['/resources', 'All guides']] },
        { title: 'Compare', links: [['/compare/hiring-an-agency', 'Ideal ICP or an agency'], ['/compare/doing-it-yourself', 'Ideal ICP or doing it yourself']] },
        { title: 'More', links: [['/glossary', 'Glossary'], ['/reviews', 'Reviews'], ['/about', 'About us'], ['/contact', 'Contact']] },
      ],
    },
    { href: '/pricing', label: 'Pricing' },
  ]
}
const FOOT = [
  { title: 'Start', links: [['/how-it-works', 'How it works'], ['/pricing', 'Pricing'], ['/questionnaire', 'Free diagnosis'], ['/auth', 'Log in']] },
  { title: 'Who it is for', links: [['/for/property', 'Property'], ['/for/schools', 'Schools and colleges'], ['/for/insurance', 'Insurance and finance'], ['/for/clinics', 'Clinics and beauty'], ['/for/professional-services', 'Professional services']] },
  { title: 'Read', links: [['/case-studies', 'Case studies'], ['/resources', 'Resources'], ['/reviews', 'Reviews'], ['/glossary', 'Glossary']] },
  { title: 'Ideal ICP', links: [['/about', 'About us'], ['/contact', 'Contact'], ['/privacy', 'Privacy'], ['/terms', 'Terms']] },
]

/** Pages that exist as copy are linked inside the preview; everything else keeps its live address. */
export const to = (href: string) => {
  if (!href.startsWith('/')) return href
  const [p, hash] = href.split('#')
  if (p === '/') return (BASE || '/') + (hash ? `#${hash}` : '')
  return (copyByPath(p) ? BASE + p : p) + (hash ? `#${hash}` : '')
}

const inline = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*|\[LINK:[^\]]+\])/g)
  return parts.map((part, i) => {
    if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    const m = part.match(/^\[LINK:\s*(.+?)\s*->\s*(.+?)\]$/)
    if (m) return <Link key={i} href={to(m[2])}>{m[1]}</Link>
    return part
  })
}

function Photo({ alt, ratio, className = '' }: { alt: string; ratio: string; className?: string }) {
  const [w, h] = ratio.split(':').map(Number)
  return (
    <div className={`ic-photo ${className}`} style={{ aspectRatio: `${w || 4} / ${h || 3}` }} role="img" aria-label={`Photo to come: ${alt}`}>
      <ImageIcon size={26} strokeWidth={1.5} aria-hidden="true" />
      <p>{alt}</p>
      <span>Photo placeholder {ratio}</span>
    </div>
  )
}

function Blocks({ blocks, skip = [] as string[], light = false }: { blocks: Block[]; skip?: string[]; light?: boolean }) {
  return (
    <>
      {blocks.filter(b => !skip.includes(b.t)).map((b, i) => {
        switch (b.t) {
          case 'h1': return <h1 key={i}>{b.text}</h1>
          case 'h3': return <h2 key={i}>{b.text}</h2>
          case 'p': return <p key={i} className="ic-p">{inline(b.text)}</p>
          case 'quote': return <blockquote key={i}>{b.text}</blockquote>
          case 'ul': return <ul key={i} className="ic-ul">{b.items.map(li => <li key={li}><Check size={17} aria-hidden="true" /><span>{inline(li)}</span></li>)}</ul>
          case 'button': return <p key={i} className="ic-act"><Link href={to(b.href)} className={`ic-btn${light ? ' ic-btn-light' : ''}`}>{b.text}<ArrowRight size={18} aria-hidden="true" /></Link></p>
          case 'link': return <p key={i} className="ic-act"><Link href={to(b.href)} className="ic-more">{b.text}<ArrowRight size={16} aria-hidden="true" /></Link></p>
          case 'image': return <Photo key={i} alt={b.alt} ratio={b.ratio} />
          case 'table': return (
            <div key={i} className="ic-table"><table>
              <thead><tr>{b.head.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead>
              <tbody>{b.rows.map(r => <tr key={r.join('|')}>{r.map((c, j) => j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>)}</tr>)}</tbody>
            </table></div>
          )
        }
      })}
    </>
  )
}

const Head = ({ s }: { s: Section }) => {
  const h = s.blocks.filter(b => b.t === 'h3' || b.t === 'p')
  if (!h.length && !s.meta.eyebrow) return null
  return <div className="ic-head">{s.meta.eyebrow && <p className="ic-eye">{s.meta.eyebrow}</p>}<Blocks blocks={h} /></div>
}
const imageOf = (blocks: Block[]) => blocks.find((b): b is Extract<Block, { t: 'image' }> => b.t === 'image')

function ItemCard({ item, n }: { item: Item; n?: number }) {
  const img = imageOf(item.blocks)
  return (
    <li className="ic-card">
      {img && <Photo alt={img.alt} ratio={img.ratio} />}
      {n !== undefined && <span className="ic-n" aria-hidden="true">{n}</span>}
      <h3>{item.title}</h3>
      <Blocks blocks={item.blocks} skip={['image']} />
    </li>
  )
}

function SectionView({ s, index, page, flip, dark }: { s: Section; index: number; page: CopyPage; flip: boolean; dark: boolean }) {
  const article = page.sections.some(x => x.kind === 'prose')
  switch (s.kind) {
    case 'hero': {
      const img = imageOf(s.blocks)
      if (article) return (
        <section className="ic-top">
          <div className="ic-wrap ic-narrow">
            {s.meta.eyebrow && <p className="ic-eye">{s.meta.eyebrow}</p>}
            <Blocks blocks={s.blocks} skip={['image', 'button']} />
          </div>
          {img && <div className="ic-wrap"><Photo alt={img.alt} ratio="16:9" className="ic-top-photo" /></div>}
        </section>
      )
      return (
        <section className="ic-hero">
          <div className="ic-wrap ic-hero-in">
            <Photo alt={img?.alt ?? 'A real photo for this page'} ratio={img?.ratio ?? '4:3'} className="ic-hero-photo" />
            <div className="ic-disc">
              <div>
                {s.meta.eyebrow && <p className="ic-eye">{s.meta.eyebrow}</p>}
                <Blocks blocks={s.blocks} skip={['image']} light />
              </div>
            </div>
          </div>
        </section>
      )
    }
    case 'opener': return (
      <section className="ic-opener" id="start">
        <div className="ic-wrap ic-opener-in">
          <Opener />
          <ul className="ic-vows">
            <li><Check size={18} aria-hidden="true" />Nobody will call you unless you ask.</li>
            <li><Check size={18} aria-hidden="true" />No access to your ad account needed.</li>
            <li><Check size={18} aria-hidden="true" />Rough numbers from memory are enough.</li>
          </ul>
        </div>
      </section>
    )
    case 'split': {
      const img = imageOf(s.blocks)
      return (
        <section className="ic-sec">
          <div className={`ic-wrap ic-split${flip ? ' ic-flip' : ''}`}>
            <div>{s.meta.eyebrow && <p className="ic-eye">{s.meta.eyebrow}</p>}<Blocks blocks={s.blocks} skip={['image']} /></div>
            {img && <Photo alt={img.alt} ratio={img.ratio} />}
          </div>
        </section>
      )
    }
    case 'cards': case 'steps': return (
      <section className={`ic-sec${dark ? ' ic-dark' : ''}`}>
        <div className="ic-wrap">
          <Head s={s} />
          <ol className={`ic-cards ic-cards-${s.items.length > 4 ? 3 : s.items.length}`}>
            {s.items.map((it, i) => <ItemCard key={it.title} item={it} n={s.kind === 'steps' ? i + 1 : undefined} />)}
          </ol>
          <Blocks blocks={s.blocks.filter(b => b.t === 'button' || b.t === 'link')} light={dark} />
        </div>
      </section>
    )
    case 'ladder': return (
      <section className="ic-sec">
        <div className="ic-wrap ic-two">
          <Head s={s} />
          <ol className="ic-ladder">{s.items.map(it => <li key={it.title}><span>{it.title}</span><div><Blocks blocks={it.blocks} /></div></li>)}</ol>
        </div>
      </section>
    )
    case 'receipts': return (
      <section className="ic-sec ic-tint">
        <div className="ic-wrap">
          <Head s={s} />
          <Blocks blocks={s.blocks.filter(b => b.t === 'table')} />
          {s.meta.period && <p className="ic-fine">Period: {s.meta.period}</p>}
        </div>
      </section>
    )
    case 'quote': {
      const img = imageOf(s.blocks)
      return (
        <section className="ic-sec">
          <div className={`ic-wrap ic-split${flip ? ' ic-flip' : ''}`}>
            <figure className="ic-quote">
              {s.meta.eyebrow && <p className="ic-eye">{s.meta.eyebrow}</p>}
              <Blocks blocks={s.blocks.filter(b => b.t === 'quote')} />
              {s.meta.attribution && <figcaption>{s.meta.attribution}</figcaption>}
              <Blocks blocks={s.blocks.filter(b => b.t === 'link' || b.t === 'p')} />
            </figure>
            {img && <Photo alt={img.alt} ratio={img.ratio} />}
          </div>
        </section>
      )
    }
    case 'faq': return (
      <section className="ic-sec">
        <div className="ic-wrap ic-two">
          <Head s={s.blocks.length || s.meta.eyebrow ? s : { ...s, blocks: [{ t: 'h3', text: 'Questions' }] }} />
          <div className="ic-faq">{s.items.map(it => <details key={it.title}><summary>{it.title}</summary><Blocks blocks={it.blocks} /></details>)}</div>
        </div>
      </section>
    )
    case 'plans': return (
      <section className="ic-sec ic-tint" id="plans">
        <div className="ic-wrap">
          <ul className="ic-plans">
            {PLANS.map(p => (
              <li key={p.name} className={p.pick ? 'ic-pick' : ''}>
                <h3>{p.name}</h3>
                <p className="ic-for">{p.forWho}</p>
                <p className="ic-price">{p.price}<small>{p.per || 'no card needed'}</small></p>
                <ul className="ic-ul">{p.items.map(i => <li key={i}><Check size={16} aria-hidden="true" /><span>{i}</span></li>)}</ul>
                <Link href="/questionnaire" className={`ic-btn${p.pick ? '' : ' ic-btn-line'}`}>{p.cta}</Link>
              </li>
            ))}
          </ul>
          <p className="ic-fine">Every plan starts with the free diagnosis, which sets up your account. Paid month by month with M-Pesa or card. Nothing renews on its own.</p>
        </div>
      </section>
    )
    case 'prose': return (
      <section className="ic-sec ic-prose-sec">
        <div className="ic-wrap ic-narrow ic-prose"><Blocks blocks={s.blocks} /></div>
      </section>
    )
    case 'form': {
      const fields = (s.meta.fields ?? 'name, WhatsApp number, what you need help with').split(',').map(f => f.trim()).filter(Boolean)
      return (
        <section className="ic-sec">
          <div className="ic-wrap ic-two">
            <Head s={s} />
            <form className="ic-form" aria-describedby="ic-form-note">
              {fields.map((f, i) => {
                const id = `ic-f-${i}`
                const long = i === fields.length - 1
                return (
                  <label key={f} htmlFor={id}>{f.charAt(0).toUpperCase() + f.slice(1)}
                    {long ? <textarea id={id} rows={4} disabled /> : <input id={id} disabled />}
                  </label>
                )
              })}
              <button type="button" className="ic-btn" disabled>Send message</button>
              <p id="ic-form-note" className="ic-fine">Preview only. This form is not connected yet.</p>
            </form>
          </div>
        </section>
      )
    }
    case 'map': {
      const home = MAP_POINTS['Kenya']
      const shown = s.items.filter(it => MAP_POINTS[it.title])
      return (
        <section className="ic-sec ic-dark ic-map-sec">
          <div className="ic-wrap">
            <Head s={s} />
            <div className="ic-map">
              <svg viewBox={`0 28 ${MAP_W} ${MAP_H - 56}`} role="img" aria-label={`World map marking ${shown.map(it => it.title).join(', ')}`}>
                <path d={MAP_DOTS} className="ic-map-land" />
                {shown.filter(it => it.title !== 'Kenya').map(it => {
                  const [x, y] = MAP_POINTS[it.title]
                  const mx = (x + home[0]) / 2, my = Math.min(y, home[1]) - Math.abs(x - home[0]) * 0.22 - 24
                  return <path key={it.title} d={`M${x} ${y}Q${mx} ${my} ${home[0]} ${home[1]}`} className="ic-map-arc" />
                })}
                {shown.map(it => {
                  const [x, y] = MAP_POINTS[it.title]
                  const base = it.title === 'Kenya'
                  return <g key={it.title}><circle cx={x} cy={y} r={base ? 15 : 11} className="ic-map-halo" /><circle cx={x} cy={y} r={base ? 6.5 : 5} className={base ? 'ic-map-base' : 'ic-map-pin'} /></g>
                })}
              </svg>
            </div>
            <ol className={`ic-cards ic-cards-${shown.length > 4 ? 3 : shown.length}`}>
              {s.items.map(it => <ItemCard key={it.title} item={it} />)}
            </ol>
          </div>
        </section>
      )
    }
    case 'band': return (
      <section className="ic-band">
        <div className="ic-wrap ic-band-in">
          <div><Blocks blocks={s.blocks} skip={['button', 'image']} /></div>
          <Blocks blocks={s.blocks.filter(b => b.t === 'button')} />
        </div>
      </section>
    )
    default: return <div key={index} />
  }
}

export function CopyPageView({ page }: { page: CopyPage }) {
  let splits = 0
  let seenGrid = false
  const hasOpener = page.sections.some(s => s.kind === 'opener')
  const MENU = menu()
  return (
    <div className={`hp oh ic${hasOpener ? ' ic-home' : ''}`}>
      <SiteStyles />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <header className="ic-nav">
        <div className="ic-wrap ic-nav-in">
          <Link href={to('/')} className="ic-logo"><i aria-hidden="true" />Ideal ICP</Link>
          <nav className="ic-links" aria-label="Main">
            <ul className="ic-mega">
              {MENU.map(m => (
                <li key={m.href} className={m.cols ? 'ic-has-panel' : ''}>
                  <Link href={to(m.href)} className="ic-top-link">{m.label}{m.cols && <ChevronDown size={15} aria-hidden="true" />}</Link>
                  {m.cols && (
                    <div className="ic-panel">
                      <div className={`ic-wrap ic-panel-in ic-panel-${m.cols.length}${m.aside ? ' ic-panel-aside' : ''}`}>
                        {m.cols.map(c => (
                          <div key={c.title} className="ic-panel-col">
                            <p className="ic-panel-title">{c.title}</p>
                            <ul>
                              {c.links.map(([href, label, note]) => (
                                <li key={href + label}><Link href={to(href)}><span>{label}</span>{note && <small>{note}</small>}</Link></li>
                              ))}
                            </ul>
                          </div>
                        ))}
                        {m.aside && (
                          <div className="ic-panel-box">
                            <p className="ic-panel-box-title">{m.aside.title}</p>
                            <p>{m.aside.text}</p>
                            <Link href={to(m.aside.button[1])} className="ic-btn ic-btn-sm">{m.aside.button[0]}<ArrowRight size={16} aria-hidden="true" /></Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <Link href={hasOpener ? '#start' : '/questionnaire'} className="ic-btn ic-btn-sm">Free diagnosis</Link>
          <details className="ic-menu">
            <summary aria-label="Menu"><span /><span /><span /></summary>
            <nav aria-label="Menu">
              {MENU.map(m => (
                <div key={m.href} className="ic-menu-group">
                  <Link href={to(m.href)} className="ic-menu-top">{m.label}</Link>
                  {m.cols && m.aside && m.cols[0].links.filter(([href]) => href !== m.href).map(([href, label]) => <Link key={href} href={to(href)} className="ic-menu-sub">{label}</Link>)}
                </div>
              ))}
              <div className="ic-menu-group">
                <Link href={to('/about')} className="ic-menu-top">About us</Link>
                <Link href={to('/contact')} className="ic-menu-top">Contact</Link>
                <Link href="/auth" className="ic-menu-top">Log in</Link>
              </div>
            </nav>
          </details>
        </div>
      </header>
      {page.status === 'sample' && <p className="ic-sample">Sample. Replace with a real client before this page goes live.</p>}
      <main>
        {page.sections.map((s, i) => {
          const flip = s.kind === 'split' || s.kind === 'quote' ? splits++ % 2 === 1 : false
          const dark = (s.kind === 'cards' || s.kind === 'steps') && !seenGrid
          if (s.kind === 'cards' || s.kind === 'steps') seenGrid = true
          // On the home page the conversation sits right under the hero, so the hero button goes to it.
          const sec = hasOpener && s.kind === 'hero'
            ? { ...s, blocks: s.blocks.map(b => b.t === 'button' ? { ...b, href: '#start' } : b) }
            : s
          return <SectionView key={i} s={sec} index={i} page={page} flip={flip} dark={dark} />
        })}
      </main>
      <footer className="ic-foot">
        <div className="ic-wrap ic-foot-in">
          <div>
            <p className="ic-logo"><i aria-hidden="true" />Ideal ICP</p>
            <p>A media buying service in Nairobi for businesses whose ads bring inquiries that do not buy.</p>
          </div>
          {FOOT.map(g => (
            <nav key={g.title} aria-label={g.title}>
              <h2>{g.title}</h2>
              {g.links.map(([href, label]) => <Link key={href} href={to(href)}>{label}</Link>)}
            </nav>
          ))}
        </div>
      </footer>
    </div>
  )
}

export const previewPaths = () => allCopy().map(c => c.path)

const css = `
.ic{--blush:#fbeee6;--navy:#201515;--red:var(--accent);background:#fff;color:var(--ink)}
.ic-wrap{max-width:1200px;margin:0 auto;padding:0 clamp(20px,5vw,44px)}
.ic-narrow{max-width:780px}
.ic h1{font:600 clamp(34px,5.4vw,60px)/1.04 var(--head);letter-spacing:-.03em;margin:0}
.ic h2{font:600 clamp(28px,3.8vw,44px)/1.08 var(--head);letter-spacing:-.028em;margin:0}
.ic h3{font:600 20px/1.25 var(--head);letter-spacing:-.01em;margin:0}
.ic .ic-p{font-size:clamp(16px,1.5vw,18px);line-height:1.65;color:var(--ink2);max-width:58ch;margin:16px 0 0}
.ic .ic-p a,.ic-prose a{color:var(--ink);text-decoration:underline;text-decoration-color:var(--red);text-underline-offset:3px}
.ic .ic-eye{font:600 14px/1.3 var(--body);color:var(--red);margin:0 0 14px}
.ic .ic-fine{font-size:14px;line-height:1.5;color:var(--muted);margin:18px 0 0}
.ic .ic-act{margin:26px 0 0}
.ic-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 24px;border-radius:6px;border:1.5px solid var(--red);background:var(--red);color:#fff!important;font:600 16px/1 var(--body);text-decoration:none;cursor:pointer;transition:background .15s,border-color .15s}
.ic-btn:hover{background:#c92a06;border-color:#c92a06}
.ic-btn-sm{min-height:42px;padding:0 16px;font-size:14.5px}
.ic-btn-line{background:transparent;color:var(--ink)!important;border-color:var(--ink)}
.ic-btn-line:hover{background:var(--ink);color:#fff!important;border-color:var(--ink)}
.ic-btn-light{background:#fff;border-color:#fff;color:var(--navy)!important}
.ic-btn-light:hover{background:var(--navy);border-color:var(--navy);color:#fff!important}
.ic-btn[disabled]{opacity:.5;cursor:not-allowed}
.ic-more{display:inline-flex;align-items:center;gap:8px;font:600 15.5px/1.2 var(--body);color:var(--ink);text-decoration:none;border-bottom:2px solid var(--red);padding-bottom:3px}
.ic a:focus-visible,.ic button:focus-visible,.ic summary:focus-visible,.ic input:focus-visible{outline:3px solid var(--red);outline-offset:3px}
.ic-ul{list-style:none;margin:18px 0 0;padding:0;display:grid;gap:10px}
.ic-ul li{display:flex;gap:10px;align-items:flex-start;font-size:16px;line-height:1.5;color:var(--ink2)}
.ic-ul svg{flex-shrink:0;margin-top:3px;color:var(--red)}

.ic-nav{position:sticky;top:0;z-index:60;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.ic-nav-in{height:66px;display:flex;align-items:center;gap:14px}
.ic-logo{display:inline-flex;align-items:center;gap:9px;font:700 18px/1 var(--head);letter-spacing:-.02em;color:inherit;text-decoration:none;margin:0 auto 0 0}
.ic-logo i{width:10px;height:10px;border-radius:50%;background:var(--red)}
.ic-links{display:none}
.ic-mega{list-style:none;margin:0;padding:0;display:flex;gap:4px}
.ic-mega>li{height:66px;display:flex;align-items:center}
.ic-top-link{display:inline-flex;align-items:center;gap:5px;height:40px;padding:0 12px;border-radius:6px;font:500 15px/1 var(--body);color:var(--ink);text-decoration:none}
.ic-top-link svg{transition:transform .15s;color:var(--muted)}
.ic-mega>li:hover>.ic-top-link,.ic-mega>li:focus-within>.ic-top-link{color:var(--red)}
.ic-mega>li:hover>.ic-top-link svg,.ic-mega>li:focus-within>.ic-top-link svg{transform:rotate(180deg);color:var(--red)}
.ic-panel{position:absolute;left:0;right:0;top:66px;background:#fff;border-top:1px solid var(--line);border-bottom:1px solid var(--line);box-shadow:0 30px 50px -30px rgba(32,21,21,.35);padding:30px 0 34px;visibility:hidden;opacity:0;transition:opacity .15s,visibility 0s .15s}
.ic-mega>li:hover>.ic-panel,.ic-mega>li:focus-within>.ic-panel{visibility:visible;opacity:1;transition-delay:.05s,0s}
.ic-panel-in{display:grid;gap:40px;align-items:start}
.ic-panel-aside{grid-template-columns:1fr 300px}
.ic-panel-3{grid-template-columns:1.5fr 1fr 1fr}
.ic .ic-panel-title{font:600 13.5px/1.3 var(--body);color:var(--muted);margin:0 0 12px}
.ic-panel-col ul{list-style:none;margin:0;padding:0;display:grid;gap:2px}
.ic-panel-aside .ic-panel-col ul{grid-template-columns:1fr 1fr;gap:4px 24px}
.ic-panel-col a{display:grid;gap:4px;padding:10px 12px;margin:0 -12px;border-radius:6px;text-decoration:none;color:var(--ink)}
.ic-panel-col a:hover{background:#f8f4f0}
.ic-panel-col a span{font:600 15.5px/1.3 var(--head)}
.ic-panel-col a small{font:400 14px/1.4 var(--body);color:var(--muted)}
.ic-panel-box{background:var(--blush);border-radius:6px;padding:22px;display:grid;gap:10px;justify-items:start}
.ic .ic-panel-box-title{font:600 18px/1.25 var(--head);margin:0}
.ic .ic-panel-box p{font-size:15px;line-height:1.5;color:var(--ink2);margin:0}
.ic-menu{position:static}
.ic-menu summary{list-style:none;width:44px;height:44px;display:grid;place-content:center;gap:5px;cursor:pointer;border-radius:6px}
.ic-menu summary::-webkit-details-marker{display:none}
.ic-menu summary span{display:block;width:22px;height:2px;background:var(--ink)}
.ic-menu nav{position:absolute;left:0;right:0;top:66px;max-height:calc(100dvh - 66px);overflow-y:auto;background:#fff;border-bottom:1px solid var(--line);padding:4px clamp(20px,5vw,44px) 20px;display:grid;box-shadow:0 24px 40px -24px rgba(32,21,21,.3)}
.ic-menu-group{display:grid;padding:6px 0;border-bottom:1px solid var(--line)}
.ic-menu-group:last-child{border-bottom:0}
.ic-menu nav a{display:flex;align-items:center;min-height:44px;text-decoration:none;color:var(--ink)}
.ic-menu-top{font:600 17px/1.2 var(--body)}
.ic-menu-sub{font:400 16px/1.2 var(--body);padding-left:14px;color:var(--ink2)!important}
.ic .ic-sample{margin:0;background:#201515;color:#fff;text-align:center;font:500 14px/1.4 var(--body);padding:10px 16px}

.ic-photo{position:relative;width:100%;display:grid;place-content:center;justify-items:center;gap:8px;padding:20px;text-align:center;color:#6b5f55;border-radius:4px;overflow:hidden;
  background:repeating-linear-gradient(135deg,#efe6dd 0 14px,#e9dfd4 14px 28px)}
.ic .ic-photo p{font:500 14.5px/1.4 var(--body);max-width:30ch;margin:0;color:#4a4039}
.ic-photo span{font:500 12px/1 var(--body);color:#8a7d70}

.ic .ic-hero{padding:0 0 clamp(28px,5vw,56px)}
.ic-hero-in{display:grid;padding-top:clamp(16px,3vw,28px)}
.ic-hero-photo{aspect-ratio:4/3!important}
.ic-disc{background:var(--red);color:#fff;padding:30px 24px 34px;margin-top:-6px;border-radius:0 0 4px 4px}
.ic-disc .ic-eye{color:rgba(255,255,255,.85)}
.ic-disc .ic-p{color:rgba(255,255,255,.92);margin-top:14px}
.ic .ic-disc h1{font-size:clamp(34px,8.6vw,46px);color:#fff}
.ic .ic-disc strong{color:#fff}
.ic-home .ic-hero-photo{display:none}
.ic-home .ic-disc{margin-top:0;border-radius:4px}

.ic .ic-opener{background:var(--blush);padding:clamp(32px,6vw,72px) 0;scroll-margin-top:66px}
.ic-opener-in{display:grid;gap:26px;justify-items:center}
.ic-vows{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.ic-vows li{display:flex;gap:10px;align-items:flex-start;font:500 16px/1.4 var(--body)}
.ic-vows svg{flex-shrink:0;color:var(--red);margin-top:2px}

.ic .ic-sec{padding:clamp(52px,8vw,104px) 0}
.ic-tint{background:#f8f4f0}
.ic-dark{background:#170f0f;color:#fff}
.ic-dark h2,.ic-dark h3{color:#fff}
.ic-dark .ic-p{color:rgba(255,255,255,.72)}
.ic-dark .ic-card{border-top-color:rgba(255,255,255,.22)}
.ic-dark .ic-more{color:#fff}
.ic-head{margin-bottom:clamp(26px,4vw,44px)}
.ic-split{display:grid;gap:30px;align-items:center}
.ic-two{display:grid;gap:8px}
.ic-cards{list-style:none;margin:0;padding:0;display:grid;gap:28px}
.ic-card{border-top:2px solid var(--ink);padding-top:20px;display:grid;gap:0;align-content:start}
.ic-card .ic-photo{margin:-20px 0 18px;border-radius:4px}
.ic-card:has(.ic-photo){border-top:0;padding-top:20px}
.ic-card .ic-p{font-size:16px;margin-top:10px}
.ic-card .ic-act{margin-top:16px}
.ic-n{font:700 15px/1 var(--head);color:var(--red);margin-bottom:12px}
.ic-ladder{list-style:none;margin:0;padding:0}
.ic-ladder li{display:grid;gap:6px;padding:20px 0;border-top:1px solid var(--line)}
.ic-ladder li:last-child{border-bottom:1px solid var(--line)}
.ic-ladder span{font:600 15px/1.3 var(--body);color:var(--red)}
.ic-ladder .ic-p{margin:0;color:var(--ink);font-size:17px}
.ic-table{overflow-x:auto;margin-top:8px}
.ic-table table{width:100%;border-collapse:collapse;min-width:420px}
.ic-table th,.ic-table td{text-align:left;padding:16px 14px 16px 0;border-bottom:1px solid var(--line);font:500 16px/1.35 var(--body);vertical-align:baseline}
.ic-table thead th{font:600 14px/1.3 var(--body);color:var(--muted);border-bottom:2px solid var(--ink)}
.ic-table td{font:600 clamp(18px,2.4vw,26px)/1.2 var(--head);letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.ic-table td:last-child{color:var(--red)}
.ic-quote{margin:0}
.ic-quote blockquote{margin:0;font:500 clamp(22px,3vw,34px)/1.3 var(--head);letter-spacing:-.02em}
.ic-quote figcaption{margin-top:18px;font:500 15px/1.4 var(--body);color:var(--muted)}
.ic-faq details{border-top:1px solid var(--line)}
.ic-faq details:last-child{border-bottom:1px solid var(--line)}
.ic-faq summary{list-style:none;cursor:pointer;padding:20px 34px 20px 0;font:600 18px/1.35 var(--head);position:relative}
.ic-faq summary::-webkit-details-marker{display:none}
.ic-faq summary::after{content:'+';position:absolute;right:4px;top:16px;font:400 26px/1 var(--body);color:var(--red)}
.ic-faq details[open] summary::after{content:'\\2212'}
.ic-faq .ic-p{margin:0 0 20px}
.ic-plans{list-style:none;margin:0;padding:0;display:grid;gap:18px}
.ic-plans>li{background:#fff;border:1px solid var(--line);border-radius:6px;padding:26px 22px;display:grid;gap:0;grid-template-rows:auto auto auto 1fr auto}
.ic-plans>li.ic-pick{border:2px solid var(--ink)}
.ic .ic-for{font-size:15px;line-height:1.45;color:var(--muted);margin:8px 0 0;min-height:44px}
.ic .ic-price{font:700 30px/1 var(--head);letter-spacing:-.02em;margin:16px 0 4px}
.ic-price small{display:block;margin-top:8px;font:500 14px/1 var(--body);color:var(--muted);letter-spacing:0;min-height:14px}
.ic-plans .ic-ul{margin-bottom:22px}
.ic-plans .ic-ul li{font-size:15px}
.ic-plans .ic-btn{align-self:end}
.ic .ic-top{padding:clamp(36px,6vw,72px) 0 0}
.ic-top-photo{margin-top:clamp(26px,4vw,44px)}
.ic .ic-prose-sec{padding-top:clamp(32px,5vw,56px)}
.ic-prose h2{font-size:clamp(24px,3vw,32px);margin:44px 0 0}
.ic-prose .ic-p{max-width:none;font-size:18px;line-height:1.7;color:var(--ink)}
.ic-prose .ic-ul li{font-size:18px;color:var(--ink)}
.ic-form{display:grid;gap:16px}
.ic-form label{display:grid;gap:8px;font:600 15px/1.3 var(--body)}
.ic-form input,.ic-form textarea{width:100%;padding:14px;border:1.5px solid var(--line);border-radius:6px;font:400 16px/1.4 var(--body);background:#fff;color:var(--ink)}
.ic-form .ic-btn{justify-self:start}
.ic-map{margin:0 0 clamp(24px,4vw,40px)}
.ic-map{overflow:hidden}
.ic .ic-map svg{display:block;width:185%;max-width:none;margin-left:-32%;height:auto}
.ic-map-land{fill:none;stroke:rgba(255,255,255,.3);stroke-width:3.4;stroke-linecap:round}
.ic-map-arc{fill:none;stroke:var(--red);stroke-width:2;stroke-dasharray:1 7;stroke-linecap:round}
.ic-map-halo{fill:var(--red);opacity:.25}
.ic-map-pin{fill:#fff}
.ic-map-base{fill:var(--red);stroke:#fff;stroke-width:2.5}
.ic .ic-band{background:var(--red);color:#fff;padding:clamp(44px,6vw,72px) 0}
.ic-band h2{color:#fff}
.ic-band .ic-p{color:rgba(255,255,255,.92)}
.ic-band-in{display:grid;gap:8px;align-items:center}
.ic-band .ic-btn{background:#fff;border-color:#fff;color:var(--navy)!important}
.ic-band .ic-btn:hover{background:var(--navy);border-color:var(--navy);color:#fff!important}
.ic-foot{background:#170f0f;color:rgba(255,255,255,.7);padding:56px 0 48px}
.ic-foot-in{display:grid;gap:34px}
.ic-foot .ic-logo{color:#fff}
.ic-foot p{font-size:15px;line-height:1.6;max-width:34ch;margin:14px 0 0}
.ic-foot nav{display:grid;gap:11px;align-content:start}
.ic-foot h2{font:600 14px/1.3 var(--body);letter-spacing:0;color:#fff;margin:0 0 4px}
.ic-foot nav a{font-size:15px;color:rgba(255,255,255,.75);text-decoration:none}
.ic-foot nav a:hover{color:#fff}

@media (min-width:720px){
  .ic-cards-2,.ic-cards-4{grid-template-columns:repeat(2,1fr)}
  .ic .ic-map svg{width:100%;margin-left:0}
  .ic-cards-3{grid-template-columns:repeat(3,1fr)}
  .ic-plans{grid-template-columns:repeat(2,1fr)}
  .ic-vows{grid-auto-flow:column;gap:28px}
  .ic-foot-in{grid-template-columns:repeat(2,1fr)}
  .ic-band-in{grid-template-columns:1fr auto;gap:40px}
  .ic-band .ic-act{margin:0}
}
@media (min-width:980px){
  .ic-links{display:block}
  .ic-logo{margin-right:auto}
  .ic-nav-in{gap:18px}
  .ic-menu{display:none}
  .ic-hero-in{grid-template-columns:repeat(12,1fr);align-items:center;padding-top:28px}
  .ic-hero-photo{grid-column:1 / 9;grid-row:1;aspect-ratio:16/11!important}
  .ic-disc{grid-column:6 / 13;grid-row:1;z-index:1;justify-self:end;width:min(100%,600px);aspect-ratio:1;border-radius:50%;margin:0;padding:0;display:grid;place-items:center}
  .ic-disc>div{width:68%}
  .ic .ic-disc h1{font-size:clamp(30px,3.2vw,44px)}
  .ic-home .ic-hero-photo{display:grid}
  .ic-home .ic-disc{border-radius:50%}
  .ic-disc .ic-p{font-size:16px;line-height:1.55}
  .ic-disc .ic-act{margin-top:20px}
  .ic-split{grid-template-columns:1fr 1fr;gap:clamp(40px,6vw,88px)}
  .ic-flip>:first-child{order:2}
  .ic-two{grid-template-columns:1fr 1.25fr;gap:clamp(40px,6vw,88px);align-items:start}
  .ic-two .ic-head{margin:0;position:sticky;top:96px}
  .ic-cards-4{grid-template-columns:repeat(4,1fr)}
  .ic-plans{grid-template-columns:repeat(4,1fr)}
  .ic-ladder li{grid-template-columns:190px 1fr;gap:24px}
  .ic-foot-in{grid-template-columns:1.4fr repeat(4,1fr)}
}
@media (prefers-reduced-motion:reduce){.ic *{transition:none!important}}
`
