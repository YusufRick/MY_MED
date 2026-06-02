'use client'
import { useEffect, useState } from 'react'
import { formatMYR } from '@/lib/utils'
import type { Medication, PharmacyMedicationPrice, Pharmacy } from '@/types'

export default function PharmacyPricesPage() {
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null)
  const [prices, setPrices] = useState<PharmacyMedicationPrice[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editingPrice, setEditingPrice] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/pharmacies/me')
      .then(r => r.json())
      .then(async ph => {
        setPharmacy(ph)
        if (ph?.id) {
          const [pricesRes, medsRes] = await Promise.all([
            fetch(`/api/pharmacies/${ph.id}/prices`).then(r => r.json()),
            fetch('/api/medications').then(r => r.json()),
          ])
          setPrices(pricesRes)
          setMedications(medsRes)
          // Pre-fill editing state
          const initial: Record<string, string> = {}
          pricesRes.forEach((p: PharmacyMedicationPrice) => {
            initial[p.medication_id] = p.price_myr.toString()
          })
          setEditingPrice(initial)
        }
        setLoading(false)
      })
  }, [])

  async function savePrice(medId: string, inStock: boolean) {
    if (!pharmacy) return
    const price = parseFloat(editingPrice[medId] ?? '0')
    if (isNaN(price) || price < 0) return

    setSaving(medId)
    await fetch(`/api/pharmacies/${pharmacy.id}/prices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medication_id: medId, price_myr: price, in_stock: inStock }),
    })
    const updated = await fetch(`/api/pharmacies/${pharmacy.id}/prices`).then(r => r.json())
    setPrices(updated)
    setSaving(null)
  }

  const getPriceRecord = (medId: string) => prices.find(p => p.medication_id === medId)

  const filtered = medications.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.generic_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-pine-900 text-2xl font-bold">Medication prices</h1>
        <p className="text-pine-400 text-sm mt-1">Set your prices per medication. Patients will see these on the map.</p>
      </div>

      <input
        className="input max-w-sm"
        placeholder="Search medications..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-pine-100 bg-pine-50 grid grid-cols-12 gap-4">
          <span className="col-span-5 text-pine-500 text-xs font-medium uppercase tracking-wide">Medication</span>
          <span className="col-span-2 text-pine-500 text-xs font-medium uppercase tracking-wide">Type</span>
          <span className="col-span-3 text-pine-500 text-xs font-medium uppercase tracking-wide">Price (RM)</span>
          <span className="col-span-2 text-pine-500 text-xs font-medium uppercase tracking-wide">In stock</span>
        </div>

        {loading ? (
          <div className="divide-y divide-pine-50">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse grid grid-cols-12 gap-4">
                <div className="col-span-5 space-y-1.5">
                  <div className="h-3.5 bg-pine-100 rounded w-32" />
                  <div className="h-3 bg-pine-50 rounded w-20" />
                </div>
                <div className="col-span-2"><div className="h-5 bg-pine-50 rounded-full w-12" /></div>
                <div className="col-span-3"><div className="h-8 bg-pine-50 rounded-lg" /></div>
                <div className="col-span-2"><div className="h-5 bg-pine-50 rounded-full w-10" /></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-pine-50">
            {filtered.map(med => {
              const priceRecord = getPriceRecord(med.id)
              const inStock = priceRecord?.in_stock ?? true

              return (
                <div key={med.id} className="px-5 py-3.5 grid grid-cols-12 gap-4 items-center hover:bg-pine-50 transition-colors">
                  <div className="col-span-5">
                    <p className="text-pine-800 text-sm font-medium">{med.name}</p>
                    <p className="text-pine-400 text-xs">{med.generic_name} · {med.strength}</p>
                  </div>
                  <div className="col-span-2">
                    <span className={`badge text-[10px] ${med.access_type === 'prescription_only' ? 'badge-amber' : 'badge-green'}`}>
                      {med.access_type === 'prescription_only' ? 'Rx' : 'OTC'}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <span className="text-pine-400 text-sm">RM</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input py-1.5 text-sm w-24"
                      placeholder="0.00"
                      value={editingPrice[med.id] ?? priceRecord?.price_myr ?? ''}
                      onChange={e => setEditingPrice(prev => ({ ...prev, [med.id]: e.target.value }))}
                      onBlur={() => savePrice(med.id, inStock)}
                    />
                    {saving === med.id && <span className="text-pine-300 text-xs">Saving...</span>}
                  </div>
                  <div className="col-span-2">
                    <button
                      onClick={() => savePrice(med.id, !inStock)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                        inStock ? 'bg-pine-500' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                        inStock ? 'translate-x-4' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <p className="text-pine-400 text-xs">Prices are saved automatically when you click out of the price field.</p>
    </div>
  )
}
