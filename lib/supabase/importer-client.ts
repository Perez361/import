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
        },
      }
    )
  }
  return instance
}
