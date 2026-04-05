import { useState, useCallback } from 'react'
import { Activity, Users, AlertTriangle, Clock, MonitorPlay } from 'lucide-react'
import CameraFeed from '../components/CameraFeed'
import ZoneCard from '../components/ZoneCard'

export default function Dashboard() {
  const [zones, setZones] = useState({})

  const handleZoneUpdate = useCallback((zoneData) => {
    setZones(zoneData)
  }, [])

  const zoneList = Object.values(zones)
  const activeCount = zoneList.filter(z => z.status === 'active').length
  const idleCount = zoneList.filter(z => z.status === 'idle').length
  const warningCount = zoneList.filter(z => z.status === 'warning').length
  const totalWorkers = zoneList.reduce((sum, z) => sum + (z.person_count || 0), 0)
  const isDemo = zoneList.length > 0

  const summaryCards = [
    {
      label: 'Zonas Ativas',
      value: activeCount,
      icon: Activity,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Zonas Ociosas',
      value: idleCount,
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    {
      label: 'Em Alerta',
      value: warningCount,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Operadores Detectados',
      value: totalWorkers,
      icon: Users,
      color: 'text-factory-400',
      bg: 'bg-factory-500/10',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-400">Monitoramento em tempo real do chão de fábrica</p>
        </div>
        {isDemo && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <MonitorPlay className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">Modo Demo</span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Camera Feed - Takes 2 columns */}
        <div className="lg:col-span-2">
          <CameraFeed onZoneUpdate={handleZoneUpdate} />
        </div>

        {/* Zone Status - 1 column */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapPinIcon />
            Status das Zonas
          </h2>
          {zoneList.length > 0 ? (
            zoneList.map((zone) => (
              <ZoneCard key={zone.zone_id} zone={zone} />
            ))
          ) : (
            <div className="glass rounded-xl p-8 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-factory-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Iniciando simulação...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MapPinIcon() {
  return (
    <svg className="w-5 h-5 text-factory-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
