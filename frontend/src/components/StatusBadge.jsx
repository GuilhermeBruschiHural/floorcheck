import { Activity, AlertTriangle, XCircle } from 'lucide-react'

const statusConfig = {
  active: {
    label: 'Ativo',
    class: 'status-active',
    pulse: 'pulse-active',
    icon: Activity,
  },
  warning: {
    label: 'Alerta',
    class: 'status-warning',
    pulse: '',
    icon: AlertTriangle,
  },
  idle: {
    label: 'Ocioso',
    class: 'status-idle',
    pulse: 'pulse-idle',
    icon: XCircle,
  },
}

export default function StatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status] || statusConfig.idle
  const Icon = config.icon

  const sizeClasses = size === 'lg'
    ? 'px-3 py-1.5 text-sm gap-2'
    : 'px-2 py-0.5 text-xs gap-1'

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${config.class} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current ${config.pulse}`} />
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />
      {config.label}
    </span>
  )
}
