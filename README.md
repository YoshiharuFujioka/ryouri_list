# 料理お気に入りアプリ セットアップ手順

## 1. プロジェクト作成

```bash
npx create-next-app@latest ryouri-list --typescript --tailwind --app --src-dir=false
cd ryouri-list
npm install @supabase/supabase-js
```

---

## 2. Supabase セットアップ

### 2-1. プロジェクト作成
1. https://supabase.com にアクセスしてログイン
2. 「New Project」でプロジェクト作成
3. **Project URL** と **anon key** をメモ

### 2-2. テーブル作成
Supabase の SQL Editor で以下を実行：
 →SQL Editerで以下をコピペして実行
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

-- 全件読み取り・書き込みを許可（個人利用想定）
alter table recipes enable row level security;
create policy "allow all" on recipes for all using (true) with check (true);
```

### 2-3. Storage バケット作成
Supabase の Storage メニューで：
1. 「New bucket」→ 名前: `recipe-images`
2. **Public bucket** にチェック ✅

Storage の Policies で以下を実行：
 →SQL Editerで以下をコピペして実行
```sql
create policy "public read" on storage.objects for select using (bucket_id = 'recipe-images');
create policy "allow upload" on storage.objects for insert with check (bucket_id = 'recipe-images');
create policy "allow delete" on storage.objects for delete using (bucket_id = 'recipe-images');
```

---

## 3. 環境変数

プロジェクトルートに `.env.local` を作成：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 4. Vercel デプロイ

```bash
# GitHubにpush
git add .
git commit -m "initial commit"
git push origin main
```

1. https://vercel.com でリポジトリをインポート
2. Environment Variables に `.env.local` の2つを追加
3. Deploy

---

## 5. CSVからの移行（任意）

既存の `ryouri_list.csv` を移行する場合、
Supabase の Table Editor で「Insert rows」からCSVインポートが可能です。
（画像はURLが空になるので、アプリから再登録してください）