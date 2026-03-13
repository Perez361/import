import { createServerClient } from '@supabase/ssr'

export async function createClient() {
  // Simplified server client for app dir - cookies handled in middleware
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    }
  )
}

