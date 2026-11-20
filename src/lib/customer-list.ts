// Turn a client's own customer spreadsheet into the file Meta accepts for a
// customer list audience. Everything here runs in the browser: the client's
// list is never sent to our server.

export type Field = 'email' | 'phone' | 'fn' | 'ln' | 'name' | 'ct'
export type Mapping = Partial<Record<Field, number>>   // field -> column index
export type Cell = string | number | boolean | Date | null | undefined

const s = (v: Cell): string => {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return ''
  if (typeof v === 'number') return Number.isFinite(v) ? v.toLocaleString('fullwide', { useGrouping: false, maximumFractionDigits: 0 }) : ''
  return String(v).trim()
}

/** Split CSV text into rows. Handles quotes and picks comma, semicolon or tab by the first line. */
export function parseCsv(text: string): string[][] {
  const t = text.replace(/^﻿/, '')
  const first = t.split(/\r?\n/, 1)[0] ?? ''
  const count = (c: string) => first.split(c).length - 1
  const sep = count('\t') > count(',') && count('\t') >= count(';') ? '\t' : count(';') > count(',') ? ';' : ','
  const rows: string[][] = []
  let row: string[] = [], cell = '', quoted = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (quoted) {
      if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++ } else quoted = false }
      else cell += c
    } else if (c === '"' && cell === '') quoted = true
    else if (c === sep) { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some(x => x.trim() !== '')) rows.push(row)
      row = []
    } else cell += c
  }
  row.push(cell)
  if (row.some(x => x.trim() !== '')) rows.push(row)
  return rows
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export function cleanEmail(v: Cell): string {
  const e = s(v).toLowerCase().replace(/^mailto:/, '')
  return EMAIL.test(e) ? e : ''
}

/**
 * A phone number as Meta wants it: digits only, starting with the country code.
 * Kenyan numbers written 07.., 01.., 7.. or 1.. get 254 in front (a spreadsheet
 * often drops the leading zero). Numbers that already carry a country code are kept.
 */
export function cleanPhone(v: Cell): string {
  const raw = s(v)
  if (!raw) return ''
  const intl = /^\s*(\+|00)/.test(raw)
  let d = raw.replace(/\D/g, '')
  if (raw.trim().startsWith('00')) d = d.replace(/^00/, '')
  if (intl) return d.length >= 9 && d.length <= 15 ? d : ''
  if (/^254[17]\d{8}$/.test(d)) return d
  if (/^0[17]\d{8}$/.test(d))   return `254${d.slice(1)}`
  if (/^[17]\d{8}$/.test(d))    return `254${d}`
  // Anything else long enough to already include a country code
  return d.length >= 11 && d.length <= 15 ? d : ''
}

const CODES: [string, string][] = [['254', 'KE'], ['255', 'TZ'], ['256', 'UG'], ['250', 'RW'], ['251', 'ET'], ['234', 'NG'], ['233', 'GH'], ['971', 'AE'], ['27', 'ZA'], ['44', 'GB'], ['1', 'US']]
export const countryOf = (phone: string): string => (phone ? (CODES.find(([c]) => phone.startsWith(c))?.[1] ?? '') : 'KE')

const HEADERS: Record<Field, RegExp> = {
  email: /e-?mail|barua/i,
  phone: /phone|mobile|cell|tel|whats\s*app|msisdn|contact|simu|number/i,
  fn:    /first|given|fname|jina la kwanza/i,
  ln:    /last|surname|family|lname|second name/i,
  name:  /^(full\s*)?name$|customer|client|^names?$|jina/i,
  ct:    /city|town|location|area|county|mji/i,
}

const looksLikeData = (row: Cell[]) => row.some(c => cleanEmail(c) || cleanPhone(c))

/** Does the first row hold column titles? */
export function hasHeader(rows: Cell[][]): boolean {
  if (rows.length < 2) return false
  return !looksLikeData(rows[0]) && rows[0].some(c => /[a-z]/i.test(s(c)))
}

/** Work out which column is which, from the titles first and the contents second. */
export function guessMapping(rows: Cell[][]): Mapping {
  const header = hasHeader(rows)
  const body   = (header ? rows.slice(1) : rows).slice(0, 200)
  const width  = Math.max(0, ...rows.slice(0, 50).map(r => r.length))
  const map: Mapping = {}
  if (header) {
    // Most specific first, so "Email" is not taken as a contact number and "First name" not as a full name
    for (const f of ['email', 'fn', 'ln', 'ct', 'phone', 'name'] as Field[]) {
      for (let c = 0; c < width; c++) {
        if (Object.values(map).includes(c)) continue
        if (HEADERS[f].test(s(rows[0][c]))) { map[f] = c; break }
      }
    }
  }
  const share = (c: number, test: (v: Cell) => string) => body.length ? body.filter(r => test(r[c])).length / body.length : 0
  const best  = (test: (v: Cell) => string) => {
    let at = -1, top = 0
    for (let c = 0; c < width; c++) {
      if (Object.values(map).includes(c)) continue
      const sh = share(c, test); if (sh > top) { top = sh; at = c }
    }
    return top >= 0.3 ? at : -1
  }
  if (map.email === undefined) { const c = best(cleanEmail); if (c >= 0) map.email = c }
  if (map.phone === undefined) { const c = best(cleanPhone); if (c >= 0) map.phone = c }
  // A titled phone column whose contents are not phone numbers is the wrong column
  if (map.phone !== undefined && share(map.phone, cleanPhone) < 0.1) {
    delete map.phone
    const c = best(cleanPhone); if (c >= 0) map.phone = c
  }
  return map
}

export type ListResult = {
  csv: string
  total: number          // data rows read
  kept: number           // rows written
  withEmail: number
  withPhone: number
  noContact: number      // dropped: neither a usable email nor phone
  duplicates: number     // dropped: same person twice
}

const cell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)

/** Build the Meta customer list file. Columns: email, phone, fn, ln, ct, country. */
export function buildMetaList(rows: Cell[][], map: Mapping): ListResult {
  const body = hasHeader(rows) ? rows.slice(1) : rows
  const out: string[] = ['email,phone,fn,ln,ct,country']
  const seen = new Set<string>()
  const r: ListResult = { csv: '', total: 0, kept: 0, withEmail: 0, withPhone: 0, noContact: 0, duplicates: 0 }
  const at = (row: Cell[], f: Field) => (map[f] === undefined ? '' : s(row[map[f] as number]))
  for (const row of body) {
    if (!row || row.every(c => s(c) === '')) continue
    r.total++
    const email = map.email === undefined ? '' : cleanEmail(row[map.email])
    const phone = map.phone === undefined ? '' : cleanPhone(row[map.phone])
    if (!email && !phone) { r.noContact++; continue }
    const key = `${email}|${phone}`
    if (seen.has(key) || (email && seen.has(`e:${email}`)) || (phone && seen.has(`p:${phone}`))) { r.duplicates++; continue }
    seen.add(key); if (email) seen.add(`e:${email}`); if (phone) seen.add(`p:${phone}`)
    let fn = at(row, 'fn'), ln = at(row, 'ln')
    if (!fn && !ln) {
      const parts = at(row, 'name').split(/\s+/).filter(Boolean)
      fn = parts[0] ?? ''; ln = parts.length > 1 ? parts[parts.length - 1] : ''
    }
    out.push([email, phone, fn, ln, at(row, 'ct'), countryOf(phone)].map(cell).join(','))
    r.kept++; if (email) r.withEmail++; if (phone) r.withPhone++
  }
  r.csv = out.join('\r\n') + '\r\n'
  return r
}

/** Column titles for the pickers: the header text, or "Column A" when there is none. */
export function columnNames(rows: Cell[][]): string[] {
  const width  = Math.max(0, ...rows.slice(0, 50).map(r => r.length))
  const header = hasHeader(rows)
  return Array.from({ length: width }, (_, c) => (header && s(rows[0][c])) || `Column ${String.fromCharCode(65 + (c % 26))}`)
}
