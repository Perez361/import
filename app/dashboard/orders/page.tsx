import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { ShoppingCart, Clock, PackageCheck, XCircle, Package } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Orders – ImportFlow PRO',
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const statusFilter = params.status || 'all'

  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select(`
      id,
      total,
      status,
      created_at,
      customers (
        full_name,
        username,
        contact
      ),
      order_items (
        quantity,
        products (name)
      )
    `)
    .eq('store_id', user.id)
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: orders, error } = await query

  if (error) {
    console.error('Error fetching orders:', error)
  }

  const orderList = orders || []

  const fmt = (n: number) =>
    n.toLocaleString('en-GH', { maximumFractionDigits: 0 })

  const filters = [
    { label: 'All Orders', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Orders</h1>
        <div className="text-sm text-[var(--color-text-muted)]">
          {orderList.length} {statusFilter === 'all' ? 'total' : statusFilter} order{orderList.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
        {/* Status filters */}
        <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-2 flex-wrap">
          {filters.map((f) => (
            <Link
              key={f.value}
              href={f.value === 'all' ? '/dashboard/orders' : `/dashboard/orders?status=${f.value}`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                statusFilter === f.value
                  ? 'bg-[var(--color-brand)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {orderList.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-[var(--color-text-muted)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              {statusFilter === 'all' ? 'No orders yet' : `No ${statusFilter} orders`}
            </h3>
            <p className="text-[var(--color-text-muted)]">
              {statusFilter === 'all'
                ? 'Orders placed through your store will appear here.'
                : 'Try a different status filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {['Order ID', 'Customer', 'Items', 'Amount', 'Status', 'Date'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {orderList.map((order: any) => {
                  const customerName =
                    order.customers?.full_name ||
                    order.customers?.username ||
                    'Unknown'
                  const contact = order.customers?.contact || '—'
                  const status = order.status?.toLowerCase() || 'pending'
                  const itemSummary =
                    order.order_items
                      ?.map((i: any) => `${i.products?.name || 'Item'} x${i.quantity}`)
                      .join(', ') || '—'
                  const total = parseFloat(String(order.total)) || 0
                  const date = new Date(order.created_at).toLocaleDateString('en', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-[var(--color-surface)] transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-sm font-medium text-[var(--color-text-primary)]">
                        #{order.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-[var(--color-text-primary)]">{customerName}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{contact}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-text-muted)] max-w-xs truncate">
                        {itemSummary}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[var(--color-success)]">
                        GH₵{fmt(total)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-text-muted)]">
                        {date}
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { classes: string; icon: React.ReactNode }> = {
    pending: {
      classes: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
      icon: <Clock className="h-3 w-3" />,
    },
    processing: {
      classes: 'bg-[var(--color-brand-light)] text-[var(--color-brand)]',
      icon: <Package className="h-3 w-3" />,
    },
    shipped: {
      classes: 'bg-sky-50 text-sky-600',
      icon: <Package className="h-3 w-3" />,
    },
    delivered: {
      classes: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
      icon: <PackageCheck className="h-3 w-3" />,
    },
    cancelled: {
      classes: 'bg-[var(--color-danger-light)] text-[var(--color-danger)]',
      icon: <XCircle className="h-3 w-3" />,
    },
  }

  const config = map[status] || {
    classes: 'bg-gray-100 text-gray-600',
    icon: null,
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${config.classes}`}
    >
      {config.icon}
      {status}
    </span>
  )
}