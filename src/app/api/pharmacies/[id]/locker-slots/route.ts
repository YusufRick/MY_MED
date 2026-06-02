import { NextRequest, NextResponse } from 'next/server'
import { getLockerSlots, bookLockerSlot } from '@/repositories/pharmacy.repository'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const date = new URL(req.url).searchParams.get('date') ?? new Date().toISOString().split('T')[0]
  const slots = await getLockerSlots(params.id, date)
  return NextResponse.json(slots)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'patient') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
  }

  const { slot_id } = await req.json()
  try {
    const slot = await bookLockerSlot(slot_id, session.user.id)
    return NextResponse.json(slot)
  } catch {
    return NextResponse.json({ error: 'Slot unavailable' }, { status: 409 })
  }
}
