'use client'
import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils'
import type { Profile, UserRole } from '@/types'

const ASSIGNABLE_ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: 'patient',      label: 'Patient',      color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'doctor',       label: 'Doctor',       color: 'bg-pine-100 text-pine-700 border-pine-200' },
  { value: 'clinic_staff', label: 'Clinic Staff', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  { value: 'pharmacy',     label: 'Pharmacy',     color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
]

function RoleLabel({ role }: { role: UserRole | null }) {
  if (!role) return <span className="badge badge-amber">Pending</span>
  const map: Record<string, string> = {
    doctor: 'badge bg-pine-100 text-pine-700',
    clinic_staff: 'badge bg-teal-100 text-teal-700',
    pharmacy: 'badge bg-emerald-100 text-emerald-700',
    patient: 'badge bg-blue-100 text-blue-700',
    admin: 'badge bg-gray-800 text-white',
  }
  const labels: Record<string, string> = {
    clinic_staff: 'Clinic Staff',
  }
  return <span className={map[role] ?? 'badge badge-gray'}>{labels[role] ?? role}</span>
}

export default function AdminUsersPage() {
  const [users, setUsers]         = useState<Profile[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState<'pending' | 'all'>('pending')
  const [search, setSearch]       = useState('')
  const [assigning, setAssigning] = useState<string | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [roleModal, setRoleModal] = useState<Profile | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Profile | null>(null)

  useEffect(() => { loadUsers() }, [filter])

  async function loadUsers() {
    setLoading(true)
    const data = await fetch(`/api/admin/users?filter=${filter}`).then(r => r.json())
    setUsers(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function assignRole(userId: string, role: UserRole) {
    setAssigning(userId)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role }),
    })
    setAssigning(null)
    setRoleModal(null)
    loadUsers()
  }

  async function deleteUser(userId: string) {
    setDeleting(userId)
    await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    setDeleting(null)
    setConfirmDelete(null)
    loadUsers()
  }

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-pine-900 text-2xl font-bold">User management</h1>
        <p className="text-pine-400 text-sm mt-1">Assign roles to new users or update existing ones</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          className="input flex-1"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2 bg-pine-100 p-1 rounded-xl shrink-0">
          {(['pending', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all duration-150 ${
                filter === f ? 'bg-white text-pine-800 shadow-sm' : 'text-pine-500 hover:text-pine-700'
              }`}
            >
              {f === 'pending' ? 'Pending' : 'All users'}
            </button>
          ))}
        </div>
      </div>

      {/* User table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-pine-100 bg-pine-50 hidden sm:grid grid-cols-12 gap-4">
          <span className="col-span-5 text-pine-500 text-xs font-medium uppercase tracking-wide">User</span>
          <span className="col-span-2 text-pine-500 text-xs font-medium uppercase tracking-wide">Role</span>
          <span className="col-span-3 text-pine-500 text-xs font-medium uppercase tracking-wide">Joined</span>
          <span className="col-span-2 text-pine-500 text-xs font-medium uppercase tracking-wide">Actions</span>
        </div>

        {loading ? (
          <div className="divide-y divide-pine-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse flex gap-4">
                <div className="w-9 h-9 rounded-full bg-pine-100 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-pine-100 rounded w-40" />
                  <div className="h-3 bg-pine-50 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-pine-300 text-sm">
            {filter === 'pending' ? 'No pending users — all caught up!' : 'No users found.'}
          </div>
        ) : (
          <div className="divide-y divide-pine-50">
            {filtered.map(user => (
              <div key={user.id} className="px-5 py-4 flex flex-col sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center gap-3">
                {/* User info */}
                <div className="col-span-5 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                    user.role ? 'bg-pine-100 text-pine-600' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {user.full_name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-pine-800 font-medium text-sm truncate">{user.full_name}</p>
                    <p className="text-pine-400 text-xs truncate">{user.id.slice(0, 8)}...</p>
                  </div>
                </div>

                {/* Role */}
                <div className="col-span-2">
                  <RoleLabel role={user.role} />
                </div>

                {/* Joined */}
                <div className="col-span-3">
                  <span className="text-pine-400 text-xs">{formatDate(user.created_at)}</span>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center gap-2">
                  <button
                    onClick={() => setRoleModal(user)}
                    className="text-xs font-medium text-pine-600 border border-pine-200 px-3 py-1.5 rounded-lg hover:bg-pine-50 transition-colors whitespace-nowrap"
                  >
                    {user.role ? 'Change role' : 'Assign role'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(user)}
                    className="text-xs font-medium text-red-400 border border-red-100 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role assignment modal */}
      {roleModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setRoleModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-pine-900 text-lg font-bold mb-1">Assign role</h3>
            <p className="text-pine-400 text-sm mb-5">
              Assigning role for <span className="font-medium text-pine-700">{roleModal.full_name}</span>
            </p>

            <div className="space-y-2">
              {ASSIGNABLE_ROLES.map(r => (
                <button
                  key={r.value}
                  onClick={() => assignRole(roleModal.id, r.value)}
                  disabled={assigning === roleModal.id}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-150 hover:shadow-sm ${
                    roleModal.role === r.value
                      ? r.color + ' font-semibold'
                      : 'border-pine-100 hover:border-pine-200 text-pine-700'
                  }`}
                >
                  <span className="text-sm font-medium">{r.label}</span>
                  {roleModal.role === r.value && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                    </svg>
                  )}
                  {assigning === roleModal.id && <span className="text-pine-300 text-xs">Saving...</span>}
                </button>
              ))}
            </div>

            <button
              onClick={() => setRoleModal(null)}
              className="w-full mt-4 text-pine-400 text-sm hover:text-pine-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-pine-900 text-lg font-bold mb-1">Delete user?</h3>
            <p className="text-pine-400 text-sm mb-5">
              This will permanently delete <span className="font-medium text-pine-700">{confirmDelete.full_name}</span> and all their data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-outline flex-1">Cancel</button>
              <button
                onClick={() => deleteUser(confirmDelete.id)}
                disabled={deleting === confirmDelete.id}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting === confirmDelete.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
