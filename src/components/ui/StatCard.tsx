import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: 'green' | 'amber' | 'red' | 'gray'
  icon?: React.ReactNode
}

export function StatCard({ label, value, sub, accent = 'green', icon }: StatCardProps) {
  const accentMap = {
    green: 'bg-pine-100 text-pine-700',
    amber: 'bg-amber-100 text-amber-700',
    red:   'bg-red-100 text-red-600',
    gray:  'bg-gray-100 text-gray-500',
  }
  return (
    <div className="card p-5 flex items-start gap-4">
      {icon && (
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', accentMap[accent])}>
          <span className="w-5 h-5">{icon}</span>
        </div>
      )}
      <div>
        <p className="text-pine-400 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-pine-900 text-2xl font-bold font-display mt-0.5">{value}</p>
        {sub && <p className="text-pine-400 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:    'badge badge-amber',
    confirmed:  'badge badge-green',
    ready:      'badge badge-green',
    dispatched: 'badge bg-blue-100 text-blue-700',
    completed:  'badge bg-pine-100 text-pine-700',
    cancelled:  'badge badge-red',
  }
  return <span className={map[status] ?? 'badge badge-gray'}>{status}</span>
}

export function PrescriptionStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:   'badge badge-amber',
    approved:  'badge badge-green',
    rejected:  'badge badge-red',
    fulfilled: 'badge badge-gray',
  }
  return <span className={map[status] ?? 'badge badge-gray'}>{status}</span>
}
