import { Link } from 'react-router-dom'
import {
  Eye, Brain, MapPin, BarChart3, Shield, Zap, Clock, Users,
  ArrowRight, CheckCircle2, Play, ChevronRight, HardHat, Route, MessageSquare
} from 'lucide-react'

const features = [
  {
    icon: Eye,
    title: 'Detecção em Tempo Real',
    desc: 'Monitoramento contínuo via câmeras com IA YOLOv8 para identificação instantânea de operadores no chão de fábrica.',
  },
  {
    icon: HardHat,
    title: 'Smart Safety (EPIs)',
    desc: 'Detecção automática de capacete, colete e óculos. Alertas instantâneos de violação com conformidade NR-6.',
    badge: 'NOVO',
  },
  {
    icon: Route,
    title: 'Heatmap & Gargalos',
    desc: 'Mapa de calor de movimentação, análise de trajetos e detecção automática de gargalos no chão de fábrica.',
    badge: 'NOVO',
  },
  {
    icon: MessageSquare,
    title: 'AI Reports via WhatsApp',
    desc: 'Relatórios de turno com análise inteligente enviados automaticamente via WhatsApp para gestores.',
    badge: 'NOVO',
  },
  {
    icon: MapPin,
    title: 'Zonas Inteligentes',
    desc: 'Defina áreas de trabalho por equipamento. O sistema detecta automaticamente presença e ociosidade por zona.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios Detalhados',
    desc: 'Dashboards com métricas de produtividade por turno, zona e operador. Dados para decisões estratégicas.',
  },
  {
    icon: Shield,
    title: 'Privacidade Garantida',
    desc: 'Processamento local sem envio de imagens para nuvem. Dados permanecem sob controle da sua empresa.',
  },
  {
    icon: Zap,
    title: 'Setup em Minutos',
    desc: 'Compatível com câmeras IP existentes (RTSP/HTTP). Sem necessidade de hardware proprietário.',
  },
]

const steps = [
  {
    num: '01',
    title: 'Conecte suas câmeras',
    desc: 'Aponte câmeras IP para as áreas de trabalho. Suporte a RTSP, HTTP e modelos populares como Hikvision e Dahua.',
  },
  {
    num: '02',
    title: 'Defina as zonas',
    desc: 'Desenhe áreas sobre a imagem da câmera para delimitar cada equipamento ou posto de trabalho.',
  },
  {
    num: '03',
    title: 'Monitore em tempo real',
    desc: 'A IA detecta automaticamente operadores e calcula a produtividade de cada zona segundo a segundo.',
  },
]

const stats = [
  { value: '99.2%', label: 'Precisão de detecção' },
  { value: '<100ms', label: 'Latência de processamento' },
  { value: '24/7', label: 'Monitoramento contínuo' },
  { value: '30%', label: 'Aumento médio de produtividade' },
]

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-factory-950/50 to-gray-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(12,147,231,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.1),transparent_60%)]" />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-factory-300 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Powered by YOLOv8 AI
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
              Monitore a{' '}
              <span className="bg-gradient-to-r from-factory-400 to-emerald-400 bg-clip-text text-transparent">
                produtividade
              </span>
              <br />do seu chão de fábrica
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              Detecção inteligente de operadores em tempo real via câmeras.
              Saiba quem está operando, quem está ocioso e otimize sua produção com dados concretos.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-factory-500 hover:bg-factory-600 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-factory-500/25"
              >
                <Play className="w-5 h-5" />
                Ver Demo ao Vivo
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 px-8 py-3.5 glass glass-hover rounded-xl font-semibold text-gray-300"
              >
                Como Funciona
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Dashboard Preview Mock */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="glass rounded-2xl p-1 shadow-2xl shadow-factory-500/10">
              <div className="bg-gray-900/80 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-gray-500 ml-2">FloorCheck Dashboard</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {['CNC-01', 'Torno-01', 'Fresa-01', 'Solda-01'].map((name, i) => (
                    <div key={name} className={`rounded-lg p-3 border ${
                      i < 2 ? 'border-emerald-500/30 bg-emerald-500/5' : i === 2 ? 'border-amber-500/30 bg-amber-500/5' : 'border-red-500/30 bg-red-500/5'
                    }`}>
                      <div className="text-xs text-gray-400 mb-1">{name}</div>
                      <div className={`text-sm font-bold ${
                        i < 2 ? 'text-emerald-400' : i === 2 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {i < 2 ? 'ATIVO' : i === 2 ? 'ALERTA' : 'OCIOSO'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {i < 2 ? '1 operador' : i === 2 ? '15s ausente' : '5m ocioso'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 h-40 bg-gray-800/50 rounded-lg flex items-center justify-center border border-white/5">
                  <div className="text-center">
                    <Eye className="w-8 h-8 text-factory-500 mx-auto mb-1" />
                    <span className="text-xs text-gray-500">Feed de câmera com detecção AI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-factory-400 to-emerald-400 bg-clip-text text-transparent">
                  {value}
                </div>
                <div className="text-sm text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Tecnologia de ponta para sua{' '}
              <span className="text-factory-400">indústria</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Combine visão computacional com gestão inteligente de zonas para
              ter visibilidade total do seu chão de fábrica.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, desc, badge }) => (
              <div key={title} className="glass rounded-xl p-5 glass-hover group relative">
                {badge && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                    {badge}
                  </span>
                )}
                <div className="w-10 h-10 rounded-lg bg-factory-500/10 flex items-center justify-center mb-4 group-hover:bg-factory-500/20 transition-colors">
                  <Icon className="w-5 h-5 text-factory-400" />
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-24 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Simples de <span className="text-emerald-400">implementar</span>
            </h2>
            <p className="text-gray-400">Três passos para transformar seu monitoramento</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="relative">
                <div className="text-6xl font-black text-white/5 absolute -top-4 -left-2">{num}</div>
                <div className="relative glass rounded-xl p-6">
                  <h3 className="font-semibold text-white mb-2">{title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="glass rounded-2xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-factory-500/10 to-emerald-500/10" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Pronto para otimizar sua produção?
              </h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                Experimente o FloorCheck agora mesmo com nosso modo demo.
                Sem necessidade de configuração de câmeras.
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-factory-500 hover:bg-factory-600 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-factory-500/25"
              >
                Acessar Dashboard Demo
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
