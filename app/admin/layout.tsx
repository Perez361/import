import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/session'
import AdminShell from '@/components/admin/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()

  return (
    <AdminShell admin={admin}>
      {children}
    </AdminShell>
  )
}