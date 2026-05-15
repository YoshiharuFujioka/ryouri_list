# 料理お気に入りアプリ

お気に入りのレシピ・料理動画を管理するアプリです。  
URLを入力するだけでサムネイルを自動取得し、タグ・評価・メモと一緒に保存できます。

## 技術スタック

- **フロントエンド / API**: Next.js 14 (App Router)
- **データベース**: Supabase (PostgreSQL)
- **画像ストレージ**: Supabase Storage
- **ホスティング**: Vercel

---

## セットアップ手順

### 1. Supabase セットアップ

#### 1-1. プロジェクト作成
1. https://supabase.com にアクセスしてログイン
2. 「New Project」でプロジェクト作成
3. **Project URL** と **anon key** をメモ（Settings → API）

#### 1-2. テーブル作成
SQL Editor で以下をコピペして実行：

```sql
create extension if not exists "uuid-ossp";

create table recipes (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  url text not null,
  image_url text,
  rating integer check (rating >= 1 and rating <= 5),
  tags text[] default '{}',
  memo text,
  created_at timestamptz default now()
);

alter table recipes enable row level security;
create policy "allow all" on recipes for all using (true) with check (true);
```

#### 1-3. Storage バケット作成
1. Storage メニューで「New bucket」→ 名前: `recipe-images`
2. **Public bucket** にチェック ✅

SQL Editor で以下をコピペして実行：

```sql
create policy "public read" on storage.objects for select using (bucket_id = 'recipe-images');
create policy "allow upload" on storage.objects for insert with check (bucket_id = 'recipe-images');
create policy "allow delete" on storage.objects for delete using (bucket_id = 'recipe-images');
```

---

### 2. Vercel デプロイ

1. https://vercel.com でGitHubアカウントでログイン
2. 「Add New → Project」→ このリポジトリを選択して「Import」
3. **Environment Variables** に以下を追加：

| Name                            | Value                 |
| ------------------------------- | --------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | SupabaseのProject URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabaseのanon key    |

4. 「Deploy」をクリック

---

### 3. 更新方法

GitHubのファイルを直接編集してCommitするだけで、Vercelが自動で再デプロイします。  
ローカル環境は不要です。

---

## フォルダ構成

```
ryouri_list/
├── README.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                        # メインページ（一覧・検索・フィルタ）
│   └── api/
│       ├── fetch-thumbnail/
│       │   └── route.ts                # YouTube/Vimeo/OGPサムネ取得
│       ├── upload-image/
│       │   └── route.ts                # 画像→Supabase Storage保存
│       └── recipes/
│           ├── route.ts                # レシピ一覧取得・新規追加
│           └── [id]/
│               └── route.ts            # レシピ更新・削除
├── components/
│   ├── RecipeCard.tsx                  # カード表示コンポーネント
│   └── RecipeForm.tsx                  # 追加・編集フォーム
└── lib/
    └── supabase.ts                     # Supabaseクライアント・型定義
```

---

## 主な機能

- URLからサムネイル自動取得（YouTube・Vimeo・一般レシピサイト対応）
- レシピをカード形式で一覧表示
- タグ・評価・料理名での検索・フィルタ・ソート
- レシピの追加・編集・削除
- 画像はSupabase Storageに自動保存