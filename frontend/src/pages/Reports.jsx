import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Clock, Calendar } from 'lucide-react'
import ProductivityChart from '../components/ProductivityChart'

const API_BASE = '/api'

export default function Reports() {
  const [analytics, setAnalytics] = useState(null)
  const [period, setPeriod] = useState(7)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  async function fetchAnalytics() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/analytics?days=${period}`)
      if (res.ok) {
        setAnalytics(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  // Transform data for charts
  const dailyData = analytics?.daily_stats
    ? Object.entries(analytics.daily_stats)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({
          name: date.slice(5), // MM-DD
          ativo: Math.round(data.active),
          ocioso: Math.round(data.idle),
        }))
    : []

  const zoneData = analytics?.zone_stats
    ? Object.entries(analytics.zone_stats).map(([name, data]) => ({
        name,
        ativo: Math.round(data.active),
        ocioso: Math.round(data.idle),
      }))
    : []

  const pieData = analytics?.zone_stats
    ? (() => {
        const totalActive = Object.values(analytics.zone_stats).reduce((s, d) => s + d.active, 0)
        const totalIdle = Object.values(analytics.zone_stats).reduce((s, d) => s + d.idle, 0)
        return [
          { name: 'Tempo Ativo', value: Math.round(totalActive) },
          { name: 'Tempo Ocioso', value: Math.round(totalIdle) },
        ]
      })()
    : []

  const hourlyData = analytics?.hourly_stats
    ? Object.entries(analytics.hourly_stats)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([hour, data]) => ({
          name: `${hour}h`,
          ativo: data.count > 0 ? Math.round(data.active / data.count) : 0,
          ocioso: data.count > 0 ? Math.round(data.idle / data.count) : 0,
        }))
    : []

  // Summary stats
  const totalActive = analytics?.zone_stats
    ? Object.values(analytics.zone_stats).reduce((s, d) => s + d.active, 0)
    : 0
  const totalIdle = analytics?.zone_stats
    ? Object.values(analytics.zone_stats).reduce((s, d) => s + d.idle, 0)
    : 0
  const productivity = totalActive + totalIdle > 0
    ? ((totalActive / (totalActive + totalIdle)) * 100).toFixed(1)
    : 0

  // Demo data for when no backend data is available
  const demoDaily = [
    { name: '03-28', ativo: 420, ocioso: 60 },
    { name: '03-29', ativo: 390, ocioso: 90 },
    { name: '03-30', ativo: 450, ocioso: 30 },
    { name: '03-31', ativo: 380, ocioso: 100 },
    { name: '04-01', ativo: 440, ocioso: 40 },
    { name: '04-02', ativo: 410, ocioso: 70 },
    { name: '04-03', ativo: 430, ocioso: 50 },
  ]
  const demoZone = [
    { name: 'CNC-01', ativo: 380, ocioso: 100 },
    { name: 'Torno-01', ativo: 420, ocioso: 60 },
    { name: 'Fresa-01', ativo: 350, ocioso: 130 },
    { name: 'Solda-01', ativo: 290, ocioso: 190 },
  ]
  const demoPie = [
    { name: 'Tempo Ativo', value: 1440 },
    { name: 'Tempo Ocioso', value: 480 },
  ]
  const demoHourly = Array.from({ length: 10 }, (_, i) => ({
    name: `${i + 7}h`,
    ativo: 40 + Math.floor(Math.random() * 20),
    ocioso: 5 + Math.floor(Math.random() * 15),
  }))

  const useDemo = dailyData.length === 0
  const chartDaily = useDemo ? demoDaily : dailyData
  const chartZone = useDemo ? demoZone : zoneData
  const chartPie = useDemo ? demoPie : pieData
  const chartHourly = useDemo ? demoHourly : hourlyData
  const displayProductivity = useDemo ? '75.0' : productivity

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-factory-400" />
            Relatórios
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Análise de produtividade do chão de fábrica
            {useDemo && <span className="text-amber-400 ml-2">(Dados de demonstração)</span>}
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          {[1, 7, 30].map((d) => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === d
                  ? 'bg-factory-500/20 text-factory-300'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {d === 1 ? 'Hoje' : d === 7 ? '7 dias' : '30 dias'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{displayProductivity}%</p>
              <p className="text-xs text-gray-400">Taxa de Produtividade</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-factory-500/10">
              <Clock className="w-5 h-5 text-factory-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{useDemo ? '1440' : Math.round(totalActive)}m</p>
              <p className="text-xs text-gray-400">Tempo Ativo Total</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Clock className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{useDemo ? '480' : Math.round(totalIdle)}m</p>
              <p className="text-xs text-gray-400">Tempo Ocioso Total</p>
            </div>
          </div>
        </div>
      </div>

      {loading && !useDemo ? (
        <div className="glass rounded-xl p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-factory-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-400">Carregando relatórios...</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Daily Productivity */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Produtividade Diária (minutos)</h3>
            <ProductivityChart data={chartDaily} type="bar" />
          </div>

          {/* Zone Comparison */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Produtividade por Zona (minutos)</h3>
            <ProductivityChart data={chartZone} type="bar" />
          </div>

          {/* Overall Split */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Distribuição Geral</h3>
            <ProductivityChart data={chartPie} type="pie" />
          </div>

          {/* Hourly Pattern */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Padrão por Hora (média)</h3>
            <ProductivityChart data={chartHourly} type="bar" />
          </div>
        </div>
      )}
    </div>
  )
}
