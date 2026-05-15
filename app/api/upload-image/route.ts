import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// URLから画像を取得してSupabase Storageに保存する
export async function POST(req: NextRequest) {
  const { imageUrl } = await req.json()
  if (!imageUrl) return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })

  try {
    // 外部URLから画像を取得
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`)

    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
    const buf = await res.arrayBuffer()

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from('recipe-images')
      .upload(filename, buf, { contentType, upsert: false })

    if (error) throw new Error(error.message)

    const { data } = supabase.storage.from('recipe-images').getPublicUrl(filename)
    return NextResponse.json({ publicUrl: data.publicUrl })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}