// Remembers where a visitor stopped, in their own browser only. Nothing here
// is sent anywhere: it lets someone who leaves mid-way come back days later,
// on the same device, and carry on. Entries expire after 14 days.

const TTL_MS = 14 * 24 * 60 * 60 * 1000
const OPENER = 'icp_opener_answers'      // the conversation on the home page
const PROGRESS = 'icp_q_progress'        // the questions that follow it

import { getConsent } from './consent'

type Saved<T> = { at: number; data: T }
export type AnswerMapLoose = Record<number, string | number | string[]>
export interface Progress { answers: AnswerMapLoose; profile: { name: string; email: string; company: string } }

function read<T>(key: string): T | null {
  try {
    if (!getConsent().functional) return null
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const saved = JSON.parse(raw) as Saved<T>
    if (!saved || typeof saved.at !== 'number' || Date.now() - saved.at > TTL_MS) { window.localStorage.removeItem(key); return null }
    return saved.data ?? null
  } catch { return null }
}
function write<T>(key: string, data: T) {
  if (!getConsent().functional) return
  try { window.localStorage.setItem(key, JSON.stringify({ at: Date.now(), data } satisfies Saved<T>)) } catch { /* private mode: nothing is remembered */ }
}
function drop(key: string) { try { window.localStorage.removeItem(key) } catch { /* nothing to clear */ } }

export const loadOpener = (): Record<number, string> => read<Record<number, string>>(OPENER) ?? {}
export const saveOpener = (a: Record<number, string>) => write(OPENER, a)
export const clearOpener = () => drop(OPENER)

export const loadProgress = (): Progress | null => read<Progress>(PROGRESS)
export const saveProgress = (p: Progress) => write(PROGRESS, p)
export const clearProgress = () => drop(PROGRESS)

/** Called when a diagnosis is finished: there is nothing left to resume. */
export const clearResume = () => { drop(OPENER); drop(PROGRESS) }
