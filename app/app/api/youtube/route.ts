import { NextResponse } from 'next/server'
import { fetchTrendingVideos, searchVideos, searchChannels, detectOutliers, trendingToTrendItems } from '@/lib/youtube'
import { saveTrends } from '@/lib/trends'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'trending'
  const query = searchParams.get('q') || ''
  const channelId = searchParams.get('channel_id') || ''
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    if (action === 'trending') {
      const videos = await fetchTrendingVideos(limit)
      return NextResponse.json({ videos, total: videos.length })
    }

    if (action === 'search' && query) {
      const videos = await searchVideos(query, limit)
      return NextResponse.json({ videos, total: videos.length, query })
    }

    if (action === 'channels' && query) {
      const channels = await searchChannels(query, limit)
      return NextResponse.json({ channels, total: channels.length, query })
    }

    if (action === 'outliers' && channelId) {
      const videos = await detectOutliers(channelId)
      return NextResponse.json({ videos, total: videos.length, channel_id: channelId })
    }

    return NextResponse.json({ error: 'Ação inválida. Use: trending, search, channels, outliers' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST() {
  try {
    const videos = await fetchTrendingVideos(30)
    const items = trendingToTrendItems(videos)
    const res = await saveTrends(items)
    return NextResponse.json({ ok: true, coletados: videos.length, salvos: res.saved })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
