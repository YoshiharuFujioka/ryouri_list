'use client'

import { Recipe } from '@/lib/supabase'

type Props = {
  recipe: Recipe
  onEdit: (r: Recipe) => void
  onDelete: (id: string) => void
}

export default function RecipeCard({ recipe, onEdit, onDelete }: Props) {
  const stars = '★'.repeat(recipe.rating ?? 0) + '☆'.repeat(5 - (recipe.rating ?? 0))

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* サムネ */}
      <a href={recipe.url} target="_blank" rel="noopener noreferrer" className="block">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-44 object-cover hover:opacity-90 transition-opacity"
          />
        ) : (
          <div className="w-full h-44 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            画像なし
          </div>
        )}
      </a>

      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* タイトル */}
        <a
          href={recipe.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-base leading-snug hover:text-blue-600 line-clamp-2"
        >
          {recipe.title}
        </a>

        {/* 評価 */}
        <p className="text-yellow-400 text-sm tracking-wider">{stars}</p>

        {/* タグ */}
        {recipe.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.map(t => (
              <span key={t} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs rounded-full px-2 py-0.5">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* メモ */}
        {recipe.memo && (
          <p className="text-gray-500 text-xs line-clamp-2">{recipe.memo}</p>
        )}

        {/* 操作 */}
        <div className="flex gap-2 mt-auto pt-2">
          <button
            onClick={() => onEdit(recipe)}
            className="flex-1 border rounded-xl py-1.5 text-xs hover:bg-gray-50"
          >編集</button>
          <button
            onClick={() => { if (confirm('削除しますか？')) onDelete(recipe.id) }}
            className="flex-1 border border-red-200 text-red-500 rounded-xl py-1.5 text-xs hover:bg-red-50"
          >削除</button>
        </div>
      </div>
    </div>
  )
}