'use client'
import { useEffect, useState } from 'react'
import { formatTime } from '@/lib/utils'

interface Slot {
  id: string
  slot_date: string
  slot_time: string
  is_available: boolean
  booked_patient?: { full_name: string } | null
}

const TIME_OPTIONS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30',
]

export default function PharmacyLockerPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => { loadSlots() }, [date])

  async function loadSlots() {
    setLoading(true)
    const res = await fetch(`/api/locker?date=${date}`)
    const data = await res.json()
    setSlots(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function createSlots() {
    if (selected.length === 0) return
    setCreating(true)

    // We need pharmacy id - fetch it
    const ph = await fetch('/api/pharmacies/me').then(r => r.json())
    await fetch('/api/locker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pharmacy_id: ph.id,
        slots: selected.map(t => ({ slot_date: date, slot_time: t })),
      }),
    })
    setSelected([])
    setCreating(false)
    loadSlots()
  }

  const existingTimes = new Set(slots.map(s => s.slot_time))

  const today = new Date().toISOString().split('T')[0]
  const maxDate = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0]

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-pine-900 text-2xl font-bold">Locker slots</h1>
        <p className="text-pine-400 text-sm mt-1">Manage collection timeslots for patient pickup</p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <label className="text-pine-600 text-sm font-medium block mb-1">Date</label>
          <input
            type="date"
            className="input w-auto"
            value={date}
            min={today}
            max={maxDate}
            onChange={e => setDate(e.target.value)}
          />
        </div>
      </div>

      {/* Current slots */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-pine-100 flex items-center justify-between">
          <h2 className="text-pine-800 font-semibold">Slots for {new Date(date + 'T00:00').toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          <span className="text-pine-400 text-sm">{slots.length} slot{slots.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="p-5 grid grid-cols-3 sm:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 bg-pine-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="py-12 text-center text-pine-300 text-sm">No slots set for this date. Add some below.</div>
        ) : (
          <div className="p-5 grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map(slot => (
              <div
                key={slot.id}
                className={`rounded-xl border-2 px-3 py-2.5 text-center ${
                  !slot.is_available
                    ? 'border-pine-200 bg-pine-50'
                    : 'border-pine-300 bg-white'
                }`}
              >
                <p className="text-pine-800 text-sm font-medium">{formatTime(slot.slot_time)}</p>
                <p className={`text-xs mt-0.5 ${slot.is_available ? 'text-pine-400' : 'text-amber-600'}`}>
                  {slot.is_available ? 'Available' : slot.booked_patient?.full_name ?? 'Booked'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new slots */}
      <div className="card p-5 space-y-4">
        <h2 className="text-pine-800 font-semibold">Add timeslots</h2>
        <p className="text-pine-400 text-xs">Select times to add. Already-existing slots are greyed out.</p>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {TIME_OPTIONS.map(time => {
            const exists = existingTimes.has(time)
            const isSelected = selected.includes(time)
            return (
              <button
                key={time}
                disabled={exists}
                onClick={() => setSelected(prev =>
                  isSelected ? prev.filter(t => t !== time) : [...prev, time]
                )}
                className={`py-2 rounded-xl text-xs font-medium border transition-all duration-150 ${
                  exists
                    ? 'border-pine-100 bg-pine-50 text-pine-200 cursor-not-allowed'
                    : isSelected
                    ? 'border-pine-600 bg-pine-600 text-white'
                    : 'border-pine-200 bg-white text-pine-600 hover:border-pine-400'
                }`}
              >
                {formatTime(time)}
              </button>
            )
          })}
        </div>

        <button
          onClick={createSlots}
          disabled={selected.length === 0 || creating}
          className="btn-primary"
        >
          {creating ? 'Adding...' : `Add ${selected.length > 0 ? selected.length : ''} slot${selected.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}
