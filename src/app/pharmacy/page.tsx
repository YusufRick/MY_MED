'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { StatCard, OrderStatusBadge } from '@/components/ui/StatCard'
import { formatDate, formatMYR } from '@/lib/utils'
import type { Order, Pharmacy } from '@/types'

export default function PharmacyDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/pharmacies/me').then(r => r.json()),
      fetch('/api/orders').then(r => r.json()),
    ]).then(([ph, ord]) => {
      setPharmacy(ph)
      setOrders(Array.isArray(ord) ? ord : [])
      setLoading(false)
    })
  }, [])

  const pending   = orders.filter(o => o.status === 'pending').length
  const today     = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length
  const revenue   = orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.total_myr ?? 0), 0)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-pine-900 text-2xl font-bold">{pharmacy?.name ?? 'Pharmacy'}</h1>
          <p className="text-pine-400 text-sm mt-1">{pharmacy?.address ?? 'Set up your pharmacy profile'}</p>
        </div>
        <div className="flex items-center gap-2">
          {pharmacy?.has_locker && <span className="badge badge-green">Locker enabled</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Pending orders" value={loading ? '—' : pending} icon={<BagIcon />} accent="amber" />
        <StatCard label="Orders today" value={loading ? '—' : today} icon={<CalIcon />} accent="green" />
        <StatCard label="Total revenue" value={loading ? '—' : formatMYR(revenue)} icon={<CoinIcon />} accent="green" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Manage prices', desc: 'Update medication prices', href: '/pharmacy/prices', icon: <TagIcon /> },
          { label: 'Locker slots', desc: 'Set collection timeslots', href: '/pharmacy/locker', icon: <BoxIcon /> },
          { label: 'View orders', desc: 'Manage incoming orders', href: '/pharmacy/orders', icon: <BagIcon /> },
        ].map(action => (
          <Link key={action.href} href={action.href} className="card p-5 hover:border-pine-200 hover:shadow-md transition-all duration-200 group">
            <div className="w-10 h-10 rounded-xl bg-pine-100 text-pine-600 flex items-center justify-center mb-3 group-hover:bg-pine-600 group-hover:text-white transition-colors duration-200">
              <span className="w-5 h-5">{action.icon}</span>
            </div>
            <p className="text-pine-800 font-semibold text-sm">{action.label}</p>
            <p className="text-pine-400 text-xs mt-0.5">{action.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-pine-100 flex items-center justify-between">
          <h2 className="text-pine-800 font-semibold">Recent orders</h2>
          <Link href="/pharmacy/orders" className="text-pine-400 text-sm hover:text-pine-600">View all</Link>
        </div>
        {loading ? (
          <div className="divide-y divide-pine-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse flex gap-3">
                <div className="w-9 h-9 rounded-full bg-pine-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-pine-100 rounded w-32" />
                  <div className="h-3 bg-pine-50 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.slice(0, 6).map(order => (
          <div key={order.id} className="px-5 py-4 flex items-center gap-4 border-b border-pine-50 last:border-0 hover:bg-pine-50 transition-colors">
            <div className="w-9 h-9 rounded-full bg-pine-100 flex items-center justify-center shrink-0 text-pine-600 font-bold text-sm">
              {(order as any).patient?.full_name?.[0] ?? 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-pine-800 font-medium text-sm truncate">{(order as any).patient?.full_name}</p>
              <p className="text-pine-400 text-xs mt-0.5 capitalize">
                {order.fulfilment_type} · {formatDate(order.created_at)}
              </p>
            </div>
            <div className="text-right shrink-0 space-y-1">
              <OrderStatusBadge status={order.status} />
              {order.total_myr && <p className="text-pine-600 text-xs font-semibold">{formatMYR(order.total_myr)}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BagIcon() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg> }
function CalIcon() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="4" width="18" height="18" rx="2"/><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18"/></svg> }
function CoinIcon() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v1m0 8v1m-4-5h1m6 0h1M8.5 9.5l.7.7m5.6 4.6.7.7m0-6-.7.7m-5.6 4.6-.7.7"/></svg> }
function TagIcon() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/></svg> }
function BoxIcon() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg> }
