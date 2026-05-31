import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { cookies } from 'next/headers'
import { createHmac } from 'crypto'

export const dynamic     = 'force-dynamic'
export const maxDuration = 60

const supabase  = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost', process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder')
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function verifySession(token: string): { email: string } | null {
  const secret = process.env.SESSION_SECRET ?? 'fallback-secret'
  try {
    const [payload, sig] = token.split('.')
    const expected = createHmac('sha256', secret).update(payload).digest('base64url')
    if (sig !== expected) return null
    return JSON.parse(Buffer.from(payload, 'base64url').toString())
  } catch { return null }
}

const BUYERS: Record<string, { name: string; firstName: string; title: string }> = {
  'EK': { name: 'Eugene Kariuki',  firstName: 'Eugene',  title: 'Senior Media Buyer, East Africa' },
  'AM': { name: 'Aisha Mensah',    firstName: 'Aisha',   title: 'Senior Media Buyer, West Africa' },
  'DO': { name: 'David Osei',      firstName: 'David',   title: 'Performance Strategist, Southern Africa' },
  'GN': { name: 'Grace Nakato',    firstName: 'Grace',   title: 'Paid Social Lead, East Africa' },
  'MW': { name: 'Marcus Webb',     firstName: 'Marcus',  title: 'Global Performance Lead' },
}

function getBuyerByRegionIndustry(region: string, industry: string, tier: string) {
  const r = region.toLowerCase()
  const i = industry.toLowerCase()
  if (tier === 'agency') return BUYERS['MW']
  if (r.includes('west') || r.includes('ghana') || r.includes('nigeria') || r.includes('lagos') || r.includes('accra')) return BUYERS['AM']
  if (r.includes('south') || r.includes('johannesburg') || r.includes('cape town') || r.includes('durban')) return BUYERS['DO']
  if (i.includes('ecommerce') || i.includes('e-commerce') || i.includes('retail')) return BUYERS['GN']
  return BUYERS['EK']
}

function stripDashes(v: unknown): unknown {
  if (typeof v === 'string') return v.replace(/ — /g, ', ').replace(/— /g, ', ').replace(/—/g, '-').replace(/ – /g, ', ').replace(/–/g, '-')
  if (Array.isArray(v)) return v.map(stripDashes)
  if (v !== null && typeof v === 'object') {
    const o: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) o[k] = stripDashes(val)
    return o
  }
  return v
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('icp_session')?.value
  const session = token ? verifySession(token) : null
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id, email, full_name, company_name, subscription_tier, billing_status')
    .eq('email', session.email)
    .single()

  if (userErr || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Free users can fetch their buyer intro message only
  const typeParam = req.nextUrl.searchParams.get('type')
  if (typeParam === 'intro') {
    const { data: intro } = await supabase
      .from('monthly_checkins')
      .select('id, message, buyer_name, buyer_initials, created_at')
      .eq('user_id', user.id)
      .eq('month_key', 'intro')
      .maybeSingle()
    return NextResponse.json({ checkin: intro ?? null })
  }

  if (user.subscription_tier === 'free' || user.billing_status !== 'active')
    return NextResponse.json({ error: 'Not available on free tier' }, { status: 403 })

  // Check if we have a current-month check-in already
  const monthKey = new Date().toISOString().slice(0, 7) // YYYY-MM
  const { data: existing } = await supabase
    .from('monthly_checkins')
    .select('id, message, buyer_name, buyer_initials, created_at')
    .eq('user_id', user.id)
    .eq('month_key', monthKey)
    .maybeSingle()

  if (existing) return NextResponse.json({ checkin: existing })

  return NextResponse.json({ checkin: null })
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('icp_session')?.value
  const session = token ? verifySession(token) : null
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id, email, full_name, company_name, subscription_tier, billing_status')
    .eq('email', session.email)
    .single()

  if (userErr || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.subscription_tier === 'free' || user.billing_status !== 'active')
    return NextResponse.json({ error: 'Not available on free tier' }, { status: 403 })

  const monthKey = new Date().toISOString().slice(0, 7)
  const { data: existing } = await supabase
    .from('monthly_checkins')
    .select('id, message, buyer_name, buyer_initials, created_at')
    .eq('user_id', user.id)
    .eq('month_key', monthKey)
    .maybeSingle()

  if (existing) return NextResponse.json({ checkin: existing })

  // Load reports for context
  const { data: reports } = await supabase
    .from('reports')
    .select('report_summary, generated_at')
    .eq('user_id', user.id)
    .order('generated_at', { ascending: false })
    .limit(3)

  const latestScore = (() => {
    if (!reports?.length) return null
    try { const p = JSON.parse(reports[0].report_summary); return p.overall_score ?? p.health_score ?? null } catch { return null }
  })()
  const previousScore = (() => {
    if (!reports || reports.length < 2) return null
    try { const p = JSON.parse(reports[1].report_summary); return p.overall_score ?? p.health_score ?? null } catch { return null }
  })()

  // Load questionnaire for region/industry
  const { data: qData } = await supabase
    .from('questionnaire_responses')
    .select('data')
    .eq('email', user.email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const qd = (qData?.data as Record<string, string>) ?? {}

  const { data: rawQ } = await supabase
    .from('questionnaires')
    .select('responses')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const r: Record<string, unknown> = (rawQ?.responses as Record<string, unknown>) ?? {}

  const region   = qd.region ?? qd.country ?? (r[11] as string) ?? 'Kenya'
  const industry = qd.industry ?? qd.business_type ?? (r[2] as string) ?? 'digital marketing'
  const product  = qd.product_service ?? qd.offer ?? (r[1] as string) ?? ''

  const buyer = getBuyerByRegionIndustry(region, industry, user.subscription_tier)

  const monthName = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const firstName = user.full_name?.split(' ')[0] ?? 'there'
  const scoreLine = latestScore !== null
    ? previousScore !== null
      ? `Their ICP score is currently ${latestScore}/100, ${latestScore > previousScore ? `up ${latestScore - previousScore} points` : latestScore < previousScore ? `down ${Math.abs(latestScore - previousScore)} points` : 'unchanged'} since their last diagnosis.`
      : `Their ICP score is ${latestScore}/100.`
    : 'They have not yet run a full diagnosis.'

  const systemPrompt = `You are ${buyer.name}, ${buyer.title} at Ideal ICP. You are writing a brief monthly check-in message to one of your assigned clients. Write in a direct, professional, warm tone. No generic phrases like "I hope this finds you well." No em dashes or en dashes. No emojis. Keep it under 120 words. Sound like a real person who has reviewed their account data.`

  const userPrompt = `Write a monthly check-in message for ${monthName} for a client named ${firstName}${user.company_name ? ` at ${user.company_name}` : ''}. They are in the ${industry} industry in ${region}${product ? `, selling ${product}` : ''}. ${scoreLine} Your name is ${buyer.firstName} and your role is ${buyer.title}. The message should acknowledge their current score context, note one specific thing you want them to focus on this month based on the industry/region, and invite them to book a call if they want to go deeper. Sign off with your first name only. Return plain text only, no JSON, no markdown.`

  const res = await anthropic.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 400,
    system:     systemPrompt,
    messages:   [{ role: 'user', content: userPrompt }],
  })

  const raw = res.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('').trim()
  const message = (stripDashes(raw) as string)

  const initials = buyer.name.split(' ').map((n: string) => n[0]).join('')

  const { data: inserted, error: insertErr } = await supabase
    .from('monthly_checkins')
    .insert({
      user_id:       user.id,
      month_key:     monthKey,
      message,
      buyer_name:    buyer.name,
      buyer_initials: initials,
    })
    .select('id, message, buyer_name, buyer_initials, created_at')
    .single()

  if (insertErr) {
    console.error('[monthly-checkin] insert error:', insertErr)
    return NextResponse.json({ checkin: { message, buyer_name: buyer.name, buyer_initials: initials, created_at: new Date().toISOString() } })
  }

  return NextResponse.json({ checkin: inserted })
}
