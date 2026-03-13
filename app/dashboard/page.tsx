import { redirect } from 'next/navigation'
import { Package2, ClipboardList, Users, TrendingUp, Package, ShoppingCart, Truck } from 'lucide-react'
import { getAuthenticatedUser } from '@/lib/auth/session'
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
  { label: 'Products', value: '24', icon: Package2, note: '+2 today' },
  { label: 'Orders', value: '7', icon: ClipboardList, note: '2 pending' },
  { label: 'Customers', value: '8', icon: Users, note: '+1 new' },
  { label: 'Revenue', value: 'GH₵2,450', icon: TrendingUp, note: '+12% vs last week' },
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
    <div className="min-h-screen bg-[var(--color-surface)]">
      <DashboardHeader businessName={businessName} email={email} />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Welcome */}
        <div className="mb-8 flex flex-col gap-1 sm:mb-10">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">
            Welcome back, {businessName} 👋
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Here's an overview of your importation business.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, note }) => (
            <div
              key={label}
              className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-text-muted)]">{label}</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand-light)]">
                  <Icon className="h-5 w-5 text-[var(--color-brand)]" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold text-[var(--color-text-primary)]">{value}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{note}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold text-[var(--color-text-primary)]">Recent Activity</h3>
          <div className="divide-y divide-[var(--color-border)]">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-success-light)]">
                  <Package className="h-5 w-5 text-[var(--color-success)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">New product added</p>
                  <p className="text-xs text-[var(--color-text-muted)]">T-Shirts (12 units)</p>
                </div>
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">2 min ago</span>
            </div>
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-brand-light)]">
                  <ShoppingCart className="h-5 w-5 text-[var(--color-brand)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">Order #124 confirmed</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Kofi Mensah</p>
                </div>
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">1 hr ago</span>
            </div>
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-warning-light)]">
                  <Truck className="h-5 w-5 text-[var(--color-warning)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">Shipment arrived</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Tracking #GHX123</p>
                </div>
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">3 hrs ago</span>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">
            Account Details
          </h3>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                Business Name
              </dt>
              <dd className="text-sm font-medium text-[var(--color-text-primary)]">{businessName}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                Email Address
              </dt>
              <dd className="text-sm font-medium text-[var(--color-text-primary)]">{email}</dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  )
}

