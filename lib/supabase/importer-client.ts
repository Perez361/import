import { createBrowserClient } from '@supabase/ssr'

// Dedicated client for importer/staff sessions.
// Uses its own localStorage key so it never collides with customer sessions.
let instance: ReturnType<typeof createBrowserClient> | null = null

export function createImporterClient() {
  if (!instance) {
    instance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storageKey: 'importflow-importer-auth',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: {
            getItem: (key: string) => {
              if (typeof window === 'undefined') return null
              try {
                return localStorage.getItem(key)
              } catch {
                return null
              }
            },
            setItem: (key: string, value: string) => {
              if (typeof window === 'undefined') return
              try {
                localStorage.setItem(key, value)
              } catch {}
            },
            removeItem: (key: string) => {
              if (typeof window === 'undefined') return
              try {
                localStorage.removeItem(key)
              } catch {}
            },
          },
        },
      }
    )
  }
  return instance
}
