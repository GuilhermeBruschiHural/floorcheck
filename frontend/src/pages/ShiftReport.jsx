import { useState } from 'react'
import {
  MessageSquare, Send, Clock, Calendar, CheckCircle2, Phone,
  Plus, Trash2, Settings, TrendingUp, AlertTriangle, Lightbulb, Bell
} from 'lucide-react'

// ── Mock shift reports ───────────────────────────────────────────────────

function generateMockReport(shift, dateStr) {
  const reports = {
    A: {
      shift: 'Turno A (06:00 - 14:00)',
      productivity: 82.4,
      trend: '+3.1%',
      trendDir: 'up',
      activeTime: '6h 35min',
      idleTime: '1h 25min',
      highlights: [
        'CNC-01 operou 96% do tempo — melhor desempenho da semana',
        'Torno-01 manteve produtividade estável em 88%',
        'Zero acidentes registrados no turno',
      ],
      alerts: [
        'Solda-01 ficou ociosa por 47min entre 10h-11h (padrão recorrente há 3 dias)',
        '2 violações de EPI detectadas: Carlos S. sem óculos (08:32), Julia R. sem colete (11:15)',
        'Fresa-01 abaixo da meta de 85% (atual: 78%)',
      ],
      recommendations: [
        'Verificar disponibilidade de material para soldagem no horário de 10h-11h',
        'Reforçar orientação sobre uso de óculos de proteção no setor CNC',
        'Avaliar redistribuição de operadores: Fresa-01 pode precisar de segundo operador',
      ],
      safetyScore: 87,
      topZone: 'CNC-01',
      bottomZone: 'Solda-01',
    },
    B: {
      shift: 'Turno B (14:00 - 22:00)',
      productivity: 78.9,
      trend: '-1.2%',
      trendDir: 'down',
      activeTime: '6h 19min',
      idleTime: '1h 41min',
      highlights: [
        'Torno-01 atingiu 92% de produtividade — acima da meta',
        'Transição de turno realizada em tempo recorde (8 min)',
      ],
      alerts: [
        'Queda de produtividade geral de 14h30 às 15h00 (adaptação pós-almoço)',
        '4 violações de EPI detectadas no setor Solda',
        'CNC-01 parou por 23min (possível manutenção não programada)',
      ],
      recommendations: [
        'Implementar warm-up de 15min no início do turno para reduzir queda pós-almoço',
        'Agendar treinamento de segurança focado no setor Solda',
        'Verificar log de manutenção do CNC-01 para paradas não programadas',
      ],
      safetyScore: 74,
      topZone: 'Torno-01',
      bottomZone: 'CNC-01',
    },
  }
  return { ...(reports[shift] || reports.A), date: dateStr }
}

// ── WhatsApp message renderer ────────────────────────────────────────────

function WhatsAppMessage({ report }) {
  return (
    <div className="max-w-md mx-auto">
      {/* Phone frame */}
      <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        {/* WhatsApp header */}
        <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">FV</div>
          <div>
            <p className="text-sm font-medium text-white">FloorCheck Bot</p>
            <p className="text-xs text-emerald-200">online</p>
          </div>
        </div>

        {/* Chat area */}
        <div className="bg-[#0b141a] p-4 min-h-[320px]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 0L60 30L30 60L0 30Z\' fill=\'none\' stroke=\'%23ffffff08\' stroke-width=\'0.5\'/%3E%3C/svg%3E")' }}>

          {/* Message bubble */}
          <div className="bg-[#005c4b] rounded-lg rounded-tl-none p-3 max-w-[95%] relative">
            <div className="absolute -top-0 -left-2 w-0 h-0 border-t-[8px] border-t-[#005c4b] border-l-[8px] border-l-transparent" />

            <p className="text-xs font-bold text-emerald-300 mb-2">📊 RELATÓRIO DE TURNO</p>
            <p className="text-xs text-gray-300 mb-3">{report.shift} — {report.date}</p>

            <div className="border-t border-white/10 pt-2 mb-2">
              <p className="text-xs text-white mb-1">
                <span className="font-bold">📈 Produtividade:</span> {report.productivity}% ({report.trend} vs ontem)
              </p>
              <p className="text-xs text-white mb-1">
                <span className="font-bold">⏱️ Tempo ativo:</span> {report.activeTime} | Ocioso: {report.idleTime}
              </p>
              <p className="text-xs text-white mb-1">
                <span className="font-bold">🛡️ Segurança:</span> {report.safetyScore}% conformidade EPI
              </p>
            </div>

            <div className="border-t border-white/10 pt-2 mb-2">
              <p className="text-xs font-bold text-emerald-300 mb-1">✅ Destaques</p>
              {report.highlights.map((h, i) => (
                <p key={i} className="text-xs text-gray-200 mb-0.5">• {h}</p>
              ))}
            </div>

            <div className="border-t border-white/10 pt-2 mb-2">
              <p className="text-xs font-bold text-amber-300 mb-1">⚠️ Alertas</p>
              {report.alerts.map((a, i) => (
                <p key={i} className="text-xs text-gray-200 mb-0.5">• {a}</p>
              ))}
            </div>

            <div className="border-t border-white/10 pt-2 mb-1">
              <p className="text-xs font-bold text-blue-300 mb-1">💡 Recomendações</p>
              {report.recommendations.map((r, i) => (
                <p key={i} className="text-xs text-gray-200 mb-0.5">• {r}</p>
              ))}
            </div>

            <p className="text-[10px] text-gray-400 text-right mt-2">
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ✓✓
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════
// Page
// ═════════════════════════════════════════════════════════════════════════

export default function ShiftReport() {
  const [selectedShift, setSelectedShift] = useState('A')
  const [toast, setToast] = useState(null)
  const [recipients, setRecipients] = useState([
    { id: 1, name: 'Gerente Produção', phone: '+55 11 99999-0001', active: true },
    { id: 2, name: 'Supervisor Turno A', phone: '+55 11 99999-0002', active: true },
    { id: 3, name: 'Coord. Segurança', phone: '+55 11 99999-0003', active: false },
  ])
  const [sections, setSections] = useState({
    highlights: true, alerts: true, recommendations: true, safety: true,
  })

  const today = new Date().toLocaleDateString('pt-BR')
  const report = generateMockReport(selectedShift, today)

  const sendTest = () => {
    setToast('success')
    setTimeout(() => setToast(null), 3000)
  }

  const toggleRecipient = (id) => {
    setRecipients((prev) => prev.map((r) => r.id === id ? { ...r, active: !r.active } : r))
  }

  const activeRecipients = recipients.filter((r) => r.active).length

  // Demo history
  const reportHistory = [
    { date: '05/04/2026', shift: 'Turno A', productivity: 82.4, sent: true },
    { date: '04/04/2026', shift: 'Turno B', productivity: 78.9, sent: true },
    { date: '04/04/2026', shift: 'Turno A', productivity: 79.3, sent: true },
    { date: '03/04/2026', shift: 'Turno B', productivity: 85.1, sent: true },
    { date: '03/04/2026', shift: 'Turno A', productivity: 80.7, sent: false },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-400" />
            AI Shift Reports
          </h1>
          <p className="text-sm text-gray-400 mt-1">Relatórios inteligentes via WhatsApp com análise de IA</p>
        </div>
        <button onClick={sendTest}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors">
          <Send className="w-4 h-4" />
          Enviar Teste
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 rounded-lg shadow-lg animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">Relatório enviado para {activeRecipients} destinatário(s)!</span>
        </div>
      )}

      {/* Shift Selector */}
      <div className="flex gap-2 mb-6">
        {['A', 'B'].map((s) => (
          <button key={s} onClick={() => setSelectedShift(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedShift === s ? 'bg-factory-500/20 text-factory-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Clock className="w-4 h-4 inline mr-1" />
            Turno {s} ({s === 'A' ? '06:00-14:00' : '14:00-22:00'})
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* WhatsApp Preview — Main */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Preview da Mensagem</h3>
          <WhatsAppMessage report={report} />

          {/* Report Stats below preview */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="glass rounded-xl p-4 text-center">
              <TrendingUp className={`w-5 h-5 mx-auto mb-1 ${report.trendDir === 'up' ? 'text-emerald-400' : 'text-red-400'}`} />
              <p className="text-lg font-bold">{report.productivity}%</p>
              <p className="text-xs text-gray-500">Produtividade</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-amber-400" />
              <p className="text-lg font-bold">{report.alerts.length}</p>
              <p className="text-xs text-gray-500">Alertas</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Lightbulb className="w-5 h-5 mx-auto mb-1 text-blue-400" />
              <p className="text-lg font-bold">{report.recommendations.length}</p>
              <p className="text-xs text-gray-500">Recomendações</p>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Recipients */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Phone className="w-4 h-4 text-gray-400" /> Destinatários
            </h3>
            <div className="space-y-2">
              {recipients.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-gray-500">{r.phone}</p>
                  </div>
                  <button onClick={() => toggleRecipient(r.id)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${r.active ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${r.active ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Template Sections */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4 text-gray-400" /> Seções do Relatório
            </h3>
            <div className="space-y-2">
              {Object.entries(sections).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                  <span className="text-sm capitalize text-gray-300">
                    {key === 'highlights' ? '✅ Destaques' : key === 'alerts' ? '⚠️ Alertas' : key === 'recommendations' ? '💡 Recomendações' : '🛡️ Segurança'}
                  </span>
                  <button onClick={() => setSections((p) => ({ ...p, [key]: !val }))}
                    className={`w-10 h-5 rounded-full transition-colors relative ${val ? 'bg-factory-500' : 'bg-gray-600'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${val ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-gray-400" /> Agendamento
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 rounded-lg bg-white/[0.03]">
                <span className="text-gray-400">Turno A</span>
                <span className="text-emerald-400 font-medium">14:05</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-white/[0.03]">
                <span className="text-gray-400">Turno B</span>
                <span className="text-emerald-400 font-medium">22:05</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-white/[0.03]">
                <span className="text-gray-400">Frequência</span>
                <span className="text-factory-400 font-medium">Diário</span>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-gray-400" /> Histórico
            </h3>
            <div className="space-y-2">
              {reportHistory.map((rh, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] text-xs">
                  <div>
                    <span className="text-gray-300">{rh.date}</span>
                    <span className="text-gray-500 ml-2">{rh.shift}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{rh.productivity}%</span>
                    {rh.sent ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
