'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'

interface NavItem { label: string; href: string; icon: React.ReactNode }

const navByRole: Record<string, NavItem[]> = {
  admin: [
    { label: 'Dashboard',  href: '/admin',        icon: <GridIcon /> },
    { label: 'Users',      href: '/admin/users',  icon: <UsersIcon /> },
  ],
  doctor: [
    { label: 'Dashboard',     href: '/doctor',                  icon: <GridIcon /> },
    { label: 'Prescriptions', href: '/doctor/prescriptions',    icon: <DocIcon /> },
    { label: 'New Rx',        href: '/doctor/prescriptions/new', icon: <PlusIcon /> },
  ],
  clinic_staff: [
    { label: 'Dashboard',  href: '/staff',          icon: <GridIcon /> },
    { label: 'Approvals',  href: '/staff/approvals', icon: <CheckIcon /> },
  ],
  pharmacy: [
    { label: 'Dashboard', href: '/pharmacy',          icon: <GridIcon /> },
    { label: 'Prices',    href: '/pharmacy/prices',   icon: <TagIcon /> },
    { label: 'Locker',    href: '/pharmacy/locker',   icon: <BoxIcon /> },
    { label: 'Orders',    href: '/pharmacy/orders',   icon: <BagIcon /> },
  ],
  patient: [
    { label: 'Dashboard',   href: '/patient',              icon: <GridIcon /> },
    { label: 'Medications', href: '/patient/medications',  icon: <PillIcon /> },
    { label: 'Pharmacies',  href: '/patient/pharmacies',   icon: <MapIcon /> },
    { label: 'My Orders',   href: '/patient/orders',       icon: <BagIcon /> },
  ],
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role ?? ''
  const items = navByRole[role] ?? []

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-white border-r border-pine-100 px-4 py-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <div className="w-8 h-8 rounded-xl bg-pine-600 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <span className="font-display text-pine-800 font-semibold text-sm">MedConnect MY</span>
      </div>

      {/* Role badge */}
      <div className="px-2 mb-6">
        <span className="badge badge-green capitalize text-xs">{role.replace('_', ' ')}</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {items.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-pine-600 text-white shadow-sm'
                  : 'text-pine-600 hover:bg-pine-50 hover:text-pine-800'
              )}
            >
              <span className="w-4 h-4 shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + signout */}
      <div className="border-t border-pine-100 pt-4 mt-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-pine-100 flex items-center justify-center shrink-0">
            <span className="text-pine-600 text-xs font-bold">
              {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="overflow-hidden">
            <p className="text-pine-800 text-xs font-medium truncate">{session?.user?.name}</p>
            <p className="text-pine-400 text-xs truncate">{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-pine-400 hover:text-red-500 hover:bg-red-50 text-sm transition-colors duration-150"
        >
          <LogoutIcon />
          Sign out
        </button>
      </div>
    </aside>
  )
}

// Mobile bottom nav
export function MobileNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role ?? ''
  const items = (navByRole[role] ?? []).slice(0, 4)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-pine-100 z-50">
      <div className="flex items-center justify-around py-2 px-4 safe-area-inset-bottom">
        {items.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors duration-150',
                active ? 'text-pine-600' : 'text-pine-300'
              )}
            >
              <span className={cn('w-5 h-5', active && 'text-pine-600')}>{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// ─── Icons ────────────────────────────────────────────────────
function GridIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
}
function UsersIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
}
function DocIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
}
function PlusIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
}
function CheckIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
}
function TagIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/></svg>
}
function BoxIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
}
function BagIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
}
function PillIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
}
function MapIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
}
function LogoutIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
}
