import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Users, Package, ArrowUpRight, ArrowDownRight, Minus,
  BarChart3, Calendar, Receipt
} from 'lucide-react'

export const metadata = {
  title: 'Finances – ImportFlow PRO',
}

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const period = params.period || '30d'
  const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[period] || 30

  const supabase = await createClient()

  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceISO = since.toISOString()

  const prevSince = new Date()
  prevSince.setDate(prevSince.getDate() - days * 2)
  const prevSinceISO = prevSince.toISOString()

  const [
    { data: currentOrders },
    { data: prevOrders },
    { data: allOrders },
    { data: orderItems },
    { data: products },
    { count: customerCount },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total, shipping_fee, status, created_at, customer_id')
      .eq('store_id', user.id)
      .gte('created_at', sinceISO),
    supabase
      .from('orders')
      .select('id, total, shipping_fee, status, created_at')
      .eq('store_id', user.id)
      .gte('created_at', prevSinceISO)
      .lt('created_at', sinceISO),
    supabase
      .from('orders')
      .select('id, total, shipping_fee, status, created_at')
      .eq('store_id', user.id),
    supabase
      .from('order_items')
      .select('product_id, quantity, price')
      .in(
        'order_id',
        (
          await supabase
            .from('orders')
            .select('id')
            .eq('store_id', user.id)
            .gte('created_at', sinceISO)
        ).data?.map((o) => o.id) || []
      ),
    supabase
      .from('products')
      .select('id, name, price')
      .eq('importer_id', user.id),
    supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', user.id),
  ])

  const n = (v: any) => parseFloat(String(v || 0)) || 0
  const fmt = (v: number) => v.toLocaleString('en-GH', { maximumFractionDigits: 0 })

  // KPIs
  const revenue = (currentOrders || []).reduce((s, o) => s + n(o.total) + n(o.shipping_fee), 0)
  const prevRevenue = (prevOrders || []).reduce((s, o) => s + n(o.total) + n(o.shipping_fee), 0)
  const orderCount = currentOrders?.length || 0
  const prevOrderCount = prevOrders?.length || 0
  const allRevenue = (allOrders || []).reduce((s, o) => s + n(o.total) + n(o.shipping_fee), 0)
  const aov = orderCount > 0 ? revenue / orderCount : 0
  const prevAov = prevOrderCount > 0 ? prevRevenue / prevOrderCount : 0

  const deliveredRevenue = (currentOrders || [])
    .filter((o) => o.status === 'delivered')
    .reduce((s, o) => s + n(o.total) + n(o.shipping_fee), 0)

  const cancelledRevenue = (currentOrders || [])
    .filter((o) => o.status === 'cancelled')
    .reduce((s, o) => s + n(o.total) + n(o.shipping_fee), 0)

  // Delta helper
  const delta = (cur: number, prev: number) => {
    if (prev === 0) return { pct: 0, dir: 'flat' as const }
    const pct = Math.round(((cur - prev) / prev) * 100)
    return { pct: Math.abs(pct), dir: pct > 0 ? 'up' as const : pct < 0 ? 'down' as const : 'flat' as const }
  }

  // Top products by revenue
  const prodMap: Record<string, string> = {}
  ;(products || []).forEach((p) => (prodMap[p.id] = p.name))
  const prodRev: Record<string, number> = {}
  ;(orderItems || []).forEach((i) => {
    const name = prodMap[i.product_id] || 'Unknown'
    prodRev[name] = (prodRev[name] || 0) + n(i.price) * (parseInt(String(i.quantity)) || 1)
  })
  const topProducts = Object.entries(prodRev)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxProdRev = topProducts[0]?.[1] || 1

  // Order status breakdown
  const statusMap: Record<string, number> = {}
  ;(currentOrders || []).forEach((o) => {
    const s = o.status || 'pending'
    statusMap[s] = (statusMap[s] || 0) + 1
  })

  // Monthly revenue for mini sparkline (last 6 months)
  const monthlyData: { label: string; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('en', { month: 'short' })
    const rev = (allOrders || [])
      .filter((o) => o.created_at?.slice(0, 7) === key)
      .reduce((s, o) => s + n(o.total) + n(o.shipping_fee), 0)
    monthlyData.push({ label, revenue: Math.round(rev) })
  }
  const maxMonthly = Math.max(...monthlyData.map((m) => m.revenue), 1)

  const periodOptions = [
    { label: '7 days', value: '7d' },
    { label: '30 days', value: '30d' },
    { label: '90 days', value: '90d' },
    { label: '1 year', value: '1y' },
  ]

  const statCards = [
    {
      label: 'Revenue',
      value: `GH₵${fmt(Math.round(revenue))}`,
      sub: `All time: GH₵${fmt(Math.round(allRevenue))}`,
      delta: delta(revenue, prevRevenue),
      icon: DollarSign,
      color: 'text-[var(--color-success)]',
      bg: 'bg-[var(--color-success-light)]',
    },
    {
      label: 'Orders',
      value: String(orderCount),
      sub: `${statusMap['pending'] || 0} pending`,
      delta: delta(orderCount, prevOrderCount),
      icon: ShoppingCart,
      color: 'text-[var(--color-brand)]',
      bg: 'bg-[var(--color-brand-light)]',
    },
    {
      label: 'Avg Order Value',
      value: `GH₵${fmt(Math.round(aov))}`,
      sub: 'per order',
      delta: delta(aov, prevAov),
      icon: Receipt,
      color: 'text-[var(--color-warning)]',
      bg: 'bg-[var(--color-warning-light)]',
    },
    {
      label: 'Customers',
      value: String(customerCount ?? 0),
      sub: 'registered',
      delta: { pct: 0, dir: 'flat' as const },
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">Finances</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            Track your revenue, orders and top products
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
          {periodOptions.map((p) => (
            <a
              key={p.value}
              href={`/dashboard/finances?period=${p.value}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p.value
                  ? 'bg-[var(--color-brand)] text-white shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)]'
              }`}
            >
              {p.label}
            </a>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, delta: d, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                {label}
              </span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
              {value}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-muted)]">{sub}</span>
              {d.dir !== 'flat' && (
                <span
                  className={`flex items-center gap-0.5 text-xs font-semibold ${
                    d.dir === 'up' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                  }`}
                >
                  {d.dir === 'up' ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {d.pct}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Bar Chart + Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Monthly bars */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Monthly Revenue
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">Last 6 months</p>
            </div>
            <BarChart3 className="h-4 w-4 text-[var(--color-text-muted)]" />
          </div>
          {monthlyData.every((m) => m.revenue === 0) ? (
            <div className="flex items-center justify-center py-10 text-sm text-[var(--color-text-muted)]">
              No revenue data yet
            </div>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {monthlyData.map((m) => {
                const heightPct = Math.round((m.revenue / maxMonthly) * 100)
                return (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-[var(--color-text-muted)] tabular-nums">
                      {m.revenue > 0 ? `${Math.round(m.revenue / 1000)}k` : ''}
                    </span>
                    <div className="w-full flex items-end" style={{ height: '100px' }}>
                      <div
                        className="w-full rounded-t-lg bg-[var(--color-brand)] opacity-80 hover:opacity-100 transition-all"
                        style={{ height: `${Math.max(heightPct, m.revenue > 0 ? 4 : 0)}%` }}
                        title={`GH₵${fmt(m.revenue)}`}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--color-text-muted)]">{m.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-5">
            Order Status
          </h2>
          {orderCount === 0 ? (
            <div className="flex items-center justify-center py-10 text-sm text-[var(--color-text-muted)]">
              No orders yet
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {[
                { label: 'Pending', key: 'pending', color: 'bg-[var(--color-warning)]' },
                { label: 'Processing', key: 'processing', color: 'bg-[var(--color-brand)]' },
                { label: 'Shipped', key: 'shipped', color: 'bg-sky-400' },
                { label: 'Delivered', key: 'delivered', color: 'bg-[var(--color-success)]' },
                { label: 'Cancelled', key: 'cancelled', color: 'bg-[var(--color-danger)]' },
              ].map(({ label, key, color }) => {
                const count = statusMap[key] || 0
                const pct = orderCount > 0 ? Math.round((count / orderCount) * 100) : 0
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
                      <span className="text-xs font-semibold text-[var(--color-text-primary)] tabular-nums">
                        {count} <span className="font-normal text-[var(--color-text-muted)]">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Products + Revenue Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top products */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
            Top Products{' '}
            <span className="font-normal text-[var(--color-text-muted)]">by revenue</span>
          </h2>
          {topProducts.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-sm text-[var(--color-text-muted)]">
              No sales data yet
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {topProducts.map(([name, rev], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-surface)] text-xs font-bold text-[var(--color-text-muted)] flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-[var(--color-text-primary)] truncate">{name}</span>
                  <div className="w-24 h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden shrink-0">
                    <div
                      className="h-full rounded-full bg-[var(--color-brand)]"
                      style={{ width: `${Math.round((rev / maxProdRev) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)] w-24 text-right shrink-0 tabular-nums">
                    GH₵{fmt(Math.round(rev))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue summary */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
            Revenue Summary
          </h2>
          <div className="flex flex-col gap-3">
            {[
              {
                label: 'Gross Revenue',
                value: `GH₵${fmt(Math.round(revenue))}`,
                note: 'all orders in period',
                color: 'text-[var(--color-text-primary)]',
                icon: TrendingUp,
                iconColor: 'text-[var(--color-success)]',
                iconBg: 'bg-[var(--color-success-light)]',
              },
              {
                label: 'Delivered Revenue',
                value: `GH₵${fmt(Math.round(deliveredRevenue))}`,
                note: 'confirmed delivered',
                color: 'text-[var(--color-success)]',
                icon: Package,
                iconColor: 'text-[var(--color-brand)]',
                iconBg: 'bg-[var(--color-brand-light)]',
              },
              {
                label: 'Cancelled Revenue',
                value: `GH₵${fmt(Math.round(cancelledRevenue))}`,
                note: 'lost to cancellations',
                color: 'text-[var(--color-danger)]',
                icon: TrendingDown,
                iconColor: 'text-[var(--color-danger)]',
                iconBg: 'bg-[var(--color-danger-light)]',
              },
              {
                label: 'All-time Revenue',
                value: `GH₵${fmt(Math.round(allRevenue))}`,
                note: 'since account creation',
                color: 'text-[var(--color-text-primary)]',
                icon: Calendar,
                iconColor: 'text-purple-600',
                iconBg: 'bg-purple-50',
              },
            ].map(({ label, value, note, color, icon: Icon, iconColor, iconBg }) => (
              <div
                key={label}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface)]"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{label}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{note}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold tabular-nums ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent high-value orders */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
          Highest Value Orders{' '}
          <span className="font-normal text-[var(--color-text-muted)]">in this period</span>
        </h2>
        {orderCount === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-[var(--color-text-muted)]">
            No orders in this period
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {['Order', 'Status', 'Date', 'Amount'].map((h, i) => (
                    <th
                      key={h}
                      className={`pb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] ${
                        i === 3 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {[...(currentOrders || [])]
                  .sort((a, b) => n(b.total) - n(a.total))
                  .slice(0, 8)
                  .map((o) => {
                    const status = o.status?.toLowerCase() || 'pending'
                    const statusColors: Record<string, string> = {
                      pending: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
                      processing: 'bg-[var(--color-brand-light)] text-[var(--color-brand)]',
                      shipped: 'bg-sky-50 text-sky-600',
                      delivered: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
                      cancelled: 'bg-[var(--color-danger-light)] text-[var(--color-danger)]',
                    }
                    return (
                      <tr key={o.id} className="hover:bg-[var(--color-surface)] transition-colors">
                        <td className="py-3 font-mono text-xs text-[var(--color-text-muted)]">
                          #{o.id.slice(-8).toUpperCase()}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                              statusColors[status] || 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-[var(--color-text-muted)]">
                          {new Date(o.created_at).toLocaleDateString('en', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 text-right font-semibold text-[var(--color-success)] tabular-nums">
                          GH₵{fmt(Math.round(n(o.total)))}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}