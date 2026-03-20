import { requireAdmin } from '@/lib/admin/session'
import { createClient } from '@/lib/supabase/server'
import AdminSettingsClient from '@/components/admin/AdminSettingsClient'

export const metadata = { title: 'Settings – Admin' }

export default async function AdminSettingsPage() {
  const admin = await requireAdmin()
  const supabase = await createClient()

  const { data: admins } = await supabase
    .from('admins')
    .select('id, email, full_name, role, created_at')
    .order('created_at')

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage admin accounts and platform settings</p>
      </div>
      <AdminSettingsClient
        currentAdmin={admin}
        admins={admins || []}
      />
    </div>
  )
}