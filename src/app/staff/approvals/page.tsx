'use client'
import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils'
import type { Prescription } from '@/types'

export default function ApprovalsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { loadPrescriptions() }, [])

  async function loadPrescriptions() {
    setLoading(true)
    const res = await fetch('/api/prescriptions')
    const data = await res.json()
    setPrescriptions(data)
    setLoading(false)
  }

  async function handleAction(id: string, status: 'approved' | 'rejected') {
    setActionLoading(id)
    await fetch(`/api/prescriptions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setActionLoading(null)
    loadPrescriptions()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-pine-900 text-2xl font-bold">Prescription approvals</h1>
        <p className="text-pine-400 text-sm mt-1">
          {loading ? 'Loading...' : `${prescriptions.length} pending`}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-pine-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-pine-100 rounded w-40" />
                  <div className="h-3 bg-pine-50 rounded w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="card py-20 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-pine-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-pine-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <p className="text-pine-800 font-semibold">All done!</p>
          <p className="text-pine-400 text-sm">No pending prescriptions to review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map(rx => (
            <div key={rx.id} className="card overflow-hidden">
              {/* Header row */}
              <button
                onClick={() => setExpanded(expanded === rx.id ? null : rx.id)}
                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-pine-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-amber-700 font-bold text-sm">
                    {(rx.patient as any)?.full_name?.[0] ?? 'P'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-pine-800 font-semibold text-sm">
                    {(rx.patient as any)?.full_name ?? 'Patient'}
                  </p>
                  <p className="text-pine-400 text-xs mt-0.5">
                    Dr. {(rx.doctor as any)?.full_name ?? 'Unknown'} · {formatDate(rx.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="badge badge-amber text-xs">Pending</span>
                  <svg
                    className={`w-4 h-4 text-pine-400 transition-transform duration-200 ${expanded === rx.id ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
              </button>

              {/* Expanded details */}
              {expanded === rx.id && (
                <div className="border-t border-pine-100 px-5 py-4 space-y-4 animate-fade-in">
                  {/* Medications list */}
                  <div>
                    <p className="text-pine-500 text-xs font-medium uppercase tracking-wide mb-2">Medications</p>
                    <div className="space-y-2">
                      {(rx.items ?? []).map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between bg-pine-50 rounded-xl px-4 py-3">
                          <div>
                            <p className="text-pine-800 text-sm font-medium">{item.medication?.name}</p>
                            <p className="text-pine-400 text-xs mt-0.5">{item.dosage} · Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <span className={`badge text-[10px] ${item.medication?.access_type === 'prescription_only' ? 'badge-amber' : 'badge-green'}`}>
                              {item.medication?.access_type === 'prescription_only' ? 'Rx only' : 'OTC'}
                            </span>
                            <p className="text-pine-400 text-xs mt-1">{item.refills} refill{item.refills !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {rx.notes && (
                    <div>
                      <p className="text-pine-500 text-xs font-medium uppercase tracking-wide mb-1">Doctor notes</p>
                      <p className="text-pine-700 text-sm bg-pine-50 rounded-xl px-4 py-3">{rx.notes}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => handleAction(rx.id, 'rejected')}
                      disabled={actionLoading === rx.id}
                      className="flex-1 py-2.5 rounded-xl border-2 border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === rx.id ? '...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleAction(rx.id, 'approved')}
                      disabled={actionLoading === rx.id}
                      className="flex-1 py-2.5 rounded-xl bg-pine-600 text-white text-sm font-medium hover:bg-pine-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === rx.id ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
