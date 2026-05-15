'use client'

import { useState, useRef } from 'react'
import { Recipe } from '@/lib/supabase'

type Props = {
  initial?: Partial<Recipe>
  onSave: (data: Partial<Recipe>) => Promise<void>
  onCancel: () => void
}

export default function RecipeForm({ initial, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '')
  const [previewUrl, setPreviewUrl] = useState(initial?.image_url ?? '')
  const [rating, setRating] = useState(initial?.rating ?? 3)
  const [tags, setTags] = useState((initial?.tags ?? []).join(' '))
  const [memo, setMemo] = useState(initial?.memo ?? '')
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // URLからサムネ＋タイトルを自動取得
  const fetchThumbnail = async () => {
    if (!url) return
    setFetching(true)
    setError('')
    try {
      const res = await fetch(`/api/fetch-thumbnail?url=${encodeURIComponent(url)}`)
      const json = await res.json()
      if (json.imageUrl) {
        // Storageに保存
        const upRes = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: json.imageUrl }),
        })
        const upJson = await upRes.json()
        if (upJson.publicUrl) {
          setImageUrl(upJson.publicUrl)
          setPreviewUrl(upJson.publicUrl)
        }
      }
      if (json.title && !title) setTitle(json.title)
    } catch (e) {
      setError('サムネイル取得に失敗しました')
    } finally {
      setFetching(false)
    }
  }

  // ファイルから手動アップロード
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFetching(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const ext = file.name.split('.').pop()
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('recipe-images').upload(filename, file, {
        contentType: file.type,
      })
      if (error) throw error
      const { data } = supabase.storage.from('recipe-images').getPublicUrl(filename)
      setImageUrl(data.publicUrl)
      setPreviewUrl(data.publicUrl)
    } catch (e) {
      setError('画像のアップロードに失敗しました')
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async () => {
    if (!title || !url) { setError('料理名とURLは必須です'); return }
    setSaving(true)
    try {
      await onSave({
        title,
        url,
        image_url: imageUrl || null,
        rating,
        tags: tags.split(/[\s\u3000]+/).filter(Boolean),
        memo: memo || null,
      })
    } catch (e) {
      setError('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold">{initial?.id ? 'レシピを編集' : 'レシピを追加'}</h2>

        {/* URL */}
        <div>
          <label className="block text-sm font-medium mb-1">レシピ / 動画URL <span className="text-red-500">*</span></label>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-xl px-3 py-2 text-sm"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
            />
            <button
              onClick={fetchThumbnail}
              disabled={fetching || !url}
              className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50 whitespace-nowrap"
            >
              {fetching ? '取得中…' : 'サムネ取得'}
            </button>
          </div>
        </div>

        {/* サムネプレビュー */}
        <div>
          <label className="block text-sm font-medium mb-1">サムネイル</label>
          {previewUrl ? (
            <div className="relative">
              <img src={previewUrl} alt="preview" className="w-full h-48 object-cover rounded-xl border" />
              <button
                onClick={() => { setImageUrl(''); setPreviewUrl('') }}
                className="absolute top-2 right-2 bg-white/80 rounded-full px-2 py-0.5 text-xs"
              >✕ 削除</button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="w-full h-36 border-2 border-dashed rounded-xl flex items-center justify-center text-gray-400 text-sm cursor-pointer hover:border-blue-400"
            >
              クリックして画像をアップロード
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </div>

        {/* 料理名 */}
        <div>
          <label className="block text-sm font-medium mb-1">料理名 <span className="text-red-500">*</span></label>
          <input
            className="w-full border rounded-xl px-3 py-2 text-sm"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="例: チキンカレー"
          />
        </div>

        {/* 評価 */}
        <div>
          <label className="block text-sm font-medium mb-1">評価</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className={`text-2xl transition-transform hover:scale-110 ${n <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
              >★</button>
            ))}
          </div>
        </div>

        {/* タグ */}
        <div>
          <label className="block text-sm font-medium mb-1">タグ（スペース区切り）</label>
          <input
            className="w-full border rounded-xl px-3 py-2 text-sm"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="例: 和食 簡単 夕食"
          />
        </div>

        {/* メモ */}
        <div>
          <label className="block text-sm font-medium mb-1">メモ</label>
          <textarea
            className="w-full border rounded-xl px-3 py-2 text-sm resize-none"
            rows={3}
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="気になった点など..."
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {saving ? '保存中…' : '保存する'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border rounded-xl py-2.5 text-sm"
          >キャンセル</button>
        </div>
      </div>
    </div>
  )
}