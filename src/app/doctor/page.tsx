'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { StatCard } from '@/components/ui/StatCard'
import { PrescriptionStatusBadge } from '@/components/ui/StatCard'
import { formatDate } from '@/lib/utils'
import type { Prescription } from '@/types'

export default function DoctorDashboard() {
  const { data: session } = useSession()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/prescriptions')
      .then(r => r.json())
      .then(d => { setPrescriptions(d); setLoading(false) })
  }, [])

  const stats = {
    total:    prescriptions.length,
    pending:  prescriptions.filter(p => p.status === 'pending').length,
    approved: prescriptions.filter(p => p.status === 'approved').length,
  }

  const recent = prescriptions.slice(0, 5)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-pine-900 text-2xl font-bold">
            Good {getGreeting()}, Dr. {session?.user?.name?.split(' ')[0]}
          </h1>
          <p className="text-pine-400 text-sm mt-1">Here's your prescription overview</p>
        </div>
        <Link href="/doctor/prescriptions/new" className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          New prescription
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total prescriptions" value={stats.total} icon={<DocIcon />} accent="green" />
        <StatCard label="Awaiting approval" value={stats.pending} icon={<ClockIcon />} accent="amber" />
        <StatCard label="Approved" value={stats.approved} icon={<CheckIcon />} accent="green" />
      </div>

      {/* Recent prescriptions */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-pine-100 flex items-center justify-between">
          <h2 className="text-pine-800 font-semibold">Recent prescriptions</h2>
          <Link href="/doctor/prescriptions" className="text-pine-500 text-sm hover:text-pine-700">View all</Link>
        </div>

        {loading ? (
          <div className="divide-y divide-pine-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-pine-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-pine-100 rounded w-40" />
                  <div className="h-3 bg-pine-50 rounded w-28" />
                </div>
                <div className="h-5 bg-pine-50 rounded-full w-20" />
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="px-5 py-12 text-center text-pine-300 text-sm">
            No prescriptions yet. Create your first one.
          </div>
        ) : (
          <div className="divide-y divide-pine-50">
            {recent.map(rx => (
              <div key={rx.id} className="px-5 py-4 flex items-center gap-4 hover:bg-pine-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-pine-100 flex items-center justify-center shrink-0">
                  <span className="text-pine-600 text-sm font-bold">
                    {(rx.patient as any)?.full_name?.[0] ?? 'P'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-pine-800 text-sm font-medium truncate">
                    {(rx.patient as any)?.full_name ?? 'Patient'}
                  </p>
                  <p className="text-pine-400 text-xs mt-0.5">
                    {rx.items?.length ?? 0} medication{rx.items?.length !== 1 ? 's' : ''} · {formatDate(rx.created_at)}
                  </p>
                </div>
                <PrescriptionStatusBadge status={rx.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function DocIcon() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> }
function ClockIcon() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M12 7v5l3 3"/></svg> }
function CheckIcon() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> }
