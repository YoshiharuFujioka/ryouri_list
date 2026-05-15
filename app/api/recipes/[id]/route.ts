import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type Params = { params: { id: string } }

// 更新
export async function PATCH(req: NextRequest, { params }: Params) {
  const body = await req.json()
  const { title, url, image_url, rating, tags, memo } = body

  const { data, error } = await supabase
    .from('recipes')
    .update({ title, url, image_url, rating, tags, memo })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// 削除
export async function DELETE(_req: NextRequest, { params }: Params) {
  // Storage の画像も削除
  const { data: recipe } = await supabase
    .from('recipes')
    .select('image_url')
    .eq('id', params.id)
    .single()

  if (recipe?.image_url) {
    // Supabase Storage のパスを抽出
    const path = recipe.image_url.split('/recipe-images/')[1]
    if (path) await supabase.storage.from('recipe-images').remove([path])
  }

  const { error } = await supabase.from('recipes').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}