'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LockerSlotPicker } from '@/components/locker/LockerSlotPicker'
import { formatMYR } from '@/lib/utils'
import type { Pharmacy, Medication, PharmacyMedicationPrice, LockerSlot } from '@/types'

interface CartItem {
  medication_id: string
  medication_name: string
  quantity: number
  unit_price_myr: number
}

function NewOrderForm() {
  const router = useRouter()
  const params = useSearchParams()

  const [step, setStep] = useState<'pharmacy' | 'meds' | 'fulfilment' | 'confirm'>('pharmacy')
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null)
  const [prices, setPrices] = useState<PharmacyMedicationPrice[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [fulfilment, setFulfilment] = useState<'locker' | 'delivery'>('locker')
  const [lockerSlot, setLockerSlot] = useState<LockerSlot | null>(null)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        fetch(`/api/pharmacies/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`)
          .then(r => r.json())
          .then(d => { setPharmacies(d); setLocating(false) })
      },
      () => {
        fetch('/api/pharmacies/nearby?lat=3.1390&lng=101.6869')
          .then(r => r.json())
          .then(d => { setPharmacies(d); setLocating(false) })
      }
    )
  }, [])

  async function selectPharmacy(ph: Pharmacy) {
    setSelectedPharmacy(ph)
    const data = await fetch(`/api/pharmacies/${ph.id}/prices`).then(r => r.json())
    setPrices(data)

    // If a med was pre-selected via URL
    const medId = params.get('med')
    if (medId) {
      const price = data.find((p: PharmacyMedicationPrice) => p.medication_id === medId)
      if (price) {
        setCart([{
          medication_id: price.medication_id,
          medication_name: price.medication?.name ?? '',
          quantity: 1,
          unit_price_myr: price.price_myr,
        }])
      }
    }

    // Pre-select fulfilment from URL
    const f = params.get('fulfilment')
    if (f === 'locker' || f === 'delivery') setFulfilment(f)

    setStep('meds')
  }

  function addToCart(price: PharmacyMedicationPrice) {
    setCart(prev => {
      const existing = prev.find(i => i.medication_id === price.medication_id)
      if (existing) return prev.map(i =>
        i.medication_id === price.medication_id ? { ...i, quantity: i.quantity + 1 } : i
      )
      return [...prev, {
        medication_id: price.medication_id,
        medication_name: price.medication?.name ?? '',
        quantity: 1,
        unit_price_myr: price.price_myr,
      }]
    })
  }

  function removeFromCart(medId: string) {
    setCart(prev => prev.filter(i => i.medication_id !== medId))
  }

  function updateQty(medId: string, qty: number) {
    if (qty <= 0) { removeFromCart(medId); return }
    setCart(prev => prev.map(i => i.medication_id === medId ? { ...i, quantity: qty } : i))
  }

  const total = cart.reduce((s, i) => s + i.unit_price_myr * i.quantity, 0)

  async function submitOrder() {
    if (cart.length === 0) { setError('Add at least one medication.'); return }
    if (fulfilment === 'locker' && !lockerSlot) { setError('Select a locker timeslot.'); return }
    if (fulfilment === 'delivery' && !deliveryAddress) { setError('Enter your delivery address.'); return }

    setLoading(true); setError('')
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pharmacy_id: selectedPharmacy!.id,
        items: cart.map(i => ({
          medication_id: i.medication_id,
          quantity: i.quantity,
          unit_price_myr: i.unit_price_myr,
        })),
        fulfilment_type: fulfilment,
        locker_slot_id: lockerSlot?.id,
        delivery_address: deliveryAddress || undefined,
      }),
    })
    setLoading(false)

    if (res.ok) {
      router.push('/patient/orders')
    } else {
      const d = await res.json()
      setError(d.error ?? 'Failed to place order.')
    }
  }

  const steps = ['pharmacy', 'meds', 'fulfilment', 'confirm']
  const stepIdx = steps.indexOf(step)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-pine-400 text-sm hover:text-pine-600 flex items-center gap-1 mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <h1 className="font-display text-pine-900 text-2xl font-bold">New order</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {['Pharmacy', 'Medications', 'Fulfilment', 'Confirm'].map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < stepIdx ? 'bg-pine-500 text-white' :
              i === stepIdx ? 'bg-pine-600 text-white' :
              'bg-pine-100 text-pine-300'
            }`}>
              {i < stepIdx ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === stepIdx ? 'text-pine-700' : 'text-pine-300'}`}>{label}</span>
            {i < 3 && <div className={`flex-1 h-px ${i < stepIdx ? 'bg-pine-400' : 'bg-pine-100'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Select pharmacy */}
      {step === 'pharmacy' && (
        <div className="space-y-3">
          <h2 className="text-pine-800 font-semibold">Select a pharmacy</h2>
          {locating ? (
            <p className="text-pine-400 text-sm">Getting nearby pharmacies...</p>
          ) : pharmacies.length === 0 ? (
            <p className="text-pine-400 text-sm">No pharmacies found nearby.</p>
          ) : (
            <div className="space-y-2">
              {pharmacies.map(ph => (
                <button
                  key={ph.id}
                  onClick={() => selectPharmacy(ph)}
                  className="w-full card p-4 text-left hover:border-pine-300 hover:shadow-sm transition-all duration-150 flex items-center justify-between"
                >
                  <div>
                    <p className="text-pine-800 font-medium">{ph.name}</p>
                    <p className="text-pine-400 text-xs mt-0.5">{ph.address}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    {ph.distance_km !== undefined && (
                      <span className="text-pine-500 text-xs font-medium">{ph.distance_km.toFixed(1)} km</span>
                    )}
                    {ph.has_locker && <div className="badge badge-green text-[10px] mt-1">Locker</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select medications */}
      {step === 'meds' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-pine-800 font-semibold">Select medications</h2>
            <span className="text-pine-400 text-xs">{selectedPharmacy?.name}</span>
          </div>

          {prices.length === 0 ? (
            <div className="card py-10 text-center text-pine-300 text-sm">This pharmacy has no prices listed yet.</div>
          ) : (
            <div className="space-y-2">
              {prices.map(price => {
                const inCart = cart.find(i => i.medication_id === price.medication_id)
                return (
                  <div key={price.id} className={`card p-4 flex items-center gap-4 transition-colors ${inCart ? 'border-pine-300 bg-pine-50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-pine-800 font-medium text-sm">{price.medication?.name}</p>
                      <p className="text-pine-400 text-xs">{price.medication?.strength} · {price.medication?.dosage_form}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-pine-600 font-semibold text-sm">{formatMYR(price.price_myr)}</span>
                        <span className={`badge text-[10px] ${price.medication?.access_type === 'prescription_only' ? 'badge-amber' : 'badge-green'}`}>
                          {price.medication?.access_type === 'prescription_only' ? 'Rx required' : 'OTC'}
                        </span>
                      </div>
                    </div>
                    {inCart ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => updateQty(price.medication_id, inCart.quantity - 1)} className="w-7 h-7 rounded-lg border border-pine-200 flex items-center justify-center text-pine-600 hover:bg-pine-100">−</button>
                        <span className="text-pine-800 font-medium w-4 text-center text-sm">{inCart.quantity}</span>
                        <button onClick={() => updateQty(price.medication_id, inCart.quantity + 1)} className="w-7 h-7 rounded-lg border border-pine-200 flex items-center justify-center text-pine-600 hover:bg-pine-100">+</button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(price)} className="btn-outline text-xs py-1.5 px-3 shrink-0">Add</button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {cart.length > 0 && (
            <div className="card p-4 bg-pine-50 border-pine-200">
              <div className="flex items-center justify-between mb-1">
                <p className="text-pine-700 text-sm font-medium">{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</p>
                <p className="text-pine-700 font-bold">{formatMYR(total)}</p>
              </div>
              <button onClick={() => setStep('fulfilment')} className="btn-primary w-full mt-3">
                Continue to fulfilment →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Fulfilment */}
      {step === 'fulfilment' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-pine-800 font-semibold">How do you want to receive your order?</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'locker' as const, label: 'Locker pickup', desc: 'Collect at a time that suits you', icon: '📦', available: selectedPharmacy?.has_locker },
              { value: 'delivery' as const, label: 'GrabExpress delivery', desc: 'Delivered to your address', icon: '🛵', available: true },
            ].map(opt => (
              <button
                key={opt.value}
                disabled={!opt.available}
                onClick={() => setFulfilment(opt.value)}
                className={`card p-4 text-left transition-all duration-150 ${
                  !opt.available ? 'opacity-40 cursor-not-allowed' :
                  fulfilment === opt.value ? 'border-2 border-pine-500 bg-pine-50' : 'hover:border-pine-200'
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <p className="text-pine-800 font-semibold text-sm mt-2">{opt.label}</p>
                <p className="text-pine-400 text-xs mt-0.5">{opt.desc}</p>
                {!opt.available && <p className="text-red-400 text-xs mt-1">Not available at this pharmacy</p>}
              </button>
            ))}
          </div>

          {fulfilment === 'locker' && selectedPharmacy && (
            <div className="card p-5">
              <LockerSlotPicker
                pharmacyId={selectedPharmacy.id}
                selected={lockerSlot}
                onSelect={setLockerSlot}
              />
            </div>
          )}

          {fulfilment === 'delivery' && (
            <div className="card p-5 space-y-3">
              <h3 className="text-pine-700 font-medium text-sm">Delivery address</h3>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Enter your full delivery address..."
                value={deliveryAddress}
                onChange={e => setDeliveryAddress(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep('meds')} className="btn-outline flex-1">Back</button>
            <button
              onClick={() => setStep('confirm')}
              disabled={fulfilment === 'locker' && !lockerSlot}
              className="btn-primary flex-1"
            >
              Review order →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 'confirm' && (
        <div className="space-y-5">
          <h2 className="text-pine-800 font-semibold">Review your order</h2>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-pine-500 text-xs font-medium uppercase tracking-wide">Pharmacy</p>
            </div>
            <p className="text-pine-800 font-medium">{selectedPharmacy?.name}</p>
            <p className="text-pine-400 text-xs">{selectedPharmacy?.address}</p>
          </div>

          <div className="card p-5 space-y-2">
            <p className="text-pine-500 text-xs font-medium uppercase tracking-wide mb-3">Medications</p>
            {cart.map(item => (
              <div key={item.medication_id} className="flex justify-between">
                <span className="text-pine-700 text-sm">{item.medication_name} × {item.quantity}</span>
                <span className="text-pine-700 text-sm font-medium">{formatMYR(item.unit_price_myr * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-pine-100 pt-2 mt-2 flex justify-between">
              <span className="text-pine-800 font-semibold">Total</span>
              <span className="text-pine-800 font-bold">{formatMYR(total)}</span>
            </div>
          </div>

          <div className="card p-5 space-y-2">
            <p className="text-pine-500 text-xs font-medium uppercase tracking-wide mb-2">Fulfilment</p>
            {fulfilment === 'locker' ? (
              <div>
                <p className="text-pine-700 font-medium">Locker pickup</p>
                {lockerSlot && (
                  <p className="text-pine-400 text-xs mt-0.5">{lockerSlot.slot_date} at {lockerSlot.slot_time}</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-pine-700 font-medium">GrabExpress delivery</p>
                <p className="text-pine-400 text-xs mt-0.5">{deliveryAddress}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('fulfilment')} className="btn-outline flex-1">Back</button>
            <button onClick={submitOrder} disabled={loading} className="btn-primary flex-1">
              {loading ? 'Placing order...' : 'Place order'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="p-6 text-pine-400 text-sm">Loading...</div>}>
      <NewOrderForm />
    </Suspense>
  )
}
