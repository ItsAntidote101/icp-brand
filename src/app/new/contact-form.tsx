'use client'

import { useState } from 'react'

// The contact page form. Sends to /api/contact, which emails the message on.
export default function ContactForm({ labels }: { labels: string[] }) {
  const [name, phone, message] = [labels[0] ?? 'Name', labels[1] ?? 'WhatsApp number', labels[2] ?? 'What you need help with']
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (state === 'sending') return
    const data = Object.fromEntries(new FormData(e.currentTarget))
    setState('sending'); setError('')
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const out = await res.json().catch(() => ({}))
      if (!res.ok) { setError(out.message || 'That did not send. Please try again in a minute.'); setState('idle'); return }
      setState('sent')
    } catch {
      setError('That did not send. Check your connection and try again.'); setState('idle')
    }
  }

  if (state === 'sent') return (
    <div className="ic-form-done" role="status">
      <h3>Your message is with us.</h3>
      <p className="ic-p">A media buyer will read it and reply on the WhatsApp number you gave.</p>
    </div>
  )

  return (
    <form className="ic-form" onSubmit={submit} noValidate={false}>
      <label htmlFor="ic-f-name">{name}<input id="ic-f-name" name="name" autoComplete="name" required minLength={2} maxLength={80} /></label>
      <label htmlFor="ic-f-phone">{phone}<input id="ic-f-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="07..." required maxLength={30} /></label>
      <label htmlFor="ic-f-message">{message}<textarea id="ic-f-message" name="message" rows={5} required minLength={10} maxLength={2000} /></label>
      <div className="ic-hp" aria-hidden="true"><label htmlFor="ic-f-website">Website<input id="ic-f-website" name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {error && <p className="ic-form-err" role="alert">{error}</p>}
      <button type="submit" className="ic-btn" disabled={state === 'sending'}>{state === 'sending' ? 'Sending' : 'Send message'}</button>
    </form>
  )
}
