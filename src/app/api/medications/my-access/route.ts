import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('patient_medication_access')
    .select(`
      *,
      medication:medications(*),
      prescribed_by_profile:profiles!prescribed_by(id, full_name, role),
      prescription:prescriptions(
        id,
        notes,
        created_at,
        items:prescription_items(dosage, quantity, refills)
      )
    `)
    .eq('patient_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Also fetch patient's own profile for the digital prescription slip
  const { data: patient } = await db
    .from('profiles')
    .select('id, full_name, phone')
    .eq('id', session.user.id)
    .single()

  return NextResponse.json({ access: data, patient })
}
