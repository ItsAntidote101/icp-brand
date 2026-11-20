// "Write it for me": the actual words a client can paste to carry out one fix.
import { answersBlock, type AnswerMap } from '@/lib/answers'

export type Fix = { action?: string; platform?: string; where?: string }

export const DRAFT_SYSTEM = `You write the actual words a small business in Kenya can copy and use today to carry out one fix from their ad report. You are not giving advice: you are writing the thing itself.

Pick the form that fits the fix:
- a WhatsApp or SMS reply to a new inquiry
- ad text (a headline of at most 8 words, then the main text)
- the questions for a lead form, each with its answer choices
- words for a page (a headline, one supporting line, the button text)
- if the fix is a setting inside an ad platform, the exact values to enter, one per line

Rules you must not break:
- First line: a short label for what this is, for example "WhatsApp first reply". Then a blank line. Then the draft and nothing after it.
- Plain text only. No markdown, no asterisks, no em dashes or en dashes.
- Use only what the business told us. Never invent a price, a number, a year, an award, a location, a customer name or a result. Where the draft needs a fact only they know, write it in square brackets, for example [price] or [your location].
- Write the way a Kenyan business owner would write to a customer: warm, short, clear. No hype words.
- At most 110 words after the label.`

export function draftPrompt(fix: Fix, answers: AnswerMap, company: string): string {
  return `THE FIX TO CARRY OUT
${(fix.action ?? '').slice(0, 600)}
${fix.platform || fix.where ? `Where: ${[fix.platform, fix.where].filter(Boolean).join(', ')}` : ''}

THE BUSINESS${company ? ` (${company})` : ''}
${answersBlock(answers)}

Write the draft now.`
}

/** Tidy the model's reply into { label, body }. Returns null if there is nothing usable. */
export function cleanDraft(raw: string): { label: string; body: string } | null {
  const text = raw.replace(/\r/g, '').replace(/[–—]/g, ',').replace(/\*\*/g, '').trim()
  if (text.length < 20) return null
  const lines = text.split('\n')
  const first = lines[0].trim().replace(/[:.]$/, '')
  const rest  = lines.slice(1).join('\n').trim()
  if (rest.length >= 20 && first.length <= 60) return { label: first, body: rest.slice(0, 1500) }
  return { label: 'Draft', body: text.slice(0, 1500) }
}
