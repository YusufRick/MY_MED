import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateOrderStatus } from '@/repositories/order.repository'
import QRCode from 'qrcode'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { status } = await req.json()
  let extras: Record<string, string> = {}

  // Auto-generate QR when marking ready for locker pickup
  if (status === 'ready') {
    const qr = await QRCode.toDataURL(`medconnect:order:${params.id}`)
    extras.qr_code = qr
  }

  try {
    const order = await updateOrderStatus(params.id, status, extras)
    return NextResponse.json(order)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
