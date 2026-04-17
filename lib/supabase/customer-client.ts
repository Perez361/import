import { createBrowserClient } from '@supabase/ssr'

// Customer sessions are stored in sessionStorage (per-tab) instead of localStorage.
// This prevents the importer client's localStorage events from bleeding into
// customer tabs and causing unwanted re-renders / auth state changes.
const sessionStorageAdapter = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null
    try { return sessionStorage.getItem(key) } catch { return null }
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return
    try { sessionStorage.setItem(key, value) } catch {}
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return
    try { sessionStorage.removeItem(key) } catch {}
  },
}

const instances = new Map<string, ReturnType<typeof createBrowserClient>>()

export function createCustomerClient(slug: string) {
  if (!instances.has(slug)) {
    instances.set(
      slug,
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            storageKey: `importflow-customer-auth-${slug}`,
            storage: sessionStorageAdapter,
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
          },
        }
      )
    )
  }
  return instances.get(slug)!
}
