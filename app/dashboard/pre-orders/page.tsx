import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Package, Users, ShoppingCart, Hash,
  ChevronRight, Calendar, AlertCircle, CheckCircle2,
} from 'lucide-react'

export const metadata = { title: 'Pre-orders – ImportFlow PRO' }

// ── helpers ───────────────────────────────────────────────────────────────────

function monthKey(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString('en', { month: 'long', year: 'numeric' })
}

const STATUS_COLOR: Record<string, string> = {
  pending:         'bg-gray-100 text-gray-600',
  product_paid:    'bg-blue-100 text-blue-700',
  processing:      'bg-indigo-100 text-indigo-700',
  arrived:         'bg-purple-100 text-purple-700',
  shipping_billed: 'bg-orange-100 text-orange-700',
  shipping_paid:   'bg-green-100 text-green-700',
  delivered:       'bg-emerald-100 text-emerald-700',
  cancelled:       'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  pending:         'Pending',
  product_paid:    'Product Paid',
  processing:      'Processing',
  arrived:         'Arrived',
  shipping_billed: 'Shipping Due',
  shipping_paid:   'Shipping Paid',
  delivered:       'Delivered',
  cancelled:       'Cancelled',
}

// ── page ──────────────────────────────────────────────────────────────────────

export default async function PreOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>
}) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const params = await searchParams

  // Fetch all active (non-delivered, non-cancelled) order items with full joins
  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      id, quantity, price,
      products ( id, name, price, tracking_number, supplier_name ),
      orders (
        id, status, created_at, total, shipping_fee,
        customers ( id, full_name, username, contact, location )
      )
    `)
    .in(
      'order_id',
      (
        await supabase
          .from('orders')
          .select('id')
          .eq('store_id', user.id)
          .not('status', 'in', '("delivered","cancelled")')
      ).data?.map((o) => o.id) || []
    )
    .order('created_at', { referencedTable: 'orders', ascending: false })

  const items = (orderItems || []) as any[]

  // ── Build month → product → customers map ────────────────────────────────

  // Collect all unique months, sorted newest first
  const monthSet = new Set<string>()
  items.forEach((item) => {
    if (item.orders?.created_at) monthSet.add(monthKey(item.orders.created_at))
  })
  const months = Array.from(monthSet).sort((a, b) => b.localeCompare(a))

  // Default to the most recent month
  const activeBatch = params.batch && months.includes(params.batch)
    ? params.batch
    : months[0] ?? null

  // Filter items to the active batch month
  const batchItems = activeBatch
    ? items.filter(
        (item) => item.orders?.created_at && monthKey(item.orders.created_at) === activeBatch
      )
    : []

  // Group by product id
  type CustomerRow = {
    orderId: string
    customerId: string
    name: string
    contact: string
    location: string
    quantity: number
    price: number
    status: string
  }
  type ProductGroup = {
    productId: string
    productName: string
    trackingNumber: string | null
    supplierName: string | null
    customers: CustomerRow[]
  }

  const productMap = new Map<string, ProductGroup>()

  batchItems.forEach((item) => {
    const product = item.products
    const order = item.orders
    const customer = order?.customers
      ? (Array.isArray(order.customers) ? order.customers[0] : order.customers)
      : null
    if (!product) return

    if (!productMap.has(product.id)) {
      productMap.set(product.id, {
        productId: product.id,
        productName: product.name,
        trackingNumber: product.tracking_number ?? null,
        supplierName: product.supplier_name ?? null,
        customers: [],
      })
    }

    productMap.get(product.id)!.customers.push({
      orderId: order?.id ?? '',
      customerId: customer?.id ?? '',
      name: customer?.full_name || customer?.username || 'Unknown',
      contact: customer?.contact || '—',
      location: customer?.location || '—',
      quantity: item.quantity,
      price: parseFloat(String(item.price)) || 0,
      status: order?.status?.toLowerCase() || 'pending',
    })
  })

  const productGroups = Array.from(productMap.values())

  const fmt = (n: number) => n.toLocaleString('en-GH', { maximumFractionDigits: 0 })

  return (
    <div className="flex min-h-full">

      {/* ── Month sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-card)] min-h-full">
        <div className="px-4 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[var(--color-brand)]" />
            <span className="text-sm font-bold text-[var(--color-text-primary)]">Order Batches</span>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {months.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] px-3 py-2">No orders yet</p>
          ) : (
            months.map((m) => {
              const isActive = m === activeBatch
              const count = items.filter(
                (i) => i.orders?.created_at && monthKey(i.orders.created_at) === m
              ).length
              return (
                <Link
                  key={m}
                  href={`/dashboard/pre-orders?batch=${m}`}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
                    isActive
                      ? 'bg-[var(--color-brand-light)] text-[var(--color-brand)] font-semibold'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
                  }`}
                >
                  <span>{monthLabel(m)}</span>
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-[var(--color-brand)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
                  }`}>
                    {count}
                  </span>
                </Link>
              )
            })
          )}
        </nav>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="flex-1 p-4 sm:p-6 space-y-5 min-w-0">

        {/* Mobile month selector */}
        <div className="md:hidden">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {months.map((m) => (
              <Link
                key={m}
                href={`/dashboard/pre-orders?batch=${m}`}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  m === activeBatch
                    ? 'bg-[var(--color-brand)] text-white'
                    : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]'
                }`}
              >
                {monthLabel(m)}
              </Link>
            ))}
          </div>
        </div>

        {/* Batch header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
              {activeBatch ? monthLabel(activeBatch) : 'Pre-orders'}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
              {productGroups.length} product{productGroups.length !== 1 ? 's' : ''} ·{' '}
              {batchItems.length} item{batchItems.length !== 1 ? 's' : ''} ordered
            </p>
          </div>
        </div>

        {/* Empty state */}
        {months.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] p-12 text-center">
            <ShoppingCart className="h-14 w-14 text-[var(--color-text-muted)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">No active pre-orders</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              When customers place orders they will appear here, grouped by month.
            </p>
          </div>
        )}

        {activeBatch && productGroups.length === 0 && months.length > 0 && (
          <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] p-10 text-center">
            <Package className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--color-text-muted)]">No active orders for this month.</p>
          </div>
        )}

        {/* ── Product groups ──────────────────────────────────────────── */}
        <div className="space-y-5">
          {productGroups.map((group) => {
            const totalQty = group.customers.reduce((s, c) => s + c.quantity, 0)
            const totalValue = group.customers.reduce((s, c) => s + c.price * c.quantity, 0)

            return (
              <div
                key={group.productId}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden"
              >
                {/* Product header */}
                <div className={`px-5 py-4 border-b border-[var(--color-border)] ${
                  group.trackingNumber
                    ? 'bg-[var(--color-surface)]'
                    : 'bg-orange-50 border-orange-100'
                }`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">

                    {/* Left: product info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-light)] shrink-0">
                        <Package className="h-5 w-5 text-[var(--color-brand)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[var(--color-text-primary)] truncate">{group.productName}</p>
                        {group.supplierName && (
                          <p className="text-xs text-[var(--color-text-muted)]">{group.supplierName}</p>
                        )}
                      </div>
                    </div>

                    {/* Right: tracking + stats */}
                    <div className="flex items-center gap-3 flex-wrap">

                      {/* Tracking number badge */}
                      {group.trackingNumber ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[var(--color-border)] shadow-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)] shrink-0" />
                          <span className="font-mono text-xs font-bold text-[var(--color-text-primary)]">
                            {group.trackingNumber}
                          </span>
                        </div>
                      ) : (
                        <Link
                          href={`/dashboard/products/${group.productId}/edit`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-orange-300 text-orange-600 text-xs font-semibold hover:bg-orange-50 transition-colors"
                        >
                          <AlertCircle className="h-3.5 w-3.5" />
                          No tracking — Add now
                        </Link>
                      )}

                      {/* Stats pill */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand)] text-xs font-semibold">
                        <Users className="h-3 w-3" />
                        {group.customers.length} customer{group.customers.length !== 1 ? 's' : ''} · {totalQty} unit{totalQty !== 1 ? 's' : ''}
                      </div>

                      <span className="text-sm font-bold text-[var(--color-success)] tabular-nums">
                        GH₵{fmt(totalValue)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Customer</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Contact</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] hidden sm:table-cell">Location</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Qty</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Amount</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {group.customers.map((c, i) => (
                        <tr key={`${c.orderId}-${i}`} className="hover:bg-[var(--color-surface)] transition-colors">

                          {/* Customer name + avatar initial */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-[var(--color-brand-light)] flex items-center justify-center text-[var(--color-brand)] text-xs font-bold shrink-0">
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-[var(--color-text-primary)] whitespace-nowrap">{c.name}</p>
                                <Link
                                  href={`/dashboard/orders?status=${c.status}`}
                                  className="text-[10px] font-mono text-[var(--color-text-muted)] hover:text-[var(--color-brand)] transition-colors"
                                >
                                  #{c.orderId.slice(-8).toUpperCase()}
                                </Link>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="px-4 py-3.5 text-sm text-[var(--color-text-primary)] whitespace-nowrap">
                            {c.contact}
                          </td>

                          {/* Location */}
                          <td className="px-4 py-3.5 text-sm text-[var(--color-text-muted)] hidden sm:table-cell">
                            {c.location}
                          </td>

                          {/* Quantity */}
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)]">
                              {c.quantity}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="px-4 py-3.5 text-right font-semibold text-[var(--color-text-primary)] tabular-nums whitespace-nowrap">
                            GH₵{fmt(c.price * c.quantity)}
                          </td>

                          {/* Status badge */}
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap ${STATUS_COLOR[c.status] || 'bg-gray-100 text-gray-600'}`}>
                              {STATUS_LABEL[c.status] || c.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Product footer totals */}
                <div className="px-5 py-3 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {group.customers.length} customer{group.customers.length !== 1 ? 's' : ''} · {totalQty} unit{totalQty !== 1 ? 's' : ''} ordered
                  </span>
                  <span className="text-sm font-bold text-[var(--color-success)] tabular-nums">
                    Total collected: GH₵{fmt(totalValue)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}