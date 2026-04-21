'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Trend {
  id: string
  keyword: string
  fonte: string
  categoria: string | null
  volume_relativo: number
  variacao_percent: number | null
  coletado_em: string
}

const fonteLabel: Record<string, { label: string; color: string }> = {
  google_trends: { label: 'Google', color: 'bg-blue-100 text-blue-700' },
  ml_trends: { label: 'Mercado Livre', color: 'bg-yellow-100 text-yellow-700' },
  meta_ads: { label: 'Meta Ads', color: 'bg-purple-100 text-purple-700' },
  youtube: { label: 'YouTube', color: 'bg-red-100 text-red-700' },
}

export default function Dashboard() {
  const [trends, setTrends] = useState<Trend[]>([])
  const [loading, setLoading] = useState(true)
  const [coletando, setColetando] = useState(false)
  const [filtroFonte, setFiltroFonte] = useState('')
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100', dias: '7' })
      if (filtroFonte) params.set('fonte', filtroFonte)
      const res = await fetch(`/api/trends?${params}`)
      const data = await res.json()
      setTrends(data.trends || [])
    } finally {
      setLoading(false)
    }
  }, [filtroFonte])

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Radar de Tendências</h1>
            <p className="text-sm text-gray-500">O que está bombando agora no Brasil</p>
          </div>
          <Button onClick={coletar} disabled={coletando} className="bg-blue-600 hover:bg-blue-700 text-white">
            {coletando ? 'Coletando...' : 'Coletar agora'}
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        {msg && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">{msg}</div>
        )}

        <div className="flex items-center gap-2 mb-4">
          {[{ id: '', label: 'Todas' }, { id: 'google_trends', label: 'Google' }, { id: 'ml_trends', label: 'ML' }, { id: 'youtube', label: 'YouTube' }, { id: 'meta_ads', label: 'Meta Ads' }].map(f => (
            <button key={f.id} onClick={() => setFiltroFonte(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroFonte === f.id ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}>
              {f.label}
            </button>
          ))}
          <span className="text-xs text-gray-400 ml-auto">{trends.length} trends (últimos 7 dias)</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : trends.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">Nenhum trend coletado ainda.</p>
            <p className="text-gray-400 text-xs mt-1">Clique em "Coletar agora" para buscar tendências.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trends.map((t, i) => {
              const fonte = fonteLabel[t.fonte] || { label: t.fonte, color: 'bg-gray-100 text-gray-600' }
              return (
                <Card key={t.id || i} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800 leading-tight">{t.keyword}</p>
                      <Badge className={`${fonte.color} text-xs shrink-0`}>{fonte.label}</Badge>
                    </div>
                    {t.fonte === 'youtube' && t.categoria && (
                      <p className="text-xs text-gray-500 mt-1">{t.categoria}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500">{t.fonte === 'youtube' ? 'Views' : 'Vol'}: {t.volume_relativo.toLocaleString()}</span>
                      {t.variacao_percent !== null && (
                        <span className={`text-xs font-medium ${t.variacao_percent > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {t.variacao_percent > 0 ? '+' : ''}{t.variacao_percent}%
                        </span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(t.coletado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
