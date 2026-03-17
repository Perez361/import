'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/session'

export async function updateProfileAction(formData: FormData) {
  const user = await getAuthenticatedUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const business_name = (formData.get('business_name') as string)?.trim()
  const full_name = (formData.get('full_name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim()
  const location = (formData.get('location') as string)?.trim()
  const store_slug = (formData.get('store_slug') as string)
    ?.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')

  if (!business_name) return { error: 'Business name is required' }
  if (!store_slug) return { error: 'Store URL is required' }

  // Check slug uniqueness (exclude current user)
  const { data: existing } = await supabase
    .from('importers')
    .select('id')
    .eq('store_slug', store_slug)
    .neq('id', user.id)
    .maybeSingle()

  if (existing) return { error: 'That store URL is already taken. Please choose another.' }

  const { error } = await supabase
    .from('importers')
    .update({ business_name, full_name, phone, location, store_slug })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function changePasswordAction(formData: FormData) {
  const user = await getAuthenticatedUser()
  if (!user) return { error: 'Not authenticated' }

  const currentPassword = (formData.get('current_password') as string)?.trim()
  const newPassword = (formData.get('new_password') as string)?.trim()
  const confirmPassword = (formData.get('confirm_password') as string)?.trim()

  if (!currentPassword) return { error: 'Current password is required' }
  if (!newPassword || newPassword.length < 8)
    return { error: 'New password must be at least 8 characters' }
  if (newPassword !== confirmPassword)
    return { error: 'New passwords do not match' }
  if (currentPassword === newPassword)
    return { error: 'New password must be different from your current password' }

  const supabase = await createClient()

  // Verify current password by re-authenticating
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })

  if (verifyError) return { error: 'Current password is incorrect' }

  // Verified — now set the new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (updateError) return { error: updateError.message }

  return { success: true }
}