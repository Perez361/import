import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { getImporter } from '@/lib/importer'
import { getCustomerUser, getCustomerStoreSlug } from '@/lib/auth/user-type'
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

  // Block customers from dashboard
  const customer = await getCustomerUser()
  if (customer) {
    const storeSlug = await getCustomerStoreSlug()
    redirect(`/store/${storeSlug}`)
  }

  const importer = await getImporter(user.id)
  if (!importer) {
    redirect('/login')
  }

  const businessName = importer.business_name
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

