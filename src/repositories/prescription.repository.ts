import { createAdminClient } from '@/lib/supabase'
import type { Prescription, PrescriptionItem } from '@/types'

const db = () => createAdminClient()

export async function createPrescription(
  patientId: string,
  doctorId: string,
  notes: string,
  items: Omit<PrescriptionItem, 'id' | 'prescription_id'>[]
): Promise<Prescription> {
  const { data: prescription, error } = await db()
    .from('prescriptions')
    .insert({ patient_id: patientId, doctor_id: doctorId, notes, status: 'pending' })
    .select()
    .single()
  if (error) throw error

  const { error: itemsError } = await db()
    .from('prescription_items')
    .insert(items.map(i => ({ ...i, prescription_id: prescription.id })))
  if (itemsError) throw itemsError

  return prescription
}

export async function getPrescriptionsByPatient(patientId: string) {
  const { data, error } = await db()
    .from('prescriptions')
    .select('*, items:prescription_items(*, medication:medications(*)), doctor:profiles!doctor_id(*)')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getPrescriptionsByDoctor(doctorId: string) {
  const { data, error } = await db()
    .from('prescriptions')
    .select('*, items:prescription_items(*, medication:medications(*)), patient:profiles!patient_id(*)')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getPendingPrescriptions() {
  const { data, error } = await db()
    .from('prescriptions')
    .select('*, items:prescription_items(*, medication:medications(*)), patient:profiles!patient_id(*), doctor:profiles!doctor_id(*)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function updatePrescriptionStatus(
  id: string,
  status: 'approved' | 'rejected',
  approvedBy: string
) {
  const { data, error } = await db()
    .from('prescriptions')
    .update({ status, approved_by: approvedBy, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
