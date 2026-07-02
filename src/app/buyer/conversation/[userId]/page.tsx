'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, CheckCircle } from 'lucide-react'

const Warm   = '#fffefb'
const Dark   = '#201515'
const Orange = '#e8330a'
const Muted  = '#605d52'
const Border = '#c5c0b1'
const font   = "'PolySans Median', -apple-system, system-ui, sans-serif"
const fontB  = "'PolySans Neutral', -apple-system, system-ui, sans-serif"

type ThreadMsg = {
  id: string
  role: 'user' | 'assistant' | 'media_buyer'
  content: string
  buyerName: string | null
  createdAt: string
}

type Finding = { title: string; severity: string; explanation: string }
type QuickWin = { action: string; impact: string; timeline?: string }

type ConversationData = {
  user: { id: string; email: string; fullName: string | null; companyName: string | null; tier: string; assignedBuyer: string | null }
  report: { score: number | null; wasteEstimate: string | null; findings: Finding[]; quickWins: QuickWin[]; generatedAt: string | null }
  thread: ThreadMsg[]
  escalations: { id: string; urgency: string; note: string; status: string; assignedBuyer: string | null; claimedBy: string | null; claimedByMe: boolean; createdAt: string }[]
}

export default function BuyerConversationPage() {
  const router = useRouter()
  const params = useParams<{ userId: string }>()
  const userId = params.userId

  const [data,     setData]     = useState<ConversationData | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [reply,    setReply]    = useState('')
  const [sending,  setSending]  = useState(false)
  const [busyId,   setBusyId]   = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/buyer/conversation/${userId}`)
    if (res.status === 401) { router.replace('/buyer/login'); return }
    if (!res.ok) { setLoading(false); return }
    const json = await res.json() as ConversationData
    setData(json)
    setLoading(false)
  }, [userId, router])

  useEffect(() => { void load() }, [load])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [data?.thread.length])

  const openEscalation = data?.escalations.find(e => e.status !== 'resolved')

  async function handleSend() {
    if (!reply.trim() || sending) return
    setSending(true)
    try {
      await fetch('/api/buyer/reply', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, escalationId: openEscalation?.id, reply: reply.trim() }),
      })
      setReply('')
      await load()
    } finally {
      setSending(false)
    }
  }

  async function handleClaim() {
    if (!openEscalation) return
    setBusyId(openEscalation.id)
    try {
      await fetch('/api/buyer/claim', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escalationId: openEscalation.id }),
      })
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function handleResolve() {
    if (!openEscalation) return
    setBusyId(openEscalation.id)
    try {
      await fetch('/api/buyer/resolve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escalationId: openEscalation.id }),
      })
      await load()
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <div style={{ minHeight: '100vh', background: Warm, display: 'flex', alignItems: 'center', justifyContent: 'center', color: Muted, fontFamily: fontB }}>Loading…</div>
  if (!data) return <div style={{ minHeight: '100vh', background: Warm, display: 'flex', alignItems: 'center', justifyContent: 'center', color: Muted, fontFamily: fontB }}>Conversation not found.</div>

  const { user, report, thread } = data

  return (
    <div style={{ minHeight: '100vh', background: Warm, fontFamily: fontB, display: 'flex' }}>
      {/* Context sidebar */}
      <div style={{ width: 300, flexShrink: 0, background: '#fff', borderRight: `1px solid ${Border}`, padding: 24, overflowY: 'auto' }}>
        <Link href="/buyer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: Muted, textDecoration: 'none', fontSize: 13, marginBottom: 20 }}>
          <ArrowLeft size={14} /> Inbox
        </Link>
        <p style={{ fontFamily: font, fontSize: 17, fontWeight: 700, color: Dark, margin: '0 0 2px' }}>{user.fullName ?? user.email}</p>
        {user.companyName && <p style={{ fontSize: 13, color: Muted, margin: '0 0 12px' }}>{user.companyName}</p>}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: Orange, background: 'rgba(232,51,10,0.08)', padding: '3px 9px', borderRadius: 100 }}>{user.tier}</span>
          {user.assignedBuyer && <span style={{ fontSize: 11, color: Muted, padding: '3px 0' }}>Assigned: {user.assignedBuyer}</span>}
        </div>

        {report.score !== null && (
          <div style={{ background: Warm, border: `1px solid ${Border}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: Muted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>ICP Health Score</p>
            <p style={{ fontFamily: font, fontSize: 26, fontWeight: 700, color: Dark, margin: 0 }}>{report.score}/100</p>
            {report.wasteEstimate && <p style={{ fontSize: 12, color: Muted, margin: '4px 0 0' }}>Losing {report.wasteEstimate}/mo</p>}
          </div>
        )}

        {report.findings.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: Muted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Top Findings</p>
            {report.findings.slice(0, 3).map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: Dark, marginBottom: 8, lineHeight: 1.4 }}>
                <strong>{f.title}</strong>
                <p style={{ margin: '2px 0 0', color: Muted, fontSize: 12 }}>{f.explanation}</p>
              </div>
            ))}
          </div>
        )}

        {report.quickWins.length > 0 && (
          <div>
            <p style={{ fontSize: 11, color: Muted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Quick Wins</p>
            {report.quickWins.slice(0, 3).map((w, i) => (
              <p key={i} style={{ fontSize: 13, color: Dark, margin: '0 0 6px', lineHeight: 1.4 }}>{w.action}</p>
            ))}
          </div>
        )}

        {openEscalation && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${Border}` }}>
            <p style={{ fontSize: 11, color: Muted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Escalation</p>
            <p style={{ fontSize: 13, color: Dark, margin: '0 0 4px' }}>Urgency: {openEscalation.urgency}</p>
            <p style={{ fontSize: 13, color: Muted, margin: '0 0 10px' }}>Status: {openEscalation.status}{openEscalation.claimedBy ? ` · ${openEscalation.claimedByMe ? 'claimed by you' : `claimed by ${openEscalation.claimedBy}`}` : ''}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {!openEscalation.claimedByMe && (
                <button onClick={handleClaim} disabled={busyId === openEscalation.id}
                  style={{ flex: 1, background: Dark, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Claim
                </button>
              )}
              <button onClick={handleResolve} disabled={busyId === openEscalation.id}
                style={{ flex: 1, background: '#fff', color: Dark, border: `1px solid ${Border}`, borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <CheckCircle size={14} /> Resolve
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Thread */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {thread.length === 0 && <p style={{ color: Muted, fontSize: 14 }}>No messages yet.</p>}
          {thread.map(msg => {
            const isUser = msg.role === 'user'
            const isBuyer = msg.role === 'media_buyer'
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-start' : 'flex-end', gap: 4 }}>
                {isBuyer && <span style={{ fontSize: 11, color: Muted, paddingRight: 4 }}>{msg.buyerName ?? 'Media buyer'}</span>}
                <div style={{
                  maxWidth: '70%', padding: '10px 14px', borderRadius: 12, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                  background: isUser ? '#fff' : isBuyer ? Orange : '#ede9fe',
                  color: isUser ? Dark : isBuyer ? '#fff' : Dark,
                  border: isUser ? `1px solid ${Border}` : 'none',
                }}>
                  {msg.content}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <div style={{ borderTop: `1px solid ${Border}`, padding: 16, display: 'flex', gap: 10, background: '#fff' }}>
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Reply as media buyer…"
            rows={2}
            style={{ flex: 1, resize: 'none', border: `1px solid ${Border}`, borderRadius: 8, padding: '10px 12px', fontFamily: fontB, fontSize: 14, outline: 'none' }}
          />
          <button onClick={handleSend} disabled={!reply.trim() || sending}
            style={{ background: Orange, color: '#fff', border: 'none', borderRadius: 8, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 8, cursor: !reply.trim() || sending ? 'default' : 'pointer', opacity: !reply.trim() || sending ? 0.6 : 1, fontFamily: fontB, fontWeight: 600 }}>
            <Send size={15} /> {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
