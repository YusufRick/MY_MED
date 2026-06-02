import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updatePrescriptionStatus } from '@/repositories/prescription.repository'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'clinic_staff')
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })

  const { status } = await req.json()
  if (!['approved', 'rejected'].includes(status))
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  try {
    const rx = await updatePrescriptionStatus(params.id, status, session.user.id)
    return NextResponse.json(rx)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
