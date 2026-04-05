import { useState, useCallback } from 'react'
import { Shield, AlertTriangle, CheckCircle2, HardHat, Eye, ShirtIcon, Users, TrendingUp } from 'lucide-react'
import CameraFeed from '../components/CameraFeed'
import ProductivityChart from '../components/ProductivityChart'

const PPE_LABELS = { capacete: 'Capacete', colete: 'Colete', oculos: 'Óculos' }
const PPE_ICONS = { capacete: HardHat, colete: ShirtIcon, oculos: Eye }

// Demo historical data
const demoViolationsByZone = [
  { name: 'CNC-01', ativo: 95, ocioso: 5 },
  { name: 'Torno-01', ativo: 88, ocioso: 12 },
  { name: 'Fresa-01', ativo: 78, ocioso: 22 },
  { name: 'Solda-01', ativo: 92, ocioso: 8 },
]
const demoPPEBreakdown = [
  { name: 'Capacete', value: 12 },
  { name: 'Colete', value: 23 },
  { name: 'Óculos', value: 31 },
]

export default function Safety() {
  const [safety, setSafety] = useState({ workers: [], violations: 0, compliance: 100 })
  const [violationLog, setViolationLog] = useState([])

  const handleSafetyUpdate = useCallback((data) => {
    setSafety(data)
    // Log new violations
    data.workers.forEach((w) => {
      if (w.violations.length > 0) {
        setViolationLog((prev) => {
          const entry = {
            id: Date.now() + w.id,
            worker: w.name,
            zone: w.zone,
            items: w.violations.map((v) => PPE_LABELS[v]),
            time: new Date().toLocaleTimeString('pt-BR'),
          }
          return [entry, ...prev].slice(0, 30)
        })
      }
    })
  }, [])

  const compliantCount = safety.workers.filter((w) => w.compliant).length
  const totalWorkers = safety.workers.length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            Smart Safety Compliance
          </h1>
          <p className="text-sm text-gray-400 mt-1">Monitoramento de EPIs em tempo real via IA</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <span className="text-xs font-medium text-amber-400">NR-6 Compliance</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Compliance Score */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                <circle cx="28" cy="28" r="24" fill="none"
                  stroke={safety.compliance >= 90 ? '#10b981' : safety.compliance >= 70 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${(safety.compliance / 100) * 150.8} 150.8`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                {safety.compliance}%
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400">Conformidade</p>
              <p className="text-xs text-gray-500">EPIs</p>
            </div>
          </div>
        </div>

        {/* Active Violations */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{safety.violations}</p>
              <p className="text-xs text-gray-400">Violações Ativas</p>
            </div>
          </div>
        </div>

        {/* Compliant Workers */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{compliantCount}/{totalWorkers}</p>
              <p className="text-xs text-gray-400">Em Conformidade</p>
            </div>
          </div>
        </div>

        {/* Today's Violations */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-factory-500/10">
              <TrendingUp className="w-5 h-5 text-factory-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{violationLog.length}</p>
              <p className="text-xs text-gray-400">Ocorrências Hoje</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Camera Feed */}
        <div className="lg:col-span-2">
          <CameraFeed onSafetyUpdate={handleSafetyUpdate} onZoneUpdate={() => {}} />
        </div>

        {/* Worker PPE Status */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Status dos Operadores</h2>
          {safety.workers.length > 0 ? safety.workers.map((w) => (
            <div key={w.id} className={`glass rounded-xl p-4 border ${w.compliant ? 'border-emerald-500/20' : 'border-red-500/30 shadow-red-500/5 shadow-lg'}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-sm">{w.name}</p>
                  <p className="text-xs text-gray-500">{w.zone}</p>
                </div>
                {w.compliant ? (
                  <span className="status-active px-2 py-0.5 rounded-full text-xs font-medium border">OK</span>
                ) : (
                  <span className="status-idle px-2 py-0.5 rounded-full text-xs font-medium border animate-pulse">ALERTA</span>
                )}
              </div>
              <div className="flex gap-2">
                {Object.entries(w.ppe).map(([key, ok]) => {
                  const Icon = PPE_ICONS[key] || Shield
                  return (
                    <div key={key} className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      <Icon className="w-3 h-3" />
                      {PPE_LABELS[key]}
                    </div>
                  )
                })}
              </div>
            </div>
          )) : (
            <div className="glass rounded-xl p-8 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-factory-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-gray-500">Iniciando detecção de EPIs...</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts + Log */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Compliance by Zone */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Conformidade por Zona (%)</h3>
          <ProductivityChart data={demoViolationsByZone} type="bar" />
        </div>

        {/* PPE Breakdown */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Violações por Item</h3>
          <ProductivityChart data={demoPPEBreakdown} type="pie" />
        </div>

        {/* Violation Log */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Registro de Ocorrências</h3>
          <div className="glass rounded-xl p-3 max-h-[280px] overflow-y-auto space-y-2">
            {violationLog.length > 0 ? violationLog.map((v) => (
              <div key={v.id} className="flex items-start gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-red-300">{v.worker} — {v.zone}</p>
                  <p className="text-xs text-gray-500">Sem: {v.items.join(', ')}</p>
                  <p className="text-xs text-gray-600">{v.time}</p>
                </div>
              </div>
            )) : (
              <p className="text-xs text-gray-500 text-center py-4">Nenhuma ocorrência registrada</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
