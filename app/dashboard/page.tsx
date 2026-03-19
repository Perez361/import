import { redirect } from 'next/navigation'
import { Package2, ClipboardList, Users, TrendingUp, Package, ShoppingCart, Truck as TruckIcon } from 'lucide-react'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { getImporter } from '@/lib/importer'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Dashboard – ImportFlow PRO',
}

function getTimeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function DashboardPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const importer = await getImporter(user.id)
  const businessName = importer?.business_name || user.user_metadata?.business_name || 'My Business'
  const email = user.email || ''

  const supabase = await createClient()

  const [
    { count: productCount },
    { count: orderCount },
    { count: customerCount },
    { data: orders },
    { data: recentActivity },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('importer_id', user.id),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', user.id),
    supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', user.id),
    supabase
      .from('orders')
      .select('total, shipping_fee, status')
      .eq('store_id', user.id),
    supabase
      .from('orders')
      .select(`
        id,
        status,
        created_at,
        total,
        customers (full_name, username)
      `)
      .eq('store_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const pendingCount = orders?.filter((o) => o.status === 'pending').length ?? 0

  // ── Exclude cancelled orders from all revenue calculations ──
  const paidOrders = orders?.filter((o) => o.status !== 'cancelled') ?? []

  const totalRevenue = paidOrders.reduce(
    (sum, o) => sum + (parseFloat(String(o.total)) || 0) + (parseFloat(String(o.shipping_fee)) || 0),
    0
  )

  const productRevenue = paidOrders.reduce(
    (sum, o) => sum + (parseFloat(String(o.total)) || 0),
    0
  )

  const shippingRevenue = paidOrders.reduce(
    (sum, o) => sum + (parseFloat(String(o.shipping_fee)) || 0),
    0
  )

  const fmt = (n: number) =>
    n.toLocaleString('en-GH', { maximumFractionDigits: 0 })

  const statCards = [
    {
      label: 'Products',
      value: String(productCount ?? 0),
      icon: Package2,
      note: 'total listed',
    },
    {
      label: 'Orders',
      value: String(orderCount ?? 0),
      icon: ClipboardList,
      note: `${pendingCount} pending`,
    },
    {
      label: 'Customers',
      value: String(customerCount ?? 0),
      icon: Users,
      note: 'registered',
    },
    {
      label: 'Revenue',
      value: `GH₵${fmt(totalRevenue)}`,
      sub: `Products GH₵${fmt(productRevenue)} · Shipping GH₵${fmt(shippingRevenue)}`,
      icon: TrendingUp,
      note: 'all time (excl. cancelled)',
    },
    {
      label: 'Shipping Collected',
      value: `GH₵${fmt(shippingRevenue)}`,
      icon: TruckIcon,
      note: 'Total shipping fees received',
    },
  ]

  const statusColor: Record<string, string> = {
    pending: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
    processing: 'bg-[var(--color-brand-light)] text-[var(--color-brand)]',
    shipped: 'bg-sky-50 text-sky-600',
    delivered: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
    cancelled: 'bg-[var(--color-danger-light)] text-[var(--color-danger)]',
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
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

        {/* Recent Orders */}
        <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold text-[var(--color-text-primary)]">Recent Orders</h3>

          {!recentActivity || recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <ShoppingCart className="h-10 w-10 text-[var(--color-text-muted)]" />
              <p className="text-sm text-[var(--color-text-muted)]">No orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {recentActivity.map((order: any) => {
                const customerName =
                  order.customers?.full_name ||
                  order.customers?.username ||
                  'Unknown customer'
                const status = order.status?.toLowerCase() || 'pending'
                const timeAgo = getTimeAgo(order.created_at)

                return (
                  <div key={order.id} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-brand-light)]">
                        <ShoppingCart className="h-5 w-5 text-[var(--color-brand)]" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)]">
                          Order #{order.id.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">{customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                          statusColor[status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {status}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[var(--color-success)]">
                          GH₵{fmt(parseFloat(String(order.total)) || 0)}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">{timeAgo}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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
                Email
              </dt>
              <dd className="text-sm font-medium text-[var(--color-text-primary)]">{email}</dd>
            </div>
          </dl>
        </div>

      </main>
    </div>
  )
}