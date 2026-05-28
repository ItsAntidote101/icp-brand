import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rawEmail = req.nextUrl.searchParams.get('email')
  const email = rawEmail ? rawEmail.trim().toLowerCase() : session.email.toLowerCase()
  if (session.email.toLowerCase() !== email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    serviceKey
  )

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (!user) return NextResponse.json({ analyses: [] })

  const { data: rows, error } = await supabase
    .from('diagnostics')
    .select('id, diagnosis, created_at')
    .filter('diagnosis->>type', 'eq', 'csv_analysis')
    .filter('diagnosis->>user_id', 'eq', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[csv-history] query error:', error)
    return NextResponse.json({ analyses: [] })
  }

  const analyses = (rows ?? []).map((r: { id: string; created_at: string; diagnosis: Record<string, unknown> }) => {
    const d = r.diagnosis as Record<string, unknown>
    const recs = Array.isArray(d.recommendations) ? d.recommendations : []
    const tops = Array.isArray(d.top_performers)   ? d.top_performers  : []
    const waste = (d.budget_waste as { estimated_amount?: string } | undefined)?.estimated_amount ?? null
    return {
      id:                   r.id,
      created_at:           r.created_at,
      file:                 typeof d.file === 'string' ? d.file : 'upload.csv',
      summary:              typeof d.summary === 'string' ? d.summary : '',
      budget_waste:         waste,
      recommendations_count: recs.length,
      top_performers_count:  tops.length,
    }
  })

  return NextResponse.json({ analyses })
}

// Single analysis by diagnostic ID
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json() as { id?: string }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    serviceKey
  )

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', session.email.toLowerCase())
    .single()

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: row } = await supabase
    .from('diagnostics')
    .select('id, diagnosis, created_at')
    .eq('id', id)
    .filter('diagnosis->>type', 'eq', 'csv_analysis')
    .filter('diagnosis->>user_id', 'eq', user.id)
    .single()

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ analysis: row.diagnosis, created_at: row.created_at })
}
