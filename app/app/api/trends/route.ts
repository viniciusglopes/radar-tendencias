import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { fetchGoogleTrends, fetchMlTrends, saveTrends } from '@/lib/trends'
import { getMlAccessToken } from '@/lib/ml-auth'

// GET — lista trends salvos
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fonte = searchParams.get('fonte')
  const limit = parseInt(searchParams.get('limit') || '50')
  const dias = parseInt(searchParams.get('dias') || '7')

  const desde = new Date()
  desde.setDate(desde.getDate() - dias)

  let query = supabaseAdmin
    .from('radar_trends')
    .select('*')
    .gte('coletado_em', desde.toISOString())
    .order('volume_relativo', { ascending: false })
    .limit(limit)

  if (fonte) query = query.eq('fonte', fonte)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ trends: data || [], total: data?.length || 0 })
}

// POST — coleta trends agora
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const fontes = body.fontes || ['google_trends', 'ml_trends']

    const resultados: Record<string, any> = {}

    if (fontes.includes('google_trends')) {
      const items = await fetchGoogleTrends()
      const res = await saveTrends(items)
      resultados.google_trends = { coletados: items.length, salvos: res.saved }
    }

    if (fontes.includes('ml_trends')) {
      const token = await getMlAccessToken()
      if (token) {
        const items = await fetchMlTrends(token)
        const res = await saveTrends(items)
        resultados.ml_trends = { coletados: items.length, salvos: res.saved }
      } else {
        resultados.ml_trends = { erro: 'Token ML não disponível' }
      }
    }

    return NextResponse.json({ ok: true, resultados })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
