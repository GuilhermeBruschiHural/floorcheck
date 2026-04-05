import { Users, Clock } from 'lucide-react'
import StatusBadge from './StatusBadge'

function formatDuration(seconds) {
  if (!seconds || seconds < 1) return '0s'
  if (seconds < 60) return `${Math.floor(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

export default function ZoneCard({ zone }) {
  const { zone_name, status, person_count, idle_duration } = zone

  return (
    <div className={`glass rounded-xl p-4 border transition-all ${
      status === 'active'
        ? 'border-emerald-500/30 shadow-emerald-500/5 shadow-lg'
        : status === 'warning'
        ? 'border-amber-500/30'
        : 'border-red-500/30 shadow-red-500/5 shadow-lg'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-white">{zone_name}</h3>
        <StatusBadge status={status} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300">
            {person_count} {person_count === 1 ? 'operador' : 'operadores'}
          </span>
        </div>

        {status !== 'active' && idle_duration > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">
              Ocioso há {formatDuration(idle_duration)}
            </span>
          </div>
        )}
      </div>

      {/* Mini progress bar */}
      <div className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            status === 'active' ? 'bg-emerald-500' : status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: status === 'active' ? '100%' : status === 'warning' ? '50%' : '15%' }}
        />
      </div>
    </div>
  )
}
