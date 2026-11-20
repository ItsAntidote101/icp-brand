import { getVerifiedSession } from '@/lib/session'

// Who may use the admin screens. Set ADMIN_EMAILS (comma separated) in Vercel
// to change it; by default it is the founder inbox.
const DEFAULT_ADMIN = 'kwata@idealicp.com'

export async function getAdmin(): Promise<{ email: string; userId: string } | null> {
  const session = await getVerifiedSession()
  if (!session) return null
  const allowed = (process.env.ADMIN_EMAILS ?? DEFAULT_ADMIN)
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return allowed.includes(session.email.trim().toLowerCase()) ? session : null
}
