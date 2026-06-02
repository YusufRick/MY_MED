'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Medication } from '@/types'

interface Patient { id: string; full_name: string; email: string }
interface RxItem { medication_id: string; medication_name: string; dosage: string; quantity: number; refills: number }

export default function NewPrescriptionPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [patientSearch, setPatientSearch] = useState('')
  const [medSearch, setMedSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [items, setItems] = useState<RxItem[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPatientList, setShowPatientList] = useState(false)
  const [showMedList, setShowMedList] = useState(false)

  useEffect(() => {
    if (patientSearch.length < 2) { setPatients([]); return }
    const t = setTimeout(() => {
      fetch(`/api/patients?q=${patientSearch}`)
        .then(r => r.json()).then(setPatients)
    }, 300)
    return () => clearTimeout(t)
  }, [patientSearch])

  useEffect(() => {
    fetch(`/api/medications?q=${medSearch}`)
      .then(r => r.json()).then(setMedications)
  }, [medSearch])

  function addMedication(med: Medication) {
    if (items.find(i => i.medication_id === med.id)) return
    setItems(prev => [...prev, {
      medication_id: med.id,
      medication_name: med.name,
      dosage: '',
      quantity: 1,
      refills: 0,
    }])
    setShowMedList(false)
    setMedSearch('')
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.medication_id !== id))
  }

  function updateItem(id: string, field: keyof RxItem, value: string | number) {
    setItems(prev => prev.map(i => i.medication_id === id ? { ...i, [field]: value } : i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPatient) { setError('Please select a patient.'); return }
    if (items.length === 0) { setError('Add at least one medication.'); return }
    if (items.some(i => !i.dosage)) { setError('Fill in dosage for all medications.'); return }

    setLoading(true); setError('')
    const res = await fetch('/api/prescriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: selectedPatient.id,
        notes,
        items: items.map(i => ({
          medication_id: i.medication_id,
          dosage: i.dosage,
          quantity: i.quantity,
          refills: i.refills,
        })),
      }),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/doctor/prescriptions')
    } else {
      const d = await res.json()
      setError(d.error ?? 'Failed to create prescription.')
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-pine-400 text-sm hover:text-pine-600 flex items-center gap-1 mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <h1 className="font-display text-pine-900 text-2xl font-bold">New prescription</h1>
        <p className="text-pine-400 text-sm mt-1">Issue a prescription for a patient</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl animate-fade-in">
            {error}
          </div>
        )}

        {/* Patient selector */}
        <div className="card p-5 space-y-3">
          <h2 className="text-pine-800 font-semibold text-sm">Patient</h2>
          {selectedPatient ? (
            <div className="flex items-center justify-between bg-pine-50 rounded-xl px-4 py-3">
              <div>
                <p className="text-pine-800 font-medium text-sm">{selectedPatient.full_name}</p>
                <p className="text-pine-400 text-xs">{selectedPatient.email}</p>
              </div>
              <button type="button" onClick={() => setSelectedPatient(null)} className="text-pine-300 hover:text-pine-500 text-sm">Change</button>
            </div>
          ) : (
            <div className="relative">
              <input
                className="input"
                placeholder="Search patient by name..."
                value={patientSearch}
                onChange={e => { setPatientSearch(e.target.value); setShowPatientList(true) }}
                onFocus={() => setShowPatientList(true)}
              />
              {showPatientList && patients.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-pine-100 rounded-xl shadow-lg overflow-hidden">
                  {patients.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setSelectedPatient(p); setPatientSearch(''); setShowPatientList(false) }}
                      className="w-full text-left px-4 py-3 hover:bg-pine-50 transition-colors border-b border-pine-50 last:border-0"
                    >
                      <p className="text-pine-800 text-sm font-medium">{p.full_name}</p>
                      <p className="text-pine-400 text-xs">{p.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Medications */}
        <div className="card p-5 space-y-4">
          <h2 className="text-pine-800 font-semibold text-sm">Medications</h2>

          {items.length > 0 && (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.medication_id} className="bg-pine-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-pine-800 font-medium text-sm">{item.medication_name}</span>
                    <button type="button" onClick={() => removeItem(item.medication_id)} className="text-pine-300 hover:text-red-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="text-pine-500 text-xs mb-1 block">Dosage</label>
                      <input
                        className="input text-sm py-2"
                        placeholder="e.g. 1 tablet twice daily"
                        value={item.dosage}
                        onChange={e => updateItem(item.medication_id, 'dosage', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-pine-500 text-xs mb-1 block">Quantity</label>
                      <input
                        type="number" min={1} max={999}
                        className="input text-sm py-2"
                        value={item.quantity}
                        onChange={e => updateItem(item.medication_id, 'quantity', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-pine-500 text-xs mb-1 block">Refills allowed</label>
                      <input
                        type="number" min={0} max={12}
                        className="input text-sm py-2"
                        value={item.refills}
                        onChange={e => updateItem(item.medication_id, 'refills', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add medication */}
          <div className="relative">
            <input
              className="input"
              placeholder="Search and add medication..."
              value={medSearch}
              onChange={e => { setMedSearch(e.target.value); setShowMedList(true) }}
              onFocus={() => setShowMedList(true)}
            />
            {showMedList && medications.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-pine-100 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
                {medications.map(med => (
                  <button
                    key={med.id}
                    type="button"
                    onClick={() => addMedication(med)}
                    className="w-full text-left px-4 py-3 hover:bg-pine-50 transition-colors border-b border-pine-50 last:border-0 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-pine-800 text-sm font-medium">{med.name}</p>
                      <p className="text-pine-400 text-xs">{med.strength} · {med.dosage_form}</p>
                    </div>
                    <span className={`badge text-[10px] ${med.access_type === 'prescription_only' ? 'badge-amber' : 'badge-green'}`}>
                      {med.access_type === 'prescription_only' ? 'Rx' : 'OTC'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="card p-5 space-y-3">
          <h2 className="text-pine-800 font-semibold text-sm">Notes <span className="text-pine-300 font-normal">(optional)</span></h2>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Clinical notes, instructions for pharmacy..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="btn-outline flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Issuing...' : 'Issue prescription'}
          </button>
        </div>
      </form>
    </div>
  )
}
