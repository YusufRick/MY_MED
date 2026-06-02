import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

// Pharmacy creates/manages their own locker slots
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'pharmacy')
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })

  const { pharmacy_id, slots } = await req.json()
  // slots: Array<{ slot_date: string, slot_time: string }>
  const db = createAdminClient()

  const rows = slots.map((s: { slot_date: string; slot_time: string }) => ({
    pharmacy_id,
    slot_date: s.slot_date,
    slot_time: s.slot_time,
    is_available: true,
  }))

  const { data, error } = await db
    .from('locker_slots')
    .upsert(rows, { onConflict: 'pharmacy_id,slot_date,slot_time' })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'pharmacy')
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })

  const db = createAdminClient()
  const { data: pharmacy } = await db
    .from('pharmacies')
    .select('id')
    .eq('owner_id', session.user.id)
    .single()

  if (!pharmacy) return NextResponse.json([])

  const date = new URL(req.url).searchParams.get('date') ?? new Date().toISOString().split('T')[0]
  const { data, error } = await db
    .from('locker_slots')
    .select('*, booked_patient:profiles!booked_by(full_name)')
    .eq('pharmacy_id', pharmacy.id)
    .eq('slot_date', date)
    .order('slot_time')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
