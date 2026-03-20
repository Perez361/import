import { getAdminUser } from '@/lib/admin/session'
import { redirect } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getAdminUser()
  if (!admin) redirect('/admin/login')

  return (
    <AdminShell admin={admin}>
      {children}
    </AdminShell>
  )
}