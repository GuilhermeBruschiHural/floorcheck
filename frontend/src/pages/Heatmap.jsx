import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Clock, Route, AlertTriangle, ArrowRight, Users } from 'lucide-react'
import CameraFeed, { MOCK_ZONES } from '../components/CameraFeed'

const TIME_RANGES = [
  { label: '1 min', seconds: 60 },
  { label: '5 min', seconds: 300 },
  { label: '15 min', seconds: 900 },
]

const LAYER_MODES = ['heatmap', 'trails', 'both']

function generateHeatmapGrid(positions, gridSize, timeRange) {
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0))
  const now = Date.now()
  const filtered = positions.filter((p) => now - p.t < timeRange * 1000)
  filtered.forEach((p) => {
    const gx = Math.floor(p.x * gridSize)
    const gy = Math.floor(p.y * gridSize)
    if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) grid[gy][gx]++
  })
  return grid
}

function getFlowData(positions) {
  const flows = {}
  const sorted = [...positions].sort((a, b) => a.t - b.t)
  const byWorker = {}
  sorted.forEach((p) => {
    if (!byWorker[p.workerId]) byWorker[p.workerId] = []
    byWorker[p.workerId].push(p)
  })
  Object.values(byWorker).forEach((trail) => {
    for (let i = 1; i < trail.length; i++) {
      const fromZone = MOCK_ZONES.find((z) => pointInZoneSimple(trail[i - 1].x, trail[i - 1].y, z.polygon))
      const toZone = MOCK_ZONES.find((z) => pointInZoneSimple(trail[i].x, trail[i].y, z.polygon))
      if (fromZone && toZone && fromZone.id !== toZone.id) {
        const key = `${fromZone.name} → ${toZone.name}`
        flows[key] = (flows[key] || 0) + 1
      }
    }
  })
  return Object.entries(flows).sort((a, b) => b[1] - a[1]).slice(0, 6)
}

function pointInZoneSimple(px, py, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function getDwellTime(positions) {
  const dwell = {}
  MOCK_ZONES.forEach((z) => { dwell[z.name] = 0 })
  dwell['Trânsito'] = 0
  positions.forEach((p) => {
    const zone = MOCK_ZONES.find((z) => pointInZoneSimple(p.x, p.y, z.polygon))
    if (zone) dwell[zone.name]++
    else dwell['Trânsito']++
  })
  // Convert to percentage
  const total = positions.length || 1
  return Object.entries(dwell).map(([name, count]) => ({ name, pct: Math.round((count / total) * 100) }))
}

export default function Heatmap() {
  const [positions, setPositions] = useState([])
  const [timeRange, setTimeRange] = useState(300)
  const [layer, setLayer] = useState('both')
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  const handlePositionUpdate = useCallback((data) => { setPositions([...data]) }, [])

  // Draw heatmap canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || positions.length === 0) return

    const draw = () => {
      const ctx = canvas.getContext('2d')
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr; canvas.height = rect.height * dpr; ctx.scale(dpr, dpr)
      const w = rect.width, h = rect.height

      // Background
      ctx.fillStyle = '#1a1d23'; ctx.fillRect(0, 0, w, h)
      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1
      for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
      for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }

      // Zone outlines
      MOCK_ZONES.forEach((zone) => {
        const pts = zone.polygon.map(([x, y]) => [x * w, y * h])
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
        ctx.beginPath(); pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)); ctx.closePath(); ctx.stroke()
        ctx.setLineDash([])
        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = `bold ${Math.max(10, w * 0.014)}px sans-serif`
        const cx = (pts[0][0] + pts[2][0]) / 2, cy = (pts[0][1] + pts[2][1]) / 2
        ctx.textAlign = 'center'; ctx.fillText(zone.name, cx, cy); ctx.textAlign = 'left'
      })

      const now = Date.now()
      const filtered = positions.filter((p) => now - p.t < timeRange * 1000)

      // Heatmap layer
      if (layer === 'heatmap' || layer === 'both') {
        const gridSize = 50
        const grid = generateHeatmapGrid(filtered, gridSize, timeRange)
        const maxVal = Math.max(1, ...grid.flat())
        const cellW = w / gridSize, cellH = h / gridSize

        grid.forEach((row, gy) => {
          row.forEach((val, gx) => {
            if (val === 0) return
            const intensity = val / maxVal
            const r = Math.floor(255 * Math.min(1, intensity * 2))
            const g = Math.floor(255 * Math.max(0, 1 - intensity * 1.5))
            const b = Math.floor(100 * Math.max(0, 1 - intensity * 3))
            ctx.fillStyle = `rgba(${r},${g},${b},${0.15 + intensity * 0.5})`
            ctx.fillRect(gx * cellW, gy * cellH, cellW + 1, cellH + 1)
          })
        })
      }

      // Trails layer
      if (layer === 'trails' || layer === 'both') {
        const byWorker = {}
        filtered.forEach((p) => {
          if (!byWorker[p.workerId]) byWorker[p.workerId] = []
          byWorker[p.workerId].push(p)
        })
        const trailColors = ['#06b6d4', '#22c55e', '#f97316', '#ec4899']
        Object.entries(byWorker).forEach(([wid, trail]) => {
          if (trail.length < 2) return
          ctx.strokeStyle = trailColors[wid % trailColors.length]
          ctx.lineWidth = 2; ctx.globalAlpha = 0.6
          ctx.beginPath()
          trail.forEach((p, i) => {
            const px = p.x * w, py = p.y * h
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
          })
          ctx.stroke()
          // Current position dot
          const last = trail[trail.length - 1]
          ctx.globalAlpha = 1; ctx.fillStyle = trailColors[wid % trailColors.length]
          ctx.beginPath(); ctx.arc(last.x * w, last.y * h, 5, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = '#fff'; ctx.font = '9px sans-serif'
          ctx.fillText(last.name || `W${wid}`, last.x * w + 8, last.y * h + 3)
        })
        ctx.globalAlpha = 1
      }

      // Legend
      const legendY = h - 30
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, legendY, w, 30)
      ctx.font = '10px sans-serif'; ctx.fillStyle = '#9ca3af'
      ctx.fillText(`Posições: ${filtered.length} | Range: ${timeRange}s | Layer: ${layer}`, 8, legendY + 18)

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [positions, timeRange, layer])

  const flows = getFlowData(positions)
  const dwell = getDwellTime(positions)

  // Bottleneck detection (zones where multiple workers congregate)
  const bottlenecks = MOCK_ZONES.map((zone) => {
    const count = positions.filter((p) => {
      const recent = Date.now() - p.t < 30000
      return recent && pointInZoneSimple(p.x, p.y, zone.polygon)
    }).length
    return { zone: zone.name, density: count }
  }).filter((b) => b.density > 15).sort((a, b) => b.density - a.density)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-6 h-6 text-factory-400" />
          Movement Heatmap & Bottlenecks
        </h1>
        <p className="text-sm text-gray-400 mt-1">Análise de movimentação e detecção de gargalos</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          {TIME_RANGES.map((tr) => (
            <button key={tr.seconds} onClick={() => setTimeRange(tr.seconds)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${timeRange === tr.seconds ? 'bg-factory-500/20 text-factory-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              {tr.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-gray-400" />
          {LAYER_MODES.map((m) => (
            <button key={m} onClick={() => setLayer(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${layer === m ? 'bg-factory-500/20 text-factory-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap + Feed side by side */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Heatmap Canvas */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-factory-400" />
            <span className="text-sm font-medium">Mapa de Calor</span>
          </div>
          <div className="aspect-video bg-gray-900">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
        </div>

        {/* Live Camera (feeds position data) */}
        <CameraFeed onZoneUpdate={() => {}} onPositionUpdate={handlePositionUpdate} />
      </div>

      {/* Analytics Row */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Zone Dwell Time */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Tempo por Zona
          </h3>
          <div className="space-y-3">
            {dwell.map((d) => (
              <div key={d.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">{d.name}</span>
                  <span className="text-gray-500">{d.pct}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-factory-500 rounded-full transition-all duration-500" style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flow Diagram */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <Route className="w-4 h-4" /> Fluxo entre Zonas
          </h3>
          {flows.length > 0 ? (
            <div className="space-y-2">
              {flows.map(([path, count], i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                  <span className="text-xs text-gray-300 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-factory-400" /> {path}
                  </span>
                  <span className="text-xs font-medium text-factory-400">{count}x</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-6">Coletando dados de movimentação...</p>
          )}
        </div>

        {/* Bottleneck Alerts */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Alertas de Gargalo
          </h3>
          {bottlenecks.length > 0 ? (
            <div className="space-y-2">
              {bottlenecks.map((b, i) => (
                <div key={i} className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-300">{b.zone}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Alta densidade: {b.density} pontos nos últimos 30s</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Nenhum gargalo detectado</p>
              <p className="text-xs text-gray-600 mt-1">Fluxo normal de operadores</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
