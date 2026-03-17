import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, ShoppingCart, ChevronRight, Package, AlertCircle, CheckCircle2 } from 'lucide-react'

export const metadata = { title: 'Pre-orders – ImportFlow PRO' }

function monthKey(d: string) {
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}
function monthLabel(key: string) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en', { month: 'long', year: 'numeric' })
}

export default async function PreOrdersPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  // Fetch all orders with items to build monthly summary
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, created_at,
      order_items (
        id,
        products ( id, name, tracking_number )
      )
    `)
    .eq('store_id', user.id)
    .order('created_at', { ascending: false })

  // Build monthly batch summaries
  const batchMap = new Map<string, {
    key: string
    label: string
    totalOrders: number
    totalItems: number
    needsTracking: number
    pendingShipping: number
    awaitingVerification: number
  }>()

  for (const order of orders || []) {
    const key = monthKey(order.created_at)
    if (!batchMap.has(key)) {
      batchMap.set(key, {
        key,
        label: monthLabel(key),
        totalOrders: 0,
        totalItems: 0,
        needsTracking: 0,
        pendingShipping: 0,
        awaitingVerification: 0,
      })
    }
    const b = batchMap.get(key)!
    b.totalOrders += 1
    b.totalItems += (order.order_items || []).length

    const status = order.status?.toLowerCase()
    const hasTracking = (order.order_items || []).some((i: any) => i.products?.tracking_number)

    if (!hasTracking && !['delivered', 'cancelled'].includes(status)) b.needsTracking += 1
    if (status === 'arrived') b.pendingShipping += 1
    if (status === 'shipping_paid') b.awaitingVerification += 1
  }

  const batches = Array.from(batchMap.values()).sort((a, b) => b.key.localeCompare(a.key))

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">Pre-orders</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Orders grouped by month — click a batch to manage</p>
      </div>

      {batches.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] p-14 text-center">
          <ShoppingCart className="h-14 w-14 text-[var(--color-text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">No orders yet</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Orders placed through your store will appear here grouped by month.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {batches.map((b) => (
            <Link
              key={b.key}
              href={`/dashboard/pre-orders/${b.key}`}
              className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm hover:shadow-md hover:border-[var(--color-brand)] transition-all p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-brand-light)] shrink-0">
                    <Calendar className="h-5 w-5 text-[var(--color-brand)]" />
                  </div>
                  <div>
                    <p className="font-bold text-[var(--color-text-primary)] text-lg">{b.label}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {b.totalOrders} order{b.totalOrders !== 1 ? 's' : ''} · {b.totalItems} item{b.totalItems !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-brand)] transition-colors shrink-0" />
              </div>

              {/* Alert badges */}
              {(b.needsTracking > 0 || b.pendingShipping > 0 || b.awaitingVerification > 0) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {b.needsTracking > 0 && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                      <AlertCircle className="h-3 w-3" />
                      {b.needsTracking} need tracking
                    </span>
                  )}
                  {b.pendingShipping > 0 && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                      <Package className="h-3 w-3" />
                      {b.pendingShipping} arrived — bill shipping
                    </span>
                  )}
                  {b.awaitingVerification > 0 && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                      <CheckCircle2 className="h-3 w-3" />
                      {b.awaitingVerification} awaiting verification
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}