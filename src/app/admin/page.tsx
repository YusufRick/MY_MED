'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { StatCard } from '@/components/ui/StatCard'
import { formatDate } from '@/lib/utils'
import type { Profile } from '@/types'

export default function AdminDashboard() {
  const [pending, setPending] = useState<Profile[]>([])
  const [all, setAll]         = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/users?filter=pending').then(r => r.json()),
      fetch('/api/admin/users?filter=all').then(r => r.json()),
    ]).then(([p, a]) => {
      setPending(Array.isArray(p) ? p : [])
      setAll(Array.isArray(a) ? a : [])
      setLoading(false)
    })
  }, [])

  const roleCounts = all.reduce((acc, u) => {
    const r = u.role ?? 'pending'
    acc[r] = (acc[r] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-pine-900 text-2xl font-bold">Admin dashboard</h1>
        <p className="text-pine-400 text-sm mt-1">Manage users and role assignments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Pending approval" value={loading ? '—' : pending.length} icon={<ClockIcon />} accent={pending.length > 0 ? 'amber' : 'green'} />
        <StatCard label="Doctors"      value={loading ? '—' : roleCounts['doctor'] ?? 0}       icon={<UserIcon />} accent="green" />
        <StatCard label="Pharmacies"   value={loading ? '—' : roleCounts['pharmacy'] ?? 0}     icon={<UserIcon />} accent="green" />
        <StatCard label="Patients"     value={loading ? '—' : roleCounts['patient'] ?? 0}      icon={<UserIcon />} accent="green" />
      </div>

      {/* Pending users — quick action from dashboard */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-pine-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-pine-800 font-semibold">Pending approvals</h2>
            {pending.length > 0 && (
              <span className="badge badge-amber">{pending.length} waiting</span>
            )}
          </div>
          <Link href="/admin/users" className="text-pine-400 text-sm hover:text-pine-600">Manage all users</Link>
        </div>

        {loading ? (
          <div className="divide-y divide-pine-50">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse flex gap-4">
                <div className="w-9 h-9 rounded-full bg-pine-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-pine-100 rounded w-36" />
                  <div className="h-3 bg-pine-50 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="py-12 text-center text-pine-300 text-sm">No pending approvals.</div>
        ) : (
          <div className="divide-y divide-pine-50">
            {pending.slice(0, 5).map(user => (
              <div key={user.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-amber-700 font-bold text-sm">{user.full_name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-pine-800 font-medium text-sm truncate">{user.full_name}</p>
                  <p className="text-pine-400 text-xs mt-0.5">{formatDate(user.created_at)}</p>
                </div>
                <Link href="/admin/users" className="text-pine-500 text-xs font-medium hover:text-pine-700 border border-pine-200 px-3 py-1.5 rounded-lg hover:bg-pine-50 transition-colors">
                  Assign role →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role breakdown */}
      <div className="card p-5">
        <h2 className="text-pine-800 font-semibold mb-4">Users by role</h2>
        <div className="space-y-3">
          {[
            { role: 'doctor',       label: 'Doctors',       color: 'bg-pine-500' },
            { role: 'clinic_staff', label: 'Clinic staff',  color: 'bg-teal-500' },
            { role: 'pharmacy',     label: 'Pharmacies',    color: 'bg-emerald-500' },
            { role: 'patient',      label: 'Patients',      color: 'bg-blue-400' },
            { role: 'pending',      label: 'Pending',       color: 'bg-amber-400' },
          ].map(({ role, label, color }) => {
            const count = roleCounts[role] ?? 0
            const total = all.length + pending.length || 1
            const pct = Math.round((count / total) * 100)
            return (
              <div key={role} className="flex items-center gap-3">
                <span className="text-pine-600 text-xs w-24 shrink-0">{label}</span>
                <div className="flex-1 bg-pine-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${color} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-pine-500 text-xs w-8 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ClockIcon() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M12 7v5l3 3"/></svg> }
function UserIcon() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> }
