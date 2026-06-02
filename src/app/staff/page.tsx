'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { StatCard } from '@/components/ui/StatCard'
import type { Prescription } from '@/types'

export default function StaffDashboard() {
  const [pending, setPending] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/prescriptions')
      .then(r => r.json())
      .then(d => { setPending(d); setLoading(false) })
  }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-pine-900 text-2xl font-bold">Clinic staff dashboard</h1>
        <p className="text-pine-400 text-sm mt-1">Review and approve pending prescriptions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Pending approvals" value={loading ? '—' : pending.length} icon={<ClockIcon />} accent="amber" />
        <StatCard label="Action needed" value={loading ? '—' : pending.length > 0 ? 'Yes' : 'None'} icon={<BellIcon />} accent={pending.length > 0 ? 'red' : 'green'} />
      </div>

      <div className="card p-5 flex flex-col items-center gap-4 text-center py-10">
        <div className="w-14 h-14 rounded-2xl bg-pine-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-pine-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div>
          <p className="text-pine-800 font-semibold">
            {pending.length > 0 ? `${pending.length} prescription${pending.length > 1 ? 's' : ''} awaiting your review` : 'All caught up!'}
          </p>
          <p className="text-pine-400 text-sm mt-1">
            {pending.length > 0 ? 'Go to approvals to review and action them.' : 'No pending prescriptions right now.'}
          </p>
        </div>
        <Link href="/staff/approvals" className="btn-primary">Go to approvals</Link>
      </div>
    </div>
  )
}

function ClockIcon() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M12 7v5l3 3"/></svg> }
function BellIcon() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg> }
