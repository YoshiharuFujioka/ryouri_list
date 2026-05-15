import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 一覧取得
export async function GET() {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// 新規追加
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, url, image_url, rating, tags, memo } = body

  if (!title || !url) {
    return NextResponse.json({ error: 'title と url は必須です' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('recipes')
    .insert({ title, url, image_url, rating, tags: tags ?? [], memo })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}