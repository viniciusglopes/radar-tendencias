import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { fetchGoogleTrends, fetchMlTrends, saveTrends } from '@/lib/trends'

// POST — cron de coleta (roda 2x por dia)
export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resultados: Record<string, any> = {}

  // Google Trends
  try {
    const items = await fetchGoogleTrends()
    const res = await saveTrends(items)
    resultados.google_trends = { coletados: items.length, salvos: res.saved }
  } catch (e: any) {
    resultados.google_trends = { erro: e.message }
  }

  // ML Trends
  try {
    const { data: cfg } = await supabaseAdmin
      .from('radar_config')
      .select('value')
      .eq('key', 'ml_access_token')
      .maybeSingle()

    if (cfg?.value) {
      const items = await fetchMlTrends(cfg.value)
      const res = await saveTrends(items)
      resultados.ml_trends = { coletados: items.length, salvos: res.saved }
    } else {
      resultados.ml_trends = { erro: 'Token ML não configurado' }
    }
  } catch (e: any) {
    resultados.ml_trends = { erro: e.message }
  }

  return NextResponse.json({
    ok: true,
    executado_em: new Date().toISOString(),
    resultados,
  })
}
