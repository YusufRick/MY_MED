import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createGrabDelivery } from '@/lib/grab'
import { updateOrderStatus } from '@/repositories/order.repository'
import { createAdminClient } from '@/lib/supabase'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'pharmacy')
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })

  const db = createAdminClient()
  const { data: order, error } = await db
    .from('orders')
    .select('*, pharmacy:pharmacies(*), patient:profiles!patient_id(*), items:order_items(*, medication:medications(*))')
    .eq('id', params.id)
    .single()

  if (error || !order)
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  if (order.fulfilment_type !== 'delivery')
    return NextResponse.json({ error: 'This order is for locker pickup' }, { status: 400 })

  try {
    const grabResponse = await createGrabDelivery({
      merchantOrderID: order.id,
      serviceType: 'INSTANT',
      sender: {
        name: order.pharmacy.name,
        phone: order.pharmacy.phone ?? '',
        address: {
          address: order.pharmacy.address,
          coordinates: { lat: order.pharmacy.lat, lng: order.pharmacy.lng },
        },
      },
      recipient: {
        name: order.patient.full_name,
        phone: order.patient.phone ?? '',
        address: {
          address: order.delivery_address ?? '',
          coordinates: { lat: 0, lng: 0 },
        },
      },
      packages: order.items.map((i: any) => ({
        name: i.medication.name,
        quantity: i.quantity,
        dimensions: { height: 10, width: 10, depth: 5, weight: 0.2 },
      })),
    })

    const updated = await updateOrderStatus(order.id, 'dispatched', {
      grab_booking_ref: grabResponse.deliveryID,
    })

    return NextResponse.json({ order: updated, grab: grabResponse })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
