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
const VeryMuted   = 'rgba(24,17,10,0.4)'
const Border      = 'rgba(24,17,10,0.12)'
const BorderLight = 'rgba(24,17,10,0.07)'
const CardBg      = 'rgba(24,17,10,0.04)'
const font        = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"

// ─── Base template ────────────────────────────────────────────────────────────

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ICP Diagnostic</title></head>
<body style="margin:0;padding:0;background-color:${Warm};font-family:${font};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${Warm};min-height:100vh;">
    <tr><td align="center" style="padding:48px 20px;">
      <table role="presentation" width="100%" style="max-width:560px;background-color:${White};border:1.5px solid ${Border};overflow:hidden;">
        <tr>
          <td style="padding:24px 36px 20px;border-bottom:1.5px solid ${BorderLight};">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="width:26px;height:26px;background:${Orange};vertical-align:middle;"></td>
              <td style="padding-left:10px;vertical-align:middle;"><span style="color:${Dark};font-size:16px;font-weight:700;letter-spacing:-0.3px;">ICP Diagnostic</span></td>
            </tr></table>
          </td>
        </tr>
        <tr><td style="padding:36px 36px 32px;">${content}</td></tr>
        <tr>
          <td style="padding:18px 36px 26px;border-top:1.5px solid ${BorderLight};">
            <p style="margin:0;color:${VeryMuted};font-size:12px;line-height:1.6;">
              You are receiving this because you have an account with ICP Diagnostic.
              Manage everything from your <a href="https://idealicp.com/dashboard" style="color:${Orange};text-decoration:none;">dashboard</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function cta(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;"><tr>
    <td style="background-color:${Orange};border-radius:6px;">
      <a href="${href}" style="display:inline-block;padding:14px 28px;color:${White};font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.2px;">${label} &rarr;</a>
    </td>
  </tr></table>`
}

function infoCard(content: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CardBg};border:1.5px solid ${Border};margin-bottom:16px;">
  <tr><td style="padding:20px 24px;">${content}</td></tr>
</table>`
}

function row(label: string, value: string, last = false): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${last ? '' : `border-bottom:1px solid ${BorderLight};`}padding-bottom:10px;margin-bottom:10px;"><tr>
    <td><p style="margin:0;color:${Muted};font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">${label}</p>
    <p style="margin:2px 0 0;color:${Dark};font-size:14px;font-weight:600;">${value}</p></td>
  </tr></table>`
}

// ─── Email 1: Welcome / Report ready ─────────────────────────────────────────

export async function sendWelcomeEmail({
  to, name, reportId, baseUrl,
}: { to: string; name?: string; reportId: string; baseUrl?: string }) {
  const url = `${baseUrl ?? 'https://idealicp.com'}/report/${reportId}`
  const first = name?.split(' ')[0] ?? 'there'

  const rows = [
    ['ICP Health Score',   'A 0-100 score showing how strong your customer profile is'],
    ['Top 3 Findings',     'Issues costing you money, ranked by revenue impact'],
    ['Quick Wins',         '3 specific actions you can take this week'],
    ['Score Breakdown',    '6-dimension analysis: targeting, funnel, channels, and more'],
  ]

  const content = `
<h1 style="margin:0 0 10px;color:${Dark};font-size:26px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Your ICP Diagnostic is ready</h1>
<p style="margin:0 0 28px;color:${Muted};font-size:15px;line-height:1.7;">Hi ${first}, your report has been generated. Here is what is inside:</p>
${infoCard(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  ${rows.map(([label, desc], i) => `<tr><td style="padding:8px 0;${i < rows.length - 1 ? `border-bottom:1px solid ${BorderLight};` : ''}">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;">${label}</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;">${desc}</p>
  </td></tr>`).join('')}
</table>`)}
${cta('View Your Report', url)}
<p style="margin:18px 0 0;color:${Muted};font-size:13px;">Or copy: <a href="${url}" style="color:${Orange};text-decoration:none;">${url}</a></p>`

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
<h1 style="margin:0 0 10px;color:${Dark};font-size:26px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Welcome to ICP Diagnostic</h1>
<p style="margin:0 0 28px;color:${Muted};font-size:15px;line-height:1.7;">Hi ${first}, your <strong style="color:${Dark};">${tierLabel}</strong> subscription is active. Your dashboard is ready.</p>
${infoCard(`<p style="margin:0 0 14px;color:${Orange};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Your ${tierLabel} plan includes</p>
${features.map(f => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;"><tr>
  <td style="width:20px;color:${Orange};font-size:14px;vertical-align:top;padding-top:1px;">&#10003;</td>
  <td style="color:${Dark};font-size:14px;line-height:1.5;">${f}</td>
</tr></table>`).join('')}`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CardBg};border:1.5px solid ${Border};">
  <tr><td style="padding:14px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="color:${Muted};font-size:13px;">Next renewal</td>
      <td align="right" style="color:${Dark};font-size:13px;font-weight:600;">${renewal}</td>
    </tr></table>
  </td></tr>
</table>
${cta('Go to Your Dashboard', url)}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: `Welcome to ICP Diagnostic — Your ${tierLabel} dashboard is ready`,
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
      ? `Your last score was <strong style="color:#15803d;">${lastScore}/100</strong> — strong. Let us see if you have pushed it even higher.`
      : lastScore >= 40
        ? `Your last score was <strong style="color:#d97706;">${lastScore}/100</strong>. There is meaningful ground to recover. Let us see where you stand now.`
        : `Your last score was <strong style="color:#dc2626;">${lastScore}/100</strong>. A lot can change in 30 days. Let us get a fresh read.`
    : `Time to see where your ICP stands this month.`

  const content = `
<h1 style="margin:0 0 10px;color:${Dark};font-size:26px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Time for your monthly ICP check-in</h1>
<p style="margin:0 0 28px;color:${Muted};font-size:15px;line-height:1.7;">Hi ${first}, it has been about 30 days since your last diagnostic. ${scoreHtml}</p>
${infoCard(`<p style="margin:0 0 10px;color:${Muted};font-size:14px;line-height:1.6;">Markets shift. Algorithms update. Your ICP needs a monthly re-calibration to stay sharp.</p>
<p style="margin:0;color:${Muted};font-size:14px;line-height:1.6;">Takes less than 5 minutes. Results are instant.</p>`)}
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

// ─── Email 4: Session request — founder notification ─────────────────────────

export async function sendSessionRequestToFounder({
  userName, userEmail, companyName, sessionFormat, preferredTime, notes, diagnostic,
}: {
  userName: string; userEmail: string; companyName: string
  sessionFormat: string; preferredTime: string; notes: string
  diagnostic: { score: number | null; waste: string; topFinding: string }
}) {
  const content = `
<h1 style="margin:0 0 10px;color:${Dark};font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">New Strategy Session Request</h1>
<p style="margin:0 0 24px;color:${Muted};font-size:15px;line-height:1.7;">A new Agency session request has come in. Details below.</p>
${infoCard(`<p style="margin:0 0 12px;color:${Orange};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Client</p>
${[
  ['Name', escapeHtml(userName)],
  ['Email', escapeHtml(userEmail)],
  ['Company', escapeHtml(companyName)],
  ['Format', escapeHtml(sessionFormat)],
  ['Preferred Time', escapeHtml(preferredTime || 'Not specified')],
].map(([k, v]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr>
  <td style="color:${Muted};font-size:13px;width:140px;">${k}</td>
  <td style="color:${Dark};font-size:13px;font-weight:600;">${v}</td>
</tr></table>`).join('')}`)}
${infoCard(`<p style="margin:0 0 12px;color:${Orange};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Diagnostic Summary</p>
${[
  ['ICP Health Score', diagnostic.score !== null ? `${diagnostic.score}/100` : '&#8212;'],
  ['Estimated Waste', escapeHtml(diagnostic.waste || '&#8212;')],
  ['Top Finding', escapeHtml(diagnostic.topFinding || '&#8212;')],
].map(([k, v]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr>
  <td style="color:${Muted};font-size:13px;width:160px;">${k}</td>
  <td style="color:${Dark};font-size:13px;font-weight:600;">${v}</td>
</tr></table>`).join('')}`)}
${notes ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CardBg};border:1.5px solid ${Border};margin-bottom:16px;"><tr><td style="padding:16px 20px;"><p style="margin:0 0 8px;color:${Muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Notes from client</p><p style="margin:0;color:${Dark};font-size:14px;line-height:1.6;">${escapeHtml(notes)}</p></td></tr></table>` : ''}
<p style="margin:16px 0 0;color:${Muted};font-size:13px;">Reply to this email to reach the client directly.</p>`

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to: 'eugene@idealicp.com',
    replyTo: userEmail,
    subject: `New Strategy Session Request from ${companyName || userName}`,
    html: base(content),
  })
  if (error) console.error('[email] session founder error:', JSON.stringify(error))
  else console.log('[email] session founder sent id:', data?.id)
  return { data, error }
}

// ─── Email 5: Session request — user confirmation ─────────────────────────────

export async function sendSessionConfirmationToUser({
  to, name,
}: { to: string; name: string }) {
  const first = name?.split(' ')[0] ?? 'there'
  const content = `
<h1 style="margin:0 0 10px;color:${Dark};font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Session request received.</h1>
<p style="margin:0 0 24px;color:${Muted};font-size:15px;line-height:1.7;">Hi ${first}, we have your request and we are on it. Here is what happens next.</p>
${infoCard([
  ['Within 2 business hours', 'We confirm your booking and send a calendar invite.'],
  ['Before the session', 'Your media buyer reads your full diagnostic. No briefing needed from you.'],
  ['On the call', 'We implement your top 3 fixes together. Come ready to make decisions.'],
  ['30 days later', 'You run a new diagnosis. We measure the improvement together.'],
].map(([step, desc]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;"><tr>
  <td style="vertical-align:top;padding-top:2px;width:18px;color:${Orange};font-size:14px;">&rarr;</td>
  <td style="vertical-align:top;padding-left:8px;">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;">${step}</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;line-height:1.5;">${desc}</p>
  </td>
</tr></table>`).join(''))}
<p style="margin:0;color:${Muted};font-size:13px;">Manage your session from your <a href="https://idealicp.com/dashboard" style="color:${Orange};text-decoration:none;">dashboard</a>.</p>`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: 'Your strategy session request is confirmed',
    html: base(content),
  })
  if (error) console.error('[email] session user error:', JSON.stringify(error))
  else console.log('[email] session user sent id:', data?.id, 'to:', to)
  return { data, error }
}

// ─── Email 6: Cancellation — user confirmation ────────────────────────────────

export async function sendCancellationToUser({
  to, name, renewalDate,
}: { to: string; name: string; renewalDate?: string }) {
  const first = name?.split(' ')[0] ?? 'there'
  const accessUntil = renewalDate
    ? new Date(renewalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'your next renewal date'

  const content = `
<h1 style="margin:0 0 10px;color:${Dark};font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Your subscription has been cancelled.</h1>
<p style="margin:0 0 24px;color:${Muted};font-size:15px;line-height:1.7;">Hi ${first}, your cancellation is confirmed. Here is what happens next.</p>
${infoCard(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="padding:8px 0;border-bottom:1px solid ${BorderLight};">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;">Access until ${accessUntil}</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;">All your diagnostics, reports, and score history remain available until then.</p>
  </td></tr>
  <tr><td style="padding:8px 0;border-bottom:1px solid ${BorderLight};">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;">No further charges</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;">Your card will not be billed again.</p>
  </td></tr>
  <tr><td style="padding:8px 0;">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;">Resubscribe anytime</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;">Your account and data will be here when you come back.</p>
  </td></tr>
</table>`)}
<p style="margin:0;color:${Muted};font-size:13px;">Changed your mind? Reach us at <a href="mailto:info@idealicp.com" style="color:${Orange};text-decoration:none;">info@idealicp.com</a></p>`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: 'Subscription cancelled — access continues until ' + accessUntil,
    html: base(content),
  })
  if (error) console.error('[email] cancel user error:', JSON.stringify(error))
  else console.log('[email] cancel user sent id:', data?.id, 'to:', to)
  return { data, error }
}

// ─── Email 7: Cancellation — founder notification ─────────────────────────────

export async function sendCancellationToFounder({
  userName, userEmail, companyName, reason, renewalDate,
}: { userName: string; userEmail: string; companyName?: string; reason?: string; renewalDate?: string }) {
  const accessUntil = renewalDate
    ? new Date(renewalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '&#8212;'

  const content = `
<h1 style="margin:0 0 10px;color:${Dark};font-size:22px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Cancellation alert</h1>
<p style="margin:0 0 24px;color:${Muted};font-size:15px;line-height:1.7;">A subscriber has cancelled their plan.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(239,68,68,0.06);border:1.5px solid rgba(239,68,68,0.2);margin-bottom:20px;">
  <tr><td style="padding:20px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${[
        ['Name', escapeHtml(userName)],
        ['Email', escapeHtml(userEmail)],
        ['Company', escapeHtml(companyName || '&#8212;')],
        ['Reason', escapeHtml(reason || 'Not provided')],
        ['Access until', accessUntil],
      ].map(([label, val], i, arr) => `<tr><td style="padding:8px 0;${i < arr.length - 1 ? `border-bottom:1px solid ${BorderLight};` : ''}">
        <p style="margin:0;color:${Muted};font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">${label}</p>
        <p style="margin:2px 0 0;color:${Dark};font-size:14px;font-weight:600;">${val}</p>
      </td></tr>`).join('')}
    </table>
  </td></tr>
</table>
<p style="margin:0;color:${Muted};font-size:13px;">Reply to this email to reach the subscriber directly.</p>`

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to: 'eugene@idealicp.com',
    replyTo: userEmail,
    subject: `Cancellation: ${companyName || userName}`,
    html: base(content),
  })
  if (error) console.error('[email] cancel founder error:', JSON.stringify(error))
  else console.log('[email] cancel founder sent id:', data?.id)
  return { data, error }
}

// ─── Email 8a: Upgrade — user ─────────────────────────────────────────────────

export async function sendUpgradeToUser({
  to, name, oldTier, newTier, topUpKes, renewalDate,
}: { to: string; name: string; oldTier: string; newTier: string; topUpKes: number; renewalDate: string | null }) {
  const tierNames: Record<string, string> = { free: 'Free', starter: 'Starter', pro: 'Pro', agency: 'Agency' }
  const first      = name?.split(' ')[0] ?? 'there'
  const newLabel   = tierNames[newTier] ?? newTier
  const oldLabel   = tierNames[oldTier] ?? oldTier
  const nextDate   = renewalDate
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
<h1 style="margin:0 0 10px;color:${Dark};font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">You have upgraded to ${newLabel}.</h1>
<p style="margin:0 0 24px;color:${Muted};font-size:15px;line-height:1.7;">Hi ${first}, your ${newLabel} features are active right now.${topUpKes > 0 ? ` We will send you a separate invoice for the prorated top-up of <strong style="color:${Dark};">KES ${topUpKes.toLocaleString()}</strong> covering the rest of your current billing period.` : ''}</p>
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

// ─── Email 8b: Upgrade — founder ─────────────────────────────────────────────

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
<h1 style="margin:0 0 10px;color:${Dark};font-size:22px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Upgrade: ${tierNames[oldTier] ?? oldTier} to ${tierNames[newTier] ?? newTier}</h1>
${topUpKes > 0 ? `<p style="margin:0 0 16px;color:#d97706;font-size:14px;font-weight:600;">Action required: send an invoice for KES ${topUpKes.toLocaleString()} to cover ${daysRemaining} remaining days.</p>` : ''}
${infoCard(rows.map(([l, v], i) => row(l, v, i === rows.length - 1)).join(''))}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to: 'eugene@idealicp.com', replyTo: userEmail,
    subject: `Upgrade: ${tierNames[oldTier] ?? oldTier} to ${tierNames[newTier] ?? newTier}${topUpKes > 0 ? ` — KES ${topUpKes.toLocaleString()} to collect` : ''} — ${companyName || userName}`,
    html: base(content),
  })
  if (error) console.error('[email] upgrade founder error:', JSON.stringify(error))
  else console.log('[email] upgrade founder sent id:', data?.id)
  return { data, error }
}

// ─── Email 8c: Downgrade scheduled — user ────────────────────────────────────

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
<h1 style="margin:0 0 10px;color:${Dark};font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Downgrade scheduled.</h1>
<p style="margin:0 0 24px;color:${Muted};font-size:15px;line-height:1.7;">Hi ${first}, your plan will switch from ${currentLabel} to ${newLabel} on <strong style="color:${Dark};">${switchDate}</strong>. You keep all your current ${currentLabel} features until then. No charge today.</p>
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

// ─── Email 8d: Downgrade scheduled — founder ─────────────────────────────────

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
<h1 style="margin:0 0 10px;color:${Dark};font-size:22px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Downgrade scheduled: ${tierNames[currentTier] ?? currentTier} to ${tierNames[newTier] ?? newTier}</h1>
<p style="margin:0 0 16px;color:${Muted};font-size:14px;line-height:1.6;">No action needed. The switch applies automatically on ${switchDate}. Their current plan stays active until then.</p>
${infoCard(rows.map(([l, v], i) => row(l, v, i === rows.length - 1)).join(''))}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to: 'eugene@idealicp.com', replyTo: userEmail,
    subject: `Downgrade scheduled: ${tierNames[currentTier] ?? currentTier} to ${tierNames[newTier] ?? newTier} on ${switchDate} — ${companyName || userName}`,
    html: base(content),
  })
  if (error) console.error('[email] downgrade founder error:', JSON.stringify(error))
  else console.log('[email] downgrade founder sent id:', data?.id)
  return { data, error }
}

// ─── Email 10: Paused — user ──────────────────────────────────────────────────

export async function sendPausedToUser({
  to, name, resumeDate,
}: { to: string; name: string; resumeDate: string }) {
  const first  = name?.split(' ')[0] ?? 'there'
  const resume = new Date(resumeDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const content = `
<h1 style="margin:0 0 10px;color:${Dark};font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Your subscription is paused.</h1>
<p style="margin:0 0 24px;color:${Muted};font-size:15px;line-height:1.7;">Hi ${first}, your subscription has been paused for 30 days. Here is what this means for you.</p>
${infoCard(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="padding:8px 0;border-bottom:1px solid ${BorderLight};">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;">No charge this month</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;">Your card will not be billed during the pause period.</p>
  </td></tr>
  <tr><td style="padding:8px 0;border-bottom:1px solid ${BorderLight};">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;">Your data is safe</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;">All your diagnostics, scores, and reports remain available.</p>
  </td></tr>
  <tr><td style="padding:8px 0;">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;">Auto-resumes on ${resume}</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;">You can also resume early from your dashboard at any time.</p>
  </td></tr>
</table>`)}
${cta('Resume Early', 'https://idealicp.com/dashboard')}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: `Subscription paused — resumes ${resume}`,
    html: base(content),
  })
  if (error) console.error('[email] paused user error:', JSON.stringify(error))
  else console.log('[email] paused user sent id:', data?.id)
  return { data, error }
}

// ─── Email 11: Paused — founder ───────────────────────────────────────────────

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
<h1 style="margin:0 0 10px;color:${Dark};font-size:22px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Subscription paused</h1>
${infoCard(rows.map(([l, v], i) => row(l, v, i === rows.length - 1)).join(''))}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to: 'eugene@idealicp.com', replyTo: userEmail,
    subject: `Subscription paused: ${companyName || userName}`,
    html: base(content),
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
      <p style="margin:0;color:${Muted};font-size:11px;text-transform:uppercase;letter-spacing:0.07em;">${i + 1}</p>
      <p style="margin:2px 0 0;color:${Dark};font-size:14px;font-weight:600;">${ins.title}</p>
      <p style="margin:3px 0 0;color:${Muted};font-size:13px;line-height:1.5;">${ins.body}</p>
    </td></tr>`).join('')

  const benchmarkRows = benchmarks.slice(0, 4).map((b, i, arr) => {
    const fmt = (v: number) => b.unit === '%' ? `${v}%` : b.unit === '$' ? `$${v}` : `${v}${b.unit}`
    return `<tr>
      <td style="padding:8px 12px;color:${Muted};font-size:13px;${i < arr.length - 1 ? `border-bottom:1px solid ${BorderLight};` : ''}">${b.name}</td>
      <td style="padding:8px 12px;color:${Dark};font-size:13px;font-weight:600;${i < arr.length - 1 ? `border-bottom:1px solid ${BorderLight};` : ''}">${b.userValue != null ? fmt(b.userValue) : '&#8212;'}</td>
      <td style="padding:8px 12px;color:${Orange};font-size:13px;${i < arr.length - 1 ? `border-bottom:1px solid ${BorderLight};` : ''}">${fmt(b.industryAvg)}</td>
    </tr>`
  }).join('')

  const content = `
<h1 style="margin:0 0 6px;color:${Dark};font-size:22px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Your Weekly Market Intelligence</h1>
<p style="margin:0 0 28px;color:${Muted};font-size:14px;line-height:1.6;">Hi ${first}, here is what moved in your market this week — ${weekLabel}.</p>

<p style="margin:0 0 10px;color:${Dark};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">3 things to know this week</p>
${infoCard(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${insightRows}</table>`)}

<p style="margin:0 0 10px;color:${Dark};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Your benchmark position</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CardBg};border:1.5px solid ${Border};margin-bottom:16px;">
  <tr><td style="padding:0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <th style="padding:10px 12px;color:${Muted};font-size:11px;text-align:left;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1.5px solid ${Border};">Metric</th>
        <th style="padding:10px 12px;color:${Dark};font-size:11px;text-align:left;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1.5px solid ${Border};">You</th>
        <th style="padding:10px 12px;color:${Orange};font-size:11px;text-align:left;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1.5px solid ${Border};">Industry Avg</th>
      </tr>
      ${benchmarkRows}
    </table>
  </td></tr>
</table>

<p style="margin:0 0 10px;color:${Dark};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">This week's opportunity</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(245,158,11,0.07);border:1.5px solid rgba(245,158,11,0.25);margin-bottom:16px;">
  <tr><td style="padding:18px 22px;">
    <p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">${opportunity}</p>
  </td></tr>
</table>

<p style="margin:0 0 10px;color:${Dark};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Recommended action this week</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(34,197,94,0.07);border:1.5px solid rgba(34,197,94,0.2);margin-bottom:24px;">
  <tr><td style="padding:18px 22px;">
    <p style="margin:0;color:#166534;font-size:14px;line-height:1.6;">&rarr; ${recommendation}</p>
  </td></tr>
</table>

${cta('View Full Briefing', 'https://idealicp.com/dashboard')}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: `Your weekly market intelligence — ${weekLabel}`,
    html: base(content),
  })
  if (error) console.error('[email] weekly intelligence error:', JSON.stringify(error))
  else console.log('[email] weekly intelligence sent id:', data?.id, 'to:', to)
  return { data, error }
}

// ─── Email 13: Escalation — founder notification ──────────────────────────────

export async function sendEscalationToFounder({
  userName, userEmail, companyName, tier, score, wasteEstimate,
  urgency, note, conversationTranscript,
}: {
  userName: string; userEmail: string; companyName?: string
  tier: string; score: number | null; wasteEstimate: string
  urgency: string; note: string; conversationTranscript: string
}) {
  const content = `
<h1 style="margin:0 0 10px;color:${Dark};font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">New Escalation Request</h1>
<p style="margin:0 0 24px;color:${Muted};font-size:15px;line-height:1.7;">A client has requested human review. Details below.</p>
${infoCard(`<p style="margin:0 0 12px;color:${Orange};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Client</p>
${[
  ['Name', escapeHtml(userName)],
  ['Email', escapeHtml(userEmail)],
  ['Company', escapeHtml(companyName || '&#8212;')],
  ['Tier', escapeHtml(tier.charAt(0).toUpperCase() + tier.slice(1))],
  ['ICP Health Score', score !== null ? `${score}/100` : '&#8212;'],
  ['Est. Waste', escapeHtml(wasteEstimate || '&#8212;')],
  ['Urgency', escapeHtml(urgency)],
].map(([k, v]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr>
  <td style="color:${Muted};font-size:13px;width:160px;">${k}</td>
  <td style="color:${Dark};font-size:13px;font-weight:600;">${v}</td>
</tr></table>`).join('')}`)}
${note ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CardBg};border:1.5px solid ${Border};margin-bottom:20px;"><tr><td style="padding:16px 20px;"><p style="margin:0 0 8px;color:${Muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Note from client</p><p style="margin:0;color:${Dark};font-size:14px;line-height:1.6;">${escapeHtml(note)}</p></td></tr></table>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CardBg};border:1.5px solid ${Border};margin-bottom:20px;">
  <tr><td style="padding:16px 20px;">
    <p style="margin:0 0 10px;color:${Muted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Conversation transcript</p>
    <pre style="margin:0;color:${Dark};font-size:12px;line-height:1.7;white-space:pre-wrap;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',monospace;">${escapeHtml(conversationTranscript)}</pre>
  </td></tr>
</table>
<p style="margin:0;color:${Muted};font-size:13px;">Reply via email to respond directly.</p>`

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to: 'eugene@idealicp.com',
    replyTo: userEmail,
    subject: `Escalation: ${companyName || userName} — ${urgency}`,
    html: base(content),
  })
  if (error) console.error('[email] escalation founder error:', JSON.stringify(error))
  else console.log('[email] escalation founder sent id:', data?.id)
  return { data, error }
}

// ─── Email 14: Escalation — user confirmation ─────────────────────────────────

export async function sendEscalationConfirmationToUser({
  to, name, tier, urgency,
}: {
  to: string; name: string; tier: string; urgency: string
}) {
  const first = name?.split(' ')[0] ?? 'there'
  const tierKey = tier.toLowerCase()
  const timeline =
    tierKey === 'agency' ? 'same-day response' :
    tierKey === 'pro'    ? 'within 24 hours' :
                           'within 2 business days'

  const content = `
<h1 style="margin:0 0 10px;color:${Dark};font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Your request has been received.</h1>
<p style="margin:0 0 24px;color:${Muted};font-size:15px;line-height:1.7;">Hi ${first}, your escalation has been sent to Eugene.</p>
${infoCard(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="padding:8px 0;border-bottom:1px solid ${BorderLight};">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;">Expected response time</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;">${timeline}</p>
  </td></tr>
  <tr><td style="padding:8px 0;border-bottom:1px solid ${BorderLight};">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;">Urgency flagged</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;">${urgency}</p>
  </td></tr>
  <tr><td style="padding:8px 0;">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;">How you will hear back</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;">He will respond via the chat in your dashboard and by email.</p>
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

// ─── Email 15: Admin reply — user notification ────────────────────────────────

export async function sendAdminReplyToUser({
  to, name, reply, dashboardUrl,
}: {
  to: string; name: string; reply: string; dashboardUrl?: string
}) {
  const first = escapeHtml(name?.split(' ')[0] ?? 'there')
  const url = dashboardUrl ?? 'https://idealicp.com/dashboard'

  const content = `
<h1 style="margin:0 0 10px;color:${Dark};font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Eugene replied to your question.</h1>
<p style="margin:0 0 24px;color:${Muted};font-size:15px;line-height:1.7;">Hi ${first}, Eugene reviewed your diagnostic and replied.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(232,51,10,0.05);border:1.5px solid rgba(232,51,10,0.2);margin-bottom:20px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 10px;color:${Orange};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Reply from Eugene</p>
    <p style="margin:0;color:${Dark};font-size:15px;line-height:1.7;">${escapeHtml(reply)}</p>
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
<h1 style="margin:0 0 10px;color:${Dark};font-size:26px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Welcome to ICP Diagnostic</h1>
<p style="margin:0 0 28px;color:${Muted};font-size:15px;line-height:1.7;">Hi ${first}, your account is ready. Run your first ICP diagnostic to see how well your ideal customer profile is defined and where you are losing revenue.</p>
${infoCard(`<p style="margin:0 0 12px;color:${Orange};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">What you get with a free diagnostic</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  ${[
    ['ICP Health Score', 'A 0-100 score showing how strong your customer profile is'],
    ['Top 3 Findings', 'Issues costing you revenue, ranked by impact'],
    ['Quick Wins', '3 specific actions you can take this week'],
  ].map(([label, desc], i, arr) => `<tr><td style="padding:6px 0;${i < arr.length - 1 ? `border-bottom:1px solid ${BorderLight};` : ''}">
    <p style="margin:0;color:${Dark};font-size:14px;font-weight:600;">${label}</p>
    <p style="margin:2px 0 0;color:${Muted};font-size:13px;">${desc}</p>
  </td></tr>`).join('')}
</table>`)}
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

// ─── New signup notification — founder ───────────────────────────────────────

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
<h1 style="margin:0 0 10px;color:${Dark};font-size:22px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">New signup</h1>
${infoCard(rows.map(([l, v], i) => row(l, v, i === rows.length - 1)).join(''))}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to: 'eugene@idealicp.com', replyTo: userEmail,
    subject: `New signup: ${userName || userEmail}${source === 'google' ? ' (Google)' : ''}`,
    html: base(content),
  })
  if (error) console.error('[email] new-signup founder error:', JSON.stringify(error))
  else console.log('[email] new-signup founder sent id:', data?.id)
  return { data, error }
}
