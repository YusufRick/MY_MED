'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    setLoading(false)
    if (signUpError) {
      setError(signUpError.message)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-pine-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center animate-fade-up">
          <div className="w-16 h-16 rounded-2xl bg-pine-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-pine-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h2 className="font-display text-pine-900 text-2xl font-bold">Account created</h2>
          <p className="text-pine-400 text-sm mt-2 leading-relaxed">
            Your account is pending approval by an administrator.<br />
            You'll be able to log in once your role has been assigned.
          </p>
          <Link href="/auth/login" className="btn-primary mt-6 inline-block">Go to login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-pine-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-up">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-xl bg-pine-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <span className="font-display text-pine-800 font-semibold">MedConnect MY</span>
        </div>

        <div className="card p-8">
          <h2 className="font-display text-pine-900 text-2xl font-bold mb-1">Create your account</h2>
          <p className="text-pine-400 text-sm mb-6">
            An admin will assign your role after sign-up.
          </p>

          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-pine-700 text-sm font-medium mb-1.5">Full name</label>
              <input
                type="text"
                className="input"
                placeholder="Ahmad bin Abdullah"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>

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
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-pine-400 text-sm mt-5">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-pine-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
