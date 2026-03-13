import { redirect } from 'next/navigation'
import { Package2, ClipboardList, Truck, TrendingUp } from 'lucide-react'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { getImporter } from '@/lib/importer'
import DashboardHeader from '@/components/dashboard/DashboardHeader'

export const metadata = {
  title: 'Dashboard – ImportFlow PRO',
}

interface StatCard {
  label: string
  value: string
  icon: React.ElementType
  note: string
}

const statCards: StatCard[] = [
  { label: 'Products', value: '0', icon: Package2, note: 'Coming in Phase 2' },
  { label: 'Orders', value: '0', icon: ClipboardList, note: 'Coming in Phase 2' },
  { label: 'Shipments', value: '0', icon: Truck, note: 'Coming in Phase 2' },
  { label: 'Revenue', value: 'GH₵0', icon: TrendingUp, note: 'Coming in Phase 2' },


]

export default async function DashboardPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  const importer = await getImporter(user.id)

  const businessName = importer?.business_name || user.user_metadata?.business_name || 'My Business'
  const email = user.email || ''

  return (
    <div className="min-h-screen bg-(--color-surface)">
      <DashboardHeader businessName={businessName} email={email} />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Welcome */}
        <div className="mb-8 flex flex-col gap-1 sm:mb-10">
          <h1 className="text-xl font-bold text-(--color-text-primary) sm:text-2xl">
            Welcome back, {businessName} 👋
          </h1>
          <p className="text-sm text-(--color-text-muted)">
            Here&apos;s an overview of your importation business.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, note }) => (
            <div
              key={label}
              className="flex flex-col gap-4 rounded-2xl border border-(--color-border) bg-(--color-card) p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-(--color-text-muted)">{label}</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--color-brand-light)">
                  <Icon className="h-5 w-5 text-(--color-brand)" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold text-(--color-text-primary)">{value}</span>
                <span className="text-xs text-(--color-text-muted)">{note}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Getting Started Card */}
        <div className="mt-8 rounded-2xl border border-(--color-brand)/30 bg-(--color-brand-light) p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-(--color-text-primary)">
                🎉 Your account is ready!
              </h2>
              <p className="text-sm text-(--color-text-muted)">
                Phase 2 will unlock product, order and shipment management. Stay tuned!
              </p>
            </div>
            <div className="shrink-0 rounded-lg bg-(--color-brand) px-5 py-2.5 text-sm font-semibold text-white">
              Phase 2 Coming Soon
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="mt-6 rounded-2xl border border-(--color-border) bg-(--color-card) p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-(--color-text-primary)">
            Account Details
          </h3>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs font-medium text-(--color-text-muted) uppercase tracking-wide">
                Business Name
              </dt>
              <dd className="text-sm font-medium text-(--color-text-primary)">{businessName}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs font-medium text-(--color-text-muted) uppercase tracking-wide">
                Email Address
              </dt>
              <dd className="text-sm font-medium text-(--color-text-primary)">{email}</dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  )
}
