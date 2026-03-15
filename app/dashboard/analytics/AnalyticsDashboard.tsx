'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  DollarSign,
  Package,
  ArrowUpRight,
  Minus,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Order {
  id: string
  total: number | string
  status: string
  created_at: string
  customer_id: string
}

interface Customer {
  id: string
  created_at: string
}

interface Product {
  id: string
  name: string
  price: number | string
}

interface OrderItem {
  product_id: string
  quantity: number
  price: number | string
  order_id: string
}

interface Props {
  period: '7d' | '30d' | '90d' | '1y'
  orders: Order[]
  prevOrders: Order[]
  allOrders: Order[]
  customers: Customer[]
  prevCustomers: Customer[]
  products: Product[]
  orderItems: OrderItem[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function n(v: number | string | undefined | null): number {
  return parseFloat(String(v || 0)) || 0
}

function fmt(v: number): string {
  return v.toLocaleString('en-GH', { maximumFractionDigits: 0 })
}

function pct(cur: number, prev: number): { val: number; dir: 'up' | 'down' | 'flat' } {
  if (prev === 0) return { val: 0, dir: 'flat' }
  const val = Math.round(((cur - prev) / prev) * 100)
  return { val: Math.abs(val), dir: val > 0 ? 'up' : val < 0 ? 'down' : 'flat' }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  prev,
  prefix = '',
}: {
  label: string
  value: number
  prev: number
  prefix?: string
}) {
  const delta = pct(value, prev)
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm flex flex-col gap-3">
      <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </span>
      <span className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
        {prefix}
        {fmt(value)}
      </span>
      {prev > 0 && (
        <span
          className={`flex items-center gap-1 text-xs font-medium ${
            delta.dir === 'up'
              ? 'text-[var(--color-success)]'
              : delta.dir === 'down'
              ? 'text-[var(--color-danger)]'
              : 'text-[var(--color-text-muted)]'
          }`}
        >
          {delta.dir === 'up' ? (
            <TrendingUp className="h-3 w-3" />
          ) : delta.dir === 'down' ? (
            <TrendingDown className="h-3 w-3" />
          ) : (
            <Minus className="h-3 w-3" />
          )}
          {delta.dir !== 'flat' ? `${delta.val}%` : 'No change'} vs prev period
        </span>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
    processing: 'bg-[var(--color-brand-light)] text-[var(--color-brand)]',
    shipped: 'bg-blue-50 text-blue-600',
    delivered: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
    cancelled: 'bg-[var(--color-danger-light)] text-[var(--color-danger)]',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
        map[status.toLowerCase()] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {status}
    </span>
  )
}

// ─── Chart: Revenue over time ─────────────────────────────────────────────────

function RevenueChart({ orders, period }: { orders: Order[]; period: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    let Chart: any
    const load = async () => {
      if (typeof window === 'undefined') return
      // @ts-ignore
      Chart = (await import('chart.js/auto')).default
      if (!canvasRef.current) return
      if (chartRef.current) { chartRef.current.destroy() }

      const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[period] || 30
      const labels: string[] = []
      const buckets: Record<string, number> = {}

      if (days <= 30) {
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const key = d.toISOString().slice(0, 10)
          labels.push(d.toLocaleDateString('en', { month: 'short', day: 'numeric' }))
          buckets[key] = 0
        }
        orders.forEach((o) => {
          const k = o.created_at?.slice(0, 10)
          if (k && buckets[k] !== undefined) buckets[k] += n(o.total)
        })
      } else if (days <= 90) {
        const weeks = Math.ceil(days / 7)
        for (let i = weeks - 1; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i * 7)
          const wStart = new Date(d)
          wStart.setDate(d.getDate() - d.getDay())
          const key = 'W' + wStart.toISOString().slice(0, 10)
          labels.push('W' + (i + 1))
          buckets[key] = 0
        }
        orders.forEach((o) => {
          if (!o.created_at) return
          const d = new Date(o.created_at)
          const wStart = new Date(d)
          wStart.setDate(d.getDate() - d.getDay())
          const key = 'W' + wStart.toISOString().slice(0, 10)
          if (buckets[key] !== undefined) buckets[key] += n(o.total)
        })
      } else {
        for (let i = 11; i >= 0; i--) {
          const d = new Date()
          d.setMonth(d.getMonth() - i)
          const key = d.toISOString().slice(0, 7)
          labels.push(d.toLocaleDateString('en', { month: 'short' }))
          buckets[key] = 0
        }
        orders.forEach((o) => {
          const k = o.created_at?.slice(0, 7)
          if (k && buckets[k] !== undefined) buckets[k] += n(o.total)
        })
      }

      const data = Object.values(buckets).map((v) => Math.round(v))

      chartRef.current = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Revenue',
              data,
              borderColor: '#2563EB',
              backgroundColor: 'rgba(37,99,235,0.07)',
              fill: true,
              tension: 0.4,
              pointRadius: days <= 30 ? 3 : 2,
              borderWidth: 2,
              pointBackgroundColor: '#2563EB',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c: any) => `GH₵ ${c.parsed.y.toLocaleString()}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
            },
            y: {
              grid: { color: 'rgba(100,116,139,0.1)' },
              ticks: {
                font: { size: 10 },
                callback: (v: any) =>
                  v >= 1000 ? `GH₵${Math.round(v / 1000)}k` : `GH₵${v}`,
              },
            },
          },
        },
      })
    }
    load()
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null } }
  }, [orders, period])

  return (
    <div style={{ position: 'relative', width: '100%', height: '200px' }}>
      <canvas ref={canvasRef} />
    </div>
  )
}

// ─── Chart: Order status donut ─────────────────────────────────────────────────

function StatusChart({ orders }: { orders: Order[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<any>(null)

  const counts: Record<string, number> = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 }
  orders.forEach((o) => {
    const s = o.status?.toLowerCase() || 'pending'
    if (counts[s] !== undefined) counts[s]++
    else counts.pending++
  })
  const colors: Record<string, string> = {
    pending: '#F59E0B', processing: '#2563EB', shipped: '#0EA5E9',
    delivered: '#10B981', cancelled: '#EF4444',
  }

  useEffect(() => {
    const load = async () => {
      if (typeof window === 'undefined') return
      // @ts-ignore
      const Chart = (await import('chart.js/auto')).default
      if (!canvasRef.current) return
      if (chartRef.current) { chartRef.current.destroy() }

      const labels = Object.keys(counts).filter((k) => counts[k] > 0)
      const data = labels.map((k) => counts[k])
      const bgColors = labels.map((k) => colors[k] || '#94A3B8')

      chartRef.current = new Chart(canvasRef.current, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: bgColors, borderWidth: 0 }] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          cutout: '70%',
        },
      })
    }
    load()
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null } }
  }, [orders])

  const labels = Object.keys(counts).filter((k) => counts[k] > 0)

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {labels.map((l) => (
          <span key={l} className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <span
              className="inline-block h-2 w-2 rounded-sm flex-shrink-0"
              style={{ background: colors[l] }}
            />
            {l} ({counts[l]})
          </span>
        ))}
      </div>
      <div style={{ position: 'relative', width: '100%', height: '150px' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

// ─── Chart: Orders by day of week ─────────────────────────────────────────────

function DowChart({ orders }: { orders: Order[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    const load = async () => {
      if (typeof window === 'undefined') return
      // @ts-ignore
      const Chart = (await import('chart.js/auto')).default
      if (!canvasRef.current) return
      if (chartRef.current) { chartRef.current.destroy() }

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const counts = new Array(7).fill(0)
      orders.forEach((o) => { if (o.created_at) counts[new Date(o.created_at).getDay()]++ })
      const maxVal = Math.max(...counts)

      chartRef.current = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: days,
          datasets: [
            {
              data: counts,
              backgroundColor: counts.map((v) => (v === maxVal && maxVal > 0 ? '#2563EB' : 'rgba(37,99,235,0.25)')),
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            y: { grid: { color: 'rgba(100,116,139,0.1)' }, ticks: { font: { size: 10 }, stepSize: 1 } },
          },
        },
      })
    }
    load()
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null } }
  }, [orders])

  return (
    <div style={{ position: 'relative', width: '100%', height: '150px' }}>
      <canvas ref={canvasRef} />
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function AnalyticsDashboard({
  period,
  orders,
  prevOrders,
  allOrders,
  customers,
  prevCustomers,
  products,
  orderItems,
}: Props) {
  const router = useRouter()

  // ── KPI calculations ──────────────────────────────────────────────────────
  const revenue = orders.reduce((s, o) => s + n(o.total), 0)
  const prevRevenue = prevOrders.reduce((s, o) => s + n(o.total), 0)
  const ordCount = orders.length
  const prevOrdCount = prevOrders.length
  const custCount = customers.length
  const prevCustCount = prevCustomers.length
  const aov = ordCount > 0 ? revenue / ordCount : 0
  const prevAov = prevOrdCount > 0 ? prevRevenue / prevOrdCount : 0

  // ── Top products ──────────────────────────────────────────────────────────
  const prodMap: Record<string, string> = {}
  products.forEach((p) => (prodMap[p.id] = p.name))
  const prodRev: Record<string, number> = {}
  orderItems.forEach((i) => {
    const name = prodMap[i.product_id] || 'Unknown'
    prodRev[name] = (prodRev[name] || 0) + n(i.price) * (parseInt(String(i.quantity)) || 1)
  })
  const topProducts = Object.entries(prodRev)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxProdRev = topProducts[0]?.[1] || 1

  // ── Funnel ────────────────────────────────────────────────────────────────
  const total = allOrders.length
  const funnel = [
    { label: 'Total orders', count: total, color: '#2563EB' },
    {
      label: 'Processing',
      count: allOrders.filter((o) =>
        ['processing', 'shipped', 'delivered'].includes(o.status?.toLowerCase())
      ).length,
      color: '#10B981',
    },
    {
      label: 'Shipped',
      count: allOrders.filter((o) =>
        ['shipped', 'delivered'].includes(o.status?.toLowerCase())
      ).length,
      color: '#0EA5E9',
    },
    {
      label: 'Delivered',
      count: allOrders.filter((o) => o.status?.toLowerCase() === 'delivered').length,
      color: '#059669',
    },
  ]

  // ── Customer insights ─────────────────────────────────────────────────────
  const buyerMap: Record<string, number> = {}
  allOrders.forEach((o) => { buyerMap[o.customer_id] = (buyerMap[o.customer_id] || 0) + 1 })
  const uniqueBuyers = Object.keys(buyerMap).length
  const repeatBuyers = Object.values(buyerMap).filter((v) => v > 1).length

  // ── Period selector ───────────────────────────────────────────────────────
  const periods: { label: string; value: string }[] = [
    { label: '7 days', value: '7d' },
    { label: '30 days', value: '30d' },
    { label: '90 days', value: '90d' },
    { label: '1 year', value: '1y' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Analytics</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            Business performance overview
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => router.push(`/dashboard/analytics?period=${p.value}`)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p.value
                  ? 'bg-[var(--color-brand)] text-white shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Revenue" value={revenue} prev={prevRevenue} prefix="GH₵ " />
        <KpiCard label="Orders" value={ordCount} prev={prevOrdCount} />
        <KpiCard label="New Customers" value={custCount} prev={prevCustCount} />
        <KpiCard label="Avg Order Value" value={Math.round(aov)} prev={Math.round(prevAov)} prefix="GH₵ " />
      </div>

      {/* Revenue + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Revenue over time
            </h2>
            <span className="text-xs text-[var(--color-text-muted)]">
              {period === '7d'
                ? 'daily · 7 days'
                : period === '30d'
                ? 'daily · 30 days'
                : period === '90d'
                ? 'weekly · 90 days'
                : 'monthly · 1 year'}
            </span>
          </div>
          <RevenueChart orders={orders} period={period} />
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
            Order status
          </h2>
          {orders.length === 0 ? (
            <EmptyState label="No orders yet" />
          ) : (
            <StatusChart orders={orders} />
          )}
        </div>
      </div>

      {/* Top products + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
            Top products{' '}
            <span className="font-normal text-[var(--color-text-muted)]">by revenue</span>
          </h2>
          {topProducts.length === 0 ? (
            <EmptyState label="No order data yet" />
          ) : (
            <div className="flex flex-col gap-3">
              {topProducts.map(([name, rev], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="w-4 text-xs text-[var(--color-text-muted)] text-right shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-[var(--color-text-primary)] truncate">
                    {name}
                  </span>
                  <div className="w-20 h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden shrink-0">
                    <div
                      className="h-full rounded-full bg-[var(--color-brand)]"
                      style={{ width: `${Math.round((rev / maxProdRev) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)] w-24 text-right shrink-0 tabular-nums">
                    GH₵ {fmt(Math.round(rev))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
            Order funnel
          </h2>
          <div className="flex flex-col gap-4">
            {funnel.map((stage) => (
              <div key={stage.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[var(--color-text-muted)]">{stage.label}</span>
                  <span className="text-xs font-semibold text-[var(--color-text-primary)] tabular-nums">
                    {stage.count}{' '}
                    <span className="font-normal text-[var(--color-text-muted)]">
                      ({total > 0 ? Math.round((stage.count / total) * 100) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-surface)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${total > 0 ? Math.round((stage.count / total) * 100) : 0}%`,
                      background: stage.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day of week + Customer insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
            Orders by day of week
          </h2>
          {orders.length === 0 ? (
            <EmptyState label="No orders in this period" />
          ) : (
            <DowChart orders={orders} />
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
            Customer insights
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'New customers', value: custCount, icon: Users },
              { label: 'Unique buyers', value: uniqueBuyers, icon: ShoppingCart },
              { label: 'Repeat buyers', value: repeatBuyers, icon: ArrowUpRight },
              {
                label: 'Avg orders / customer',
                value: uniqueBuyers > 0 ? parseFloat((allOrders.length / uniqueBuyers).toFixed(1)) : 0,
                icon: Package,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-2"
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                  <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
                </div>
                <span className="text-xl font-bold text-[var(--color-text-primary)] tabular-nums">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
          Recent activity
        </h2>
        {allOrders.length === 0 ? (
          <EmptyState label="No orders yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left pb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Order
                  </th>
                  <th className="text-left pb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Status
                  </th>
                  <th className="text-left pb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] hidden sm:table-cell">
                    Date
                  </th>
                  <th className="text-right pb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {allOrders.slice(0, 10).map((o) => (
                  <tr key={o.id} className="hover:bg-[var(--color-surface)] transition-colors">
                    <td className="py-3 font-mono text-xs text-[var(--color-text-muted)]">
                      #{o.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={o.status || 'pending'} />
                    </td>
                    <td className="py-3 text-[var(--color-text-muted)] hidden sm:table-cell text-xs">
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-sm text-[var(--color-text-muted)]">
      {label}
    </div>
  )
}
