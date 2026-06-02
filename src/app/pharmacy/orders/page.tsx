'use client'
import { useEffect, useState } from 'react'
import { formatDate, formatMYR } from '@/lib/utils'
import { OrderStatusBadge } from '@/components/ui/StatCard'
import type { Order } from '@/types'

const STATUS_FLOW: Record<string, string> = {
  pending:   'confirmed',
  confirmed: 'ready',
  ready:     'completed',
}

export default function PharmacyOrdersPage() {
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('pending')
  const [acting, setActing]   = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { loadOrders() }, [])

  async function loadOrders() {
    setLoading(true)
    const data = await fetch('/api/orders').then(r => r.json())
    setOrders(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function advanceStatus(order: Order) {
    const next = STATUS_FLOW[order.status]
    if (!next) return
    setActing(order.id)

    if (order.fulfilment_type === 'delivery' && order.status === 'ready') {
      // Dispatch via GrabExpress
      await fetch(`/api/orders/${order.id}/dispatch`, { method: 'POST' })
    } else {
      await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
    }
    setActing(null)
    loadOrders()
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const actionLabel: Record<string, string> = {
    pending:   'Confirm order',
    confirmed: 'Mark ready',
    ready:     'Complete / Dispatch',
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-pine-900 text-2xl font-bold">Orders</h1>
        <p className="text-pine-400 text-sm mt-1">{orders.length} total orders</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {['pending', 'confirmed', 'ready', 'dispatched', 'completed', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-150 ${
              filter === f
                ? 'bg-pine-600 text-white'
                : 'bg-pine-100 text-pine-500 hover:bg-pine-200'
            }`}
          >
            {f} {f !== 'all' && `(${orders.filter(o => o.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-pine-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-pine-100 rounded w-36" />
                  <div className="h-3 bg-pine-50 rounded w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center text-pine-300 text-sm">No orders in this status.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className="card overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-pine-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-pine-100 flex items-center justify-center shrink-0 text-pine-600 font-bold text-sm">
                  {(order as any).patient?.full_name?.[0] ?? 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-pine-800 font-semibold text-sm">
                    {(order as any).patient?.full_name ?? 'Patient'}
                  </p>
                  <p className="text-pine-400 text-xs mt-0.5 capitalize">
                    {order.fulfilment_type} · {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <OrderStatusBadge status={order.status} />
                    {order.total_myr && (
                      <p className="text-pine-600 text-xs font-semibold mt-1">{formatMYR(order.total_myr)}</p>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 text-pine-300 transition-transform duration-200 ${expanded === order.id ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
              </button>

              {expanded === order.id && (
                <div className="border-t border-pine-100 px-5 py-4 space-y-4 animate-fade-in">
                  {/* Order items */}
                  <div>
                    <p className="text-pine-500 text-xs font-medium uppercase tracking-wide mb-2">Medications</p>
                    <div className="space-y-1.5">
                      {(order.items ?? []).map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between bg-pine-50 rounded-xl px-4 py-2.5">
                          <div>
                            <p className="text-pine-800 text-sm font-medium">{item.medication?.name}</p>
                            <p className="text-pine-400 text-xs">{item.medication?.strength} · Qty: {item.quantity}</p>
                          </div>
                          <span className="text-pine-600 text-sm font-semibold">{formatMYR(item.unit_price_myr)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fulfilment detail */}
                  <div className="bg-pine-50 rounded-xl px-4 py-3 space-y-1">
                    <p className="text-pine-500 text-xs font-medium uppercase tracking-wide">Fulfilment</p>
                    {order.fulfilment_type === 'locker' ? (
                      <div>
                        <p className="text-pine-700 text-sm font-medium">Locker pickup</p>
                        {(order as any).locker_slot && (
                          <p className="text-pine-400 text-xs">
                            {(order as any).locker_slot.slot_date} at {(order as any).locker_slot.slot_time}
                          </p>
                        )}
                        {order.qr_code && (
                          <img src={order.qr_code} alt="QR code" className="w-24 h-24 mt-2 rounded-lg border border-pine-200" />
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-pine-700 text-sm font-medium">Delivery</p>
                        <p className="text-pine-400 text-xs">{order.delivery_address}</p>
                        {order.grab_booking_ref && (
                          <p className="text-pine-400 text-xs mt-0.5">Grab ref: {order.grab_booking_ref}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  {actionLabel[order.status] && (
                    <button
                      onClick={() => advanceStatus(order)}
                      disabled={acting === order.id}
                      className="w-full btn-primary py-2.5"
                    >
                      {acting === order.id ? 'Processing...' : actionLabel[order.status]}
                      {order.fulfilment_type === 'delivery' && order.status === 'ready' && ' via GrabExpress'}
                    </button>
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
