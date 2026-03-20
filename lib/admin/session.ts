import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface AdminUser {
  id: string
  user_id: string
  email: string
  full_name: string
  role: 'super_admin' | 'admin'
  created_at: string
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !data) return null
  return data as AdminUser
}

export async function requireAdmin() {
  const admin = await getAdminUser()
  if (!admin) redirect('/admin/login')
  return admin
}

export async function requireSuperAdmin() {
  const admin = await getAdminUser()
  if (!admin) redirect('/admin/login')
  if (admin.role !== 'super_admin') redirect('/admin')
  return admin
}