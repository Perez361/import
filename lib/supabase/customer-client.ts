import { createBrowserClient } from '@supabase/ssr'

// Dedicated client for customer sessions on storefronts.
// Uses its own localStorage key so it never collides with importer sessions.
// A new instance is created per slug so sessions are fully isolated
// between different storefronts too.
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
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false, // customers don't use OAuth redirects
          },
        }
      )
    )
  }
  return instances.get(slug)!
}
