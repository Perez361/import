import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { getImporter } from '@/lib/importer'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import OrdersTable from './OrdersTable'

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

  const importer = await getImporter(user.id)
  if (!importer) redirect('/login')

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
      shipping_fee,
      shipping_paid,
      shipping_billed_at,
      shipping_paid_at,
      shipping_note,
      payment_reference,
      momo_number,
      customers (
        id,
        full_name,
        username,
        contact,
        email
      ),
      order_items (
        quantity,
        price,
        products ( name )
      )
    `)
    .eq('store_id', user.id)
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: orders, error } = await query
  if (error) console.error('Error fetching orders:', error)

  const filters = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Arrived', value: 'arrived' },
    { label: 'Shipping Billed', value: 'shipping_billed' },
    { label: 'Shipping Paid', value: 'shipping_paid' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ]

  const orderList = orders || []
  const awaitingBill = orderList.filter((o) => o.status === 'arrived').length
  const awaitingVerification = orderList.filter((o) => o.status === 'shipping_paid').length

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">Orders</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            Manage pre-orders and shipping billing
          </p>
        </div>
        <div className="flex items-center gap-2">
          {awaitingBill > 0 && (
            <Link
              href="/dashboard/orders?status=arrived"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-warning-light)] text-[var(--color-warning)] text-xs font-semibold"
            >
              <span className="h-2 w-2 rounded-full bg-[var(--color-warning)] animate-pulse" />
              {awaitingBill} need shipping fee
            </Link>
          )}
          {awaitingVerification > 0 && (
            <Link
              href="/dashboard/orders?status=shipping_paid"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-success-light)] text-[var(--color-success)] text-xs font-semibold"
            >
              <span className="h-2 w-2 rounded-full bg-[var(--color-success)] animate-pulse" />
              {awaitingVerification} awaiting verification
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={f.value === 'all' ? '/dashboard/orders' : `/dashboard/orders?status=${f.value}`}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              statusFilter === f.value
                ? 'bg-[var(--color-brand)] text-white'
                : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
        {orderList.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="h-14 w-14 text-[var(--color-text-muted)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
              {statusFilter === 'all' ? 'No orders yet' : `No ${statusFilter.replace('_', ' ')} orders`}
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Orders placed through your store will appear here.
            </p>
          </div>
        ) : (
          <OrdersTable
            orders={orderList}
            importerPhone={importer.phone || ''}
            storeSlug={importer.store_slug || ''}
          />
        )}
      </div>
    </div>
  )
}