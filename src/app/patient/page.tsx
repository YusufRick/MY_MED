'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { StatCard, OrderStatusBadge } from '@/components/ui/StatCard'
import { formatDate, formatMYR } from '@/lib/utils'
import type { Order, PatientMedicationAccess } from '@/types'

interface AccessWithDetails extends PatientMedicationAccess {
  medication: any
  prescribed_by_profile: { id: string; full_name: string; role: string } | null
  prescription: { id: string; notes: string | null; created_at: string; items: { dosage: string; quantity: number; refills: number }[] } | null
}

export default function PatientDashboard() {
  const { data: session } = useSession()
  const [orders, setOrders]   = useState<Order[]>([])
  const [access, setAccess]   = useState<AccessWithDetails[]>([])
  const [patient, setPatient] = useState<{ full_name: string; phone?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedRx, setExpandedRx] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/medications/my-access').then(r => r.json()),
    ]).then(([ord, acc]) => {
      setOrders(Array.isArray(ord) ? ord : [])
      setAccess(Array.isArray(acc?.access) ? acc.access : [])
      setPatient(acc?.patient ?? null)
      setLoading(false)
    })
  }, [])

  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status))
  const activeRx     = access.filter(a => a.refills_remaining > 0)
  const exhaustedRx  = access.filter(a => a.refills_remaining === 0)
  const lowRx        = access.filter(a => a.refills_remaining === 1)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">

      {/* Greeting */}
      <div>
        <h1 className="font-display text-pine-900 text-2xl font-bold">
          Hello, {session?.user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-pine-400 text-sm mt-1">Your health, your way</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Active orders"  value={loading ? '—' : activeOrders.length} icon={<BagIcon />}  accent="green" />
        <StatCard label="Active Rx meds" value={loading ? '—' : activeRx.length}     icon={<PillIcon />} accent="green" />
        <StatCard label="Total orders"   value={loading ? '—' : orders.length}        icon={<ListIcon />} accent="gray" />
      </div>

      {/* ── Prescribed medications ────────────────────────── */}
      {!loading && access.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-pine-900 text-lg font-bold">My prescriptions</h2>
              <span className="badge badge-green text-xs">{access.length} medication{access.length !== 1 ? 's' : ''}</span>
            </div>
            <Link href="/patient/medications" className="text-pine-400 text-sm hover:text-pine-600">View all</Link>
          </div>

          {/* Low refill warning */}
          {lowRx.length > 0 && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <WarnIcon className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-amber-700 text-sm">
                <span className="font-semibold">{lowRx.map(a => a.medication?.name).join(', ')}</span>
                {lowRx.length === 1 ? ' has' : ' have'} only 1 refill remaining. Order soon or ask your doctor to renew.
              </p>
            </div>
          )}

          {/* Exhausted warning */}
          {exhaustedRx.length > 0 && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <XCircleIcon className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-600 text-sm">
                <span className="font-semibold">{exhaustedRx.map(a => a.medication?.name).join(', ')}</span>
                {exhaustedRx.length === 1 ? ' has' : ' have'} no refills left. See your doctor to get a new prescription.
              </p>
            </div>
          )}

          {/* Rx cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {access.map(a => {
              const med       = a.medication
              const doctor    = a.prescribed_by_profile
              const rx        = a.prescription
              const canOrder  = a.refills_remaining > 0
              const isLow     = a.refills_remaining === 1
              const isOpen    = expandedRx === a.id
              const dosage    = rx?.items?.[0]?.dosage ?? '—'
              const quantity  = rx?.items?.[0]?.quantity ?? '—'
              const rxShortId = a.id.slice(0, 8).toUpperCase()

              return (
                <div key={a.id} className={`card overflow-hidden flex flex-col ${!canOrder ? 'opacity-80' : ''}`}>

                  {/* Card header */}
                  <div className="px-5 py-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        !canOrder ? 'bg-red-100' : isLow ? 'bg-amber-100' : 'bg-pine-100'
                      }`}>
                        <PillIcon2 className={`w-4 h-4 ${!canOrder ? 'text-red-400' : isLow ? 'text-amber-500' : 'text-pine-500'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-pine-900 font-semibold text-sm">{med?.name}</p>
                        <p className="text-pine-400 text-xs mt-0.5">{med?.generic_name} · {med?.strength}</p>
                      </div>
                    </div>
                    <span className={`badge shrink-0 text-xs ${!canOrder ? 'badge-red' : isLow ? 'badge-amber' : 'badge-green'}`}>
                      {a.refills_remaining} refill{a.refills_remaining !== 1 ? 's' : ''} left
                    </span>
                  </div>

                  {/* Quick detail row */}
                  <div className="px-5 pb-4 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-pine-50 rounded-lg py-2">
                      <p className="text-pine-400 text-[10px] uppercase tracking-wide">Form</p>
                      <p className="text-pine-700 text-xs font-semibold mt-0.5 capitalize">{med?.dosage_form ?? '—'}</p>
                    </div>
                    <div className="bg-pine-50 rounded-lg py-2">
                      <p className="text-pine-400 text-[10px] uppercase tracking-wide">Dosage</p>
                      <p className="text-pine-700 text-xs font-semibold mt-0.5 truncate px-1">{dosage}</p>
                    </div>
                    <div className="bg-pine-50 rounded-lg py-2">
                      <p className="text-pine-400 text-[10px] uppercase tracking-wide">Qty</p>
                      <p className="text-pine-700 text-xs font-semibold mt-0.5">{quantity}</p>
                    </div>
                  </div>

                  {/* Expand/collapse prescription slip toggle */}
                  <button
                    onClick={() => setExpandedRx(isOpen ? null : a.id)}
                    className="mx-5 mb-3 flex items-center justify-center gap-1.5 text-pine-500 text-xs font-medium border border-pine-200 rounded-xl py-2 hover:bg-pine-50 transition-colors"
                  >
                    <DocIcon className="w-3.5 h-3.5" />
                    {isOpen ? 'Hide prescription slip' : 'Show prescription slip'}
                    <svg className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                  </button>

                  {/* ── Digital prescription slip ─────────── */}
                  {isOpen && (
                    <div className="mx-5 mb-4 border-2 border-dashed border-pine-200 rounded-2xl overflow-hidden animate-fade-in">

                      {/* Slip header */}
                      <div className="bg-pine-600 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                          <span className="text-white font-semibold text-xs">MedConnect MY — Digital Prescription</span>
                        </div>
                        <span className="text-pine-200 text-[10px] font-mono">#{rxShortId}</span>
                      </div>

                      {/* Slip body */}
                      <div className="bg-white px-4 py-3 space-y-3">

                        {/* Patient row */}
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-pine-400 text-[10px] uppercase tracking-wide font-medium">Patient</p>
                            <p className="text-pine-900 text-sm font-semibold mt-0.5">{patient?.full_name ?? session?.user?.name}</p>
                            {patient?.phone && <p className="text-pine-400 text-xs">{patient.phone}</p>}
                          </div>
                          <div className="text-right">
                            <p className="text-pine-400 text-[10px] uppercase tracking-wide font-medium">Date issued</p>
                            <p className="text-pine-700 text-xs font-semibold mt-0.5">{formatDate(a.created_at)}</p>
                          </div>
                        </div>

                        <div className="border-t border-pine-100" />

                        {/* Medication row */}
                        <div>
                          <p className="text-pine-400 text-[10px] uppercase tracking-wide font-medium mb-1.5">Prescribed medication</p>
                          <div className="bg-pine-50 rounded-xl px-3 py-2.5 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-pine-900 font-semibold text-sm">{med?.name}</p>
                              <span className="badge badge-amber text-[10px]">Rx only</span>
                            </div>
                            <p className="text-pine-500 text-xs">{med?.generic_name} · {med?.strength} · {med?.dosage_form}</p>
                            <p className="text-pine-600 text-xs font-medium">{dosage}</p>
                            <div className="flex items-center gap-3 pt-0.5">
                              <span className="text-pine-400 text-xs">Qty: <span className="font-semibold text-pine-700">{quantity}</span></span>
                              <span className="text-pine-400 text-xs">Refills remaining: <span className={`font-semibold ${canOrder ? 'text-pine-600' : 'text-red-500'}`}>{a.refills_remaining}</span></span>
                            </div>
                          </div>
                        </div>

                        {rx?.notes && (
                          <div>
                            <p className="text-pine-400 text-[10px] uppercase tracking-wide font-medium mb-1">Doctor's notes</p>
                            <p className="text-pine-600 text-xs bg-pine-50 rounded-xl px-3 py-2">{rx.notes}</p>
                          </div>
                        )}

                        <div className="border-t border-pine-100" />

                        {/* Doctor row */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-pine-400 text-[10px] uppercase tracking-wide font-medium">Prescribed by</p>
                            <p className="text-pine-800 text-xs font-semibold mt-0.5">
                              {doctor ? `Dr. ${doctor.full_name}` : 'Verified doctor'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-pine-400 text-[10px] uppercase tracking-wide font-medium">Ref</p>
                            <p className="text-pine-500 text-xs font-mono mt-0.5">#{rxShortId}</p>
                          </div>
                        </div>

                        {/* Verified stamp */}
                        <div className="flex items-center gap-1.5 bg-pine-50 rounded-xl px-3 py-2">
                          <svg className="w-3.5 h-3.5 text-pine-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                          <p className="text-pine-600 text-[10px]">Verified by MedConnect MY · Issued through licensed clinical system</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action */}
                  <div className="px-5 pb-4 mt-auto">
                    {canOrder ? (
                      <Link href={`/patient/orders/new?med=${med?.id}`} className="btn-primary text-xs py-2 text-center block">
                        Order now →
                      </Link>
                    ) : (
                      <div className="bg-red-50 rounded-xl px-3 py-2 text-center">
                        <p className="text-red-500 text-xs font-medium">Refills exhausted — see your doctor</p>
                      </div>
                    )}
                  </div>

                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty prescription state */}
      {!loading && access.length === 0 && (
        <div className="card p-6 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-pine-100 flex items-center justify-center">
            <PillIcon2 className="w-6 h-6 text-pine-400" />
          </div>
          <div>
            <p className="text-pine-700 font-semibold text-sm">No prescription medications</p>
            <p className="text-pine-400 text-xs mt-1">A doctor needs to prescribe medications before they appear here.</p>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/patient/pharmacies" className="card p-5 flex items-center gap-4 hover:border-pine-200 hover:shadow-md transition-all duration-200 group">
          <div className="w-12 h-12 rounded-2xl bg-pine-100 text-pine-600 flex items-center justify-center shrink-0 group-hover:bg-pine-600 group-hover:text-white transition-colors duration-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <div>
            <p className="text-pine-800 font-semibold">Find pharmacy</p>
            <p className="text-pine-400 text-sm">GPS map + price comparison</p>
          </div>
        </Link>
        <Link href="/patient/orders/new" className="card p-5 flex items-center gap-4 hover:border-pine-200 hover:shadow-md transition-all duration-200 group">
          <div className="w-12 h-12 rounded-2xl bg-pine-100 text-pine-600 flex items-center justify-center shrink-0 group-hover:bg-pine-600 group-hover:text-white transition-colors duration-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4"/></svg>
          </div>
          <div>
            <p className="text-pine-800 font-semibold">New order</p>
            <p className="text-pine-400 text-sm">Order meds for pickup or delivery</p>
          </div>
        </Link>
      </div>

      {/* Recent orders */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-pine-100 flex items-center justify-between">
          <h2 className="text-pine-800 font-semibold">Recent orders</h2>
          <Link href="/patient/orders" className="text-pine-400 text-sm hover:text-pine-600">View all</Link>
        </div>
        {loading ? (
          <div className="divide-y divide-pine-50">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-pine-100 rounded w-40" />
                  <div className="h-3 bg-pine-50 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-10 text-center text-pine-300 text-sm">No orders yet.</div>
        ) : (
          <div className="divide-y divide-pine-50">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="px-5 py-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-pine-800 text-sm font-medium truncate">{order.pharmacy?.name ?? 'Pharmacy'}</p>
                  <p className="text-pine-400 text-xs mt-0.5 capitalize">{order.fulfilment_type} · {formatDate(order.created_at)}</p>
                </div>
                <div className="text-right shrink-0">
                  <OrderStatusBadge status={order.status} />
                  {order.total_myr && <p className="text-pine-600 text-xs font-semibold mt-1">{formatMYR(order.total_myr)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────
function BagIcon()  { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg> }
function PillIcon() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg> }
function ListIcon() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg> }
function WarnIcon({ className }: { className: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg> }
function XCircleIcon({ className }: { className: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> }
function PillIcon2({ className }: { className: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg> }
function DocIcon({ className }: { className: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> }
