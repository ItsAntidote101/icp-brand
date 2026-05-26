'use client'

import Link from 'next/link'
import { useSession } from '@/hooks/useSession'

interface Props {
  loginStyle?: React.CSSProperties
  dashboardStyle?: React.CSSProperties
  loginLabel?: string
}

export default function SessionNavButton({ loginStyle, dashboardStyle, loginLabel = 'Log in' }: Props) {
  const session = useSession()

  if (session.status === 'loading') return null

  if (session.status === 'authenticated') {
    return (
      <Link href="/dashboard" style={dashboardStyle}>
        Dashboard
      </Link>
    )
  }

  return (
    <Link href="/auth?tab=login" style={loginStyle}>
      {loginLabel}
    </Link>
  )
}
