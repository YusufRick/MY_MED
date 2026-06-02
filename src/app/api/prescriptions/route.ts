import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  createPrescription,
  getPrescriptionsByPatient,
  getPrescriptionsByDoctor,
  getPendingPrescriptions,
} from '@/repositories/prescription.repository'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const role = session.user.role
  try {
    if (role === 'patient')      return NextResponse.json(await getPrescriptionsByPatient(session.user.id))
    if (role === 'doctor')       return NextResponse.json(await getPrescriptionsByDoctor(session.user.id))
    if (role === 'clinic_staff') return NextResponse.json(await getPendingPrescriptions())
    return NextResponse.json([])
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'doctor')
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })

  const { patient_id, notes, items } = await req.json()
  try {
    const rx = await createPrescription(patient_id, session.user.id, notes, items)
    return NextResponse.json(rx, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
