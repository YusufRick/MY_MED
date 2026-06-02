import { NextRequest, NextResponse } from 'next/server'
import { getNearbyPharmacies } from '@/repositories/pharmacy.repository'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') ?? '3.1390')
  const lng = parseFloat(searchParams.get('lng') ?? '101.6869')
  const radius = parseFloat(searchParams.get('radius') ?? '10')

  try {
    const pharmacies = await getNearbyPharmacies(lat, lng, radius)
    return NextResponse.json(pharmacies)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch pharmacies' }, { status: 500 })
  }
}
