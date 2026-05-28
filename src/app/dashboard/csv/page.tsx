'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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
    cols: 'Any columns, include campaign names, spend, and at least one performance metric',
    example: 'Works with any platform. The more columns, the better the analysis.',
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStoredEmail(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('dashboard_email') ?? ''
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[rgba(201,192,177,0.18)] rounded ${className ?? ''}`} />
}

function ImpactBadge({ impact }: { impact: string }) {
  const colors = {
    High:   'bg-[rgba(232,51,10,0.1)] text-[#e8330a] border-[#e8330a]/20',
    Medium: 'bg-[rgba(201,192,177,0.3)] text-[#605d52] border-purple-500/20',
    Low:    'bg-[rgba(201,192,177,0.25)]  text-[#939084]  border-gray-500/20',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colors[impact as keyof typeof colors] ?? colors.Low}`}>
      {impact}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CsvUploadPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#fffefb' }} />}>
      <CsvUploadInner />
    </Suspense>
  )
}

function CsvUploadInner() {
  const searchParams = useSearchParams()
  const savedId      = searchParams.get('id')

  const [format, setFormat]         = useState<CsvFormat>('google')
  const [parsed, setParsed]         = useState<ParsedCSV | null>(null)
  const [fileName, setFileName]     = useState('')
  const [dragOver, setDragOver]     = useState(false)
  const [parseError, setParseError] = useState('')
  const [analysing, setAnalysing]   = useState(false)
  const [analysis, setAnalysis]     = useState<Analysis | null>(null)
  const [apiError, setApiError]     = useState('')
  const [userEmail, setUserEmail]   = useState('')
  const [savedMeta, setSavedMeta]   = useState<{ file: string; created_at: string } | null>(null)
  const [loadingId, setLoadingId]   = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const resultsRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setUserEmail(getStoredEmail())
  }, [])

  // Load a saved analysis when ?id= is present
  useEffect(() => {
    if (!savedId) return
    setLoadingId(true)
    fetch('/api/csv-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: savedId }),
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(j => {
        const d = j.analysis as Record<string, unknown>
        setAnalysis(d as Analysis)
        setSavedMeta({ file: typeof d.file === 'string' ? d.file : 'upload.csv', created_at: j.created_at })
      })
      .catch(() => setApiError('Could not load saved analysis.'))
      .finally(() => setLoadingId(false))
  }, [savedId])

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
    <div className="min-h-screen bg-[#fffefb]">

      {/* Nav */}
      <nav className="sticky top-0 z-20 bg-[#fffefb]/90 backdrop-blur-md border-b border-[rgba(201,192,177,0.3)]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard" className="text-[#939084] hover:text-[#605d52] transition-colors text-sm">
            ← Dashboard
          </Link>
          <span className="text-[#939084]">/</span>
          {savedId ? (
            <>
              <Link href="/dashboard/csv" className="text-[#939084] hover:text-[#605d52] transition-colors text-sm">CSV Analysis</Link>
              <span className="text-[#939084]">/</span>
              <span className="text-[#201515] text-sm font-medium truncate max-w-[160px]">{savedMeta?.file ?? 'Saved analysis'}</span>
            </>
          ) : (
            <span className="text-[#201515] text-sm font-medium">CSV Analysis</span>
          )}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {savedId ? (
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-[#201515]">{savedMeta?.file ?? 'Campaign Analysis'}</h1>
              {savedMeta?.created_at && (
                <p className="text-[#939084] text-sm mt-1">
                  Analysed {new Date(savedMeta.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
            <Link href="/dashboard/csv" className="text-sm font-semibold text-[#e8330a] border border-[#e8330a]/30 rounded px-4 py-2 hover:bg-[#e8330a]/5 transition-colors">
              + New upload
            </Link>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-[#201515]">Campaign CSV Analysis</h1>
            <p className="text-[#939084] text-sm mt-1">
              Upload your ad platform export and get a media buyer&apos;s-eye analysis in seconds.
            </p>
          </div>
        )}

        {/* Loading spinner for saved analysis */}
        {loadingId && (
          <div className="flex items-center gap-3 py-12 justify-center text-[#939084] text-sm">
            <span className="w-4 h-4 border-2 border-[#c5c0b1] border-t-[#201515] rounded-full animate-spin" />
            Loading saved analysis…
          </div>
        )}

        {/* Format selector — only for new uploads */}
        {!parsed && !savedId && (
          <div className="bg-[rgba(201,192,177,0.18)] border border-[#c5c0b1] rounded p-5 space-y-4">
            <p className="text-xs text-[#939084] uppercase tracking-widest font-semibold">CSV Format</p>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5">
              {(Object.keys(FORMAT_HINTS) as CsvFormat[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`py-2.5 px-3 rounded text-sm font-medium transition-colors text-center ${
                    format === f
                      ? 'bg-[#e8330a] text-[#201515]'
                      : 'bg-[rgba(201,192,177,0.18)] text-[#939084] hover:text-[#201515] hover:bg-[rgba(201,192,177,0.25)]'
                  }`}
                >
                  {FORMAT_HINTS[f].label}
                </button>
              ))}
            </div>
            <div className="text-xs text-[#939084] leading-relaxed space-y-1">
              <p><span className="text-[#939084]">Expected columns:</span> {FORMAT_HINTS[format].cols}</p>
              <p className="text-[#939084]">{FORMAT_HINTS[format].example}</p>
            </div>
          </div>
        )}

        {/* Upload zone — hidden when viewing a saved analysis */}
        {!savedId && !parsed ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded p-8 sm:p-14 text-center cursor-pointer transition-all duration-150 select-none
              ${dragOver
                ? 'border-[#e8330a] bg-[#e8330a]/5 scale-[1.01]'
                : 'border-[#c5c0b1] hover:border-white/25 bg-white/[0.02]'
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
            <div className="w-14 h-14 rounded bg-[rgba(201,192,177,0.18)] border border-[#c5c0b1] flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-[#939084]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-[#201515] font-semibold text-lg mb-1">Drop your CSV here</p>
            <p className="text-[#939084] text-sm">or click to browse</p>
            <p className="text-[#939084] text-xs mt-4">
              {FORMAT_HINTS[format].label} format selected · Max 500 rows analysed
            </p>
          </div>
        ) : (
          /* File loaded state */
          <div className="bg-[rgba(201,192,177,0.18)] border border-[#c5c0b1] rounded p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded bg-[rgba(232,51,10,0.1)] border border-[#e8330a]/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#e8330a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[#201515] text-sm font-medium truncate">{fileName}</p>
                  <p className="text-[#939084] text-xs">
                    {parsed?.rows.length ?? 0} rows · {parsed?.headers.length ?? 0} columns
                  </p>
                </div>
              </div>
              <button
                onClick={reset}
                className="text-xs text-[#939084] hover:text-[#605d52] transition-colors shrink-0"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Parse error */}
        {parseError && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-4 py-3">
            {parseError}
          </p>
        )}

        {/* Preview table */}
        {parsed && parsed.headers.length > 0 && !analysis && (
          <div className="bg-[rgba(201,192,177,0.18)] border border-[#c5c0b1] rounded overflow-hidden">
            <p className="text-xs text-[#939084] uppercase tracking-widest px-5 pt-4 pb-3 font-semibold border-b border-[rgba(201,192,177,0.3)]">
              Preview, first 5 rows
            </p>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="border-b border-[rgba(201,192,177,0.3)]">
                    {parsed.headers.slice(0, 7).map((h, i) => (
                      <th key={i} className="text-left px-4 py-2.5 text-[#939084] font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                    {parsed.headers.length > 7 && (
                      <th className="px-4 py-2.5 text-[#939084] font-medium text-left">
                        +{parsed.headers.length - 7} more
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-[rgba(201,192,177,0.3)] last:border-0">
                      {row.slice(0, 7).map((cell, j) => (
                        <td key={j} className="px-4 py-2.5 text-[#605d52] whitespace-nowrap max-w-[160px] truncate">
                          {cell || '-'}
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
            className="w-full bg-[#e8330a] hover:opacity-90 disabled:opacity-60 text-[#201515] font-semibold py-4 rounded transition-colors flex items-center justify-center gap-2.5 text-sm"
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
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-4 py-3">
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
              <div className="bg-[#e8330a]/10 border border-[#e8330a]/20 rounded p-6">
                <p className="text-xs text-[#e8330a] uppercase tracking-widest font-semibold mb-3">Overview</p>
                <p className="text-[#201515] text-base leading-relaxed">{analysis.summary}</p>
              </div>
            )}

            {/* Top / Bottom performers */}
            {'top_performers' in analysis && analysis.top_performers && (
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Winners */}
                <div className="bg-[rgba(201,192,177,0.18)] border border-[#c5c0b1] rounded p-6">
                  <p className="text-xs text-emerald-400 uppercase tracking-widest font-semibold mb-4">
                    Top Performers
                  </p>
                  <div className="space-y-5">
                    {analysis.top_performers.map((p, i) => (
                      <div key={i} className="border-b border-[rgba(201,192,177,0.3)] last:border-0 pb-4 last:pb-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm text-[#201515] font-medium leading-snug">{p.name}</p>
                          <span className="text-xs text-emerald-400 font-semibold shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            {p.metric}
                          </span>
                        </div>
                        <p className="text-xs text-[#939084] leading-relaxed">{p.why}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Losers */}
                {'underperformers' in analysis && analysis.underperformers && (
                  <div className="bg-[rgba(201,192,177,0.18)] border border-[#c5c0b1] rounded p-6">
                    <p className="text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
                      Underperformers
                    </p>
                    <div className="space-y-5">
                      {analysis.underperformers.map((p, i) => (
                        <div key={i} className="border-b border-[rgba(201,192,177,0.3)] last:border-0 pb-4 last:pb-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm text-[#201515] font-medium leading-snug">{p.name}</p>
                            <span className="text-xs text-red-400 font-semibold shrink-0 bg-red-500/10 px-2 py-0.5 rounded-full">
                              {p.metric}
                            </span>
                          </div>
                          <p className="text-xs text-[#939084] leading-relaxed">{p.why}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Budget waste */}
            {'budget_waste' in analysis && analysis.budget_waste && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded p-6">
                <div className="flex items-center gap-4 mb-3">
                  <p className="text-xs text-amber-400 uppercase tracking-widest font-semibold">Budget Waste</p>
                  <span className="text-2xl font-black text-amber-400">
                    {analysis.budget_waste.estimated_amount}
                  </span>
                </div>
                <p className="text-[#605d52] text-sm leading-relaxed">
                  {analysis.budget_waste.explanation}
                </p>
              </div>
            )}

            {/* Audience insights */}
            {'audience_insights' in analysis && analysis.audience_insights && analysis.audience_insights.length > 0 && (
              <div className="bg-[rgba(201,192,177,0.18)] border border-[#c5c0b1] rounded p-6">
                <p className="text-xs text-[#605d52] uppercase tracking-widest font-semibold mb-4">
                  Audience Insights
                </p>
                <ul className="space-y-3">
                  {analysis.audience_insights.map((insight, i) => (
                    <li key={i} className="flex gap-3 text-sm text-[#605d52] leading-relaxed">
                      <span className="text-[#605d52] shrink-0 mt-0.5">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {'recommendations' in analysis && analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="bg-[rgba(201,192,177,0.18)] border border-[#c5c0b1] rounded p-6">
                <p className="text-xs text-[#201515] uppercase tracking-widest font-semibold mb-5">
                  Recommendations, ranked by revenue impact
                </p>
                <div className="space-y-5">
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-4 border-b border-[rgba(201,192,177,0.3)] last:border-0 pb-5 last:pb-0">
                      <div className="w-7 h-7 rounded-full bg-[rgba(232,51,10,0.1)] text-[#e8330a] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <ImpactBadge impact={rec.impact} />
                          <span className="text-xs text-emerald-400 font-medium">{rec.revenue_upside}</span>
                        </div>
                        <p className="text-sm text-[#201515] leading-relaxed">{rec.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw fallback */}
            {'raw' in analysis && analysis.raw && (
              <div className="bg-[rgba(201,192,177,0.18)] border border-[#c5c0b1] rounded p-5">
                <p className="text-xs text-[#939084] mb-3">Analysis (raw)</p>
                <pre className="text-xs text-[#605d52] whitespace-pre-wrap leading-relaxed">{analysis.raw}</pre>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/dashboard"
                className="flex-1 text-center bg-[#e8330a] hover:opacity-90 text-[#201515] font-semibold px-5 py-3 rounded text-sm transition-colors"
              >
                Back to Dashboard
              </Link>
              {savedId ? (
                <Link
                  href="/dashboard/csv"
                  className="flex-1 text-center bg-[rgba(201,192,177,0.18)] hover:bg-[rgba(201,192,177,0.25)] border border-[#c5c0b1] text-[#939084] hover:text-[#201515] font-medium px-5 py-3 rounded text-sm transition-colors"
                >
                  + Upload new file
                </Link>
              ) : (
                <button
                  onClick={reset}
                  className="flex-1 bg-[rgba(201,192,177,0.18)] hover:bg-[rgba(201,192,177,0.25)] border border-[#c5c0b1] text-[#939084] hover:text-[#201515] font-medium px-5 py-3 rounded text-sm transition-colors"
                >
                  Analyse another file
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
