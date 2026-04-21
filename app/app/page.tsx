'use client'

import { useState, useEffect, useCallback } from 'react'

interface Trend {
  id: string
  keyword: string
  fonte: string
  categoria: string | null
  volume_relativo: number
  variacao_percent: number | null
  coletado_em: string
}

const fonteConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  google_trends: { label: 'Google', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: '🔍' },
  ml_trends: { label: 'Mercado Livre', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: '🛒' },
  meta_ads: { label: 'Meta Ads', color: 'text-purple-400', bg: 'bg-purple-500/20', icon: '📢' },
  youtube: { label: 'YouTube', color: 'text-red-400', bg: 'bg-red-500/20', icon: '▶️' },
}

function tempColor(pct: number): string {
  if (pct >= 80) return 'bg-red-500'
  if (pct >= 60) return 'bg-orange-500'
  if (pct >= 40) return 'bg-yellow-500'
  if (pct >= 20) return 'bg-green-500'
  return 'bg-gray-500'
}

function tempLabel(pct: number): string {
  if (pct >= 80) return '🔥 Viral'
  if (pct >= 60) return '🔶 Quente'
  if (pct >= 40) return '🟡 Morno'
  if (pct >= 20) return '🟢 Subindo'
  return '⚪ Frio'
}

function calcTemp(trends: Trend[], t: Trend): number {
  if (!trends.length) return 0
  const maxVol = Math.max(...trends.map(x => x.volume_relativo))
  if (maxVol === 0) return 0
  return Math.round((t.volume_relativo / maxVol) * 100)
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toLocaleString()
}

export default function Dashboard() {
  const [trends, setTrends] = useState<Trend[]>([])
  const [loading, setLoading] = useState(true)
  const [coletando, setColetando] = useState(false)
  const [filtroFonte, setFiltroFonte] = useState('')
  const [busca, setBusca] = useState('')
  const [periodo, setPeriodo] = useState('7')
  const [ordenar, setOrdenar] = useState<'volume' | 'data'>('volume')
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '200', dias: periodo })
      if (filtroFonte) params.set('fonte', filtroFonte)
      const res = await fetch(`/api/trends?${params}`)
      const data = await res.json()
      setTrends(data.trends || [])
    } finally {
      setLoading(false)
    }
  }, [filtroFonte, periodo])

  useEffect(() => { load() }, [load])

  const coletar = async () => {
    setColetando(true)
    setMsg('')
    try {
      const res = await fetch('/api/trends', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const data = await res.json()
      if (data.error) setMsg(`Erro: ${data.error}`)
      else {
        const g = data.resultados?.google_trends?.coletados || 0
        const m = data.resultados?.ml_trends?.coletados || 0
        const y = data.resultados?.youtube?.coletados || 0
        setMsg(`Coletados: ${g} Google + ${m} ML + ${y} YouTube`)
        load()
      }
    } catch (e: any) {
      setMsg(`Erro: ${e.message}`)
    } finally {
      setColetando(false)
    }
  }

  const filtered = trends
    .filter(t => !busca || t.keyword.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => ordenar === 'volume'
      ? b.volume_relativo - a.volume_relativo
      : new Date(b.coletado_em).getTime() - new Date(a.coletado_em).getTime()
    )

  const countByFonte = trends.reduce((acc, t) => {
    acc[t.fonte] = (acc[t.fonte] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100">
      <header className="bg-[#161822] border-b border-white/5 px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-orange-500">Radar</span> de Tendências
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Inteligência de mercado em tempo real</p>
            </div>
            <button onClick={coletar} disabled={coletando}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white transition-all shadow-lg shadow-orange-500/20">
              {coletando ? '⏳ Coletando...' : '⚡ Coletar agora'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(fonteConfig).map(([key, cfg]) => (
              <div key={key} className={`rounded-xl p-3 ${cfg.bg} border border-white/5`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{cfg.icon}</span>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                </div>
                <p className="text-2xl font-bold text-white">{countByFonte[key] || 0}</p>
                <p className="text-xs text-gray-500">trends coletados</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {msg && (
          <div className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm">{msg}</div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input
              type="text"
              placeholder="Buscar tendência..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-[#1a1d2e] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {[{ id: '', label: 'Todas' }, { id: 'google_trends', label: '🔍 Google' }, { id: 'ml_trends', label: '🛒 ML' }, { id: 'youtube', label: '▶️ YouTube' }, { id: 'meta_ads', label: '📢 Meta' }].map(f => (
              <button key={f.id} onClick={() => setFiltroFonte(f.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${filtroFonte === f.id
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-[#1a1d2e] text-gray-400 hover:text-white border border-white/5'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1 bg-[#1a1d2e] rounded-lg border border-white/5 p-0.5">
            {[{ id: '1', label: '24h' }, { id: '7', label: '7d' }, { id: '30', label: '30d' }].map(p => (
              <button key={p.id} onClick={() => setPeriodo(p.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${periodo === p.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-[#1a1d2e] rounded-lg border border-white/5 p-0.5">
            {[{ id: 'volume' as const, label: '📊 Volume' }, { id: 'data' as const, label: '🕐 Recente' }].map(o => (
              <button key={o.id} onClick={() => setOrdenar(o.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${ordenar === o.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {o.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-gray-600 ml-auto">{filtered.length} resultados</span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">
            <div className="inline-block w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-3" />
            <p className="text-sm">Carregando tendências...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-sm">Nenhum trend encontrado.</p>
            <p className="text-gray-600 text-xs mt-1">Clique em "Coletar agora" ou ajuste os filtros.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t, i) => {
              const cfg = fonteConfig[t.fonte] || { label: t.fonte, color: 'text-gray-400', bg: 'bg-gray-500/20', icon: '📌' }
              const temp = calcTemp(filtered, t)

              return (
                <div key={t.id || i}
                  className="group bg-[#161822] border border-white/5 rounded-xl p-4 hover:border-orange-500/30 transition-all cursor-default">
                  <div className="flex items-center gap-4">
                    <div className="text-center shrink-0 w-10">
                      <span className="text-lg font-bold text-gray-600">#{i + 1}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-white truncate">{t.keyword}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} font-medium shrink-0`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>

                      {t.fonte === 'youtube' && t.categoria && (
                        <p className="text-xs text-gray-500 mb-1">{t.categoria}</p>
                      )}

                      <div className="flex items-center gap-4">
                        <div className="flex-1 max-w-48">
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${tempColor(temp)}`}
                              style={{ width: `${temp}%` }} />
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{tempLabel(temp)}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white">{formatVolume(t.volume_relativo)}</p>
                      <p className="text-xs text-gray-500">{t.fonte === 'youtube' ? 'views' : 'volume'}</p>
                    </div>

                    <div className="text-right shrink-0 w-16">
                      {t.variacao_percent !== null ? (
                        <span className={`text-xs font-semibold ${t.variacao_percent > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {t.variacao_percent > 0 ? '↑' : '↓'} {Math.abs(t.variacao_percent)}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">
                          {new Date(t.coletado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
