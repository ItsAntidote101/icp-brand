import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validUnsubscribeToken } from '@/lib/weeks'

export const dynamic = 'force-dynamic'

const page = (title: string, body: string) => new Response(
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#f8f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#201515;">
<div style="max-width:440px;margin:15vh auto;padding:32px 28px;background:#fff;border-radius:20px;">
<h1 style="font-size:22px;margin:0 0 10px;">${title}</h1><p style="font-size:15px;line-height:1.5;color:#605d52;margin:0 0 20px;">${body}</p>
<a href="/dashboard" style="display:inline-block;background:#201515;color:#fff;text-decoration:none;border-radius:980px;padding:12px 20px;font-size:15px;font-weight:600;">Open your dashboard</a>
</div></body></html>`,
  { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
)

// One-click unsubscribe from the Monday numbers email. No login needed:
// the link carries a signed token for that one user.
export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u') ?? ''
  const t = req.nextUrl.searchParams.get('t') ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(u) || !validUnsubscribeToken(u, t)) {
    return page('This link is not valid', 'Open your dashboard to manage your emails.')
  }
  const { error } = await supabaseAdmin().from('users').update({ weekly_numbers_opt_out: true }).eq('id', u)
  if (error) return page('Something went wrong', 'We could not update your email settings. Please try the link again.')
  return page('You are unsubscribed', 'We will not send the Monday numbers email again. You can still log your numbers in the dashboard any time.')
}
