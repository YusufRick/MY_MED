import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/auth/login')

  const roleRedirects: Record<string, string> = {
    doctor:       '/doctor',
    clinic_staff: '/staff',
    pharmacy:     '/pharmacy',
    patient:      '/patient',
    admin:        '/admin',
  }

  const role = session.user.role ?? ''
  const dest = roleRedirects[role] ?? '/pending'
  redirect(dest)
}
