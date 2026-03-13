import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { getImporter } from '@/lib/importer'
import Sidebar from '@/components/dashboard/Sidebar'
import DashboardHeader from '@/components/dashboard/DashboardHeader'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  const importer = await getImporter(user.id)
  const businessName = importer?.business_name || user.user_metadata?.business_name || 'My Business'
  const email = user.email || ''

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <DashboardHeader businessName={businessName} email={email} />
      <div className="flex">
        <Sidebar businessName={businessName} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

