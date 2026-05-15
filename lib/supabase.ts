import { createClient } from '@supabase/supabase-js'

export type Recipe = {
  id: string
  title: string
  url: string
  image_url: string | null
  rating: number | null
  tags: string[]
  memo: string | null
  created_at: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
