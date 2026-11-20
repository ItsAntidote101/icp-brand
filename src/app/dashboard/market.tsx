'use client'

// The Market tab's briefing: at most three things, each tied to the client's
// own business, each with its source. Everything shown comes from a page the
// research really opened; nothing here is estimated.

import React from 'react'
import { T } from './overview'

export type BriefItem = { kind: 'change' | 'competitor' | 'action'; title: string; body: string; forYou: string; action: string | null; source: string | null; sourceUrl: string | null; published: string | null }
export type BriefComparison = { metric: string; yours: number | null; low: number; high: number; currency: string; scope: string; local: boolean; source: string; sourceUrl: string; published: string | null } | null
export type BriefingV2 = { version: 2; items: BriefItem[]; comparison: BriefComparison; quiet: boolean; updatedAt?: string }

export const isV2 = (b: unknown): b is BriefingV2 => !!b && typeof b === 'object' && (b as { version?: number }).version === 2 && Array.isArray((b as { items?: unknown }).items)

const KIND: Record<BriefItem['kind'], string> = { change: 'What changed', competitor: 'A competitor', action: 'What to do' }
const money = (n: number, cur: string) => `${cur} ${Math.round(n).toLocaleString()}`

function Source({ name, url, date }: { name: string | null; url: string | null; date: string | null }) {
  if (!url) return null
  return (
    <p style={{ font: `400 13px/1.4 ${T.font}`, color: T.faint, margin: '12px 0 0' }}>
      Source: <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: T.ink2, textDecoration: 'underline' }}>{name || 'the article'}</a>{date ? `, ${date}` : ''}
    </p>
  )
}

export function MarketBrief({ briefing, onRefresh, refreshing, canRefresh }: { briefing: unknown; onRefresh: () => void; refreshing: boolean; canRefresh: boolean }) {
  const refresh = (label: string) => canRefresh
    ? <button className="ov-btn ov-btn-primary" onClick={onRefresh} disabled={refreshing} style={{ opacity: refreshing ? 0.6 : 1 }}>{refreshing ? 'Researching, about a minute' : label}</button>
    : null

  if (!isV2(briefing)) return (
    <div className="ov-card ov-help">
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ font: `700 17px/1.3 ${T.head}`, color: T.ink, margin: '0 0 3px' }}>Your briefing has a new, shorter format</p>
        <p style={{ font: `400 15px/1.45 ${T.font}`, color: T.muted, margin: 0, maxWidth: '60ch' }}>Three things a week, each tied to your business and each with its source. The next one arrives on Thursday.</p>
      </div>
      {refresh('Get it now')}
    </div>
  )

  const c = briefing.comparison
  return (
    <div className="ov-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: T.font }}>
      {briefing.quiet ? (
        <div className="ov-card" style={{ padding: '24px 28px' }}>
          <p style={{ font: `700 18px/1.3 ${T.head}`, color: T.ink, margin: '0 0 6px' }}>A quiet week in your market</p>
          <p style={{ font: `400 15px/1.5 ${T.font}`, color: T.muted, margin: 0, maxWidth: '62ch' }}>We looked for news, rule changes, platform updates and competitor moves that affect your business and found nothing worth your time. We would sooner tell you that than pad this out.</p>
        </div>
      ) : (
        <div className="ov-card" style={{ overflow: 'hidden' }}>
          {briefing.items.map((it, i) => (
            <article key={it.kind}>
              {i > 0 && <div className="ov-sep" style={{ marginLeft: 0 }} />}
              <div style={{ padding: '22px clamp(20px,3vw,28px)' }}>
                <p style={{ font: `600 13px/1 ${T.font}`, color: it.kind === 'action' ? T.accent : T.faint, margin: '0 0 8px' }}>{KIND[it.kind]}</p>
                <h3 style={{ font: `700 19px/1.3 ${T.head}`, letterSpacing: '-0.015em', color: T.ink, margin: '0 0 8px' }}>{it.title}</h3>
                <p style={{ font: `400 15px/1.55 ${T.font}`, color: T.ink2, margin: 0, maxWidth: '68ch' }}>{it.body}</p>
                <p style={{ font: `400 15px/1.55 ${T.font}`, color: T.ink, margin: '12px 0 0', padding: '12px 14px', background: T.fill, borderRadius: 12, maxWidth: '68ch' }}>
                  <strong style={{ fontWeight: 600 }}>For your business: </strong>{it.forYou}{it.action ? <> <strong style={{ fontWeight: 600 }}>{it.action}</strong></> : null}
                </p>
                <Source name={it.source} url={it.sourceUrl} date={it.published} />
              </div>
            </article>
          ))}
        </div>
      )}

      {c && (
        <section aria-labelledby="mk-compare">
          <h2 id="mk-compare" className="ov-h2" style={{ margin: '0 4px 12px' }}>How your cost per lead compares</h2>
          <div className="ov-card" style={{ padding: '24px 28px' }}>
            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 20, margin: 0 }}>
              {c.yours !== null && <div><dt style={{ font: `400 14px/1.3 ${T.font}`, color: T.muted }}>Yours, last logged week</dt><dd style={{ margin: '4px 0 0', font: `700 24px/1.2 ${T.head}`, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{money(c.yours, c.currency)}</dd></div>}
              <div><dt style={{ font: `400 14px/1.3 ${T.font}`, color: T.muted }}>Published range, {c.scope}</dt><dd style={{ margin: '4px 0 0', font: `700 24px/1.2 ${T.head}`, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{money(c.low, c.currency)} to {money(c.high, c.currency)}</dd></div>
            </dl>
            <p style={{ font: `400 14px/1.5 ${T.font}`, color: T.muted, margin: '14px 0 0', maxWidth: '64ch' }}>
              {c.yours === null ? 'Log your weekly numbers on the overview to see your own figure beside this. ' : c.yours < c.low ? 'You are paying less per lead than the published range. ' : c.yours > c.high ? 'You are paying more per lead than the published range. The fixes on your overview are where to start. ' : 'You are inside the published range. '}
              {!c.local && `This range is for ${c.scope}, not your own market, so read it as a rough guide.`}
            </p>
            <Source name={c.source} url={c.sourceUrl} date={c.published} />
          </div>
        </section>
      )}
    </div>
  )
}
