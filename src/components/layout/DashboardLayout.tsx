'use client'
import { Sidebar, MobileNav } from './Sidebar'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-pine-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
