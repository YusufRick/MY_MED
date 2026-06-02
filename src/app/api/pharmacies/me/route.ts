import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'pharmacy')
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('pharmacies')
    .select('*')
    .eq('owner_id', session.user.id)
    .single()

  if (error) return NextResponse.json(null)
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'pharmacy')
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })

  const body = await req.json()
  const db = createAdminClient()
  const { data, error } = await db
    .from('pharmacies')
    .insert({ ...body, owner_id: session.user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'pharmacy')
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })

  const body = await req.json()
  const db = createAdminClient()
  const { data, error } = await db
    .from('pharmacies')
    .update(body)
    .eq('owner_id', session.user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
