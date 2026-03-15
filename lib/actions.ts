'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Server-side login for importers.
 * Signs in via the server so session cookies are set correctly.
 */
export async function loginAction(credentials: { email: string; password: string }) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })

  if (error) {
    return { error: error.message }
  }

  // Check if this user is actually a customer, not an importer
  const { data: importerRecord } = await supabase
    .from('importers')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!importerRecord) {
    // Sign them back out — wrong login page
    await supabase.auth.signOut()
    return { error: 'This account is registered as a store customer, not an importer. Please log in through your store\'s login page.' }
  }

  redirect('/dashboard')
}

/**
 * Server-side logout for importers.
 * Only signs out the server-side importer session (cookie-based).
 * Customer localStorage sessions are untouched.
 */
export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

/**
 * Customer logout is handled client-side only — calling signOut()
 * on the customer client clears just the customer's localStorage key.
 * See StoreContent.tsx handleLogout for usage.
 */
