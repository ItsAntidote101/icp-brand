import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder',
)
const resend = new Resend(process.env.RESEND_API_KEY || 're_build_placeholder')
const FROM   = 'ICP Brand <noreply@idealicp.com>'
const BASE   = 'https://idealicp.com'

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ICP Brand</title></head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;min-height:100vh;">
    <tr><td align="center" style="padding:48px 20px;">
      <table role="presentation" width="100%" style="max-width:560px;background-color:#0d0d17;border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;">
        <tr>
          <td style="padding:28px 36px 22px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="width:26px;height:26px;background:linear-gradient(135deg,#6366f1 0%,#9333ea 100%);border-radius:7px;vertical-align:middle;"></td>
              <td style="padding-left:10px;vertical-align:middle;"><span style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:-0.3px;">ICP Brand</span></td>
            </tr></table>
          </td>
        </tr>
        <tr><td style="padding:36px 36px 32px;">${content}</td></tr>
        <tr>
          <td style="padding:18px 36px 26px;border-top:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;color:#374151;font-size:12px;line-height:1.6;">
              You requested this resource from ICP Brand. Questions? <a href="mailto:info@idealicp.com" style="color:#6366f1;text-decoration:none;">info@idealicp.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function sendCalculatorEmail(to: string, wasteEstimate: number) {
  const formatted = wasteEstimate.toLocaleString()
  const content = `
<h1 style="margin:0 0 10px;color:#ffffff;font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Your ad waste breakdown</h1>
<p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.7;">Based on your inputs, here are the three most likely causes of your estimated KES ${formatted}/month in wasted ad spend.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;margin-bottom:20px;">
  <tr><td style="padding:20px 24px;">
    ${[
      ['ICP Misalignment', 'Your ads are reaching people who will never buy. The profile of your ideal customer in your head doesn\'t match who you\'re targeting in the platform.'],
      ['Funnel Friction', 'Visitors arrive but don\'t convert. Form fields, load speed, unclear CTA, or a headline that doesn\'t match the ad they clicked.'],
      ['Channel Mismatch', 'You\'re spending on platforms your ICP doesn\'t use at the moment they make decisions. Budget is leaking into the wrong channels.'],
    ].map(([title, body], i) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:${i < 2 ? '16px' : '0'};padding-bottom:${i < 2 ? '16px' : '0'};border-bottom:${i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none'};">
      <tr><td>
        <p style="margin:0 0 4px;color:#e5e7eb;font-size:14px;font-weight:700;">${i + 1}. ${title}</p>
        <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">${body}</p>
      </td></tr>
    </table>`).join('')}
  </td></tr>
</table>

<p style="margin:0 0 20px;color:#9ca3af;font-size:14px;line-height:1.7;">A full ICP diagnostic will tell you which of these is costing you the most, and exactly how to fix it.</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;"><tr>
  <td style="background-color:#6366f1;border-radius:12px;">
    <a href="${BASE}/questionnaire" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:-0.2px;">Get Your Free ICP Diagnostic →</a>
  </td>
</tr></table>`

  const { error } = await resend.emails.send({
    from: FROM, to,
    subject: `Your ad waste breakdown, KES ${formatted}/month`,
    html: base(content),
  })
  if (error) console.error('[lead-magnet] calculator email error:', JSON.stringify(error))
}

async function sendChecklistEmail(to: string) {
  const checklistUrl = `${BASE}/downloads/lp-checklist`
  const content = `
<h1 style="margin:0 0 10px;color:#ffffff;font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Your Landing Page Friction Checklist</h1>
<p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.7;">Your 27-point checklist is ready. Work through it and mark off each item, most marketers find at least 8 problems on their first pass.</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
  <td style="background-color:#6366f1;border-radius:12px;">
    <a href="${checklistUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:-0.2px;">View Your Checklist →</a>
  </td>
</tr></table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;margin-bottom:20px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 12px;color:#a5b4fc;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">What's inside</p>
    ${[
      'Above the fold, 5 checkpoints',
      'Form friction, 6 checkpoints',
      'Trust signals, 5 checkpoints',
      'Mobile experience, 5 checkpoints',
      'Messaging clarity, 6 checkpoints',
    ].map(f => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;"><tr>
      <td style="width:18px;color:#6366f1;font-size:14px;vertical-align:top;">→</td>
      <td style="color:#e5e7eb;font-size:13px;padding-left:6px;">${f}</td>
    </tr></table>`).join('')}
  </td></tr>
</table>

<p style="margin:0 0 6px;color:#9ca3af;font-size:14px;line-height:1.7;">Once you've run through the checklist, get an AI to audit your landing page automatically.</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
  <td style="border:1px solid rgba(99,102,241,0.4);border-radius:12px;">
    <a href="${BASE}/questionnaire" style="display:inline-block;padding:12px 24px;color:#a5b4fc;font-size:14px;font-weight:600;text-decoration:none;">Get Your Free ICP Diagnostic</a>
  </td>
</tr></table>`

  const { error } = await resend.emails.send({
    from: FROM, to,
    subject: 'Your Landing Page Friction Checklist',
    html: base(content),
  })
  if (error) console.error('[lead-magnet] checklist email error:', JSON.stringify(error))
}

export async function POST(req: NextRequest) {
  try {
    const { email, type, wasteEstimate } = await req.json()
    if (!email || !type) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    // Upsert email to users table
    await supabase.from('users').upsert(
      { email, billing_status: 'inactive', subscription_tier: 'free' },
      { onConflict: 'email', ignoreDuplicates: true }
    )

    if (type === 'calculator') {
      await sendCalculatorEmail(email, wasteEstimate ?? 0)
    } else if (type === 'checklist') {
      await sendChecklistEmail(email)
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[lead-magnet] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
