import { NextRequest, NextResponse } from 'next/server'
import { createOrder, checkRxAccess } from '@/repositories/order.repository'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const db = createAdminClient()
  let query = db.from('orders').select('*, items:order_items(*, medication:medications(*)), pharmacy:pharmacies(*)')

  if (session.user.role === 'patient') {
    query = query.eq('patient_id', session.user.id)
  } else if (session.user.role === 'pharmacy') {
    // Get pharmacy owned by this user
    const { data: pharmacy } = await db.from('pharmacies').select('id').eq('owner_id', session.user.id).single()
    if (pharmacy) query = query.eq('pharmacy_id', pharmacy.id)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'patient') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
  }

  const body = await req.json()
  const { pharmacy_id, items, fulfilment_type, locker_slot_id, delivery_address, prescription_id, notes } = body

  // Check Rx access for each prescription-only medication
  const db = createAdminClient()
  for (const item of items) {
    const { data: med } = await db.from('medications').select('access_type').eq('id', item.medication_id).single()
    if (med?.access_type === 'prescription_only') {
      const hasAccess = await checkRxAccess(session.user.id, item.medication_id)
      if (!hasAccess) {
        return NextResponse.json(
          { error: `You do not have a valid prescription for this medication.` },
          { status: 403 }
        )
      }
    }
  }

  try {
    const order = await createOrder(
      session.user.id,
      pharmacy_id,
      fulfilment_type,
      items,
      { prescriptionId: prescription_id, lockerSlotId: locker_slot_id, deliveryAddress: delivery_address, notes }
    )
    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
