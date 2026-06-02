import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['doctor', 'clinic_staff'].includes(session.user.role ?? ''))
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })

  const search = new URL(req.url).searchParams.get('q') ?? ''
  const db = createAdminClient()
  let query = db.from('profiles').select('id, full_name, email, phone').eq('role', 'patient')
  if (search) query = query.ilike('full_name', `%${search}%`)

  const { data, error } = await query.limit(20)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
