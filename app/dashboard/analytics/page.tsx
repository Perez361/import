import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { getImporter } from '@/lib/importer'
import { fetchAnalyticsData, type AnalyticsPeriod } from '@/lib/analytics'
import dynamic from 'next/dynamic'

export const metadata = {
  title: 'Analytics & Finances – ImportFlow PRO',
}

const AnalyticsDashboard = dynamic(() => import('./AnalyticsDashboard'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[var(--color-text-muted)]">Loading analytics…</p>
      </div>
    </div>
  ),
})

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const importer = await getImporter(user.id)
  if (!importer) redirect('/login')

  const params = await searchParams
  const period = (params.period as AnalyticsPeriod) || '30d'

  const data = await fetchAnalyticsData(user.id, period)

  return (
    <AnalyticsDashboard
      period={period}
      orders={data.orders}
      prevOrders={data.prevOrders}
      allOrders={data.allOrders}
      customers={data.customers}
      prevCustomers={data.prevCustomers}
      products={data.products}
      orderItems={data.orderItems}
      allTimeRevenue={data.allTimeRevenue}
    />
  )
}
