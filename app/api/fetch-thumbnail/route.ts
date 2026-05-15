import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// YouTube の動画IDを抽出
function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

// Vimeo の動画IDを抽出
function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return m ? m[1] : null
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

  try {
    // YouTube
    const ytId = getYouTubeId(url)
    if (ytId) {
      // maxresdefault → hqdefault にフォールバック
      const thumbUrl = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
      return NextResponse.json({ imageUrl: thumbUrl, title: null })
    }

    // Vimeo
    const vimeoId = getVimeoId(url)
    if (vimeoId) {
      const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`)
      if (res.ok) {
        const data = await res.json()
        return NextResponse.json({ imageUrl: data.thumbnail_url, title: data.title })
      }
    }

    // 一般サイト: OGP取得
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    const html = await res.text()

    // og:image
    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]

    // og:title
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
      ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]

    if (!ogImage) {
      return NextResponse.json({ imageUrl: null, title: ogTitle ?? null })
    }

    // 相対URLを絶対URLに変換
    const base = new URL(url)
    const absImage = ogImage.startsWith('http') ? ogImage : `${base.origin}${ogImage}`

    return NextResponse.json({ imageUrl: absImage, title: ogTitle ?? null })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}