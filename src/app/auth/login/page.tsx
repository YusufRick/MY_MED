'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', {
      email, password, redirect: false,
    })
    setLoading(false)
    if (res?.error) {
      setError('Invalid email or password.')
    } else {
      router.push('/')
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    await signIn('google', { callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-pine-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-pine-600 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-pine-500 opacity-40" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-pine-700 opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-pine-400 opacity-20" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <span className="font-display text-white text-lg font-semibold tracking-wide">MedConnect MY</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="font-display text-white text-4xl font-bold leading-tight">
            Healthcare,<br />
            connected<br />
            across Malaysia.
          </h1>
          <p className="text-pine-100 text-base leading-relaxed max-w-sm">
            Find nearby pharmacies, compare prices, book locker slots and get medications delivered — all in one place.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            {[
              { label: 'Pharmacies', value: '1,200+' },
              { label: 'Cities covered', value: '85' },
              { label: 'Daily orders', value: '5,000+' },
              { label: 'Medications', value: '10,000+' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 rounded-2xl p-4">
                <div className="text-white font-display text-2xl font-bold">{stat.value}</div>
                <div className="text-pine-200 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {['#4da083','#2d8463','#80c0a8'].map((c, i) => (
              <div key={i} style={{ background: c }} className="w-8 h-8 rounded-full border-2 border-pine-600" />
            ))}
          </div>
          <p className="text-pine-100 text-sm">Trusted by doctors, clinics & patients</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-fade-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-pine-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <span className="font-display text-pine-800 font-semibold">MedConnect MY</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-pine-900 text-3xl font-bold">Welcome back</h2>
            <p className="text-pine-400 mt-2 text-sm">Sign in to your account to continue</p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-pine-200 bg-white hover:bg-pine-50 rounded-xl px-4 py-3 text-pine-800 font-medium text-sm transition-colors duration-150 disabled:opacity-60"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-pine-100" />
            <span className="text-pine-300 text-xs font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-pine-100" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl animate-fade-in">
                {error}
              </div>
            )}

            <div>
              <label className="block text-pine-700 text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-pine-700 text-sm font-medium mb-1.5">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-pine-400 text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-pine-600 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
