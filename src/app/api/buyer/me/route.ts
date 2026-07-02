import { NextResponse } from 'next/server'
import { getBuyerSession } from '@/lib/buyerSession'
import { getBuyerById } from '@/lib/buyers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getBuyerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const buyer = getBuyerById(session.buyerId)
  if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })

  return NextResponse.json({ buyer })
}
