'use client'

import { useEffect, useState, useMemo } from 'react'
import { Recipe } from '@/lib/supabase'
import RecipeCard from '@/components/RecipeCard'
import RecipeForm from '@/components/RecipeForm'

type SortKey = 'newest' | 'ratingDesc' | 'ratingAsc' | 'title'

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Recipe | null>(null)
  const [query, setQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [tagMode, setTagMode] = useState<'OR' | 'AND'>('OR')
  const [sort, setSort] = useState<SortKey>('newest')

  const fetchRecipes = async () => {
    setLoading(true)
    const res = await fetch('/api/recipes')
    const data = await res.json()
    setRecipes(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchRecipes() }, [])

  // 全タグ一覧
  const allTags = useMemo(() => {
    const s = new Set<string>()
    recipes.forEach(r => r.tags?.forEach(t => s.add(t)))
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'ja'))
  }, [recipes])

  const toggleTag = (t: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev)
      next.has(t) ? next.delete(t) : next.add(t)
      return next
    })
  }

  // フィルタ＆ソート
  const filtered = useMemo(() => {
    let list = recipes.filter(r => {
      const q = query.toLowerCase()
      if (q && !r.title.toLowerCase().includes(q) && !r.url.toLowerCase().includes(q) && !(r.tags ?? []).join(' ').toLowerCase().includes(q)) return false
      if (selectedTags.size > 0) {
        const tags = new Set(r.tags ?? [])
        if (tagMode === 'AND') return [...selectedTags].every(t => tags.has(t))
        if (tagMode === 'OR') return [...selectedTags].some(t => tags.has(t))
      }
      return true
    })
    list = [...list].sort((a, b) => {
      if (sort === 'ratingDesc') return (b.rating ?? 0) - (a.rating ?? 0)
      if (sort === 'ratingAsc') return (a.rating ?? 0) - (b.rating ?? 0)
      if (sort === 'title') return a.title.localeCompare(b.title, 'ja')
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return list
  }, [recipes, query, selectedTags, tagMode, sort])

  const handleSave = async (data: Partial<Recipe>) => {
    if (editTarget) {
      await fetch(`/api/recipes/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } else {
      await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    }
    setShowForm(false)
    setEditTarget(null)
    await fetchRecipes()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/recipes/${id}`, { method: 'DELETE' })
    await fetchRecipes()
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold whitespace-nowrap">🍽 料理リスト</h1>
        <input
          className="flex-1 max-w-xs border rounded-xl px-3 py-1.5 text-sm"
          placeholder="検索..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select
          className="border rounded-xl px-2 py-1.5 text-sm"
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
        >
          <option value="newest">新着順</option>
          <option value="ratingDesc">評価（高→低）</option>
          <option value="ratingAsc">評価（低→高）</option>
          <option value="title">料理名順</option>
        </select>
        <button
          onClick={() => { setEditTarget(null); setShowForm(true) }}
          className="bg-blue-600 text-white rounded-xl px-4 py-1.5 text-sm font-medium whitespace-nowrap"
        >
          ＋ 追加
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* タグフィルタ */}
        {allTags.length > 0 && (
          <div className="bg-white border rounded-2xl p-3 mb-4 flex flex-wrap gap-2 items-center">
            <select
              className="border rounded-lg px-2 py-1 text-xs"
              value={tagMode}
              onChange={e => setTagMode(e.target.value as 'OR' | 'AND')}
            >
              <option value="OR">OR</option>
              <option value="AND">AND</option>
            </select>
            {allTags.map(t => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  selectedTags.has(t)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >{t}</button>
            ))}
            {selectedTags.size > 0 && (
              <button
                onClick={() => setSelectedTags(new Set())}
                className="text-xs text-gray-400 underline"
              >解除</button>
            )}
          </div>
        )}

        {/* 件数 */}
        <p className="text-sm text-gray-500 mb-3">{filtered.length} 件</p>

        {/* グリッド */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">レシピがありません</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(r => (
              <RecipeCard
                key={r.id}
                recipe={r}
                onEdit={r => { setEditTarget(r); setShowForm(true) }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* フォームモーダル */}
      {showForm && (
        <RecipeForm
          initial={editTarget ?? {}}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditTarget(null) }}
        />
      )}
    </main>
  )
}