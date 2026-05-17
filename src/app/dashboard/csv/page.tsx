'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Papa from 'papaparse'

// ─── Types ───────────────────────────────────────────────────────────────────

type CsvFormat = 'google' | 'meta' | 'custom'

type Analysis = {
  summary?: string
  top_performers?: Array<{ name: string; metric: string; why: string }>
  underperformers?: Array<{ name: string; metric: string; why: string }>
  budget_waste?: { estimated_amount: string; explanation: string }
  audience_insights?: string[]
  recommendations?: Array<{ action: string; impact: string; revenue_upside: string }>
  raw?: string
}

type ParsedCSV = {
  headers: string[]
  rows: string[][]
  text: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FORMAT_HINTS: Record<CsvFormat, { label: string; cols: string; example: string }> = {
  google: {
    label: 'Google Ads',
    cols: 'Campaign, Impressions, Clicks, CTR, Avg. CPC, Cost, Conversions, Cost/conv.',
    example: 'Export from: Google Ads → Reports → Predefined reports → Basic → Campaigns',
  },
  meta: {
    label: 'Meta Ads',
    cols: 'Campaign name, Reach, Impressions, CPM, Link clicks, CPC, Amount spent, Results',
    example: 'Export from: Meta Ads Manager → Campaigns → Export table data → CSV',
  },
  custom: {
    label: 'Custom CSV',
    cols: 'Any columns — include campaign names, spend, and at least one performance metric',
    example: 'Works with any platform. The more columns, the better the analysis.',
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStoredEmail(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('dashboard_email') ?? ''
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-2xl ${className ?? ''}`} />
}

function ImpactBadge({ impact }: { impact: string }) {
  const colors = {
    High:   'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
    Medium: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    Low:    'bg-gray-500/15  text-gray-400  border-gray-500/20',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colors[impact as keyof typeof colors] ?? colors.Low}`}>
      {impact}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CsvUploadPage() {
  const [format, setFormat]         = useState<CsvFormat>('google')
  const [parsed, setParsed]         = useState<ParsedCSV | null>(null)
  const [fileName, setFileName]     = useState('')
  const [dragOver, setDragOver]     = useState(false)
  const [parseError, setParseError] = useState('')
  const [analysing, setAnalysing]   = useState(false)
  const [analysis, setAnalysis]     = useState<Analysis | null>(null)
  const [apiError, setApiError]     = useState('')
  const [userEmail, setUserEmail]   = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const resultsRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setUserEmail(getStoredEmail())
  }, [])

  // ── CSV parsing ───────────────────────────────────────────────────────────

  const processFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('Please upload a .csv file.')
      return
    }
    setParseError('')
    setAnalysis(null)
    setApiError('')
    setFileName(file.name)

    Papa.parse<string[]>(file, {
      complete(result) {
        const rows = result.data.filter(r => r.some(c => c.trim()))
        if (rows.length < 2) {
          setParseError('The CSV appears to be empty or has only one row.')
          return
        }
        const headers = rows[0]
        const dataRows = rows.slice(1)

        // Reassemble clean CSV text for the API (capped at 500 rows to stay within token limits)
        const capped = [headers, ...dataRows.slice(0, 500)]
        const text = capped.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')

        setParsed({ headers, rows: dataRows, text })
      },
      error(err) {
        setParseError(`Could not parse file: ${err.message}`)
      },
    })
  }, [])

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const reset = () => {
    setParsed(null)
    setFileName('')
    setAnalysis(null)
    setApiError('')
    setParseError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Analysis ──────────────────────────────────────────────────────────────

  const runAnalysis = async () => {
    if (!parsed) return
    setAnalysing(true)
    setApiError('')
    try {
      const res = await fetch('/api/csv-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvText: parsed.text,
          fileName,
          userEmail: userEmail || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Analysis failed')
      setAnalysis(json.analysis)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setAnalysing(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0f]">

      {/* Nav */}
      <nav className="sticky top-0 z-20 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-300 transition-colors text-sm">
            ← Dashboard
          </Link>
          <span className="text-gray-700">/</span>
          <span className="text-white text-sm font-medium">CSV Analysis</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-white">Campaign CSV Analysis</h1>
          <p className="text-gray-400 text-sm mt-1">
            Upload your ad platform export and get a media buyer&apos;s-eye analysis in seconds.
          </p>
        </div>

        {/* Format selector */}
        {!parsed && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">CSV Format</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(FORMAT_HINTS) as CsvFormat[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-colors text-center ${
                    format === f
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {FORMAT_HINTS[f].label}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-600 leading-relaxed space-y-1">
              <p><span className="text-gray-400">Expected columns:</span> {FORMAT_HINTS[format].cols}</p>
              <p className="text-gray-600">{FORMAT_HINTS[format].example}</p>
            </div>
          </div>
        )}

        {/* Upload zone */}
        {!parsed ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-3xl p-14 text-center cursor-pointer transition-all duration-150 select-none
              ${dragOver
                ? 'border-indigo-400 bg-indigo-500/5 scale-[1.01]'
                : 'border-white/10 hover:border-white/25 bg-white/[0.02]'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileInput}
            />
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-white font-semibold text-lg mb-1">Drop your CSV here</p>
            <p className="text-gray-500 text-sm">or click to browse</p>
            <p className="text-gray-700 text-xs mt-4">
              {FORMAT_HINTS[format].label} format selected · Max 500 rows analysed
            </p>
          </div>
        ) : (
          /* File loaded state */
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{fileName}</p>
                  <p className="text-gray-500 text-xs">
                    {parsed.rows.length} rows · {parsed.headers.length} columns
                  </p>
                </div>
              </div>
              <button
                onClick={reset}
                className="text-xs text-gray-600 hover:text-gray-300 transition-colors shrink-0"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Parse error */}
        {parseError && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-2xl px-4 py-3">
            {parseError}
          </p>
        )}

        {/* Preview table */}
        {parsed && parsed.headers.length > 0 && !analysis && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <p className="text-xs text-gray-500 uppercase tracking-widest px-5 pt-4 pb-3 font-semibold border-b border-white/5">
              Preview — first 5 rows
            </p>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {parsed.headers.slice(0, 7).map((h, i) => (
                      <th key={i} className="text-left px-4 py-2.5 text-gray-500 font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                    {parsed.headers.length > 7 && (
                      <th className="px-4 py-2.5 text-gray-700 font-medium text-left">
                        +{parsed.headers.length - 7} more
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      {row.slice(0, 7).map((cell, j) => (
                        <td key={j} className="px-4 py-2.5 text-gray-300 whitespace-nowrap max-w-[160px] truncate">
                          {cell || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analyse button */}
        {parsed && !analysis && (
          <button
            onClick={runAnalysis}
            disabled={analysing}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2.5 text-sm"
          >
            {analysing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analysing your campaigns…
              </>
            ) : (
              'Analyse with AI →'
            )}
          </button>
        )}

        {/* API error */}
        {apiError && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-2xl px-4 py-3">
            {apiError}
          </p>
        )}

        {/* Skeleton while loading */}
        {analysing && (
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
            <Skeleton className="h-28" />
            <Skeleton className="h-40" />
          </div>
        )}

        {/* ── Results ── */}
        {analysis && !analysing && (
          <div ref={resultsRef} className="space-y-5">

            {/* Summary */}
            {'summary' in analysis && analysis.summary && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6">
                <p className="text-xs text-indigo-400 uppercase tracking-widest font-semibold mb-3">Overview</p>
                <p className="text-white text-base leading-relaxed">{analysis.summary}</p>
              </div>
            )}

            {/* Top / Bottom performers */}
            {'top_performers' in analysis && analysis.top_performers && (
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Winners */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                  <p className="text-xs text-emerald-400 uppercase tracking-widest font-semibold mb-4">
                    Top Performers
                  </p>
                  <div className="space-y-5">
                    {analysis.top_performers.map((p, i) => (
                      <div key={i} className="border-b border-white/5 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm text-white font-medium leading-snug">{p.name}</p>
                          <span className="text-xs text-emerald-400 font-semibold shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            {p.metric}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">{p.why}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Losers */}
                {'underperformers' in analysis && analysis.underperformers && (
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <p className="text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
                      Underperformers
                    </p>
                    <div className="space-y-5">
                      {analysis.underperformers.map((p, i) => (
                        <div key={i} className="border-b border-white/5 last:border-0 pb-4 last:pb-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm text-white font-medium leading-snug">{p.name}</p>
                            <span className="text-xs text-red-400 font-semibold shrink-0 bg-red-500/10 px-2 py-0.5 rounded-full">
                              {p.metric}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">{p.why}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Budget waste */}
            {'budget_waste' in analysis && analysis.budget_waste && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6">
                <div className="flex items-center gap-4 mb-3">
                  <p className="text-xs text-amber-400 uppercase tracking-widest font-semibold">Budget Waste</p>
                  <span className="text-2xl font-black text-amber-400">
                    {analysis.budget_waste.estimated_amount}
                  </span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {analysis.budget_waste.explanation}
                </p>
              </div>
            )}

            {/* Audience insights */}
            {'audience_insights' in analysis && analysis.audience_insights && analysis.audience_insights.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <p className="text-xs text-purple-400 uppercase tracking-widest font-semibold mb-4">
                  Audience Insights
                </p>
                <ul className="space-y-3">
                  {analysis.audience_insights.map((insight, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-300 leading-relaxed">
                      <span className="text-purple-400 shrink-0 mt-0.5">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {'recommendations' in analysis && analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <p className="text-xs text-white uppercase tracking-widest font-semibold mb-5">
                  Recommendations — ranked by revenue impact
                </p>
                <div className="space-y-5">
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-4 border-b border-white/5 last:border-0 pb-5 last:pb-0">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <ImpactBadge impact={rec.impact} />
                          <span className="text-xs text-emerald-400 font-medium">{rec.revenue_upside}</span>
                        </div>
                        <p className="text-sm text-white leading-relaxed">{rec.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw fallback */}
            {'raw' in analysis && analysis.raw && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-xs text-gray-500 mb-3">Analysis (raw)</p>
                <pre className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{analysis.raw}</pre>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/dashboard"
                className="flex-1 text-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-3 rounded-2xl text-sm transition-colors"
              >
                Back to Dashboard
              </Link>
              <button
                onClick={reset}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white font-medium px-5 py-3 rounded-2xl text-sm transition-colors"
              >
                Analyse another file
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
