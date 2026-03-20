'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin, requireSuperAdmin } from '@/lib/admin/session'

export async function updateImporterSubscriptionAction(
  importerId: string,
  planName: string,
  status: string,
  notes?: string
) {
  const admin = await requireAdmin()
  const supabase = await createClient()

  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('id')
    .eq('name', planName)
    .single()

  if (!plan) return { error: 'Plan not found' }

  const { error } = await supabase
    .from('importer_subscriptions')
    .upsert({
      importer_id: importerId,
      plan_id: plan.id,
      status,
      notes: notes || null,
      updated_at: new Date().toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'importer_id' })

  if (error) return { error: error.message }

  await supabase.from('admin_activity_log').insert({
    admin_id: admin.id,
    action: 'update_subscription',
    entity_type: 'importer',
    entity_id: importerId,
    details: { plan: planName, status, notes },
  })

  revalidatePath('/admin/importers')
  revalidatePath(`/admin/importers/${importerId}`)
  return { success: true }
}

export async function suspendImporterAction(importerId: string, reason?: string) {
  const admin = await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('importer_subscriptions')
    .update({ status: 'suspended', notes: reason || null, updated_at: new Date().toISOString() })
    .eq('importer_id', importerId)

  if (error) return { error: error.message }

  await supabase.from('admin_activity_log').insert({
    admin_id: admin.id,
    action: 'suspend_importer',
    entity_type: 'importer',
    entity_id: importerId,
    details: { reason },
  })

  revalidatePath('/admin/importers')
  return { success: true }
}

export async function unsuspendImporterAction(importerId: string) {
  const admin = await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('importer_subscriptions')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('importer_id', importerId)

  if (error) return { error: error.message }

  await supabase.from('admin_activity_log').insert({
    admin_id: admin.id,
    action: 'unsuspend_importer',
    entity_type: 'importer',
    entity_id: importerId,
    details: {},
  })

  revalidatePath('/admin/importers')
  return { success: true }
}

export async function createAdminAction(
  email: string,
  fullName: string,
  password: string,
  role: 'admin' | 'super_admin'
) {
  await requireSuperAdmin()
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, is_admin: true },
  })

  if (authError || !authData.user) return { error: authError?.message || 'Failed to create user' }

  const { error } = await supabase.from('admins').insert({
    user_id: authData.user.id,
    email,
    full_name: fullName,
    role,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/settings')
  return { success: true }
}

export async function adminLoginAction(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) return { error: error?.message || 'Login failed' }

  const { data: adminRecord } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', data.user.id)
    .single()

  if (!adminRecord) {
    await supabase.auth.signOut()
    return { error: 'This account does not have admin access.' }
  }

  return { success: true }
}

export async function adminLogoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}