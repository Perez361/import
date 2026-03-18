'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Server-side login for importers via email + password.
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

  // Block customer accounts from logging into the importer dashboard
  const { data: importerRecord } = await supabase
    .from('importers')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!importerRecord) {
    await supabase.auth.signOut()
    return { error: 'This account is registered as a store customer, not an importer. Please log in through your store\'s login page.' }
  }

  redirect('/dashboard')
}

/**
 * Server-side: send OTP to phone number for importer login.
 */
export async function sendPhoneOtpAction(phone: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({ phone })
  if (error) return { error: error.message }
  return { success: true }
}

/**
 * Server-side: verify OTP and establish importer session via cookie.
 */
export async function verifyPhoneOtpAction(phone: string, token: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })

  if (error || !data.user) {
    return { error: error?.message || 'Invalid code. Please try again.' }
  }

  // Block customer accounts
  const { data: importerRecord } = await supabase
    .from('importers')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!importerRecord) {
    await supabase.auth.signOut()
    return { error: 'No importer account found for this phone number. Please register first.' }
  }

  return { success: true }
}

/**
 * Server-side logout for importers.
 */
export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}