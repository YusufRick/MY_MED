import { withAuth } from 'next-auth/middleware'
import type { NextRequestWithAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const ROLE_ROUTES: Record<string, string> = {
  '/doctor': 'doctor',
  '/staff': 'clinic_staff',
  '/pharmacy': 'pharmacy',
  '/patient': 'patient',
  '/admin': 'admin',
}

const ROLE_HOME: Record<string, string> = {
  doctor: '/doctor',
  clinic_staff: '/staff',
  pharmacy: '/pharmacy',
  patient: '/patient',
  admin: '/admin',
}

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl
    const role = req.nextauth.token?.role as string | undefined

    // Logged in, but role has not been assigned yet
    if (!role && !pathname.startsWith('/pending')) {
      return NextResponse.redirect(new URL('/pending', req.url))
    }

    // Stop users from visiting dashboards that do not match their role
    for (const [prefix, requiredRole] of Object.entries(ROLE_ROUTES)) {
      if (pathname.startsWith(prefix) && role !== requiredRole) {
        const destination = role ? ROLE_HOME[role] ?? '/pending' : '/pending'
        return NextResponse.redirect(new URL(destination, req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/doctor/:path*',
    '/staff/:path*',
    '/pharmacy/:path*',
    '/patient/:path*',
    '/admin/:path*',
    '/pending',
  ],
}