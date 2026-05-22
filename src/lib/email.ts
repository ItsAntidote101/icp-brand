import { Resend } from 'resend'

const FROM = 'ICP Brand <noreply@idealicp.com>'

function escapeHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? '')
}

// ─── Base template ────────────────────────────────────────────────────────────

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
              You're receiving this because you have an account with ICP Brand.
              Questions? <a href="mailto:support@idealicp.com" style="color:#6366f1;text-decoration:none;">support@idealicp.com</a>
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
    <td style="background-color:#6366f1;border-radius:12px;">
      <a href="${href}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:-0.2px;">${label} →</a>
    </td>
  </tr></table>`
}

// ─── Email 1: Welcome / Report ready ─────────────────────────────────────────

export async function sendWelcomeEmail({
  to, name, reportId, baseUrl,
}: { to: string; name?: string; reportId: string; baseUrl?: string }) {
  const url = `${baseUrl ?? 'https://idealicp.com'}/report/${reportId}`
  const first = name?.split(' ')[0] ?? 'there'

  const rows = [
    ['ICP Health Score',   'A 0–100 score showing how strong your customer profile is'],
    ['Top 3 Findings',     'Issues costing you money, ranked by revenue impact'],
    ['Quick Wins',         '3 specific actions you can take this week'],
    ['Score Breakdown',    '6-dimension analysis: targeting, funnel, channels, and more'],
  ]

  const content = `
<h1 style="margin:0 0 10px;color:#ffffff;font-size:26px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Your ICP Diagnostic is ready</h1>
<p style="margin:0 0 28px;color:#9ca3af;font-size:15px;line-height:1.7;">Hi ${first}, your report has been generated. Here's what's inside:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;margin-bottom:4px;">
  <tr><td style="padding:20px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${rows.map(([label, desc]) => `<tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;color:#e5e7eb;font-size:14px;font-weight:600;">${label}</p>
        <p style="margin:2px 0 0;color:#6b7280;font-size:13px;">${desc}</p>
      </td></tr>`).join('')}
    </table>
  </td></tr>
</table>
${cta('View Your Report', url)}
<p style="margin:18px 0 0;color:#4b5563;font-size:13px;">Or copy: <a href="${url}" style="color:#6366f1;text-decoration:none;">${url}</a></p>`

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
<h1 style="margin:0 0 10px;color:#ffffff;font-size:26px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Welcome to ICP Brand</h1>
<p style="margin:0 0 28px;color:#9ca3af;font-size:15px;line-height:1.7;">Hi ${first}, your <strong style="color:#ffffff;">${tierLabel}</strong> subscription is active. Your dashboard is ready.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;margin-bottom:16px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 14px;color:#a5b4fc;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Your ${tierLabel} plan includes</p>
    ${features.map(f => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;"><tr>
      <td style="width:20px;color:#6366f1;font-size:14px;vertical-align:top;padding-top:1px;">✓</td>
      <td style="color:#e5e7eb;font-size:14px;line-height:1.5;">${f}</td>
    </tr></table>`).join('')}
  </td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;">
  <tr><td style="padding:14px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="color:#6b7280;font-size:13px;">Next renewal</td>
      <td align="right" style="color:#ffffff;font-size:13px;font-weight:600;">${renewal}</td>
    </tr></table>
  </td></tr>
</table>
${cta('Go to Your Dashboard', url)}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: `Welcome to ICP Brand — Your ${tierLabel} dashboard is ready`,
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
      ? `Your last score was <strong style="color:#22c55e;">${lastScore}/100</strong> — strong. Let's see if you've pushed it even higher.`
      : lastScore >= 40
        ? `Your last score was <strong style="color:#f59e0b;">${lastScore}/100</strong>. There's meaningful ground to recover. Let's see where you stand now.`
        : `Your last score was <strong style="color:#ef4444;">${lastScore}/100</strong>. A lot can change in 30 days — let's get a fresh read.`
    : `Time to see where your ICP stands this month.`

  const content = `
<h1 style="margin:0 0 10px;color:#ffffff;font-size:26px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Time for your monthly ICP check-in</h1>
<p style="margin:0 0 28px;color:#9ca3af;font-size:15px;line-height:1.7;">Hi ${first}, it's been about 30 days since your last diagnostic. ${scoreHtml}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;margin-bottom:4px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 10px;color:#9ca3af;font-size:14px;line-height:1.6;">Markets shift. Algorithms update. Your ICP needs a monthly re-calibration to stay sharp.</p>
    <p style="margin:0;color:#9ca3af;font-size:14px;line-height:1.6;">Takes less than 5 minutes. Results are instant.</p>
  </td></tr>
</table>
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
<h1 style="margin:0 0 10px;color:#ffffff;font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">New Strategy Session Request</h1>
<p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.7;">A new Agency session request has come in. Details below.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;margin-bottom:20px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 6px;color:#a5b4fc;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Client</p>
    ${[
      ['Name', escapeHtml(userName)],
      ['Email', escapeHtml(userEmail)],
      ['Company', escapeHtml(companyName)],
      ['Format', escapeHtml(sessionFormat)],
      ['Preferred Time', escapeHtml(preferredTime || 'Not specified')],
    ].map(([k, v]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr>
      <td style="color:#6b7280;font-size:13px;width:140px;">${k}</td>
      <td style="color:#e5e7eb;font-size:13px;font-weight:600;">${v}</td>
    </tr></table>`).join('')}
  </td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;margin-bottom:20px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 12px;color:#a5b4fc;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Diagnostic Summary</p>
    ${[
      ['ICP Health Score', diagnostic.score !== null ? `${diagnostic.score}/100` : '—'],
      ['Estimated Waste', escapeHtml(diagnostic.waste || '—')],
      ['Top Finding', escapeHtml(diagnostic.topFinding || '—')],
    ].map(([k, v]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr>
      <td style="color:#6b7280;font-size:13px;width:160px;">${k}</td>
      <td style="color:#e5e7eb;font-size:13px;font-weight:600;">${v}</td>
    </tr></table>`).join('')}
  </td></tr>
</table>
${notes ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:16px;"><tr><td style="padding:16px 20px;"><p style="margin:0 0 8px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Notes from client</p><p style="margin:0;color:#e5e7eb;font-size:14px;line-height:1.6;">${escapeHtml(notes)}</p></td></tr></table>` : ''}
<p style="margin:16px 0 0;color:#6b7280;font-size:13px;">Reply to this email to reach the client directly.</p>`

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
<h1 style="margin:0 0 10px;color:#ffffff;font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Session request received.</h1>
<p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.7;">Hi ${first}, we have your request and we are on it. Here is what happens next.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;margin-bottom:20px;">
  <tr><td style="padding:20px 24px;">
    ${[
      ['Within 2 business hours', 'We confirm your booking and send a calendar invite.'],
      ['Before the session', 'Your media buyer reads your full diagnostic. No briefing needed from you.'],
      ['On the call', 'We implement your top 3 fixes together. Come ready to make decisions.'],
      ['30 days later', 'You run a new diagnosis. We measure the improvement together.'],
    ].map(([step, desc]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;"><tr>
      <td style="vertical-align:top;padding-top:2px;width:18px;color:#6366f1;font-size:14px;">→</td>
      <td style="vertical-align:top;padding-left:8px;">
        <p style="margin:0;color:#ffffff;font-size:14px;font-weight:600;">${step}</p>
        <p style="margin:2px 0 0;color:#9ca3af;font-size:13px;line-height:1.5;">${desc}</p>
      </td>
    </tr></table>`).join('')}
  </td></tr>
</table>
<p style="margin:0 0 0;color:#6b7280;font-size:13px;">Questions? Reply to this email or reach us at <a href="mailto:support@idealicp.com" style="color:#6366f1;text-decoration:none;">support@idealicp.com</a></p>`

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
<h1 style="margin:0 0 10px;color:#ffffff;font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Your subscription has been cancelled.</h1>
<p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.7;">Hi ${first}, your cancellation is confirmed. Here is what happens next.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;margin-bottom:20px;">
  <tr><td style="padding:20px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;color:#e5e7eb;font-size:14px;font-weight:600;">Access until ${accessUntil}</p>
        <p style="margin:2px 0 0;color:#6b7280;font-size:13px;">All your diagnostics, reports, and score history remain available until then.</p>
      </td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;color:#e5e7eb;font-size:14px;font-weight:600;">No further charges</p>
        <p style="margin:2px 0 0;color:#6b7280;font-size:13px;">Your card will not be billed again.</p>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <p style="margin:0;color:#e5e7eb;font-size:14px;font-weight:600;">Resubscribe anytime</p>
        <p style="margin:2px 0 0;color:#6b7280;font-size:13px;">Your account and data will be here when you come back.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
<p style="margin:0 0 0;color:#6b7280;font-size:13px;">Changed your mind? Reply to this email and we will sort it out. Or reach us at <a href="mailto:support@idealicp.com" style="color:#6366f1;text-decoration:none;">support@idealicp.com</a></p>`

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
    : '—'

  const content = `
<h1 style="margin:0 0 10px;color:#ffffff;font-size:22px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Cancellation alert</h1>
<p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.7;">A subscriber has cancelled their plan.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:14px;margin-bottom:20px;">
  <tr><td style="padding:20px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${[
        ['Name', escapeHtml(userName)],
        ['Email', escapeHtml(userEmail)],
        ['Company', escapeHtml(companyName || '—')],
        ['Reason', escapeHtml(reason || 'Not provided')],
        ['Access until', accessUntil],
      ].map(([label, val]) => `<tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">${label}</p>
        <p style="margin:2px 0 0;color:#ffffff;font-size:14px;font-weight:600;">${val}</p>
      </td></tr>`).join('')}
    </table>
  </td></tr>
</table>
<p style="margin:0;color:#6b7280;font-size:13px;">Reply to this email to reach the subscriber directly.</p>`

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

// ─── Email 8: Plan changed — user ─────────────────────────────────────────────

export async function sendPlanChangedToUser({
  to, name, newTier, newPriceKES, renewalDate,
}: { to: string; name: string; newTier: string; newPriceKES: number; renewalDate?: string }) {
  const first      = name?.split(' ')[0] ?? 'there'
  const tierNames: Record<string, string> = { starter: 'Starter', pro: 'Pro', agency: 'Agency' }
  const tierLabel  = tierNames[newTier] ?? newTier
  const accessDate = renewalDate
    ? new Date(renewalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const content = `
<h1 style="margin:0 0 10px;color:#ffffff;font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Your plan has been updated.</h1>
<p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.7;">Hi ${first}, your subscription has been switched to <strong style="color:#ffffff;">${tierLabel}</strong>. Your new plan is active immediately.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;margin-bottom:20px;">
  <tr><td style="padding:20px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">New plan</p>
        <p style="margin:2px 0 0;color:#ffffff;font-size:15px;font-weight:700;">${tierLabel}</p>
      </td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">New monthly price</p>
        <p style="margin:2px 0 0;color:#ffffff;font-size:15px;font-weight:700;">KES ${newPriceKES.toLocaleString()} / month</p>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">Next billing date</p>
        <p style="margin:2px 0 0;color:#ffffff;font-size:15px;font-weight:700;">${accessDate}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
${cta('Go to Dashboard', 'https://idealicp.com/dashboard')}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: `Your plan has been updated to ${tierLabel}`,
    html: base(content),
  })
  if (error) console.error('[email] plan changed user error:', JSON.stringify(error))
  else console.log('[email] plan changed user sent id:', data?.id)
  return { data, error }
}

// ─── Email 9: Plan changed — founder ─────────────────────────────────────────

export async function sendPlanChangedToFounder({
  userName, userEmail, companyName, oldTier, newTier,
}: { userName: string; userEmail: string; companyName?: string; oldTier: string; newTier: string }) {
  const tierNames: Record<string, string> = { starter: 'Starter', pro: 'Pro', agency: 'Agency', free: 'Free' }
  const content = `
<h1 style="margin:0 0 10px;color:#ffffff;font-size:22px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Plan change</h1>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;margin-bottom:16px;">
  <tr><td style="padding:20px 24px;">
    ${[['Name', userName], ['Email', userEmail], ['Company', companyName || '—'], ['From', tierNames[oldTier] ?? oldTier], ['To', tierNames[newTier] ?? newTier]].map(([l, v]) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;"><tr>
      <td><p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">${l}</p>
      <p style="margin:2px 0 0;color:#ffffff;font-size:14px;font-weight:600;">${v}</p></td>
    </tr></table>`).join('')}
  </td></tr>
</table>`

  const { data, error } = await getResend().emails.send({
    from: FROM, to: 'eugene@idealicp.com', replyTo: userEmail,
    subject: `Plan change: ${tierNames[oldTier] ?? oldTier} → ${tierNames[newTier] ?? newTier} — ${companyName || userName}`,
    html: base(content),
  })
  if (error) console.error('[email] plan changed founder error:', JSON.stringify(error))
  else console.log('[email] plan changed founder sent id:', data?.id)
  return { data, error }
}

// ─── Email 10: Paused — user ──────────────────────────────────────────────────

export async function sendPausedToUser({
  to, name, resumeDate,
}: { to: string; name: string; resumeDate: string }) {
  const first  = name?.split(' ')[0] ?? 'there'
  const resume = new Date(resumeDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const content = `
<h1 style="margin:0 0 10px;color:#ffffff;font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Your subscription is paused.</h1>
<p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.7;">Hi ${first}, your subscription has been paused for 30 days. Here is what this means for you.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;margin-bottom:20px;">
  <tr><td style="padding:20px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;color:#e5e7eb;font-size:14px;font-weight:600;">No charge this month</p>
        <p style="margin:2px 0 0;color:#6b7280;font-size:13px;">Your card will not be billed during the pause period.</p>
      </td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;color:#e5e7eb;font-size:14px;font-weight:600;">Your data is safe</p>
        <p style="margin:2px 0 0;color:#6b7280;font-size:13px;">All your diagnostics, scores, and reports remain available.</p>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <p style="margin:0;color:#e5e7eb;font-size:14px;font-weight:600;">Auto-resumes on ${resume}</p>
        <p style="margin:2px 0 0;color:#6b7280;font-size:13px;">You can also resume early from your dashboard at any time.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
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
  const content = `
<h1 style="margin:0 0 10px;color:#ffffff;font-size:22px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Subscription paused</h1>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;margin-bottom:16px;">
  <tr><td style="padding:20px 24px;">
    ${[['Name', userName], ['Email', userEmail], ['Company', companyName || '—'], ['Resumes', resume]].map(([l, v]) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;"><tr>
      <td><p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">${l}</p>
      <p style="margin:2px 0 0;color:#ffffff;font-size:14px;font-weight:600;">${v}</p></td>
    </tr></table>`).join('')}
  </td></tr>
</table>`

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
    <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
      <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.07em;">${i + 1}</p>
      <p style="margin:2px 0 0;color:#e5e7eb;font-size:14px;font-weight:600;">${ins.title}</p>
      <p style="margin:3px 0 0;color:#9ca3af;font-size:13px;line-height:1.5;">${ins.body}</p>
    </td></tr>`).join('')

  const benchmarkRows = benchmarks.slice(0, 4).map(b => {
    const fmt = (v: number) => b.unit === '%' ? `${v}%` : b.unit === '$' ? `$${v}` : `${v}${b.unit}`
    return `<tr>
      <td style="padding:8px 12px;color:#9ca3af;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.05);">${b.name}</td>
      <td style="padding:8px 12px;color:#ffffff;font-size:13px;font-weight:600;border-bottom:1px solid rgba(255,255,255,0.05);">${b.userValue != null ? fmt(b.userValue) : '—'}</td>
      <td style="padding:8px 12px;color:#a78bfa;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.05);">${fmt(b.industryAvg)}</td>
    </tr>`
  }).join('')

  const content = `
<h1 style="margin:0 0 6px;color:#ffffff;font-size:22px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Your Weekly Market Intelligence</h1>
<p style="margin:0 0 28px;color:#9ca3af;font-size:14px;line-height:1.6;">Hi ${first}, here is what moved in your market this week — ${weekLabel}.</p>

<p style="margin:0 0 10px;color:#ffffff;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">3 things to know this week</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;margin-bottom:22px;">
  <tr><td style="padding:16px 22px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${insightRows}
    </table>
  </td></tr>
</table>

<p style="margin:0 0 10px;color:#ffffff;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Your benchmark position</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;margin-bottom:22px;">
  <tr><td style="padding:0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <th style="padding:10px 12px;color:#6b7280;font-size:11px;text-align:left;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1px solid rgba(255,255,255,0.08);">Metric</th>
        <th style="padding:10px 12px;color:#ffffff;font-size:11px;text-align:left;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1px solid rgba(255,255,255,0.08);">You</th>
        <th style="padding:10px 12px;color:#a78bfa;font-size:11px;text-align:left;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1px solid rgba(255,255,255,0.08);">Industry Avg</th>
      </tr>
      ${benchmarkRows}
    </table>
  </td></tr>
</table>

<p style="margin:0 0 10px;color:#ffffff;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">This week's opportunity</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);border-radius:14px;margin-bottom:22px;">
  <tr><td style="padding:18px 22px;">
    <p style="margin:0;color:#fcd34d;font-size:14px;line-height:1.6;">${opportunity}</p>
  </td></tr>
</table>

<p style="margin:0 0 10px;color:#ffffff;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Recommended action this week</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);border-radius:14px;margin-bottom:24px;">
  <tr><td style="padding:18px 22px;">
    <p style="margin:0;color:#86efac;font-size:14px;line-height:1.6;">→ ${recommendation}</p>
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
<h1 style="margin:0 0 10px;color:#ffffff;font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">New Escalation Request</h1>
<p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.7;">A client has requested human review. Details below.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;margin-bottom:20px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 12px;color:#a5b4fc;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Client</p>
    ${[
      ['Name', escapeHtml(userName)],
      ['Email', escapeHtml(userEmail)],
      ['Company', escapeHtml(companyName || '—')],
      ['Tier', escapeHtml(tier.charAt(0).toUpperCase() + tier.slice(1))],
      ['ICP Health Score', score !== null ? `${score}/100` : '—'],
      ['Est. Waste', escapeHtml(wasteEstimate || '—')],
      ['Urgency', escapeHtml(urgency)],
    ].map(([k, v]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr>
      <td style="color:#6b7280;font-size:13px;width:160px;">${k}</td>
      <td style="color:#e5e7eb;font-size:13px;font-weight:600;">${v}</td>
    </tr></table>`).join('')}
  </td></tr>
</table>
${note ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:20px;"><tr><td style="padding:16px 20px;"><p style="margin:0 0 8px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Note from client</p><p style="margin:0;color:#e5e7eb;font-size:14px;line-height:1.6;">${escapeHtml(note)}</p></td></tr></table>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(10,10,15,0.8);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:20px;">
  <tr><td style="padding:16px 20px;">
    <p style="margin:0 0 10px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Conversation transcript</p>
    <pre style="margin:0;color:#e5e7eb;font-size:12px;line-height:1.7;white-space:pre-wrap;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',monospace;">${escapeHtml(conversationTranscript)}</pre>
  </td></tr>
</table>
<p style="margin:0;color:#6b7280;font-size:13px;">Reply via email to respond directly.</p>`

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
<h1 style="margin:0 0 10px;color:#ffffff;font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Your request has been received.</h1>
<p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.7;">Hi ${first}, your escalation has been sent to Eugene.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;margin-bottom:20px;">
  <tr><td style="padding:20px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;color:#e5e7eb;font-size:14px;font-weight:600;">Expected response time</p>
        <p style="margin:2px 0 0;color:#9ca3af;font-size:13px;">${timeline}</p>
      </td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;color:#e5e7eb;font-size:14px;font-weight:600;">Urgency flagged</p>
        <p style="margin:2px 0 0;color:#9ca3af;font-size:13px;">${urgency}</p>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <p style="margin:0;color:#e5e7eb;font-size:14px;font-weight:600;">How you'll hear back</p>
        <p style="margin:2px 0 0;color:#9ca3af;font-size:13px;">He'll respond via the chat in your dashboard and by email.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
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
<h1 style="margin:0 0 10px;color:#ffffff;font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Eugene replied to your question.</h1>
<p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.7;">Hi ${first}, Eugene reviewed your diagnostic and replied.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.3);border-radius:14px;margin-bottom:20px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 10px;color:#a5b4fc;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Reply from Eugene</p>
    <p style="margin:0;color:#e5e7eb;font-size:15px;line-height:1.7;">${escapeHtml(reply)}</p>
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

// ─── Email: New signup — founder notification ─────────────────────────────────

export async function sendNewSignupToFounder({
  userEmail, userName, source,
}: { userEmail: string; userName?: string; source?: string }) {
  const when  = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
  const label = userName ? `${userName} (${userEmail})` : userEmail
  const via   = source === 'google' ? 'Google OAuth' : 'Email'

  const content = `
<h1 style="margin:0 0 10px;color:#ffffff;font-size:22px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">New signup</h1>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;">
  <tr><td style="padding:20px 24px;">
    ${[['User', label], ['Method', via], ['Time', when]].map(([k, v]) =>
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;"><tr>
        <td style="color:#6b7280;font-size:13px;width:80px;">${k}</td>
        <td style="color:#e5e7eb;font-size:14px;font-weight:600;">${v}</td>
      </tr></table>`
    ).join('')}
  </td></tr>
</table>`

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to: 'eugene@idealicp.com',
    replyTo: userEmail,
    subject: `New signup: ${label}`,
    html: base(content),
  })
  if (error) console.error('[email] new-signup founder error:', JSON.stringify(error))
  else console.log('[email] new-signup founder sent id:', data?.id)
  return { data, error }
}

// ─── Email: Account created (signup) ─────────────────────────────────────────

export async function sendAccountCreatedEmail({
  to, name,
}: { to: string; name?: string }) {
  const first = name?.split(' ')[0] ?? 'there'
  const url = 'https://idealicp.com/questionnaire'

  const content = `
<h1 style="margin:0 0 10px;color:#ffffff;font-size:26px;font-weight:800;line-height:1.2;letter-spacing:-0.5px;">Welcome to ICP Brand</h1>
<p style="margin:0 0 28px;color:#9ca3af;font-size:15px;line-height:1.7;">Hi ${first}, your account is ready. Run your first ICP diagnostic to see how well your ideal customer profile is defined and where you are losing revenue.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;margin-bottom:4px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 12px;color:#a5b4fc;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">What you get with a free diagnostic</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${[
        ['ICP Health Score', 'A 0-100 score showing how strong your customer profile is'],
        ['Top 3 Findings', 'Issues costing you revenue, ranked by impact'],
        ['Quick Wins', '3 specific actions you can take this week'],
      ].map(([label, desc]) => `<tr><td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;color:#e5e7eb;font-size:14px;font-weight:600;">${label}</p>
        <p style="margin:2px 0 0;color:#6b7280;font-size:13px;">${desc}</p>
      </td></tr>`).join('')}
    </table>
  </td></tr>
</table>
${cta('Run your free diagnostic', url)}`

  const { data, error } = await getResend().emails.send({
    from: FROM, to,
    subject: 'Welcome to ICP Brand',
    html: base(content),
  })
  if (error) console.error('[email] account-created error:', JSON.stringify(error))
  else console.log('[email] account-created sent id:', data?.id, 'to:', to)
  return { data, error }
}
