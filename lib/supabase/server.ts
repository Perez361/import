import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getCookieStore() {
  return await cookies()
}

export async function createClient() {
  let cookieStore = null
  try {
    cookieStore = await getCookieStore()
  } catch {
    // Not in a server context
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      cookies: {
        getAll() {
          if (!cookieStore) return []
          try {
            return cookieStore.getAll()
          } catch {
            return []
          }
        },
        setAll(cookiesToSet) {
          if (!cookieStore) return
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore - may be called from Server Component or outside request context
          }
        },
      },
    }
  )
}

