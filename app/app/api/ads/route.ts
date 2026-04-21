import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { fetchMetaAds } from '@/lib/trends'

// GET — lista anuncios coletados
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const keyword = searchParams.get('keyword')
  const limit = parseInt(searchParams.get('limit') || '50')

  let query = supabaseAdmin
    .from('radar_ads')
    .select('*')
    .order('coletado_em', { ascending: false })
    .limit(limit)

  if (keyword) query = query.ilike('keyword_busca', `%${keyword}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ads: data || [], total: data?.length || 0 })
}

// POST — busca ads por keyword na Meta Ad Library
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { keyword } = body

    if (!keyword) {
      return NextResponse.json({ error: 'keyword é obrigatório' }, { status: 400 })
    }

    const ads = await fetchMetaAds(keyword)

    if (ads.length > 0) {
      const registros = ads.map((ad: any) => ({
        ad_id: ad.id,
        keyword_busca: keyword,
        page_name: ad.page_name || '',
        page_id: ad.page_id || '',
        ad_creative_body: ad.ad_creative_bodies?.[0] || '',
        ad_creative_link_title: ad.ad_creative_link_titles?.[0] || '',
        ad_creative_link_url: ad.ad_creative_link_captions?.[0] || '',
        started_running: ad.ad_delivery_start_time || null,
        plataformas: ad.publisher_platforms || [],
        coletado_em: new Date().toISOString(),
      }))

      await supabaseAdmin
        .from('radar_ads')
        .upsert(registros, { onConflict: 'ad_id', ignoreDuplicates: true })
    }

    return NextResponse.json({ ok: true, keyword, encontrados: ads.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
