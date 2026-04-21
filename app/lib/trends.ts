import { supabaseAdmin } from './supabase'

export interface TrendItem {
  keyword: string
  fonte: 'google_trends' | 'ml_trends' | 'meta_ads'
  categoria: string | null
  volume_relativo: number
  variacao_percent: number | null
  pais: string
  coletado_em: string
}

export async function fetchGoogleTrends(): Promise<TrendItem[]> {
  const res = await fetch(
    'https://trends.google.com.br/trending/rss?geo=BR',
    { cache: 'no-store', signal: AbortSignal.timeout(10000) }
  )

  if (!res.ok) return []
  const xml = await res.text()

  const items: TrendItem[] = []
  const titleMatches = xml.matchAll(/<title>([^<]+)<\/title>/g)

  let first = true
  for (const match of titleMatches) {
    if (first) { first = false; continue }
    const keyword = match[1].trim()
    if (!keyword || keyword === 'Daily Search Trends') continue

    const trafficMatch = xml.match(
      new RegExp(`<title>${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</title>[\\s\\S]*?<ht:approx_traffic>([^<]+)</ht:approx_traffic>`)
    )
    const volume = trafficMatch
      ? parseInt(trafficMatch[1].replace(/[^0-9]/g, '')) || 100
      : 100

    items.push({
      keyword,
      fonte: 'google_trends',
      categoria: null,
      volume_relativo: volume,
      variacao_percent: null,
      pais: 'BR',
      coletado_em: new Date().toISOString(),
    })
  }

  return items
}

export async function fetchMlTrends(accessToken: string): Promise<TrendItem[]> {
  const res = await fetch('https://api.mercadolibre.com/trends/MLB', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })

  if (!res.ok) return []
  const data = await res.json()

  if (!Array.isArray(data)) return []

  return data.map((item: any, i: number) => ({
    keyword: item.keyword || item.query || '',
    fonte: 'ml_trends' as const,
    categoria: item.category_id || null,
    volume_relativo: 100 - i * 5,
    variacao_percent: null,
    pais: 'BR',
    coletado_em: new Date().toISOString(),
  })).filter((t: TrendItem) => t.keyword)
}

export async function fetchMetaAds(keyword: string): Promise<any[]> {
  const { data: cfg } = await supabaseAdmin
    .from('radar_config')
    .select('value')
    .eq('key', 'meta_access_token')
    .maybeSingle()

  if (!cfg?.value) return []

  const url = new URL('https://graph.facebook.com/v21.0/ads_archive')
  url.searchParams.set('search_terms', keyword)
  url.searchParams.set('ad_reached_countries', '["BR"]')
  url.searchParams.set('ad_type', 'ALL')
  url.searchParams.set('ad_active_status', 'ACTIVE')
  url.searchParams.set('limit', '25')
  url.searchParams.set('fields', 'id,ad_creative_bodies,ad_creative_link_titles,ad_delivery_start_time,page_name,publisher_platforms,impressions,spend')
  url.searchParams.set('access_token', cfg.value)

  const res = await fetch(url.toString(), { cache: 'no-store', signal: AbortSignal.timeout(15000) })
  if (!res.ok) return []
  const data = await res.json()
  return data.data || []
}

export async function saveTrends(items: TrendItem[]) {
  if (!items.length) return { saved: 0 }

  const { data, error } = await supabaseAdmin
    .from('radar_trends')
    .upsert(items.map(t => ({
      ...t,
      id: `${t.fonte}_${t.keyword}_${t.coletado_em.slice(0, 10)}`,
    })), { onConflict: 'id', ignoreDuplicates: true })
    .select('id')

  return { saved: data?.length || items.length, error: error?.message }
}
