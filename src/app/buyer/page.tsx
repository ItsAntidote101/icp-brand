'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, RefreshCw, AlertCircle } from 'lucide-react'

const Warm   = '#fffefb'
const Dark   = '#201515'
const Orange = '#e8330a'
const Muted  = '#605d52'
const Border = '#c5c0b1'
const font   = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontB  = "'PolySans Neutral', -apple-system, system-ui, sans-serif"

type InboxItem = {
  id: string
  userId: string
  userName: string
  companyName: string | null
  tier: string
  score: number | null
  urgency: string
  note: string
  status: string
  assignedBuyer: string | null
  claimedBy: string | null
  claimedByMe: boolean
  createdAt: string
  repliedAt: string | null
}

type Filter = 'open' | 'mine' | 'unclaimed' | 'all'

export default function BuyerInboxPage() {
  const router = useRouter()
  const [buyerName, setBuyerName] = useState<string | null>(null)
  const [filter,    setFilter]    = useState<Filter>('open')
  const [items,     setItems]     = useState<InboxItem[]>([])
  const [loading,   setLoading]   = useState(true)
  const [claiming,  setClaiming]  = useState<string | null>(null)

  const load = useCallback(async (f: Filter) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/buyer/inbox?filter=${f}`)
      if (res.status === 401) { router.replace('/buyer/login'); return }
      const data = await res.json() as { items?: InboxItem[] }
      setItems(data.items ?? [])
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void (async () => {
      const meRes = await fetch('/api/buyer/me')
      if (meRes.status === 401) { router.replace('/buyer/login'); return }
      const me = await meRes.json() as { buyer?: { name: string } }
      setBuyerName(me.buyer?.name ?? null)
    })()
  }, [router])

  useEffect(() => { void load(filter) }, [filter, load])

  async function handleClaim(escalationId: string) {
    setClaiming(escalationId)
    try {
      const res = await fetch('/api/buyer/claim', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escalationId }),
      })
      if (!res.ok) {
        const data = await res.json() as { claimedBy?: string }
        alert(data.claimedBy ? `Already claimed by ${data.claimedBy}` : 'Could not claim this conversation.')
      }
      await load(filter)
    } finally {
      setClaiming(null)
    }
  }

  async function handleLogout() {
    await fetch('/api/buyer/auth/logout', { method: 'POST' })
    router.replace('/buyer/login')
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'open', label: 'Open' },
    { key: 'mine', label: 'My Queue' },
    { key: 'unclaimed', label: 'Unclaimed' },
    { key: 'all', label: 'All' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: Warm, fontFamily: fontB }}>
      <div style={{ background: Dark, padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Message Centre</p>
          {buyerName && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: '2px 0 0' }}>Signed in as {buyerName}</p>}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => load(filter)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: 8, cursor: 'pointer', display: 'flex' }}>
            <RefreshCw size={15} color="#fff" />
          </button>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: fontB }}>
            <LogOut size={14} /> Log out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{
                padding: '8px 16px', borderRadius: 100, border: `1px solid ${filter === f.key ? Dark : Border}`,
                background: filter === f.key ? Dark : '#fff', color: filter === f.key ? '#fff' : Muted,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: fontB,
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: Muted, fontSize: 14 }}>Loading…</p>
        ) : items.length === 0 ? (
          <div style={{ background: '#fff', border: `1px solid ${Border}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
            <p style={{ color: Muted, fontSize: 14, margin: 0 }}>Nothing here right now.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(item => (
              <div key={item.id} style={{ background: '#fff', border: `1px solid ${Border}`, borderRadius: 12, padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Link href={`/buyer/conversation/${item.userId}`} style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: Dark, textDecoration: 'none' }}>
                      {item.userName}
                    </Link>
                    {item.companyName && <span style={{ fontSize: 13, color: Muted }}>{item.companyName}</span>}
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: Orange, background: 'rgba(232,51,10,0.08)', padding: '2px 8px', borderRadius: 100 }}>{item.tier}</span>
                    {item.score !== null && <span style={{ fontSize: 12, color: Muted }}>Score {item.score}/100</span>}
                  </div>
                  {item.note && <p style={{ fontSize: 13, color: Dark, margin: '6px 0 0' }}>{item.note}</p>}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, fontSize: 12, color: Muted }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> {item.urgency}</span>
                    <span>· {item.status}</span>
                    {item.claimedBy && <span>· claimed by {item.claimedByMe ? 'you' : item.claimedBy}</span>}
                    {!item.claimedBy && item.assignedBuyer && <span>· assigned to {item.assignedBuyer}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {!item.claimedBy && (
                    <button onClick={() => handleClaim(item.id)} disabled={claiming === item.id}
                      style={{ background: Dark, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: fontB }}>
                      {claiming === item.id ? 'Claiming…' : 'Claim'}
                    </button>
                  )}
                  <Link href={`/buyer/conversation/${item.userId}`}
                    style={{ background: item.claimedByMe ? Orange : '#fff', color: item.claimedByMe ? '#fff' : Dark, border: `1px solid ${item.claimedByMe ? Orange : Border}`, borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: fontB }}>
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
