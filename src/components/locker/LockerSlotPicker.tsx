'use client'
import { useEffect, useState } from 'react'
import { formatTime } from '@/lib/utils'
import type { LockerSlot } from '@/types'

interface Props {
  pharmacyId: string
  onSelect: (slot: LockerSlot) => void
  selected?: LockerSlot | null
}

export function LockerSlotPicker({ pharmacyId, onSelect, selected }: Props) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [slots, setSlots] = useState<LockerSlot[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/pharmacies/${pharmacyId}/locker-slots?date=${date}`)
      .then(r => r.json())
      .then(data => { setSlots(data); setLoading(false) })
  }, [pharmacyId, date])

  // Min date = today, max = 7 days ahead
  const today = new Date().toISOString().split('T')[0]
  const maxDate = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0]

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-pine-700 text-sm font-medium mb-1.5">Collection date</label>
        <input
          type="date"
          className="input"
          value={date}
          min={today}
          max={maxDate}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      <div>
        <p className="text-pine-700 text-sm font-medium mb-2">Available timeslots</p>
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-pine-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-8 text-pine-300 text-sm bg-pine-50 rounded-xl">
            No slots available for this date
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {slots.map(slot => (
              <button
                key={slot.id}
                onClick={() => onSelect(slot)}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-all duration-150 ${
                  selected?.id === slot.id
                    ? 'bg-pine-600 text-white border-pine-600'
                    : 'bg-white text-pine-700 border-pine-200 hover:border-pine-400 hover:bg-pine-50'
                }`}
              >
                {formatTime(slot.slot_time)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
