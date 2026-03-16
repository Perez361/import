'use client'

import { useRouter } from 'next/navigation'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, TrendingDown, ShoppingCart, Users,
  DollarSign, Package, ArrowUpRight, Minus, Truck,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Order {
  id: string
  total: number | string
  shipping_fee?: number | null
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function n(v: number | string | undefined | null): number {
  return parseFloat(String(v || 0)) || 0
}

function fmt(v: number): string {
  return v.toLocaleString('en-GH', { maximumFractionDigits: 0 })
}

function delta(cur: number, prev: number): { val: number; dir: 'up' | 'down' | 'flat' } {
  if (prev === 0) return { val: 0, dir: 'flat' }
  const val = Math.round(((cur - prev) / prev) * 100)
  return { val: Math.abs(val), dir: val > 0 ? 'up' : val < 0 ? 'down' : 'flat' }
}

function totalRevenue(order: Order): number {
  return n(order.total) + n(order.shipping_fee)
}

function buildRevenueData(orders: Order[], period: string) {
  const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[period] || 30
  const buckets: { label: string; key: string; revenue: number; products: number; shipping: number }[] = []

  if (days <= 30) {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      buckets.push({ key: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }), revenue: 0, products: 0, shipping: 0 })
    }
    orders.forEach((o) => {
      const k = o.created_at?.slice(0, 10)
      const b = buckets.find((x) => x.key === k)
      if (b) { b.products += n(o.total); b.shipping += n(o.shipping_fee); b.revenue += totalRevenue(o) }
    })
  } else if (days <= 90) {
    const weeks = Math.ceil(days / 7)
    for (let i = weeks - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i * 7)
      const wStart = new Date(d); wStart.setDate(d.getDate() - d.getDay())
      buckets.push({ key: 'W' + wStart.toISOString().slice(0, 10), label: `Wk${weeks - i}`, revenue: 0, products: 0, shipping: 0 })
    }
    orders.forEach((o) => {
      if (!o.created_at) return
      const d = new Date(o.created_at); const wStart = new Date(d); wStart.setDate(d.getDate() - d.getDay())
      const key = 'W' + wStart.toISOString().slice(0, 10)
      const b = buckets.find((x) => x.key === key)
      if (b) { b.products += n(o.total); b.shipping += n(o.shipping_fee); b.revenue += totalRevenue(o) }
    })
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      buckets.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString('en', { month: 'short' }), revenue: 0, products: 0, shipping: 0 })
    }
    orders.forEach((o) => {
      const k = o.created_at?.slice(0, 7)
      const b = buckets.find((x) => x.key === k)
      if (b) { b.products += n(o.total); b.shipping += n(o.shipping_fee); b.revenue += totalRevenue(o) }
    })
  }

  return buckets.map((b) => ({ ...b, revenue: Math.round(b.revenue), products: Math.round(b.products), shipping: Math.round(b.shipping) }))
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, prev, prefix = '', sub }: {
  label: string; value: number; prev: number; prefix?: string; sub?: string
}) {
  const d = delta(value, prev)
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm flex flex-col gap-3">
      <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">{label}</span>
      <span className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
        {prefix}{fmt(value)}
      </span>
      <div className="flex items-center justify-between flex-wrap gap-1">
        {sub && <span className="text-xs text-[var(--color-text-muted)]">{sub}</span>}
        {prev > 0 && (
          <span className={`flex items-center gap-1 text-xs font-medium ${
            d.dir === 'up' ? 'text-[var(--color-success)]' :
            d.dir === 'down' ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'
          }`}>
            {d.dir === 'up' ? <TrendingUp className="h-3 w-3" /> :
             d.dir === 'down' ? <TrendingDown className="h-3 w-3" /> :
             <Minus className="h-3 w-3" />}
            {d.dir !== 'flat' ? `${d.val}%` : 'No change'} vs prev
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Tooltip formatters ───────────────────────────────────────────────────────

const RevTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const products = payload.find((p: any) => p.dataKey === 'products')?.value || 0
  const shipping = payload.find((p: any) => p.dataKey === 'shipping')?.value || 0
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs shadow-md space-y-1">
      <p className="font-semibold text-[var(--color-text-primary)]">{label}</p>
      <p className="text-[var(--color-brand)]">Products: GH₵{fmt(products)}</p>
      <p className="text-orange-500">Shipping: GH₵{fmt(shipping)}</p>
      <p className="font-semibold text-[var(--color-text-primary)] border-t border-[var(--color-border)] pt-1">Total: GH₵{fmt(products + shipping)}</p>
    </div>
  )
}

const DowTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-[var(--color-text-primary)]">{label}: {payload[0].value} orders</p>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending: '#94A3B8',
  product_paid: '#3B82F6',
  processing: '#2563EB',
  arrived: '#8B5CF6',
  shipping_billed: '#F97316',
  shipping_paid: '#10B981',
  delivered: '#059669',
  cancelled: '#EF4444',
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AnalyticsDashboard({
  period, orders, prevOrders, allOrders,
  customers, prevCustomers, products, orderItems,
}: Props) {
  const router = useRouter()

  // KPIs
  const productRev = orders.reduce((s, o) => s + n(o.total), 0)
  const shippingRev = orders.reduce((s, o) => s + n(o.shipping_fee), 0)
  const revenue = productRev + shippingRev

  const prevProductRev = prevOrders.reduce((s, o) => s + n(o.total), 0)
  const prevShippingRev = prevOrders.reduce((s, o) => s + n(o.shipping_fee), 0)
  const prevRevenue = prevProductRev + prevShippingRev

  const ordCount = orders.length
  const prevOrdCount = prevOrders.length
  const custCount = customers.length
  const prevCustCount = prevCustomers.length
  const aov = ordCount > 0 ? revenue / ordCount : 0
  const prevAov = prevOrders.length > 0 ? prevRevenue / prevOrders.length : 0

  // Revenue chart data
  const revenueData = buildRevenueData(orders, period)

  // Status donut
  const statusCounts: Record<string, number> = {}
  orders.forEach((o) => {
    const s = o.status?.toLowerCase() || 'pending'
    statusCounts[s] = (statusCounts[s] || 0) + 1
  })
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // Top products
  const prodMap: Record<string, string> = {}
  products.forEach((p) => (prodMap[p.id] = p.name))
  const prodRev: Record<string, number> = {}
  orderItems.forEach((i) => {
    const name = prodMap[i.product_id] || 'Unknown'
    prodRev[name] = (prodRev[name] || 0) + n(i.price) * (parseInt(String(i.quantity)) || 1)
  })
  const topProducts = Object.entries(prodRev).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxProdRev = topProducts[0]?.[1] || 1

  // Funnel — updated to match new status flow
  const total = allOrders.length
  const funnel = [
    { label: 'Total orders', count: total, color: '#2563EB' },
    { label: 'Product paid', count: allOrders.filter((o) => ['product_paid','processing','arrived','shipping_billed','shipping_paid','delivered'].includes(o.status?.toLowerCase())).length, color: '#3B82F6' },
    { label: 'Arrived', count: allOrders.filter((o) => ['arrived','shipping_billed','shipping_paid','delivered'].includes(o.status?.toLowerCase())).length, color: '#8B5CF6' },
    { label: 'Shipping paid', count: allOrders.filter((o) => ['shipping_paid','delivered'].includes(o.status?.toLowerCase())).length, color: '#10B981' },
    { label: 'Delivered', count: allOrders.filter((o) => o.status?.toLowerCase() === 'delivered').length, color: '#059669' },
  ]

  // Day of week
  const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dowCounts = new Array(7).fill(0)
  orders.forEach((o) => { if (o.created_at) dowCounts[new Date(o.created_at).getDay()]++ })
  const maxDow = Math.max(...dowCounts)
  const dowData = DOW_LABELS.map((label, i) => ({ label, orders: dowCounts[i] }))

  // Customer insights
  const buyerMap: Record<string, number> = {}
  allOrders.forEach((o) => { buyerMap[o.customer_id] = (buyerMap[o.customer_id] || 0) + 1 })
  const uniqueBuyers = Object.keys(buyerMap).length
  const repeatBuyers = Object.values(buyerMap).filter((v) => v > 1).length

  const periods = [
    { label: '7 days', value: '7d' },
    { label: '30 days', value: '30d' },
    { label: '90 days', value: '90d' },
    { label: '1 year', value: '1y' },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">Analytics</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Business performance — orders, customers & trends</p>
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

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Total Revenue"
          value={Math.round(revenue)}
          prev={Math.round(prevRevenue)}
          prefix="GH₵"
          sub={`+GH₵${fmt(Math.round(shippingRev))} shipping`}
        />
        <KpiCard
          label="Shipping Collected"
          value={Math.round(shippingRev)}
          prev={Math.round(prevShippingRev)}
          prefix="GH₵"
        />
        <KpiCard label="Orders" value={ordCount} prev={prevOrdCount} />
        <KpiCard label="New Customers" value={custCount} prev={prevCustCount} />
        <KpiCard
          label="Avg Order Value"
          value={Math.round(aov)}
          prev={Math.round(prevAov)}
          prefix="GH₵"
          sub="incl. shipping"
        />
      </div>

      {/* Revenue chart + Status donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Revenue over time</h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                {period === '7d' ? 'daily · 7 days' : period === '30d' ? 'daily · 30 days' : period === '90d' ? 'weekly · 90 days' : 'monthly · 1 year'} · products + shipping
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[var(--color-brand)] inline-block" />Products</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-orange-400 inline-block" />Shipping</span>
            </div>
          </div>
          {revenueData.every((d) => d.revenue === 0) ? (
            <div className="flex items-center justify-center py-10 text-sm text-[var(--color-text-muted)]">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} />
                <Tooltip content={<RevTooltip />} />
                <Bar dataKey="products" stackId="a" fill="#2563EB" fillOpacity={0.85} radius={[0, 0, 0, 0]} />
                <Bar dataKey="shipping" stackId="a" fill="#F97316" fillOpacity={0.9} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Order status</h2>
          {statusData.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-sm text-[var(--color-text-muted)]">No orders yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any, name: any) => [v, name.replace(/_/g, ' ')]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
                {statusData.map((s) => (
                  <span key={s.name} className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                    <span className="inline-block h-2 w-2 rounded-sm shrink-0" style={{ background: STATUS_COLORS[s.name] || '#94A3B8' }} />
                    {s.name.replace(/_/g, ' ')} ({s.value})
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top products + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
            Top products <span className="font-normal text-[var(--color-text-muted)]">by revenue</span>
          </h2>
          {topProducts.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-sm text-[var(--color-text-muted)]">No order data yet</div>
          ) : (
            <div className="flex flex-col gap-3">
              {topProducts.map(([name, rev], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="w-4 text-xs text-[var(--color-text-muted)] text-right shrink-0">{i + 1}</span>
                  <span className="flex-1 text-sm text-[var(--color-text-primary)] truncate">{name}</span>
                  <div className="w-20 h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden shrink-0">
                    <div className="h-full rounded-full bg-[var(--color-brand)]" style={{ width: `${Math.round((rev / maxProdRev) * 100)}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)] w-24 text-right shrink-0 tabular-nums">
                    GH₵{fmt(Math.round(rev))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Order funnel</h2>
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
                    style={{ width: `${total > 0 ? Math.round((stage.count / total) * 100) : 0}%`, background: stage.color }}
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
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Orders by day of week</h2>
          {orders.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-sm text-[var(--color-text-muted)]">No orders in this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={dowData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<DowTooltip />} />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                  {dowData.map((entry, i) => (
                    <Cell key={i} fill={entry.orders === maxDow && maxDow > 0 ? '#2563EB' : 'rgba(37,99,235,0.25)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Customer insights</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'New customers', value: custCount, icon: Users },
              { label: 'Unique buyers', value: uniqueBuyers, icon: ShoppingCart },
              { label: 'Repeat buyers', value: repeatBuyers, icon: ArrowUpRight },
              { label: 'Avg orders / cust', value: uniqueBuyers > 0 ? parseFloat((allOrders.length / uniqueBuyers).toFixed(1)) : 0, icon: Package },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                  <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
                </div>
                <span className="text-xl font-bold text-[var(--color-text-primary)] tabular-nums">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Recent activity</h2>
        {allOrders.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-[var(--color-text-muted)]">No orders yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {['Order', 'Status', 'Date', 'Products', 'Shipping', 'Total'].map((h, i) => (
                    <th key={h} className={`pb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] ${i >= 3 ? 'text-right' : 'text-left'} ${i === 2 ? 'hidden sm:table-cell' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {allOrders.slice(0, 10).map((o) => {
                  const status = o.status?.toLowerCase() || 'pending'
                  const shippingFee = n(o.shipping_fee)
                  const grand = totalRevenue(o)
                  return (
                    <tr key={o.id} className="hover:bg-[var(--color-surface)] transition-colors">
                      <td className="py-3 font-mono text-xs text-[var(--color-text-muted)]">#{o.id.slice(-8).toUpperCase()}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize" style={{ background: STATUS_COLORS[status] + '20', color: STATUS_COLORS[status] || '#64748B' }}>
                          {status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-[var(--color-text-muted)] hidden sm:table-cell">
                        {new Date(o.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 text-right tabular-nums text-[var(--color-text-primary)]">GH₵{fmt(Math.round(n(o.total)))}</td>
                      <td className={`py-3 text-right tabular-nums ${shippingFee > 0 ? 'text-orange-500' : 'text-[var(--color-text-muted)]'}`}>
                        {shippingFee > 0 ? `GH₵${fmt(Math.round(shippingFee))}` : '—'}
                      </td>
                      <td className="py-3 text-right font-semibold text-[var(--color-success)] tabular-nums">
                        GH₵{fmt(Math.round(grand))}
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