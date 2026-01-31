import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use new publishable key (recommended) or fallback to legacy anon key
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey
  )
}
