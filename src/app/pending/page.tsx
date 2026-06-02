'use client'
import { signOut, useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PendingPage() {
  const { data: session, update } = useSession()
  const router = useRouter()

  // Poll every 10s — if role gets assigned, redirect immediately
  useEffect(() => {
    const interval = setInterval(async () => {
      await update()
      const role = (session?.user as any)?.role
      if (role) {
        const dest: Record<string, string> = {
          doctor: '/doctor', clinic_staff: '/staff',
          pharmacy: '/pharmacy', patient: '/patient', admin: '/admin',
        }
        router.push(dest[role] ?? '/')
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [session, update, router])

  return (
    <div className="min-h-screen bg-pine-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center animate-fade-up space-y-6">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-pine-100" />
          <div className="absolute inset-0 rounded-full border-4 border-pine-500 border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-pine-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
        </div>

        <div>
          <h1 className="font-display text-pine-900 text-2xl font-bold">Pending approval</h1>
          <p className="text-pine-500 text-sm mt-2 leading-relaxed">
            Hi <span className="font-medium text-pine-700">{session?.user?.name}</span>, your account has been created.<br />
            An administrator will review and assign your role shortly.
          </p>
        </div>

        <div className="card p-5 text-left space-y-3">
          <p className="text-pine-500 text-xs font-medium uppercase tracking-wide">What happens next</p>
          {[
            'Admin reviews your account',
            'Your role is assigned (doctor, staff, pharmacy, or patient)',
            'You\'ll be automatically redirected once approved',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-pine-100 text-pine-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-pine-600 text-sm">{step}</p>
            </div>
          ))}
        </div>

        <p className="text-pine-300 text-xs">This page checks for updates every 10 seconds.</p>

        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="text-pine-400 text-sm hover:text-pine-600 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
