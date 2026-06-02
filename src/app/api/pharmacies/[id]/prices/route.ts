import { NextRequest, NextResponse } from 'next/server'
import { getPharmacyPrices, upsertPrice } from '@/repositories/pharmacy.repository'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prices = await getPharmacyPrices(params.id)
    return NextResponse.json(prices)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'pharmacy') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
  }

  const { medication_id, price_myr, in_stock } = await req.json()
  try {
    const price = await upsertPrice(params.id, medication_id, price_myr, in_stock)
    return NextResponse.json(price)
  } catch {
    return NextResponse.json({ error: 'Failed to update price' }, { status: 500 })
  }
}
