'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { PrescriptionStatusBadge } from '@/components/ui/StatCard'
import type { Prescription } from '@/types'

export default function DoctorPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/api/prescriptions')
      .then(r => r.json())
      .then(d => { setPrescriptions(d); setLoading(false) })
  }, [])

  const filtered = filter === 'all' ? prescriptions : prescriptions.filter(p => p.status === filter)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-pine-900 text-2xl font-bold">Prescriptions</h1>
          <p className="text-pine-400 text-sm mt-1">{prescriptions.length} total</p>
        </div>
        <Link href="/doctor/prescriptions/new" className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          New
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 bg-pine-100 p-1 rounded-xl w-fit">
        {['all', 'pending', 'approved', 'rejected', 'fulfilled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all duration-150 ${
              filter === f ? 'bg-white text-pine-800 shadow-sm' : 'text-pine-500 hover:text-pine-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-pine-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse flex gap-4">
                <div className="w-10 h-10 rounded-full bg-pine-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-pine-100 rounded w-36" />
                  <div className="h-3 bg-pine-50 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-pine-300 text-sm">No prescriptions found.</div>
        ) : (
          <div className="divide-y divide-pine-50">
            {filtered.map(rx => (
              <div key={rx.id} className="px-5 py-4 flex items-center gap-4 hover:bg-pine-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-pine-100 flex items-center justify-center shrink-0">
                  <span className="text-pine-600 font-bold text-sm">
                    {(rx.patient as any)?.full_name?.[0] ?? 'P'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-pine-800 font-medium text-sm truncate">
                    {(rx.patient as any)?.full_name ?? 'Patient'}
                  </p>
                  <p className="text-pine-400 text-xs mt-0.5">
                    {rx.items?.map((i: any) => i.medication?.name).filter(Boolean).join(', ') || 'No items'}
                  </p>
                  <p className="text-pine-300 text-xs mt-0.5">{formatDate(rx.created_at)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <PrescriptionStatusBadge status={rx.status} />
                  <span className="text-pine-300 text-xs">
                    {rx.items?.length ?? 0} med{rx.items?.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
