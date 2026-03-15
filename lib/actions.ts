'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Server-side login action.
 * Running sign-in on the server ensures Supabase sets the session cookies
 * via Set-Cookie response headers — not via document.cookie — so the proxy
 * and every subsequent server component can immediately read a valid session.
 */
export async function loginAction(credentials: { email: string; password: string }) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })

  if (error) {
    return { error: error.message }
  }

  // redirect() throws a special Next.js error caught by the framework —
  // the browser will navigate and the fresh session cookies are included
  // in the response automatically.
  redirect('/dashboard')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  // Redirect back to the store page (will be handled by the form's action)
}