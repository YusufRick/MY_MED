// ─── Enums ────────────────────────────────────────────────────
export type UserRole = 'doctor' | 'clinic_staff' | 'pharmacy' | 'patient' | 'admin'

export type UserStatus = 'pending' | 'approved'
export type MedicationAccess = 'otc' | 'prescription_only'
export type PrescriptionStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled'
export type FulfilmentType = 'locker' | 'delivery'
export type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'dispatched' | 'completed' | 'cancelled'

// ─── Models ───────────────────────────────────────────────────
export interface Profile {
  id: string
  role: UserRole | null   // null = pending admin approval
  full_name: string
  phone?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Medication {
  id: string
  name: string
  generic_name?: string
  description?: string
  dosage_form?: string
  strength?: string
  access_type: MedicationAccess
  openfda_id?: string
  created_at: string
}

export interface PatientMedicationAccess {
  id: string
  patient_id: string
  medication_id: string
  prescribed_by: string
  refills_remaining: number
  created_at: string
  updated_at: string
  medication?: Medication
}

export interface Pharmacy {
  id: string
  owner_id: string
  name: string
  address: string
  lat: number
  lng: number
  phone?: string
  email?: string
  is_active: boolean
  has_locker: boolean
  created_at: string
  distance_km?: number             // computed client-side
}

export interface PharmacyMedicationPrice {
  id: string
  pharmacy_id: string
  medication_id: string
  price_myr: number
  in_stock: boolean
  updated_at: string
  medication?: Medication
}

export interface LockerSlot {
  id: string
  pharmacy_id: string
  slot_date: string
  slot_time: string
  is_available: boolean
  booked_by?: string
  booked_at?: string
}

export interface Prescription {
  id: string
  patient_id: string
  doctor_id: string
  approved_by?: string
  status: PrescriptionStatus
  notes?: string
  created_at: string
  updated_at: string
  items?: PrescriptionItem[]
  patient?: Profile
  doctor?: Profile
}

export interface PrescriptionItem {
  id: string
  prescription_id: string
  medication_id: string
  dosage: string
  quantity: number
  refills: number
  medication?: Medication
}

export interface Order {
  id: string
  patient_id: string
  pharmacy_id: string
  prescription_id?: string
  fulfilment_type: FulfilmentType
  locker_slot_id?: string
  grab_booking_ref?: string
  delivery_address?: string
  status: OrderStatus
  qr_code?: string
  total_myr?: number
  notes?: string
  created_at: string
  updated_at: string
  items?: OrderItem[]
  pharmacy?: Pharmacy
  locker_slot?: LockerSlot
}

export interface OrderItem {
  id: string
  order_id: string
  medication_id: string
  quantity: number
  unit_price_myr: number
  medication?: Medication
}
