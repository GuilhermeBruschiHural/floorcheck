import { useState, useEffect, useRef, useCallback } from 'react'
import { Camera, CameraOff, Maximize2, Minimize2, MonitorPlay } from 'lucide-react'

// ── Mock zone config ─────────────────────────────────────────────────────
export const MOCK_ZONES = [
  { id: 1, name: 'CNC-01',   polygon: [[0.03,0.06],[0.30,0.06],[0.30,0.46],[0.03,0.46]], color: '#3b82f6', machine: 'CNC' },
  { id: 2, name: 'Torno-01', polygon: [[0.36,0.06],[0.63,0.06],[0.63,0.46],[0.36,0.46]], color: '#8b5cf6', machine: 'TORNO' },
  { id: 3, name: 'Fresa-01', polygon: [[0.03,0.54],[0.30,0.54],[0.30,0.94],[0.03,0.94]], color: '#f59e0b', machine: 'FRESA' },
  { id: 4, name: 'Solda-01', polygon: [[0.36,0.54],[0.63,0.54],[0.63,0.94],[0.36,0.94]], color: '#ef4444', machine: 'SOLDA' },
]

const WORKER_COLORS = ['#06b6d4', '#22c55e', '#f97316', '#ec4899']
const WORKER_NAMES = ['Carlos S.', 'Ana M.', 'Pedro L.', 'Julia R.']
const PPE_ITEMS = ['capacete', 'colete', 'oculos']

function createWorkers() {
  return MOCK_ZONES.map((zone, i) => {
    const cx = (zone.polygon[0][0] + zone.polygon[2][0]) / 2
    const cy = (zone.polygon[0][1] + zone.polygon[2][1]) / 2
    return {
      id: i, name: WORKER_NAMES[i], homeX: cx, homeY: cy, x: cx, y: cy,
      zoneId: zone.id, color: WORKER_COLORS[i],
      phase: Math.random() * Math.PI * 2, wanderRadius: 0.04,
      isAway: false, awayTimer: 8 + Math.random() * 15, returnTimer: 0,
      // PPE state
      ppe: { capacete: true, colete: true, oculos: true },
      ppeTimer: 15 + Math.random() * 25, // time until next PPE toggle
    }
  })
}

function pointInZone(px, py, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
      inside = !inside
  }
  return inside
}

// ── Canvas draw helpers ──────────────────────────────────────────────────

function drawFloor(ctx, w, h) {
  ctx.fillStyle = '#1a1d23'; ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1
  for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
  for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
  ctx.setLineDash([12, 8]); ctx.strokeStyle = 'rgba(250,204,21,0.2)'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(0, h * 0.495); ctx.lineTo(w, h * 0.495); ctx.stroke(); ctx.setLineDash([])
  ctx.fillStyle = 'rgba(255,255,255,0.015)'; ctx.fillRect(w * 0.68, 0, w * 0.32, h)
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; ctx.strokeRect(w * 0.68, 0, w * 0.32, h)
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.font = `${Math.max(10, w * 0.014)}px monospace`
  ctx.fillText('PAINEL DE CONTROLE', w * 0.70, h * 0.06)
  for (let i = 0; i < 3; i++) {
    const gx = w * 0.72, gy = h * 0.12 + i * h * 0.10
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.strokeRect(gx, gy, w * 0.22, h * 0.06)
    ctx.fillStyle = `rgba(${i === 0 ? '59,130,246' : i === 1 ? '34,197,94' : '239,68,68'},0.15)`
    ctx.fillRect(gx + 2, gy + 2, w * 0.22 * (0.4 + Math.random() * 0.5) - 4, h * 0.06 - 4)
  }
}

function drawMachine(ctx, zone, w, h) {
  const [x1, y1] = zone.polygon[0], [x2, y2] = zone.polygon[2]
  const px1 = x1 * w, py1 = y1 * h, mw = x2 * w - px1, mh = y2 * h - py1
  ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(px1 + mw * 0.15, py1 + mh * 0.15, mw * 0.7, mh * 0.7)
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.strokeRect(px1 + mw * 0.15, py1 + mh * 0.15, mw * 0.7, mh * 0.7)
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.font = `bold ${Math.max(11, mw * 0.09)}px monospace`; ctx.textAlign = 'center'
  ctx.fillText(zone.machine, px1 + mw * 0.5, py1 + mh * 0.55); ctx.textAlign = 'left'
}

function drawZoneOverlay(ctx, zone, status, w, h) {
  const pts = zone.polygon.map(([x, y]) => [x * w, y * h])
  const sc = status === 'active' ? '16,185,129' : status === 'warning' ? '245,158,11' : '239,68,68'
  ctx.fillStyle = `rgba(${sc},0.08)`; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = `rgba(${sc},0.6)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.stroke()
  const label = `${zone.name}: ${status === 'active' ? 'ATIVO' : status === 'warning' ? 'ALERTA' : 'OCIOSO'}`
  const lc = status === 'active' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444'
  ctx.font = `bold ${Math.max(10, w * 0.016)}px sans-serif`
  const tw = ctx.measureText(label).width
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(pts[0][0], pts[0][1] - h * 0.04, tw + 12, h * 0.045)
  ctx.fillStyle = lc; ctx.fillText(label, pts[0][0] + 4, pts[0][1] - h * 0.008)
}

function drawWorker(ctx, worker, w, h, t) {
  const px = worker.x * w, py = worker.y * h, size = Math.max(8, w * 0.018)
  const allPPE = worker.ppe.capacete && worker.ppe.colete && worker.ppe.oculos
  const bboxColor = allPPE ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.8)'

  // Bounding box
  const bx = px - size * 1.2, by = py - size * 2.8, bw = size * 2.4, bh = size * 4.2
  ctx.strokeStyle = bboxColor; ctx.lineWidth = allPPE ? 1.5 : 2; ctx.strokeRect(bx, by, bw, bh)

  // Confidence label
  const conf = (88 + Math.sin(t + worker.phase) * 8).toFixed(0)
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.font = `${Math.max(9, w * 0.012)}px sans-serif`
  const confText = `Person ${conf}%`
  ctx.fillRect(bx, by - h * 0.03, ctx.measureText(confText).width + 6, h * 0.03)
  ctx.fillStyle = 'rgba(255,200,0,0.9)'; ctx.fillText(confText, bx + 3, by - h * 0.005)

  // PPE indicators (right side of bbox)
  const ppeItems = [
    { key: 'capacete', icon: 'C', ok: worker.ppe.capacete },
    { key: 'colete',   icon: 'V', ok: worker.ppe.colete },
    { key: 'oculos',   icon: 'O', ok: worker.ppe.oculos },
  ]
  const ppeSize = Math.max(8, w * 0.012)
  ppeItems.forEach((item, i) => {
    const ix = bx + bw + 3, iy = by + i * (ppeSize + 3)
    ctx.fillStyle = item.ok ? 'rgba(16,185,129,0.8)' : 'rgba(239,68,68,0.9)'
    ctx.fillRect(ix, iy, ppeSize, ppeSize)
    ctx.fillStyle = '#fff'; ctx.font = `bold ${ppeSize - 2}px sans-serif`
    ctx.fillText(item.icon, ix + 1, iy + ppeSize - 2)
  })

  // Head
  ctx.fillStyle = worker.color; ctx.beginPath(); ctx.arc(px, py - size * 1.6, size * 0.6, 0, Math.PI * 2); ctx.fill()
  // Hard hat (only if wearing)
  if (worker.ppe.capacete) {
    ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.ellipse(px, py - size * 2.0, size * 0.7, size * 0.25, 0, Math.PI, 0); ctx.fill()
  }
  // Vest indicator
  ctx.fillStyle = worker.ppe.colete ? '#f97316' : worker.color
  ctx.fillRect(px - size * 0.5, py - size * 1.0, size, size * 1.5)
  if (worker.ppe.colete) {
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(px - size * 0.5, py - size * 0.3); ctx.lineTo(px + size * 0.5, py - size * 0.3); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(px - size * 0.5, py + size * 0.1); ctx.lineTo(px + size * 0.5, py + size * 0.1); ctx.stroke()
  }
  // Legs
  ctx.fillStyle = '#374151'
  const ls = Math.sin(t * 3 + worker.phase) * size * 0.2
  ctx.fillRect(px - size * 0.4 + ls, py + size * 0.5, size * 0.35, size * 0.9)
  ctx.fillRect(px + size * 0.05 - ls, py + size * 0.5, size * 0.35, size * 0.9)
  // Arms
  ctx.strokeStyle = worker.color; ctx.lineWidth = Math.max(2, size * 0.18); ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(px - size * 0.5, py - size * 0.7); ctx.lineTo(px - size * 1.0, py - size * 0.2 + Math.sin(t * 2 + worker.phase) * size * 0.3); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(px + size * 0.5, py - size * 0.7); ctx.lineTo(px + size * 1.0, py - size * 0.2 - Math.sin(t * 2 + worker.phase) * size * 0.3); ctx.stroke()
  ctx.lineCap = 'butt'
}

function drawHUD(ctx, w, h, violationCount) {
  const ts = new Date().toLocaleString('pt-BR')
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, h - h * 0.05, w * 0.28, h * 0.05)
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = `${Math.max(10, w * 0.014)}px monospace`
  ctx.fillText(ts, 6, h - h * 0.012)
  // DEMO badge
  ctx.font = `bold ${Math.max(10, w * 0.014)}px sans-serif`
  const badgeText = 'MODO DEMO'; const badgeW = ctx.measureText(badgeText).width + 16; const badgeH = h * 0.045
  ctx.fillStyle = 'rgba(245,158,11,0.15)'; ctx.fillRect(w - badgeW - 8, 8, badgeW, badgeH)
  ctx.strokeStyle = 'rgba(245,158,11,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(w - badgeW - 8, 8, badgeW, badgeH)
  ctx.fillStyle = '#f59e0b'; ctx.fillText(badgeText, w - badgeW, 8 + badgeH * 0.7)
  // Camera ID
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, w * 0.16, h * 0.045)
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = `${Math.max(9, w * 0.012)}px monospace`
  ctx.fillText('CAM-01 | DEMO', 6, h * 0.03)
  // EPI violation alert
  if (violationCount > 0) {
    const alertText = `ALERTA EPI: ${violationCount} violacao(oes)`
    ctx.font = `bold ${Math.max(11, w * 0.015)}px sans-serif`
    const aw = ctx.measureText(alertText).width + 20
    const ax = (w - aw) / 2, ay = h - h * 0.10
    ctx.fillStyle = 'rgba(239,68,68,0.85)'; ctx.fillRect(ax, ay, aw, h * 0.04)
    ctx.fillStyle = '#fff'; ctx.fillText(alertText, ax + 10, ay + h * 0.028)
  }
}

// ═════════════════════════════════════════════════════════════════════════
// Component
// ═════════════════════════════════════════════════════════════════════════

export default function CameraFeed({ onZoneUpdate, onSafetyUpdate, onPositionUpdate }) {
  const [frame, setFrame] = useState(null)
  const [connected, setConnected] = useState(false)
  const [mockMode, setMockMode] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const wsRef = useRef(null)
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const reconnectTimer = useRef(null)
  const noFrameTimer = useRef(null)
  const failCount = useRef(0)
  const gotFrame = useRef(false)
  const workersRef = useRef(createWorkers())
  const animRef = useRef(null)
  const zoneStatusRef = useRef({})
  const positionHistoryRef = useRef([])

  const activateMock = useCallback(() => {
    setMockMode(true); setConnected(false)
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
  }, [])

  // ── WebSocket (real mode) ───────────────────────────────────────────
  const connect = useCallback(() => {
    if (mockMode) return
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    try {
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/feed`)
      wsRef.current = ws
      ws.onopen = () => {
        setConnected(true); failCount.current = 0; gotFrame.current = false
        clearTimeout(noFrameTimer.current)
        noFrameTimer.current = setTimeout(() => { if (!gotFrame.current) activateMock() }, 3000)
        const pi = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' })) }, 30000)
        ws._pingInterval = pi
      }
      ws.onmessage = (e) => { const d = JSON.parse(e.data); if (d.type === 'frame') { gotFrame.current = true; clearTimeout(noFrameTimer.current); setFrame(d.frame); onZoneUpdate?.(d.zones) } }
      ws.onclose = () => { setConnected(false); clearInterval(ws._pingInterval); clearTimeout(noFrameTimer.current); failCount.current += 1; if (failCount.current >= 2) activateMock(); else reconnectTimer.current = setTimeout(connect, 2000) }
      ws.onerror = () => ws.close()
    } catch { failCount.current += 1; if (failCount.current >= 2) activateMock() }
  }, [onZoneUpdate, mockMode, activateMock])

  useEffect(() => { connect(); return () => { wsRef.current?.close(); clearTimeout(reconnectTimer.current); clearTimeout(noFrameTimer.current) } }, [connect])

  // ── Mock animation loop ─────────────────────────────────────────────
  useEffect(() => {
    if (!mockMode) return
    let lastStatusUpdate = 0; let lastPositionSample = 0
    const idleTimers = {}

    const animate = (timestamp) => {
      const canvas = canvasRef.current
      if (!canvas) { animRef.current = requestAnimationFrame(animate); return }
      const ctx = canvas.getContext('2d')
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr; canvas.height = rect.height * dpr; ctx.scale(dpr, dpr)
      }
      const w = rect.width, h = rect.height, t = timestamp / 1000
      const workers = workersRef.current

      // ── Update workers ──────────────────────────────────────────
      workers.forEach((wr) => {
        // PPE timer
        wr.ppeTimer -= 1 / 60
        if (wr.ppeTimer <= 0) {
          const item = PPE_ITEMS[Math.floor(Math.random() * PPE_ITEMS.length)]
          wr.ppe[item] = !wr.ppe[item]
          wr.ppeTimer = 15 + Math.random() * 30
        }

        if (!wr.isAway) {
          wr.x = wr.homeX + Math.sin(t * 0.7 + wr.phase) * wr.wanderRadius
          wr.y = wr.homeY + Math.cos(t * 0.5 + wr.phase * 1.3) * wr.wanderRadius * 0.6
          wr.awayTimer -= 1 / 60
          if (wr.awayTimer <= 0) { wr.isAway = true; wr.returnTimer = 6 + Math.random() * 14 }
        } else {
          const tx = 0.80 + Math.sin(wr.phase) * 0.06, ty = 0.25 + wr.id * 0.15
          wr.x += (tx - wr.x) * 0.02; wr.y += (ty - wr.y) * 0.02
          wr.returnTimer -= 1 / 60
          if (wr.returnTimer <= 0) { wr.isAway = false; wr.awayTimer = 10 + Math.random() * 20 }
        }
      })

      // ── Track positions for heatmap (1 sample/sec) ──────────────
      if (timestamp - lastPositionSample > 1000) {
        lastPositionSample = timestamp
        const history = positionHistoryRef.current
        workers.forEach((wr) => {
          history.push({ x: wr.x, y: wr.y, t: timestamp, workerId: wr.id, name: wr.name })
        })
        // Keep last 600 entries (~2.5 min for 4 workers)
        if (history.length > 600) positionHistoryRef.current = history.slice(-600)
        onPositionUpdate?.(positionHistoryRef.current)
      }

      // ── Compute zone + safety status ────────────────────────────
      if (timestamp - lastStatusUpdate > 800) {
        lastStatusUpdate = timestamp
        const zoneResults = {}; const safetyData = { workers: [], violations: 0, compliance: 0 }
        let totalChecks = 0, passedChecks = 0

        MOCK_ZONES.forEach((zone) => {
          const count = workers.filter((wr) => pointInZone(wr.x, wr.y, zone.polygon)).length
          const now = timestamp / 1000
          if (count > 0) {
            idleTimers[zone.id] = null
            zoneResults[zone.id] = { zone_id: zone.id, zone_name: zone.name, status: 'active', person_count: count, idle_duration: 0 }
          } else {
            if (!idleTimers[zone.id]) idleTimers[zone.id] = now
            const dur = now - idleTimers[zone.id]
            zoneResults[zone.id] = { zone_id: zone.id, zone_name: zone.name, status: dur > 10 ? 'idle' : 'warning', person_count: 0, idle_duration: dur }
          }
        })

        workers.forEach((wr) => {
          const items = Object.entries(wr.ppe)
          items.forEach(([k, v]) => { totalChecks++; if (v) passedChecks++ })
          const violations = items.filter(([, v]) => !v).map(([k]) => k)
          safetyData.workers.push({ id: wr.id, name: wr.name, zone: MOCK_ZONES[wr.id]?.name, ppe: { ...wr.ppe }, violations, compliant: violations.length === 0 })
          safetyData.violations += violations.length
        })
        safetyData.compliance = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100

        zoneStatusRef.current = zoneResults
        onZoneUpdate?.(zoneResults)
        onSafetyUpdate?.(safetyData)
      }

      // ── Draw scene ──────────────────────────────────────────────
      drawFloor(ctx, w, h)
      MOCK_ZONES.forEach((z) => drawMachine(ctx, z, w, h))
      const statuses = zoneStatusRef.current
      MOCK_ZONES.forEach((z) => drawZoneOverlay(ctx, z, statuses[z.id]?.status || 'idle', w, h))
      workers.forEach((wr) => drawWorker(ctx, wr, w, h, t))
      const violationCount = workers.filter((wr) => !wr.ppe.capacete || !wr.ppe.colete || !wr.ppe.oculos).length
      drawHUD(ctx, w, h, violationCount)

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [mockMode, onZoneUpdate, onSafetyUpdate, onPositionUpdate])

  const toggleFullscreen = () => {
    if (!fullscreen && containerRef.current) containerRef.current.requestFullscreen?.()
    else document.exitFullscreen?.()
    setFullscreen(!fullscreen)
  }

  const isLive = connected && !mockMode
  const feedLabel = isLive ? 'Feed ao Vivo' : mockMode ? 'Simulação Demo' : 'Reconectando...'
  const FeedIcon = isLive ? Camera : mockMode ? MonitorPlay : CameraOff
  const iconColor = isLive ? 'text-emerald-400' : mockMode ? 'text-amber-400' : 'text-red-400'

  return (
    <div ref={containerRef} className="glass rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <FeedIcon className={`w-4 h-4 ${iconColor}`} />
          <span className="text-sm font-medium">{feedLabel}</span>
          {(isLive || mockMode) && (
            <span className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLive ? 'bg-red-400' : 'bg-amber-400'} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-red-500' : 'bg-amber-500'}`} />
              </span>
              <span className={`text-xs font-medium ${isLive ? 'text-red-400' : 'text-amber-400'}`}>{isLive ? 'REC' : 'DEMO'}</span>
            </span>
          )}
        </div>
        <button onClick={toggleFullscreen} className="p-1.5 rounded hover:bg-white/10">
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
      <div className="relative aspect-video bg-gray-900 flex items-center justify-center">
        {mockMode ? (
          <canvas ref={canvasRef} className="w-full h-full" style={{ imageRendering: 'auto' }} />
        ) : frame ? (
          <img src={`data:image/jpeg;base64,${frame}`} alt="Camera feed" className="w-full h-full object-contain" />
        ) : (
          <div className="text-center">
            <CameraOff className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{connected ? 'Aguardando frames...' : 'Conectando ao servidor...'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
