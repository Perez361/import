import { createClient } from '@/lib/supabase/server'

/**
 * Securely retrieves the authenticated user by validating the session
 * on the Supabase auth server — never trusting client-side data alone.
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null
  return user
}
