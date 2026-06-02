'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { PatientMedicationAccess, Medication } from '@/types'

export default function PatientMedicationsPage() {
  const [access, setAccess] = useState<PatientMedicationAccess[]>([])
  const [otcMeds, setOtcMeds] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'prescribed' | 'otc'>('prescribed')
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/medications/my-access').then(r => r.json()),
      fetch('/api/medications').then(r => r.json()),
    ]).then(([acc, meds]) => {
      setAccess(Array.isArray(acc) ? acc : [])
      setOtcMeds((Array.isArray(meds) ? meds : []).filter((m: Medication) => m.access_type === 'otc'))
      setLoading(false)
    })
  }, [])

  const filteredAccess = access.filter(a =>
    (a as any).medication?.name?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredOtc = otcMeds.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.generic_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-pine-900 text-2xl font-bold">My medications</h1>
        <p className="text-pine-400 text-sm mt-1">Your prescriptions and available OTC medications</p>
      </div>

      <input
        className="input"
        placeholder="Search medications..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="flex gap-2 bg-pine-100 p-1 rounded-xl w-fit">
        {(['prescribed', 'otc'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-1.5 rounded-lg text-sm font-medium capitalize transition-all duration-150 ${
              tab === t ? 'bg-white text-pine-800 shadow-sm' : 'text-pine-500 hover:text-pine-700'
            }`}
          >
            {t === 'prescribed' ? `Prescribed (${access.length})` : `OTC (${otcMeds.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse flex gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-pine-100 rounded w-36" />
                <div className="h-3 bg-pine-50 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'prescribed' ? (
        filteredAccess.length === 0 ? (
          <div className="card py-16 text-center">
            <p className="text-pine-300 text-sm">No prescription medications.</p>
            <p className="text-pine-300 text-xs mt-1">A doctor needs to prescribe medications to you first.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAccess.map(a => {
              const med = (a as any).medication
              const canOrder = a.refills_remaining > 0
              return (
                <div key={a.id} className="card p-5 flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${canOrder ? 'bg-pine-100' : 'bg-red-50'}`}>
                    <svg className={`w-5 h-5 ${canOrder ? 'text-pine-500' : 'text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-pine-800 font-semibold text-sm">{med?.name}</p>
                    <p className="text-pine-400 text-xs mt-0.5">{med?.generic_name} · {med?.strength} · {med?.dosage_form}</p>
                    {med?.description && <p className="text-pine-400 text-xs mt-1 leading-relaxed">{med.description}</p>}
                  </div>
                  <div className="text-right shrink-0 space-y-2">
                    <div>
                      <span className={`badge text-xs ${canOrder ? 'badge-green' : 'badge-red'}`}>
                        {a.refills_remaining} refill{a.refills_remaining !== 1 ? 's' : ''} left
                      </span>
                    </div>
                    {canOrder ? (
                      <Link href={`/patient/orders/new?med=${med?.id}`} className="text-pine-600 text-xs font-medium hover:underline block">
                        Order now →
                      </Link>
                    ) : (
                      <p className="text-red-400 text-xs">Refills exhausted</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        filteredOtc.length === 0 ? (
          <div className="card py-16 text-center text-pine-300 text-sm">No OTC medications found.</div>
        ) : (
          <div className="space-y-2">
            {filteredOtc.map(med => (
              <div key={med.id} className="card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-pine-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-pine-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-pine-800 font-medium text-sm">{med.name}</p>
                  <p className="text-pine-400 text-xs">{med.generic_name} · {med.strength}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="badge badge-green text-xs">OTC</span>
                  <Link href={`/patient/orders/new?med=${med.id}`} className="btn-outline text-xs py-1.5 px-3">
                    Order
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
