'use client'
import { useEffect, useState } from 'react'
import { formatDate, formatMYR, formatTime } from '@/lib/utils'
import { OrderStatusBadge } from '@/components/ui/StatCard'
import type { Order } from '@/types'

export default function PatientOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-pine-900 text-2xl font-bold">My orders</h1>
        <p className="text-pine-400 text-sm mt-1">{orders.length} total orders</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse space-y-2">
              <div className="h-4 bg-pine-100 rounded w-48" />
              <div className="h-3 bg-pine-50 rounded w-32" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card py-20 text-center">
          <p className="text-pine-300 text-sm">No orders yet.</p>
          <a href="/patient/orders/new" className="btn-primary mt-4 inline-block">Place your first order</a>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="card overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-pine-50 transition-colors text-left"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  order.fulfilment_type === 'locker' ? 'bg-pine-100' : 'bg-green-100'
                }`}>
                  {order.fulfilment_type === 'locker' ? (
                    <svg className="w-5 h-5 text-pine-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                  ) : (
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-pine-800 font-semibold text-sm">{order.pharmacy?.name ?? 'Pharmacy'}</p>
                  <p className="text-pine-400 text-xs mt-0.5 capitalize">
                    {order.fulfilment_type} · {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <OrderStatusBadge status={order.status} />
                  {order.total_myr && <p className="text-pine-700 text-xs font-semibold">{formatMYR(order.total_myr)}</p>}
                </div>
              </button>

              {expanded === order.id && (
                <div className="border-t border-pine-100 px-5 py-4 space-y-4 animate-fade-in">
                  {/* Medications */}
                  <div>
                    <p className="text-pine-500 text-xs font-medium uppercase tracking-wide mb-2">Medications</p>
                    <div className="space-y-1.5">
                      {(order.items ?? []).map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between bg-pine-50 rounded-xl px-4 py-2.5">
                          <div>
                            <p className="text-pine-800 text-sm font-medium">{item.medication?.name}</p>
                            <p className="text-pine-400 text-xs">Qty: {item.quantity}</p>
                          </div>
                          <span className="text-pine-600 text-sm font-semibold">{formatMYR(item.unit_price_myr)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fulfilment info */}
                  <div className="bg-pine-50 rounded-xl px-4 py-3">
                    <p className="text-pine-500 text-xs font-medium uppercase tracking-wide mb-1.5">Collection details</p>
                    {order.fulfilment_type === 'locker' ? (
                      <div className="space-y-1">
                        <p className="text-pine-700 text-sm font-medium">Locker pickup at {order.pharmacy?.name}</p>
                        {(order as any).locker_slot && (
                          <p className="text-pine-400 text-xs">
                            {(order as any).locker_slot.slot_date} · {formatTime((order as any).locker_slot.slot_time)}
                          </p>
                        )}
                        {order.qr_code && order.status === 'ready' && (
                          <div className="mt-3">
                            <p className="text-pine-600 text-xs font-medium mb-2">Show this QR code at the pharmacy</p>
                            <img src={order.qr_code} alt="Pickup QR code" className="w-32 h-32 rounded-xl border-2 border-pine-200" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-pine-700 text-sm font-medium">Delivery to:</p>
                        <p className="text-pine-400 text-xs mt-0.5">{order.delivery_address}</p>
                        {order.grab_booking_ref && (
                          <p className="text-pine-400 text-xs mt-1">Grab tracking: {order.grab_booking_ref}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {order.total_myr && (
                    <div className="flex justify-between items-center pt-1">
                      <p className="text-pine-500 text-sm">Total</p>
                      <p className="text-pine-800 font-bold">{formatMYR(order.total_myr)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
