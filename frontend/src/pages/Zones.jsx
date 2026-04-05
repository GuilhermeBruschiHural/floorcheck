import { useState, useEffect } from 'react'
import { MapPin, Plus, Trash2, Users, Save } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'

const API_BASE = '/api'

export default function Zones() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newZone, setNewZone] = useState({
    name: '',
    assigned_worker: '',
    polygon: [[0.1, 0.1], [0.4, 0.1], [0.4, 0.4], [0.1, 0.4]],
  })

  useEffect(() => {
    fetchZones()
  }, [])

  async function fetchZones() {
    try {
      const res = await fetch(`${API_BASE}/zones`)
      if (res.ok) {
        setZones(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch zones:', err)
    } finally {
      setLoading(false)
    }
  }

  async function createZone(e) {
    e.preventDefault()
    try {
      const res = await fetch(`${API_BASE}/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newZone),
      })
      if (res.ok) {
        setShowForm(false)
        setNewZone({ name: '', assigned_worker: '', polygon: [[0.1, 0.1], [0.4, 0.1], [0.4, 0.4], [0.1, 0.4]] })
        fetchZones()
      }
    } catch (err) {
      console.error('Failed to create zone:', err)
    }
  }

  async function deleteZone(id) {
    try {
      const res = await fetch(`${API_BASE}/zones/${id}`, { method: 'DELETE' })
      if (res.ok) fetchZones()
    } catch (err) {
      console.error('Failed to delete zone:', err)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="w-6 h-6 text-factory-400" />
            Gerenciar Zonas
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Configure as áreas de monitoramento para cada equipamento
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-factory-500 hover:bg-factory-600 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Zona
        </button>
      </div>

      {/* New Zone Form */}
      {showForm && (
        <form onSubmit={createZone} className="glass rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4">Criar Nova Zona</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nome da Zona</label>
              <input
                type="text"
                required
                value={newZone.name}
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                placeholder="Ex: CNC-02"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:border-factory-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Operador Designado</label>
              <input
                type="text"
                value={newZone.assigned_worker}
                onChange={(e) => setNewZone({ ...newZone, assigned_worker: e.target.value })}
                placeholder="Ex: João Silva"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:border-factory-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Polygon coordinates */}
          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-2">
              Coordenadas do Polígono (normalizado 0-1)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {newZone.polygon.map((point, idx) => (
                <div key={idx} className="flex gap-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={point[0]}
                    onChange={(e) => {
                      const updated = [...newZone.polygon]
                      updated[idx] = [parseFloat(e.target.value), point[1]]
                      setNewZone({ ...newZone, polygon: updated })
                    }}
                    className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs focus:border-factory-500 focus:outline-none"
                    placeholder="X"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={point[1]}
                    onChange={(e) => {
                      const updated = [...newZone.polygon]
                      updated[idx] = [point[0], parseFloat(e.target.value)]
                      setNewZone({ ...newZone, polygon: updated })
                    }}
                    className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs focus:border-factory-500 focus:outline-none"
                    placeholder="Y"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Cada par (X, Y) representa um vértice da zona. Valores de 0 a 1 relativos ao tamanho do frame.
            </p>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-factory-500 hover:bg-factory-600 rounded-lg text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Salvar Zona
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 glass glass-hover rounded-lg text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Zones List */}
      {loading ? (
        <div className="glass rounded-xl p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-factory-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-400">Carregando zonas...</p>
        </div>
      ) : zones.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-400 mb-1">Nenhuma zona configurada</h3>
          <p className="text-sm text-gray-500">
            Inicie o backend para criar as zonas padrão ou clique em "Nova Zona".
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <div key={zone.id} className="glass rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{zone.name}</h3>
                  <p className="text-xs text-gray-500">Câmera: {zone.camera_id}</p>
                </div>
                <button
                  onClick={() => deleteZone(zone.id)}
                  className="p-1.5 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                  title="Remover zona"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {zone.assigned_worker && (
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                  <Users className="w-4 h-4" />
                  {zone.assigned_worker}
                </div>
              )}

              {/* Zone polygon visualization */}
              <div className="bg-gray-900/50 rounded-lg p-2 border border-white/5">
                <svg viewBox="0 0 100 100" className="w-full h-20">
                  <polygon
                    points={zone.polygon.map(([x, y]) => `${x * 100},${y * 100}`).join(' ')}
                    fill="rgba(12, 147, 231, 0.15)"
                    stroke="rgba(12, 147, 231, 0.5)"
                    strokeWidth="1"
                  />
                  {zone.polygon.map(([x, y], i) => (
                    <circle
                      key={i}
                      cx={x * 100}
                      cy={y * 100}
                      r="2"
                      fill="#0c93e7"
                    />
                  ))}
                </svg>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                {zone.polygon.length} vértices
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
