import { createAdminClient } from '@/lib/supabase'
import { getDistanceKm } from '@/lib/utils'
import type { Pharmacy, PharmacyMedicationPrice, LockerSlot } from '@/types'

const db = () => createAdminClient()

export async function getPharmacies(): Promise<Pharmacy[]> {
  const { data, error } = await db()
    .from('pharmacies')
    .select('*')
    .eq('is_active', true)
  if (error) throw error
  return data
}

export async function getNearbyPharmacies(
  lat: number,
  lng: number,
  radiusKm = 10
): Promise<Pharmacy[]> {
  const all = await getPharmacies()
  return all
    .map(p => ({ ...p, distance_km: getDistanceKm(lat, lng, p.lat, p.lng) }))
    .filter(p => p.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km)
}

export async function getPharmacyById(id: string): Promise<Pharmacy | null> {
  const { data } = await db().from('pharmacies').select('*').eq('id', id).single()
  return data
}

export async function getPharmacyPrices(
  pharmacyId: string
): Promise<PharmacyMedicationPrice[]> {
  const { data, error } = await db()
    .from('pharmacy_medication_prices')
    .select('*, medication:medications(*)')
    .eq('pharmacy_id', pharmacyId)
    .eq('in_stock', true)
  if (error) throw error
  return data
}

export async function upsertPrice(
  pharmacyId: string,
  medicationId: string,
  priceMyr: number,
  inStock: boolean
) {
  const { data, error } = await db()
    .from('pharmacy_medication_prices')
    .upsert({ pharmacy_id: pharmacyId, medication_id: medicationId, price_myr: priceMyr, in_stock: inStock })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getLockerSlots(
  pharmacyId: string,
  date: string
): Promise<LockerSlot[]> {
  const { data, error } = await db()
    .from('locker_slots')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .eq('slot_date', date)
    .eq('is_available', true)
  if (error) throw error
  return data
}

export async function bookLockerSlot(
  slotId: string,
  patientId: string
): Promise<LockerSlot> {
  const { data, error } = await db()
    .from('locker_slots')
    .update({ is_available: false, booked_by: patientId, booked_at: new Date().toISOString() })
    .eq('id', slotId)
    .eq('is_available', true)
    .select()
    .single()
  if (error) throw error
  return data
}
