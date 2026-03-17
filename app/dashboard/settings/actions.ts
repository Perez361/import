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
  const store_slug = (formData.get('store_slug') as string)?.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')

  if (!business_name) return { error: 'Business name is required' }
  if (!store_slug) return { error: 'Store slug is required' }

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

  const newPassword = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!newPassword || newPassword.length < 8)
    return { error: 'Password must be at least 8 characters' }
  if (newPassword !== confirmPassword)
    return { error: 'Passwords do not match' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }

  return { success: true }
}