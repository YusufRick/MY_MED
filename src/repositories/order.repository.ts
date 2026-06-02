import { createAdminClient } from '@/lib/supabase'
import type { Order, OrderItem, FulfilmentType } from '@/types'

const db = () => createAdminClient()

export async function createOrder(
  patientId: string,
  pharmacyId: string,
  fulfilmentType: FulfilmentType,
  items: Array<{ medication_id: string; quantity: number; unit_price_myr: number }>,
  options: {
    prescriptionId?: string
    lockerSlotId?: string
    deliveryAddress?: string
    notes?: string
  }
): Promise<Order> {
  const total = items.reduce((sum, i) => sum + i.unit_price_myr * i.quantity, 0)

  const { data: order, error } = await db()
    .from('orders')
    .insert({
      patient_id: patientId,
      pharmacy_id: pharmacyId,
      fulfilment_type: fulfilmentType,
      prescription_id: options.prescriptionId,
      locker_slot_id: options.lockerSlotId,
      delivery_address: options.deliveryAddress,
      notes: options.notes,
      total_myr: total,
      status: 'pending',
    })
    .select()
    .single()
  if (error) throw error

  const { error: itemsError } = await db()
    .from('order_items')
    .insert(items.map(i => ({ ...i, order_id: order.id })))
  if (itemsError) throw itemsError

  return order
}

export async function getOrdersByPatient(patientId: string) {
  const { data, error } = await db()
    .from('orders')
    .select('*, items:order_items(*, medication:medications(*)), pharmacy:pharmacies(*), locker_slot:locker_slots(*)')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getOrdersByPharmacy(pharmacyId: string) {
  const { data, error } = await db()
    .from('orders')
    .select('*, items:order_items(*, medication:medications(*)), patient:profiles!patient_id(*), locker_slot:locker_slots(*)')
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateOrderStatus(
  id: string,
  status: Order['status'],
  extras?: { grab_booking_ref?: string; qr_code?: string }
) {
  const { data, error } = await db()
    .from('orders')
    .update({ status, ...extras, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function checkRxAccess(
  patientId: string,
  medicationId: string
): Promise<boolean> {
  const { data } = await db()
    .from('patient_medication_access')
    .select('refills_remaining')
    .eq('patient_id', patientId)
    .eq('medication_id', medicationId)
    .single()
  return (data?.refills_remaining ?? 0) > 0
}
