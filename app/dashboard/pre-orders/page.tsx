import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { Package, Hash, Users, ShoppingCart, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Pre-orders – ImportFlow PRO' }

export default async function PreOrdersPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // Fetch all products with their tracking number
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, image_url, tracking_number, supplier_name')
    .eq('importer_id', user.id)
    .order('name')

  // Fetch all active pre-orders with customer info and items
  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      id, quantity, price,
      products ( id, name ),
      orders (
        id, status, created_at, total, shipping_fee, shipping_paid,
        customers ( id, full_name, username, contact, email )
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

  const fmt = (n: number) => n.toLocaleString('en-GH', { maximumFractionDigits: 0 })

  // Group order items by product_id
  const grouped: Record<string, {
    product: { id: string; name: string; price: number; tracking_number?: string | null; supplier_name?: string | null }
    items: any[]
  }> = {}

  ;(products || []).forEach((p) => {
    grouped[p.id] = { product: p, items: [] }
  })

  ;(orderItems || []).forEach((item: any) => {
    const pid = item.products?.id
    if (pid && grouped[pid]) {
      grouped[pid].items.push(item)
    }
  })

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    arrived: 'bg-purple-100 text-purple-700',
    shipping_billed: 'bg-orange-100 text-orange-700',
    shipping_paid: 'bg-green-100 text-green-700',
  }

  // Only show products that have at least one active order
  const activeGroups = Object.values(grouped).filter((g) => (g.items?.length || 0) > 0)
  const emptyGroups = Object.values(grouped).filter((g) => (g.items?.length || 0) === 0)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Pre-orders</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            Active customer orders grouped by product with tracking numbers
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1.5">
            <Package className="h-4 w-4" />
            {activeGroups.length} products with orders
          </span>
          <span className="flex items-center gap-1.5">
            <ShoppingCart className="h-4 w-4" />
            {orderItems?.length || 0} total items
          </span>
        </div>
      </div>

      {activeGroups.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] p-12 text-center">
          <ShoppingCart className="h-14 w-14 text-[var(--color-text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">No active pre-orders</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            When customers place orders they will appear here grouped by product.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeGroups.map(({ product, items }) => {
            const totalQty = (items || []).reduce((s: number, i: any) => s + (i.quantity || 1), 0)
            const hasTracking = !!product.tracking_number

            return (
              <div
                key={product.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden"
              >
                {/* Product header */}
                <div className={`px-5 py-4 flex items-center justify-between flex-wrap gap-3 ${
                  hasTracking ? 'bg-[var(--color-surface)]' : 'bg-orange-50 border-b border-orange-100'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-light)] shrink-0">
                      <Package className="h-5 w-5 text-[var(--color-brand)]" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--color-text-primary)]">{product.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        GH₵{fmt(product.price)}
                        {product.supplier_name && ` · ${product.supplier_name}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Tracking number badge */}
                    {hasTracking ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
                        <span className="font-mono text-sm font-bold text-[var(--color-text-primary)] bg-white border border-[var(--color-border)] px-3 py-1 rounded-lg">
                          {product.tracking_number}
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={`/dashboard/products/${product.id}/edit`}
                        className="flex items-center gap-1.5 text-xs text-orange-600 font-semibold bg-white border border-orange-300 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                        No tracking — Add now
                      </Link>
                    )}

                    {/* Order count */}
                    <span className="flex items-center gap-1.5 text-xs font-semibold bg-[var(--color-brand-light)] text-[var(--color-brand)] px-3 py-1.5 rounded-full">
                      <Users className="h-3 w-3" />
                      {(items || []).length} customer{(items || []).length !== 1 ? 's' : ''} · {totalQty} unit{totalQty !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Customer orders for this product */}
                <div className="divide-y divide-[var(--color-border)]">
                  {(items || []).map((item: any) => {
                    const order = item.orders
                    const customer = order?.customers
                      ? (Array.isArray(order.customers) ? order.customers[0] : order.customers)
                      : null
                    const status = order?.status?.toLowerCase() || 'pending'
                    const shippingFee = parseFloat(String(order?.shipping_fee || 0)) || 0

                    return (
                      <div key={item.id} className="px-5 py-3.5 flex items-center gap-4 flex-wrap hover:bg-[var(--color-surface)] transition-colors">

                        {/* Customer */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-[var(--color-brand-light)] flex items-center justify-center text-[var(--color-brand)] text-xs font-bold shrink-0">
                            {(customer?.full_name || customer?.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                              {customer?.full_name || customer?.username || 'Unknown'}
                            </p>
                            {customer?.contact && (
                              <p className="text-xs text-[var(--color-text-muted)]">{customer.contact}</p>
                            )}
                          </div>
                        </div>

                        {/* Qty */}
                        <div className="text-center shrink-0">
                          <p className="text-xs text-[var(--color-text-muted)]">Qty</p>
                          <p className="text-sm font-bold text-[var(--color-text-primary)]">{item.quantity}</p>
                        </div>

                        {/* Product price */}
                        <div className="text-center shrink-0">
                          <p className="text-xs text-[var(--color-text-muted)]">Product</p>
                          <p className="text-sm font-semibold text-[var(--color-text-primary)] tabular-nums">
                            GH₵{fmt(parseFloat(String(item.price)) * item.quantity)}
                          </p>
                        </div>

                        {/* Shipping fee */}
                        <div className="text-center shrink-0">
                          <p className="text-xs text-[var(--color-text-muted)]">Shipping</p>
                          <p className={`text-sm font-semibold tabular-nums ${shippingFee > 0 ? 'text-orange-600' : 'text-[var(--color-text-muted)]'}`}>
                            {shippingFee > 0 ? `GH₵${fmt(shippingFee)}` : '—'}
                          </p>
                        </div>

                        {/* Status */}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize shrink-0 ${
                          statusColor[status] || 'bg-gray-100 text-gray-600'
                        }`}>
                          {status.replace('_', ' ')}
                        </span>

                        {/* Order link */}
                        <Link
                          href={`/dashboard/orders?status=${status}`}
                          className="text-xs text-[var(--color-brand)] hover:text-[var(--color-brand-dark)] font-mono shrink-0 hover:underline"
                        >
                          #{order?.id?.slice(-6)?.toUpperCase()}
                        </Link>

                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Products with no active orders */}
      {emptyGroups.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            <p className="text-sm font-semibold text-[var(--color-text-muted)]">
              Products with no active orders ({emptyGroups.length})
            </p>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {emptyGroups.map(({ product }) => (
              <div key={product.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-[var(--color-surface)] transition-colors">
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{product.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">GH₵{fmt(product.price)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {product.tracking_number ? (
                    <span className="font-mono text-xs bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-1 rounded-lg text-[var(--color-text-muted)]">
                      {product.tracking_number}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)]">No tracking</span>
                  )}
                  <Link
                    href={`/dashboard/products/${product.id}/edit`}
                    className="p-1.5 text-[var(--color-brand)] hover:bg-[var(--color-brand-light)] rounded-lg transition-all"
                  >
                    <Hash className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}