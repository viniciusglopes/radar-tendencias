import { supabaseAdmin } from './supabase'
import type { TrendItem } from './trends'

const YT_API = 'https://www.googleapis.com/youtube/v3'

async function getApiKey(): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('radar_config')
    .select('value')
    .eq('key', 'youtube_api_key')
    .maybeSingle()
  return data?.value || null
}

export interface YtVideo {
  video_id: string
  title: string
  channel_id: string
  channel_title: string
  published_at: string
  thumbnail: string
  view_count: number
  like_count: number
  comment_count: number
  categoria: string | null
  is_outlier: boolean
  outlier_ratio: number | null
}

export interface YtChannel {
  channel_id: string
  title: string
  description: string
  thumbnail: string
  subscriber_count: number
  video_count: number
  view_count: number
  published_at: string
}

export async function fetchTrendingVideos(maxResults = 20): Promise<YtVideo[]> {
  const key = await getApiKey()
  if (!key) return []

  const url = new URL(`${YT_API}/videos`)
  url.searchParams.set('part', 'snippet,statistics')
  url.searchParams.set('chart', 'mostPopular')
  url.searchParams.set('regionCode', 'BR')
  url.searchParams.set('maxResults', String(maxResults))
  url.searchParams.set('key', key)

  const res = await fetch(url.toString(), { cache: 'no-store', signal: AbortSignal.timeout(10000) })
  if (!res.ok) return []
  const data = await res.json()

  return (data.items || []).map((item: any) => ({
    video_id: item.id,
    title: item.snippet.title,
    channel_id: item.snippet.channelId,
    channel_title: item.snippet.channelTitle,
    published_at: item.snippet.publishedAt,
    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
    view_count: parseInt(item.statistics?.viewCount || '0'),
    like_count: parseInt(item.statistics?.likeCount || '0'),
    comment_count: parseInt(item.statistics?.commentCount || '0'),
    categoria: item.snippet.categoryId || null,
    is_outlier: false,
    outlier_ratio: null,
  }))
}

export async function searchVideos(query: string, maxResults = 20): Promise<YtVideo[]> {
  const key = await getApiKey()
  if (!key) return []

  const searchUrl = new URL(`${YT_API}/search`)
  searchUrl.searchParams.set('part', 'snippet')
  searchUrl.searchParams.set('q', query)
  searchUrl.searchParams.set('type', 'video')
  searchUrl.searchParams.set('regionCode', 'BR')
  searchUrl.searchParams.set('relevanceLanguage', 'pt')
  searchUrl.searchParams.set('order', 'viewCount')
  searchUrl.searchParams.set('publishedAfter', new Date(Date.now() - 7 * 86400000).toISOString())
  searchUrl.searchParams.set('maxResults', String(maxResults))
  searchUrl.searchParams.set('key', key)

  const searchRes = await fetch(searchUrl.toString(), { cache: 'no-store', signal: AbortSignal.timeout(10000) })
  if (!searchRes.ok) return []
  const searchData = await searchRes.json()

  const videoIds = (searchData.items || []).map((i: any) => i.id.videoId).filter(Boolean)
  if (!videoIds.length) return []

  const statsUrl = new URL(`${YT_API}/videos`)
  statsUrl.searchParams.set('part', 'snippet,statistics')
  statsUrl.searchParams.set('id', videoIds.join(','))
  statsUrl.searchParams.set('key', key)

  const statsRes = await fetch(statsUrl.toString(), { cache: 'no-store', signal: AbortSignal.timeout(10000) })
  if (!statsRes.ok) return []
  const statsData = await statsRes.json()

  return (statsData.items || []).map((item: any) => ({
    video_id: item.id,
    title: item.snippet.title,
    channel_id: item.snippet.channelId,
    channel_title: item.snippet.channelTitle,
    published_at: item.snippet.publishedAt,
    thumbnail: item.snippet.thumbnails?.medium?.url || '',
    view_count: parseInt(item.statistics?.viewCount || '0'),
    like_count: parseInt(item.statistics?.likeCount || '0'),
    comment_count: parseInt(item.statistics?.commentCount || '0'),
    categoria: item.snippet.categoryId || null,
    is_outlier: false,
    outlier_ratio: null,
  }))
}

export async function searchChannels(query: string, maxResults = 10): Promise<YtChannel[]> {
  const key = await getApiKey()
  if (!key) return []

  const searchUrl = new URL(`${YT_API}/search`)
  searchUrl.searchParams.set('part', 'snippet')
  searchUrl.searchParams.set('q', query)
  searchUrl.searchParams.set('type', 'channel')
  searchUrl.searchParams.set('regionCode', 'BR')
  searchUrl.searchParams.set('relevanceLanguage', 'pt')
  searchUrl.searchParams.set('maxResults', String(maxResults))
  searchUrl.searchParams.set('key', key)

  const searchRes = await fetch(searchUrl.toString(), { cache: 'no-store', signal: AbortSignal.timeout(10000) })
  if (!searchRes.ok) return []
  const searchData = await searchRes.json()

  const channelIds = (searchData.items || []).map((i: any) => i.id.channelId).filter(Boolean)
  if (!channelIds.length) return []

  const statsUrl = new URL(`${YT_API}/channels`)
  statsUrl.searchParams.set('part', 'snippet,statistics')
  statsUrl.searchParams.set('id', channelIds.join(','))
  statsUrl.searchParams.set('key', key)

  const statsRes = await fetch(statsUrl.toString(), { cache: 'no-store', signal: AbortSignal.timeout(10000) })
  if (!statsRes.ok) return []
  const statsData = await statsRes.json()

  return (statsData.items || []).map((item: any) => ({
    channel_id: item.id,
    title: item.snippet.title,
    description: item.snippet.description?.slice(0, 200) || '',
    thumbnail: item.snippet.thumbnails?.medium?.url || '',
    subscriber_count: parseInt(item.statistics?.subscriberCount || '0'),
    video_count: parseInt(item.statistics?.videoCount || '0'),
    view_count: parseInt(item.statistics?.viewCount || '0'),
    published_at: item.snippet.publishedAt,
  }))
}

export async function detectOutliers(channelId: string): Promise<YtVideo[]> {
  const key = await getApiKey()
  if (!key) return []

  // Get channel's recent videos
  const searchUrl = new URL(`${YT_API}/search`)
  searchUrl.searchParams.set('part', 'snippet')
  searchUrl.searchParams.set('channelId', channelId)
  searchUrl.searchParams.set('type', 'video')
  searchUrl.searchParams.set('order', 'date')
  searchUrl.searchParams.set('maxResults', '15')
  searchUrl.searchParams.set('key', key)

  const searchRes = await fetch(searchUrl.toString(), { cache: 'no-store', signal: AbortSignal.timeout(10000) })
  if (!searchRes.ok) return []
  const searchData = await searchRes.json()

  const videoIds = (searchData.items || []).map((i: any) => i.id.videoId).filter(Boolean)
  if (videoIds.length < 3) return []

  const statsUrl = new URL(`${YT_API}/videos`)
  statsUrl.searchParams.set('part', 'snippet,statistics')
  statsUrl.searchParams.set('id', videoIds.join(','))
  statsUrl.searchParams.set('key', key)

  const statsRes = await fetch(statsUrl.toString(), { cache: 'no-store', signal: AbortSignal.timeout(10000) })
  if (!statsRes.ok) return []
  const statsData = await statsRes.json()

  const videos = (statsData.items || []).map((item: any) => ({
    video_id: item.id,
    title: item.snippet.title,
    channel_id: item.snippet.channelId,
    channel_title: item.snippet.channelTitle,
    published_at: item.snippet.publishedAt,
    thumbnail: item.snippet.thumbnails?.medium?.url || '',
    view_count: parseInt(item.statistics?.viewCount || '0'),
    like_count: parseInt(item.statistics?.likeCount || '0'),
    comment_count: parseInt(item.statistics?.commentCount || '0'),
    categoria: item.snippet.categoryId || null,
    is_outlier: false,
    outlier_ratio: null as number | null,
  }))

  const avgViews = videos.reduce((s: number, v: any) => s + v.view_count, 0) / videos.length

  return videos.map((v: any) => {
    const ratio = avgViews > 0 ? v.view_count / avgViews : 0
    return { ...v, outlier_ratio: Math.round(ratio * 10) / 10, is_outlier: ratio >= 3 }
  }).sort((a: any, b: any) => b.outlier_ratio - a.outlier_ratio)
}

export function trendingToTrendItems(videos: YtVideo[]): TrendItem[] {
  return videos.map(v => ({
    keyword: v.title,
    fonte: 'youtube' as const,
    categoria: v.channel_title,
    volume_relativo: v.view_count,
    variacao_percent: null,
    pais: 'BR',
    coletado_em: new Date().toISOString(),
  }))
}
