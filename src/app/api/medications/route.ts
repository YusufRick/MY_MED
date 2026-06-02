import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const search = new URL(req.url).searchParams.get('q') ?? ''
  const db = createAdminClient()

  let query = db.from('medications').select('*').order('name')
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query.limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
