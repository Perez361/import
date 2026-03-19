'use client'

import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, TrendingDown, ShoppingCart, Users,
  DollarSign, Package, ArrowUpRight, Minus, Truck, Calendar,
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
  allTimeRevenue: number
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

function orderRevenue(order: Order): number {
  return n(order.total) + n(order.shipping_fee)
}

// ── Exclude cancelled from revenue chart data ────────────────────────────────
function buildRevenueData(orders: Order[], period: string) {
  const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[period] || 30
  // Filter out cancelled before building chart
  const paid = orders.filter((o) => o.status !== 'cancelled')
  const buckets: { label: string; key: string; revenue: number; products: number; shipping: number }[] = []

  if (days <= 30) {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      buckets.push({ key: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }), revenue: 0, products: 0, shipping: 0 })
    }
    paid.forEach((o) => {
      const k = o.created_at?.slice(0, 10)
      const b = buckets.find((x) => x.key === k)
      if (b) { b.products += n(o.total); b.shipping += n(o.shipping_fee); b.revenue += orderRevenue(o) }
    })
  } else if (days <= 90) {
    const weeks = Math.ceil(days / 7)
    for (let i = weeks - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i * 7)
      const wStart = new Date(d); wStart.setDate(d.getDate() - d.getDay())
      buckets.push({ key: 'W' + wStart.toISOString().slice(0, 10), label: `Wk${weeks - i}`, revenue: 0, products: 0, shipping: 0 })
    }
    paid.forEach((o) => {
      if (!o.created_at) return
      const d = new Date(o.created_at); const wStart = new Date(d); wStart.setDate(d.getDate() - d.getDay())
      const key = 'W' + wStart.toISOString().slice(0, 10)
      const b = buckets.find((x) => x.key === key)
      if (b) { b.products += n(o.total); b.shipping += n(o.shipping_fee); b.revenue += orderRevenue(o) }
    })
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      buckets.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString('en', { month: 'short' }), revenue: 0, products: 0, shipping: 0 })
    }
    paid.forEach((o) => {
      const k = o.created_at?.slice(0, 7)
      const b = buckets.find((x) => x.key === k)
      if (b) { b.products += n(o.total); b.shipping += n(o.shipping_fee); b.revenue += orderRevenue(o) }
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
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm flex flex-col gap-2">
      <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{label}</span>
      <span className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
        {prefix}{fmt(value)}
      </span>
      {sub && <span className="text-xs text-[var(--color-text-muted)]">{sub}</span>}
      {d.dir !== 'flat' && (
        <span className={`flex items-center gap-1 text-xs font-semibold ${
          d.dir === 'up' ? 'text-[var(--color-success)]' :
          d.dir === 'down' ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'
        }`}>
          {d.dir === 'up' ? <TrendingUp className="h-3 w-3" /> :
           d.dir === 'down' ? <TrendingDown className="h-3 w-3" /> :
           <Minus className="h-3 w-3" />}
          {d.val}% vs prev
        </span>
      )}
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

// ─── Status colours ───────────────────────────────────────────────────────────

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
  allTimeRevenue,
}: Props) {
  const router = useRouter()

  // ── KPIs — cancelled excluded ─────────────────────────────────────────────
  const paidOrders     = orders.filter((o) => o.status !== 'cancelled')
  const prevPaidOrders = prevOrders.filter((o) => o.status !== 'cancelled')

  const productRev  = paidOrders.reduce((s, o) => s + n(o.total), 0)
  const shippingRev = paidOrders.reduce((s, o) => s + n(o.shipping_fee), 0)
  const revenue     = productRev + shippingRev

  const prevProductRev  = prevPaidOrders.reduce((s, o) => s + n(o.total), 0)
  const prevShippingRev = prevPaidOrders.reduce((s, o) => s + n(o.shipping_fee), 0)
  const prevRevenue     = prevProductRev + prevShippingRev

  const ordCount     = orders.length
  const prevOrdCount = prevOrders.length
  const custCount    = customers.length
  const prevCustCount = prevCustomers.length
  const aov     = paidOrders.length > 0 ? revenue / paidOrders.length : 0
  const prevAov = prevPaidOrders.length > 0 ? prevRevenue / prevPaidOrders.length : 0

  // Revenue summary (period-scoped)
  const deliveredRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((s, o) => s + n(o.total) + n(o.shipping_fee), 0)
  const cancelledRevenue = orders
    .filter((o) => o.status === 'cancelled')
    .reduce((s, o) => s + n(o.total) + n(o.shipping_fee), 0)

  // Revenue chart data — cancelled already filtered inside buildRevenueData
  const revenueData = buildRevenueData(orders, period)

  // Status donut (all orders including cancelled, for accurate breakdown)
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

  // Funnel
  const total = allOrders.length
  const funnel = [
    { label: 'Total orders', count: total, color: '#2563EB' },
    { label: 'Product paid', count: allOrders.filter((o) => ['product_paid','processing','arrived','shipping_billed','shipping_paid','delivered'].includes(o.status?.toLowerCase())).length, color: '#3B82F6' },
    { label: 'Arrived',      count: allOrders.filter((o) => ['arrived','shipping_billed','shipping_paid','delivered'].includes(o.status?.toLowerCase())).length, color: '#8B5CF6' },
    { label: 'Shipping paid',count: allOrders.filter((o) => ['shipping_paid','delivered'].includes(o.status?.toLowerCase())).length, color: '#10B981' },
    { label: 'Delivered',    count: allOrders.filter((o) => o.status?.toLowerCase() === 'delivered').length, color: '#059669' },
  ]

  // Day of week
  const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dowCounts = new Array(7).fill(0)
  orders.forEach((o) => { if (o.created_at) dowCounts[new Date(o.created_at).getDay()]++ })
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
        <KpiCard label="Total Revenue" value={Math.round(revenue)} prev={Math.round(prevRevenue)} prefix="GH₵" sub={`+GH₵${fmt(Math.round(shippingRev))} shipping`} />
        <KpiCard label="Shipping Collected" value={Math.round(shippingRev)} prev={Math.round(prevShippingRev)} prefix="GH₵" />
        <KpiCard label="Orders" value={ordCount} prev={prevOrdCount} />
        <KpiCard label="New Customers" value={custCount} prev={prevCustCount} />
        <KpiCard label="Avg Order Value" value={Math.round(aov)} prev={Math.round(prevAov)} prefix="GH₵" sub="excl. cancelled" />
      </div>

      {/* Revenue chart + Status donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Revenue over time</h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                {period === '7d' ? 'daily · 7 days' : period === '30d' ? 'daily · 30 days' : period === '90d' ? 'weekly · 90 days' : 'monthly · 1 year'} · excl. cancelled
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
                <Bar dataKey="products" stackId="a" fill="var(--color-brand)" opacity={0.85} radius={[0, 0, 0, 0]} />
                <Bar dataKey="shipping" stackId="a" fill="#F97316" opacity={0.85} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Order status</h2>
          {statusData.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-sm text-[var(--color-text-muted)]">No orders yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94A3B8'} />
                  ))}
                </Pie>
                {/* FIX: removed explicit `number` type on `v` — Recharts types it as
                    ValueType | undefined, so we guard with ?? and String() */}
                <Tooltip formatter={(v, name) => [v ?? 0, String(name).replace(/_/g, ' ')]} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 flex flex-col gap-1.5">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[s.name] || '#94A3B8' }} />
                  <span className="text-[var(--color-text-muted)] capitalize">{s.name.replace(/_/g, ' ')}</span>
                </span>
                <span className="font-semibold text-[var(--color-text-primary)] tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top products + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Top products by revenue</h2>
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
            <div className="flex items-center justify-center py-10 text-sm text-[var(--color-text-muted)]">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={dowData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<DowTooltip />} />
                <Bar dataKey="orders" fill="var(--color-brand)" opacity={0.8} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Customer insights</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Unique buyers', value: uniqueBuyers, icon: Users },
              { label: 'Repeat buyers', value: repeatBuyers, icon: ArrowUpRight },
              { label: 'Total orders', value: allOrders.length, icon: ShoppingCart },
              { label: 'Avg orders/buyer', value: uniqueBuyers > 0 ? parseFloat((allOrders.length / uniqueBuyers).toFixed(1)) : 0, icon: Package },
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
                  const grand = orderRevenue(o)
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
                      <td className={`py-3 text-right font-semibold tabular-nums ${status === 'cancelled' ? 'text-[var(--color-danger)] line-through' : 'text-[var(--color-success)]'}`}>
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

      {/* Revenue Summary */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Revenue Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Gross Revenue', value: `GH₵${fmt(Math.round(revenue))}`, note: 'excl. cancelled orders', icon: TrendingUp, iconColor: 'text-[var(--color-success)]', iconBg: 'bg-[var(--color-success-light)]', valueColor: 'text-[var(--color-text-primary)]' },
            { label: 'Product Revenue', value: `GH₵${fmt(Math.round(productRev))}`, note: 'product prices only', icon: DollarSign, iconColor: 'text-[var(--color-brand)]', iconBg: 'bg-[var(--color-brand-light)]', valueColor: 'text-[var(--color-brand)]' },
            { label: 'Shipping Collected', value: `GH₵${fmt(Math.round(shippingRev))}`, note: 'shipping fees billed', icon: Truck, iconColor: 'text-orange-500', iconBg: 'bg-orange-50', valueColor: 'text-orange-500' },
            { label: 'Delivered Revenue', value: `GH₵${fmt(Math.round(deliveredRevenue))}`, note: 'confirmed delivered', icon: Package, iconColor: 'text-[var(--color-success)]', iconBg: 'bg-[var(--color-success-light)]', valueColor: 'text-[var(--color-success)]' },
            { label: 'Lost to Cancellations', value: `GH₵${fmt(Math.round(cancelledRevenue))}`, note: 'cancelled order value', icon: TrendingDown, iconColor: 'text-[var(--color-danger)]', iconBg: 'bg-[var(--color-danger-light)]', valueColor: 'text-[var(--color-danger)]' },
            { label: 'All-time Revenue', value: `GH₵${fmt(Math.round(allTimeRevenue))}`, note: 'since account creation', icon: Calendar, iconColor: 'text-purple-600', iconBg: 'bg-purple-50', valueColor: 'text-[var(--color-text-primary)]' },
          ].map(({ label, value, note, icon: Icon, iconColor, iconBg, valueColor }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface)]">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{label}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{note}</p>
              </div>
              <span className={`text-sm font-bold tabular-nums shrink-0 ${valueColor}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}