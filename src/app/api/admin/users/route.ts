import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

function requireAdmin(role: string | null | undefined) {
  return role === 'admin'
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !requireAdmin(session.user.role))
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'pending' // 'pending' | 'all'

  const db = createAdminClient()
  let query = db
    .from('profiles')
    .select('*')
    .neq('role', 'admin') // never show admins in this list
    .order('created_at', { ascending: false })

  if (filter === 'pending') {
    query = query.is('role', null)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !requireAdmin(session.user.role))
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })

  const { user_id, role } = await req.json()

  const validRoles = ['doctor', 'clinic_staff', 'pharmacy', 'patient']
  if (!validRoles.includes(role))
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', user_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !requireAdmin(session.user.role))
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })

  const { user_id } = await req.json()

  const db = createAdminClient()
  // Delete from auth (cascades to profiles via FK)
  const { error } = await db.auth.admin.deleteUser(user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
