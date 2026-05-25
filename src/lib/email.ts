import { Resend } from 'resend'

const FROM = 'ICP Diagnostic <noreply@idealicp.com>'

function escapeHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? '')
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const Warm        = '#faf6ef'
const White       = '#ffffff'
const Dark        = '#18110a'
const Orange      = '#e8330a'
const Muted       = 'rgba(24,17,10,0.5)'
const Border      = 'rgba(24,17,10,0.12)'
const BorderLight = 'rgba(24,17,10,0.07)'
const CardBg      = 'rgba(24,17,10,0.04)'
const font        = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const ICON = {
  check: `<table cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td>
    <div style="width:56px;height:56px;background:rgba(232,51,10,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;">
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="28" fill="rgba(232,51,10,0.1)"/>
      <circle cx="28" cy="28" r="20" fill="rgba(232,51,10,0.12)"/>
      <path d="M19 28l7 7 11-13" stroke="#e8330a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg></div>
  </td></tr></table>`,

  shield: `<table cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td>
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="28" fill="rgba(232,51,10,0.1)"/>
      <path d="M28 13L16 19v9c0 7.7 5.4 14.9 12 16.5 6.6-1.6 12-8.8 12-16.5V19L28 13z" fill="rgba(232,51,10,0.15)" stroke="#e8330a" stroke-width="1.5"/>
      <path d="M22 28l4 4 8-8" stroke="#e8330a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </td></tr></table>`,

  chart: `<table cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td>
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="28" fill="rgba(232,51,10,0.1)"/>
      <rect x="17" y="35" width="5" height="8" rx="1" fill="#e8330a" opacity="0.4"/>
      <rect x="26" y="28" width="5" height="15" rx="1" fill="#e8330a" opacity="0.65"/>
      <rect x="35" y="18" width="5" height="25" rx="1" fill="#e8330a"/>
      <path d="M15 15l8 10 8-5 9-9" stroke="#e8330a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
    </svg>
  </td></tr></table>`,

  star: `<table cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td>
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="28" fill="rgba(232,51,10,0.1)"/>
      <path d="M28 15l3.5 8h8.5l-7 5.5 3 8-8-5-8 5 3-8-7-5.5H24.5L28 15z" fill="rgba(232,51,10,0.2)" stroke="#e8330a" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>
  </td></tr></table>`,

  calendar: `<table cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td>
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="28" fill="rgba(232,51,10,0.1)"/>
      <rect x="16" y="19" width="24" height="21" rx="2" fill="rgba(232,51,10,0.1)" stroke="#e8330a" stroke-width="1.5"/>
      <path d="M16 26h24" stroke="#e8330a" stroke-width="1.5"/>
      <path d="M22 15v8M34 15v8" stroke="#e8330a" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="28" cy="33" r="2.5" fill="#e8330a"/>
    </svg>
  </td></tr></table>`,

  pause: `<table cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td>
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="28" fill="rgba(232,51,10,0.1)"/>
      <circle cx="28" cy="28" r="13" stroke="#e8330a" stroke-width="1.5" fill="rgba(232,51,10,0.08)"/>
      <rect x="23" y="22" width="4" height="12" rx="1.5" fill="#e8330a" opacity="0.7"/>
      <rect x="29" y="22" width="4" height="12" rx="1.5" fill="#e8330a"/>
    </svg>
  </td></tr></table>`,

  alert: `<table cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td>
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="28" fill="rgba(232,51,10,0.1)"/>
      <circle cx="28" cy="28" r="13" stroke="#e8330a" stroke-width="1.5" fill="rgba(232,51,10,0.06)"/>
      <path d="M28 21v9" stroke="#e8330a" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="28" cy="34" r="1.5" fill="#e8330a"/>
    </svg>
  </td></tr></table>`,

  brain: `<table cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td>
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="28" fill="rgba(232,51,10,0.1)"/>
      <path d="M28 39v-6c-5.5 0-9.5-4-9.5-9s4-9 9.5-9s9.5 4 9.5 9c0 3-1.5 5.5-4 7.5" stroke="#e8330a" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M28 33v6" stroke="#e8330a" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M23 28c1.5 2 4 3 5 3" stroke="#e8330a" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
    </svg>
  </td></tr></table>`,

  download: `<table cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td>
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="28" fill="rgba(232,51,10,0.1)"/>
      <path d="M28 16v18M28 34l-7-7M28 34l7-7" stroke="#e8330a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M16 40h24" stroke="#e8330a" stroke-width="2" stroke-linecap="round"/>
    </svg>
  </td></tr></table>`,
}

// ─── Base template ────────────────────────────────────────────────────────────
// internal: no icon, no login button, used for founder/admin notifications
function base(content: string, opts: { loginBtn?: boolean } = { loginBtn: true }): string {
  const showLogin = opts.loginBtn !== false
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ICP Diagnostic</title></head>
<body style="margin:0;padding:0;background-color:${Warm};font-family:${font};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${Warm};">
    <tr><td align="center" style="padding:40px 20px 60px;">
      <table role="presentation" width="100%" style="max-width:600px;background-color:${White};border:1px solid ${Border};">

        <!-- Header: Logo + Log in -->
        <tr>
          <td style="padding:20px 32px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="vertical-align:middle;">
                <table cellpadding="0" cellspacing="0"><tr>
                  <td style="width:22px;height:22px;background:${Orange};vertical-align:middle;font-size:0;"></td>
                  <td style="padding-left:9px;vertical-align:middle;font-size:15px;font-weight:700;color:${Dark};font-family:${font};letter-spacing:-0.3px;">ICP Diagnostic</td>
                </tr></table>
              </td>
              ${showLogin ? `<td align="right" style="vertical-align:middle;">
                <a href="https://idealicp.com/auth" style="font-size:13px;color:${Dark};text-decoration:none;border:1.5px solid ${Border};padding:7px 16px;font-family:${font};font-weight:500;">Log in</a>
              </td>` : ''}
            </tr></table>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:44px 40px 40px;border-top:1.5px solid ${BorderLight};">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:28px 40px 24px;border-top:1.5px solid ${BorderLight};">
            <!-- Footer row 1: Logo + question link -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="vertical-align:middle;">
                <table cellpadding="0" cellspacing="0"><tr>
                  <td style="width:18px;height:18px;background:${Orange};font-size:0;vertical-align:middle;"></td>
                  <td style="padding-left:8px;font-size:13px;font-weight:700;color:${Dark};font-family:${font};">ICP Diagnostic</td>
                </tr></table>
              </td>
              <td align="right" style="vertical-align:middle;">
                <a href="mailto:info@idealicp.com" style="font-size:13px;color:${Muted};text-decoration:none;font-family:${font};">Got a question? info@idealicp.com</a>
              </td>
            </tr></table>

            <!-- Footer row 2: Copyright + links -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;padding-top:20px;border-top:1px solid ${BorderLight};"><tr>
              <td style="font-size:12px;color:${Muted};font-family:${font};line-height:1.6;">
                &copy; ${new Date().getFullYear()} ICP Diagnostic. All rights reserved.<br>Nairobi, Kenya
              </td>
            </tr></table>

            <!-- Footer row 3: Fine print -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;padding-top:16px;border-top:1px solid ${BorderLight};"><tr>
              <td align="center" style="font-size:12px;color:rgba(24,17,10,0.35);font-family:${font};line-height:1.7;">
                You received this because you have an account with ICP Diagnostic.<br>
                <a href="https://idealicp.com/privacy" style="color:rgba(24,17,10,0.4);text-decoration:underline;font-family:${font};">Privacy policy</a>
                &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                <a href="https://idealicp.com/dashboard" style="color:rgba(24,17,10,0.4);text-decoration:underline;font-family:${font};">Manage account</a>
              </td>
            </tr></table>
          </td>
        </tr>

        <!-- Bottom accent bar -->
        <tr><td style="height:4px;background:${Orange};font-size:0;line-height:0;">&nbsp;</td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function cta(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:32px;"><tr>
    <td style="background-color:${Orange};border-radius:4px;">
      <a href="${href}" style="display:inline-block;padding:14px 28px;color:${White};font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.2px;font-family:${font};">${label}</a>
    </td>
  </tr></table>`
}

function heading(text: string, size = 42): string {
  return `<h1 style="margin:0 0 16px;color:${Dark};font-size:${size}px;font-weight:800;line-height:1.1;letter-spacing:-0.8px;font-family:${font};">${text}</h1>`
}

function sub(text: string): string {
  return `<p style="margin:0 0 32px;color:${Muted};font-size:16px;line-height:1.7;font-family:${font};">${text}</p>`
}

function infoCard(content: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CardBg};border:1.5px solid ${Border};border-radius:4px;margin-bottom:16px;">
  <tr><td style="padding:20px 24px;">${content}</td></tr>
</table>`
}

function securityBox(content: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid ${Border};border-radius:4px;margin-bottom:16px;">
  <tr><td style="padding:20px 24px;">${content}</td></tr>
</table>`
}

function row(label: string, value: string, last = false): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${last ? '' : `border-bottom:1px solid ${BorderLight};`}padding-bottom:10px;margin-bottom:10px;"><tr>
    <td><p style="margin:0;color:${Muted};font-size:12px;text-transform:uppercase;letter-spacing:0.06em;font-family:${font};">${label}</p>
    <p style="margin:2px 0 0;color:${Dark};font-size:14px;font-weight:600;font-family:${font};">${value}</p></td>
  </tr></table>`
}

// ─── Email 1: Welcome / Report ready ─────────────────────────────────────────

export async function sendWelcomeEmail({
  to, name, reportId, baseUrl,
}: { to: string; name?: string; reportId: string; baseUrl?: string }) {
  const url = `${baseUrl ?? 'https://idealicp.com'}/report/${reportId}`
  const first = name?.split(' ')[0] ?? 'there'

  const items = [
    ['ICP Health Score',   'A 0-100 score showing how strong your customer profile is'],
    ['Top 3 Findings',     'Issues costing you money, ranked by revenue impact'],
    ['Quick Wins',         '3 specific actions you can take this week'],
    ['Score Breakdown',    '6-dimension analysis: targeting, funnel, channels, and more'],
  ]

  const content = `
${ICON.check}
${heading('Your ICP Diagnostic is ready')}
${sub(`Hi ${first}, your report has been generated. Here is what is inside.`)}
${infoCard(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  ${items.map(([label, desc], i) => `<tr><td style="padding:10px 0;${i < items.length - 1 ? `border-bottom:1px solid ${BorderLight};` : ''}">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;font-family:${font};">${label}</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;font-family:${font};">${desc}</p>
  </td></tr>`).join('')}
</table>`)}
${cta('View Your Report', url)}
<p style="margin:18px 0 0;color:${Muted};font-size:13px;font-family:${font};">Or copy this link: <a href="${url}" style="color:${Orange};text-decoration:none;">${url}</a></p>`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: 'Your ICP Diagnostic is ready',
    html: base(content),
  })
  if (error) console.error('[email] welcome error:', JSON.stringify(error))
  else console.log('[email] welcome sent id:', data?.id, 'to:', to)
  return { data, error }
}

// ─── Email 2: Subscription confirmation ──────────────────────────────────────

export async function sendSubscriptionEmail({
  to, name, tier, renewalDate, baseUrl,
}: { to: string; name?: string; tier: string; renewalDate: string; baseUrl?: string }) {
  const url = `${baseUrl ?? 'https://idealicp.com'}/dashboard`
  const first = name?.split(' ')[0] ?? 'there'
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)
  const renewal = new Date(renewalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const featMap: Record<string, string[]> = {
    starter: ['Monthly ICP diagnostic report', 'Full 6-dimension score breakdown', 'Specific quick-win recommendations', 'Subscriber dashboard access'],
    pro:     ['Everything in Starter', 'Priority re-diagnosis turnaround', 'Campaign CSV analysis', 'Score trend tracking'],
    agency:  ['Everything in Pro', 'Multi-client reporting', 'Dedicated strategy review session', 'White-label report exports'],
  }
  const features = featMap[tier.toLowerCase()] ?? featMap.starter

  const content = `
${ICON.star}
${heading(`Welcome to ${tierLabel}.`)}
${sub(`Hi ${first}, your ${tierLabel} subscription is active. Your dashboard is ready.`)}
${infoCard(`<p style="margin:0 0 14px;color:${Orange};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;font-family:${font};">Your ${tierLabel} plan includes</p>
${features.map(f => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;"><tr>
  <td style="width:20px;color:${Orange};font-size:14px;vertical-align:top;padding-top:1px;font-family:${font};">&#10003;</td>
  <td style="color:${Dark};font-size:14px;line-height:1.5;font-family:${font};">${f}</td>
</tr></table>`).join('')}`)}
${securityBox(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
  <td style="color:${Muted};font-size:13px;font-family:${font};">Next renewal</td>
  <td align="right" style="color:${Dark};font-size:13px;font-weight:600;font-family:${font};">${renewal}</td>
</tr></table>`)}
${cta('Go to Your Dashboard', url)}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: `Welcome to ICP Diagnostic, Your ${tierLabel} dashboard is ready`,
    html: base(content),
  })
  if (error) console.error('[email] subscription error:', JSON.stringify(error))
  else console.log('[email] subscription sent id:', data?.id, 'to:', to)
  return { data, error }
}

// ─── Email 3: Monthly reminder ────────────────────────────────────────────────

export async function sendReminderEmail({
  to, name, lastScore, baseUrl,
}: { to: string; name?: string; lastScore?: number; baseUrl?: string }) {
  const url = `${baseUrl ?? 'https://idealicp.com'}/questionnaire`
  const first = name?.split(' ')[0] ?? 'there'

  const scoreHtml = lastScore !== undefined
    ? lastScore >= 70
      ? `Your last score was <strong style="color:#15803d;">${lastScore}/100</strong>, strong. Let us see if you have pushed it even higher.`
      : lastScore >= 40
        ? `Your last score was <strong style="color:#d97706;">${lastScore}/100</strong>. There is meaningful ground to recover.`
        : `Your last score was <strong style="color:#dc2626;">${lastScore}/100</strong>. A lot can change in 30 days.`
    : `Time to see where your ICP stands this month.`

  const content = `
${ICON.calendar}
${heading('Time for your monthly ICP check-in', 38)}
${sub(`Hi ${first}, it has been about 30 days since your last diagnostic. ${scoreHtml}`)}
${securityBox(`<p style="margin:0 0 8px;color:${Dark};font-size:14px;font-weight:600;font-family:${font};">Markets shift. Algorithms update.</p>
<p style="margin:0;color:${Muted};font-size:14px;line-height:1.6;font-family:${font};">Your ICP needs a monthly re-calibration to stay sharp. Takes less than 5 minutes.</p>`)}
${cta('Run New Diagnosis', url)}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: 'Time for your monthly ICP check-in',
    html: base(content),
  })
  if (error) console.error('[email] reminder error:', JSON.stringify(error))
  else console.log('[email] reminder sent id:', data?.id, 'to:', to)
  return { data, error }
}

// ─── Email 4: Session request, founder notification ─────────────────────────

export async function sendSessionRequestToFounder({
  userName, userEmail, companyName, sessionFormat, preferredTime, notes, diagnostic,
}: {
  userName: string; userEmail: string; companyName: string
  sessionFormat: string; preferredTime: string; notes: string
  diagnostic: { score: number | null; waste: string; topFinding: string }
}) {
  const content = `
${heading('New Strategy Session Request', 30)}
<p style="margin:0 0 24px;color:${Muted};font-size:15px;line-height:1.7;font-family:${font};">A new Agency session request has come in.</p>
${infoCard(`<p style="margin:0 0 12px;color:${Orange};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;font-family:${font};">Client</p>
${[
  ['Name', escapeHtml(userName)],
  ['Email', escapeHtml(userEmail)],
  ['Company', escapeHtml(companyName)],
  ['Format', escapeHtml(sessionFormat)],
  ['Preferred Time', escapeHtml(preferredTime || 'Not specified')],
].map(([k, v]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr>
  <td style="color:${Muted};font-size:13px;width:140px;font-family:${font};">${k}</td>
  <td style="color:${Dark};font-size:13px;font-weight:600;font-family:${font};">${v}</td>
</tr></table>`).join('')}`)}
${infoCard(`<p style="margin:0 0 12px;color:${Orange};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;font-family:${font};">Diagnostic Summary</p>
${[
  ['ICP Health Score', diagnostic.score !== null ? `${diagnostic.score}/100` : '&#8212;'],
  ['Estimated Waste', escapeHtml(diagnostic.waste || '&#8212;')],
  ['Top Finding', escapeHtml(diagnostic.topFinding || '&#8212;')],
].map(([k, v]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr>
  <td style="color:${Muted};font-size:13px;width:160px;font-family:${font};">${k}</td>
  <td style="color:${Dark};font-size:13px;font-weight:600;font-family:${font};">${v}</td>
</tr></table>`).join('')}`)}
${notes ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CardBg};border:1.5px solid ${Border};margin-bottom:16px;"><tr><td style="padding:16px 20px;"><p style="margin:0 0 8px;color:${Muted};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;font-family:${font};">Notes from client</p><p style="margin:0;color:${Dark};font-size:14px;line-height:1.6;font-family:${font};">${escapeHtml(notes)}</p></td></tr></table>` : ''}
<p style="margin:16px 0 0;color:${Muted};font-size:13px;font-family:${font};">Reply to this email to reach the client directly.</p>`

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to: 'eugene@idealicp.com',
    replyTo: userEmail,
    subject: `New Strategy Session Request from ${companyName || userName}`,
    html: base(content, { loginBtn: false }),
  })
  if (error) console.error('[email] session founder error:', JSON.stringify(error))
  else console.log('[email] session founder sent id:', data?.id)
  return { data, error }
}

// ─── Email 5: Session request, user confirmation ─────────────────────────────

export async function sendSessionConfirmationToUser({
  to, name,
}: { to: string; name: string }) {
  const first = name?.split(' ')[0] ?? 'there'
  const content = `
${ICON.check}
${heading('Session request received.')}
${sub(`Hi ${first}, we have your request and we are on it. Here is what happens next.`)}
${infoCard([
  ['Within 2 business hours', 'We confirm your booking and send a calendar invite.'],
  ['Before the session', 'Your media buyer reads your full diagnostic. No briefing needed.'],
  ['On the call', 'We implement your top 3 fixes together. Come ready to make decisions.'],
  ['30 days later', 'You run a new diagnosis. We measure the improvement together.'],
].map(([step, desc]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;"><tr>
  <td style="vertical-align:top;padding-top:2px;width:18px;color:${Orange};font-size:16px;font-family:${font};">&rarr;</td>
  <td style="vertical-align:top;padding-left:10px;">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;font-family:${font};">${step}</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;line-height:1.5;font-family:${font};">${desc}</p>
  </td>
</tr></table>`).join(''))}
<p style="margin:0;color:${Muted};font-size:13px;font-family:${font};">Manage your session from your <a href="https://idealicp.com/dashboard" style="color:${Orange};text-decoration:none;">dashboard</a>.</p>`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: 'Your strategy session request is confirmed',
    html: base(content),
  })
  if (error) console.error('[email] session user error:', JSON.stringify(error))
  else console.log('[email] session user sent id:', data?.id, 'to:', to)
  return { data, error }
}

// ─── Email 6: Cancellation, user confirmation ────────────────────────────────

export async function sendCancellationToUser({
  to, name, renewalDate,
}: { to: string; name: string; renewalDate?: string }) {
  const first = name?.split(' ')[0] ?? 'there'
  const accessUntil = renewalDate
    ? new Date(renewalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'your next renewal date'

  const content = `
${ICON.alert}
${heading('Subscription cancelled.', 38)}
${sub(`Hi ${first}, your cancellation is confirmed. Here is what happens next.`)}
${infoCard(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="padding:10px 0;border-bottom:1px solid ${BorderLight};">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;font-family:${font};">Access until ${accessUntil}</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;font-family:${font};">All your diagnostics, reports, and score history remain available.</p>
  </td></tr>
  <tr><td style="padding:10px 0;border-bottom:1px solid ${BorderLight};">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;font-family:${font};">No further charges</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;font-family:${font};">Your card will not be billed again.</p>
  </td></tr>
  <tr><td style="padding:10px 0;">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;font-family:${font};">Resubscribe anytime</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;font-family:${font};">Your account and data will be here when you come back.</p>
  </td></tr>
</table>`)}
${securityBox(`<p style="margin:0;font-family:${font};font-size:14px;color:${Dark};line-height:1.6;"><strong style="font-weight:700;">Changed your mind?</strong> Resubscribe from your dashboard or reach us at <a href="mailto:info@idealicp.com" style="color:${Orange};text-decoration:none;">info@idealicp.com</a></p>`)}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: 'Subscription cancelled, access continues until ' + accessUntil,
    html: base(content),
  })
  if (error) console.error('[email] cancel user error:', JSON.stringify(error))
  else console.log('[email] cancel user sent id:', data?.id, 'to:', to)
  return { data, error }
}

// ─── Email 7: Cancellation, founder notification ─────────────────────────────

export async function sendCancellationToFounder({
  userName, userEmail, companyName, reason, renewalDate,
}: { userName: string; userEmail: string; companyName?: string; reason?: string; renewalDate?: string }) {
  const accessUntil = renewalDate
    ? new Date(renewalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '&#8212;'

  const content = `
${heading('Cancellation alert', 28)}
<p style="margin:0 0 24px;color:${Muted};font-size:15px;line-height:1.7;font-family:${font};">A subscriber has cancelled their plan.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(239,68,68,0.05);border:1.5px solid rgba(239,68,68,0.18);border-radius:4px;margin-bottom:20px;">
  <tr><td style="padding:20px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${[
        ['Name', escapeHtml(userName)],
        ['Email', escapeHtml(userEmail)],
        ['Company', escapeHtml(companyName || '&#8212;')],
        ['Reason', escapeHtml(reason || 'Not provided')],
        ['Access until', accessUntil],
      ].map(([label, val], i, arr) => `<tr><td style="padding:8px 0;${i < arr.length - 1 ? `border-bottom:1px solid ${BorderLight};` : ''}">
        <p style="margin:0;color:${Muted};font-size:12px;text-transform:uppercase;letter-spacing:0.06em;font-family:${font};">${label}</p>
        <p style="margin:2px 0 0;color:${Dark};font-size:14px;font-weight:600;font-family:${font};">${val}</p>
      </td></tr>`).join('')}
    </table>
  </td></tr>
</table>
<p style="margin:0;color:${Muted};font-size:13px;font-family:${font};">Reply to this email to reach the subscriber directly.</p>`

  const { data, error } = await getResend().emails.send({
    from: FROM, to: 'eugene@idealicp.com', replyTo: userEmail,
    subject: `Cancellation: ${companyName || userName}`,
    html: base(content, { loginBtn: false }),
  })
  if (error) console.error('[email] cancel founder error:', JSON.stringify(error))
  else console.log('[email] cancel founder sent id:', data?.id)
  return { data, error }
}

// ─── Email 8a: Upgrade, user ─────────────────────────────────────────────────

export async function sendUpgradeToUser({
  to, name, oldTier, newTier, topUpKes, renewalDate,
}: { to: string; name: string; oldTier: string; newTier: string; topUpKes: number; renewalDate: string | null }) {
  const tierNames: Record<string, string> = { free: 'Free', starter: 'Starter', pro: 'Pro', agency: 'Agency' }
  const first    = name?.split(' ')[0] ?? 'there'
  const newLabel = tierNames[newTier] ?? newTier
  const oldLabel = tierNames[oldTier] ?? oldTier
  const nextDate = renewalDate
    ? new Date(renewalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '&#8212;'
  const priceKES: Record<string, number> = { starter: 6500, pro: 13000, agency: 26000, free: 0 }

  const rows = [
    ['Upgraded from', oldLabel],
    ['New plan', newLabel],
    ['Monthly rate going forward', `KES ${(priceKES[newTier] ?? 0).toLocaleString()} / month`],
    ['Prorated top-up due now', topUpKes > 0 ? `KES ${topUpKes.toLocaleString()}` : 'None'],
    ['Next renewal date', nextDate],
  ]

  const content = `
${ICON.star}
${heading(`You are now on ${newLabel}.`)}
${sub(`Hi ${first}, your ${newLabel} features are active right now.${topUpKes > 0 ? ` We will send you a separate invoice for the prorated top-up of <strong style="color:${Dark};">KES ${topUpKes.toLocaleString()}</strong>.` : ''}`)}
${infoCard(rows.map(([l, v], i) => row(l, v, i === rows.length - 1)).join(''))}
${cta('Go to Dashboard', 'https://idealicp.com/dashboard')}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: `You are now on ${newLabel}`,
    html: base(content),
  })
  if (error) console.error('[email] upgrade user error:', JSON.stringify(error))
  else console.log('[email] upgrade user sent id:', data?.id)
  return { data, error }
}

// ─── Email 8b: Upgrade, founder ─────────────────────────────────────────────

export async function sendUpgradeToFounder({
  userName, userEmail, companyName, oldTier, newTier, topUpKes, daysRemaining, renewalDate,
}: { userName: string; userEmail: string; companyName?: string; oldTier: string; newTier: string; topUpKes: number; daysRemaining: number; renewalDate: string | null }) {
  const tierNames: Record<string, string> = { free: 'Free', starter: 'Starter', pro: 'Pro', agency: 'Agency' }
  const nextDate = renewalDate
    ? new Date(renewalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '&#8212;'

  const rows = [
    ['Name', userName],
    ['Email', userEmail],
    ['Company', companyName || '&#8212;'],
    ['Upgraded from', tierNames[oldTier] ?? oldTier],
    ['Upgraded to', tierNames[newTier] ?? newTier],
    ['Days remaining in period', String(daysRemaining)],
    ['Prorated top-up to collect', topUpKes > 0 ? `KES ${topUpKes.toLocaleString()}` : 'None (period nearly over)'],
    ['Their next renewal', nextDate],
  ]

  const content = `
${heading(`Upgrade: ${tierNames[oldTier] ?? oldTier} to ${tierNames[newTier] ?? newTier}`, 28)}
${topUpKes > 0 ? `<p style="margin:0 0 16px;color:#d97706;font-size:14px;font-weight:600;font-family:${font};">Action required: send an invoice for KES ${topUpKes.toLocaleString()} to cover ${daysRemaining} remaining days.</p>` : ''}
${infoCard(rows.map(([l, v], i) => row(l, v, i === rows.length - 1)).join(''))}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to: 'eugene@idealicp.com', replyTo: userEmail,
    subject: `Upgrade: ${tierNames[oldTier] ?? oldTier} to ${tierNames[newTier] ?? newTier}${topUpKes > 0 ? `, KES ${topUpKes.toLocaleString()} to collect` : ''}, ${companyName || userName}`,
    html: base(content, { loginBtn: false }),
  })
  if (error) console.error('[email] upgrade founder error:', JSON.stringify(error))
  else console.log('[email] upgrade founder sent id:', data?.id)
  return { data, error }
}

// ─── Email 8c: Downgrade scheduled, user ────────────────────────────────────

export async function sendDowngradeScheduledToUser({
  to, name, currentTier, newTier, effectiveDate,
}: { to: string; name: string; currentTier: string; newTier: string; effectiveDate: string }) {
  const tierNames: Record<string, string> = { free: 'Free', starter: 'Starter', pro: 'Pro', agency: 'Agency' }
  const first        = name?.split(' ')[0] ?? 'there'
  const currentLabel = tierNames[currentTier] ?? currentTier
  const newLabel     = tierNames[newTier] ?? newTier
  const switchDate   = new Date(effectiveDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const priceKES: Record<string, number> = { starter: 6500, pro: 13000, agency: 26000, free: 0 }

  const rows = [
    ['Current plan (stays active until)', `${currentLabel} until ${switchDate}`],
    ['Switching to', newLabel],
    ['New monthly rate', `KES ${(priceKES[newTier] ?? 0).toLocaleString()} / month`],
    ['Effective date', switchDate],
  ]

  const content = `
${ICON.alert}
${heading('Downgrade scheduled.', 38)}
${sub(`Hi ${first}, your plan will switch from ${currentLabel} to ${newLabel} on <strong style="color:${Dark};">${switchDate}</strong>. You keep all current ${currentLabel} features until then. No charge today.`)}
${infoCard(rows.map(([l, v], i) => row(l, v, i === rows.length - 1)).join(''))}
${cta('Go to Dashboard', 'https://idealicp.com/dashboard')}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: `Downgrade to ${newLabel} scheduled for ${switchDate}`,
    html: base(content),
  })
  if (error) console.error('[email] downgrade user error:', JSON.stringify(error))
  else console.log('[email] downgrade user sent id:', data?.id)
  return { data, error }
}

// ─── Email 8d: Downgrade scheduled, founder ─────────────────────────────────

export async function sendDowngradeScheduledToFounder({
  userName, userEmail, companyName, currentTier, newTier, effectiveDate,
}: { userName: string; userEmail: string; companyName?: string; currentTier: string; newTier: string; effectiveDate: string }) {
  const tierNames: Record<string, string> = { free: 'Free', starter: 'Starter', pro: 'Pro', agency: 'Agency' }
  const switchDate = new Date(effectiveDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const rows = [
    ['Name', userName],
    ['Email', userEmail],
    ['Company', companyName || '&#8212;'],
    ['Downgrading from', tierNames[currentTier] ?? currentTier],
    ['Downgrading to', tierNames[newTier] ?? newTier],
    ['Effective date', switchDate],
  ]

  const content = `
${heading(`Downgrade scheduled: ${tierNames[currentTier] ?? currentTier} to ${tierNames[newTier] ?? newTier}`, 26)}
<p style="margin:0 0 16px;color:${Muted};font-size:14px;line-height:1.6;font-family:${font};">No action needed. The switch applies automatically on ${switchDate}.</p>
${infoCard(rows.map(([l, v], i) => row(l, v, i === rows.length - 1)).join(''))}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to: 'eugene@idealicp.com', replyTo: userEmail,
    subject: `Downgrade scheduled: ${tierNames[currentTier] ?? currentTier} to ${tierNames[newTier] ?? newTier} on ${switchDate}, ${companyName || userName}`,
    html: base(content, { loginBtn: false }),
  })
  if (error) console.error('[email] downgrade founder error:', JSON.stringify(error))
  else console.log('[email] downgrade founder sent id:', data?.id)
  return { data, error }
}

// ─── Email 10: Paused, user ──────────────────────────────────────────────────

export async function sendPausedToUser({
  to, name, resumeDate,
}: { to: string; name: string; resumeDate: string }) {
  const first  = name?.split(' ')[0] ?? 'there'
  const resume = new Date(resumeDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const content = `
${ICON.pause}
${heading('Your subscription is paused.', 38)}
${sub(`Hi ${first}, your subscription has been paused for 30 days.`)}
${infoCard(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="padding:10px 0;border-bottom:1px solid ${BorderLight};">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;font-family:${font};">No charge this month</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;font-family:${font};">Your card will not be billed during the pause period.</p>
  </td></tr>
  <tr><td style="padding:10px 0;border-bottom:1px solid ${BorderLight};">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;font-family:${font};">Your data is safe</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;font-family:${font};">All your diagnostics, scores, and reports remain available.</p>
  </td></tr>
  <tr><td style="padding:10px 0;">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;font-family:${font};">Auto-resumes on ${resume}</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;font-family:${font};">You can also resume early from your dashboard at any time.</p>
  </td></tr>
</table>`)}
${cta('Resume Early', 'https://idealicp.com/dashboard')}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: `Subscription paused, resumes ${resume}`,
    html: base(content),
  })
  if (error) console.error('[email] paused user error:', JSON.stringify(error))
  else console.log('[email] paused user sent id:', data?.id)
  return { data, error }
}

// ─── Email 11: Paused, founder ───────────────────────────────────────────────

export async function sendPausedToFounder({
  userName, userEmail, companyName, resumeDate,
}: { userName: string; userEmail: string; companyName?: string; resumeDate: string }) {
  const resume = new Date(resumeDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const rows = [
    ['Name', userName],
    ['Email', userEmail],
    ['Company', companyName || '&#8212;'],
    ['Resumes', resume],
  ]

  const content = `
${heading('Subscription paused', 28)}
${infoCard(rows.map(([l, v], i) => row(l, v, i === rows.length - 1)).join(''))}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to: 'eugene@idealicp.com', replyTo: userEmail,
    subject: `Subscription paused: ${companyName || userName}`,
    html: base(content, { loginBtn: false }),
  })
  if (error) console.error('[email] paused founder error:', JSON.stringify(error))
  else console.log('[email] paused founder sent id:', data?.id)
  return { data, error }
}

// ─── Email 12: Weekly intelligence briefing ───────────────────────────────────

type IntelligenceInsight = { title: string; body: string }
type IntelligenceBenchmark = { name: string; userValue: number | null; industryAvg: number; unit: string }

export async function sendWeeklyIntelligenceEmail({
  to, name, weekOf, insights, benchmarks, opportunity, recommendation,
}: {
  to: string
  name: string
  weekOf: string
  insights: IntelligenceInsight[]
  benchmarks: IntelligenceBenchmark[]
  opportunity: string
  recommendation: string
}) {
  const first = name?.split(' ')[0] ?? 'there'
  const weekLabel = new Date(weekOf).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const insightRows = insights.slice(0, 3).map((ins, i) => `
    <tr><td style="padding:10px 0;${i < insights.slice(0,3).length - 1 ? `border-bottom:1px solid ${BorderLight};` : ''}">
      <p style="margin:0;color:${Muted};font-size:11px;text-transform:uppercase;letter-spacing:0.07em;font-family:${font};">${i + 1}</p>
      <p style="margin:2px 0 0;color:${Dark};font-size:14px;font-weight:600;font-family:${font};">${ins.title}</p>
      <p style="margin:3px 0 0;color:${Muted};font-size:13px;line-height:1.5;font-family:${font};">${ins.body}</p>
    </td></tr>`).join('')

  const benchmarkRows = benchmarks.slice(0, 4).map((b, i, arr) => {
    const fmt = (v: number) => b.unit === '%' ? `${v}%` : b.unit === '$' ? `$${v}` : `${v}${b.unit}`
    return `<tr>
      <td style="padding:8px 12px;color:${Muted};font-size:13px;font-family:${font};${i < arr.length - 1 ? `border-bottom:1px solid ${BorderLight};` : ''}">${b.name}</td>
      <td style="padding:8px 12px;color:${Dark};font-size:13px;font-weight:600;font-family:${font};${i < arr.length - 1 ? `border-bottom:1px solid ${BorderLight};` : ''}">${b.userValue != null ? fmt(b.userValue) : '&#8212;'}</td>
      <td style="padding:8px 12px;color:${Orange};font-size:13px;font-family:${font};${i < arr.length - 1 ? `border-bottom:1px solid ${BorderLight};` : ''}">${fmt(b.industryAvg)}</td>
    </tr>`
  }).join('')

  const content = `
${ICON.brain}
${heading('Your Weekly Market Intelligence', 34)}
${sub(`Hi ${first}, here is what moved in your market this week, ${weekLabel}.`)}

<p style="margin:0 0 10px;color:${Dark};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;font-family:${font};">3 things to know this week</p>
${infoCard(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${insightRows}</table>`)}

<p style="margin:0 0 10px;color:${Dark};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;font-family:${font};">Your benchmark position</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CardBg};border:1.5px solid ${Border};margin-bottom:16px;">
  <tr><td style="padding:0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <th style="padding:10px 12px;color:${Muted};font-size:11px;text-align:left;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1.5px solid ${Border};font-family:${font};">Metric</th>
        <th style="padding:10px 12px;color:${Dark};font-size:11px;text-align:left;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1.5px solid ${Border};font-family:${font};">You</th>
        <th style="padding:10px 12px;color:${Orange};font-size:11px;text-align:left;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1.5px solid ${Border};font-family:${font};">Industry Avg</th>
      </tr>
      ${benchmarkRows}
    </table>
  </td></tr>
</table>

<p style="margin:0 0 10px;color:${Dark};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;font-family:${font};">This week's opportunity</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(245,158,11,0.07);border:1.5px solid rgba(245,158,11,0.25);margin-bottom:16px;">
  <tr><td style="padding:18px 22px;">
    <p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;font-family:${font};">${opportunity}</p>
  </td></tr>
</table>

<p style="margin:0 0 10px;color:${Dark};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;font-family:${font};">Recommended action this week</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(34,197,94,0.07);border:1.5px solid rgba(34,197,94,0.2);margin-bottom:24px;">
  <tr><td style="padding:18px 22px;">
    <p style="margin:0;color:#166534;font-size:14px;line-height:1.6;font-family:${font};">&rarr; ${recommendation}</p>
  </td></tr>
</table>

${cta('View Full Briefing', 'https://idealicp.com/dashboard')}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: `Your weekly market intelligence, ${weekLabel}`,
    html: base(content),
  })
  if (error) console.error('[email] weekly intelligence error:', JSON.stringify(error))
  else console.log('[email] weekly intelligence sent id:', data?.id, 'to:', to)
  return { data, error }
}

// ─── Email 13: Escalation, founder notification ──────────────────────────────

export async function sendEscalationToFounder({
  userName, userEmail, companyName, tier, score, wasteEstimate,
  urgency, note, conversationTranscript,
}: {
  userName: string; userEmail: string; companyName?: string
  tier: string; score: number | null; wasteEstimate: string
  urgency: string; note: string; conversationTranscript: string
}) {
  const content = `
${heading('New Escalation Request', 30)}
<p style="margin:0 0 24px;color:${Muted};font-size:15px;line-height:1.7;font-family:${font};">A client has requested human review.</p>
${infoCard(`<p style="margin:0 0 12px;color:${Orange};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;font-family:${font};">Client</p>
${[
  ['Name', escapeHtml(userName)],
  ['Email', escapeHtml(userEmail)],
  ['Company', escapeHtml(companyName || '&#8212;')],
  ['Tier', escapeHtml(tier.charAt(0).toUpperCase() + tier.slice(1))],
  ['ICP Health Score', score !== null ? `${score}/100` : '&#8212;'],
  ['Est. Waste', escapeHtml(wasteEstimate || '&#8212;')],
  ['Urgency', escapeHtml(urgency)],
].map(([k, v]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr>
  <td style="color:${Muted};font-size:13px;width:160px;font-family:${font};">${k}</td>
  <td style="color:${Dark};font-size:13px;font-weight:600;font-family:${font};">${v}</td>
</tr></table>`).join('')}`)}
${note ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CardBg};border:1.5px solid ${Border};margin-bottom:20px;"><tr><td style="padding:16px 20px;"><p style="margin:0 0 8px;color:${Muted};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;font-family:${font};">Note from client</p><p style="margin:0;color:${Dark};font-size:14px;line-height:1.6;font-family:${font};">${escapeHtml(note)}</p></td></tr></table>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CardBg};border:1.5px solid ${Border};margin-bottom:20px;">
  <tr><td style="padding:16px 20px;">
    <p style="margin:0 0 10px;color:${Muted};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;font-family:${font};">Conversation transcript</p>
    <pre style="margin:0;color:${Dark};font-size:12px;line-height:1.7;white-space:pre-wrap;font-family:-apple-system,monospace;">${escapeHtml(conversationTranscript)}</pre>
  </td></tr>
</table>
<p style="margin:0;color:${Muted};font-size:13px;font-family:${font};">Reply via email to respond directly.</p>`

  const { data, error } = await getResend().emails.send({
    from: FROM, to: 'eugene@idealicp.com', replyTo: userEmail,
    subject: `Escalation: ${companyName || userName}, ${urgency}`,
    html: base(content, { loginBtn: false }),
  })
  if (error) console.error('[email] escalation founder error:', JSON.stringify(error))
  else console.log('[email] escalation founder sent id:', data?.id)
  return { data, error }
}

// ─── Email 14: Escalation, user confirmation ─────────────────────────────────

export async function sendEscalationConfirmationToUser({
  to, name, tier, urgency,
}: {
  to: string; name: string; tier: string; urgency: string
}) {
  const first = name?.split(' ')[0] ?? 'there'
  const tierKey = tier.toLowerCase()
  const timeline =
    tierKey === 'agency' ? 'Same-day response' :
    tierKey === 'pro'    ? 'Within 24 hours' :
                           'Within 2 business days'

  const content = `
${ICON.check}
${heading('Your request has been received.')}
${sub(`Hi ${first}, your escalation has been sent to Eugene.`)}
${infoCard(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="padding:10px 0;border-bottom:1px solid ${BorderLight};">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;font-family:${font};">Expected response time</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;font-family:${font};">${timeline}</p>
  </td></tr>
  <tr><td style="padding:10px 0;border-bottom:1px solid ${BorderLight};">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;font-family:${font};">Urgency flagged</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;font-family:${font};">${urgency}</p>
  </td></tr>
  <tr><td style="padding:10px 0;">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;font-family:${font};">How you will hear back</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;font-family:${font};">Eugene will respond via chat in your dashboard and by email.</p>
  </td></tr>
</table>`)}
${cta('Go to Dashboard', 'https://idealicp.com/dashboard')}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: 'Your request has been received',
    html: base(content),
  })
  if (error) console.error('[email] escalation user error:', JSON.stringify(error))
  else console.log('[email] escalation user sent id:', data?.id, 'to:', to)
  return { data, error }
}

// ─── Email 15: Admin reply, user notification ────────────────────────────────

export async function sendAdminReplyToUser({
  to, name, reply, dashboardUrl,
}: {
  to: string; name: string; reply: string; dashboardUrl?: string
}) {
  const first = escapeHtml(name?.split(' ')[0] ?? 'there')
  const url = dashboardUrl ?? 'https://idealicp.com/dashboard'

  const content = `
${ICON.check}
${heading('Eugene replied to your question.', 36)}
${sub(`Hi ${first}, Eugene reviewed your diagnostic and left a reply.`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(232,51,10,0.05);border:1.5px solid rgba(232,51,10,0.2);border-radius:4px;margin-bottom:20px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 10px;color:${Orange};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;font-family:${font};">Reply from Eugene</p>
    <p style="margin:0;color:${Dark};font-size:15px;line-height:1.7;font-family:${font};">${escapeHtml(reply)}</p>
  </td></tr>
</table>
${cta('View in Dashboard', url)}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: 'Eugene replied to your question',
    html: base(content),
  })
  if (error) console.error('[email] admin reply user error:', JSON.stringify(error))
  else console.log('[email] admin reply user sent id:', data?.id, 'to:', to)
  return { data, error }
}

// ─── Email: Account created (signup) ─────────────────────────────────────────

export async function sendAccountCreatedEmail({
  to, name,
}: { to: string; name?: string }) {
  const first = name?.split(' ')[0] ?? 'there'
  const url = 'https://idealicp.com/questionnaire'

  const content = `
${ICON.shield}
${heading('Welcome to ICP Diagnostic.')}
${sub(`Hi ${first}, your account is ready. Run your first ICP diagnostic and see exactly where you are losing revenue.`)}
${infoCard(`<p style="margin:0 0 14px;color:${Orange};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;font-family:${font};">What you get with a free diagnostic</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  ${[
    ['ICP Health Score', 'A 0-100 score showing how strong your customer profile is'],
    ['Top 3 Findings', 'Issues costing you revenue, ranked by impact'],
    ['Quick Wins', '3 specific actions you can take this week'],
  ].map(([label, desc], i, arr) => `<tr><td style="padding:8px 0;${i < arr.length - 1 ? `border-bottom:1px solid ${BorderLight};` : ''}">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;font-family:${font};">${label}</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;font-family:${font};">${desc}</p>
  </td></tr>`).join('')}
</table>`)}
${securityBox(`<p style="margin:0;font-family:${font};font-size:14px;color:${Dark};line-height:1.6;"><strong style="font-weight:700;">No card required.</strong> Your free diagnosis is instant. Takes less than 5 minutes.</p>`)}
${cta('Run your free diagnostic', url)}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: 'Welcome to ICP Diagnostic',
    html: base(content),
  })
  if (error) console.error('[email] account-created error:', JSON.stringify(error))
  else console.log('[email] account-created sent id:', data?.id, 'to:', to)
  return { data, error }
}

// ─── New signup notification, founder ───────────────────────────────────────

export async function sendNewSignupToFounder({
  userEmail, userName, source,
}: { userEmail: string; userName?: string; source?: string }) {
  const rows = [
    ['Email', userEmail],
    ['Name', userName || '&#8212;'],
    ['Signup method', source === 'google' ? 'Google OAuth' : source ?? 'Email'],
    ['Time', new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
  ]

  const content = `
${heading('New signup', 28)}
${infoCard(rows.map(([l, v], i) => row(l, v, i === rows.length - 1)).join(''))}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to: 'eugene@idealicp.com', replyTo: userEmail,
    subject: `New signup: ${userName || userEmail}${source === 'google' ? ' (Google)' : ''}`,
    html: base(content, { loginBtn: false }),
  })
  if (error) console.error('[email] new-signup founder error:', JSON.stringify(error))
  else console.log('[email] new-signup founder sent id:', data?.id)
  return { data, error }
}
