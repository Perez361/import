import { redirect, notFound } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Calendar } from 'lucide-react'
import PreOrderMonthClient from './PreOrderMonthClient'
import type { ProductGroup } from './types'

function monthLabel(key: string) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('en', { month: 'long', year: 'numeric' })
}

export async function generateMetadata({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params
  return { title: `${monthLabel(month)} – Pre-orders` }
}

export default async function PreOrderMonthPage({
  params,
}: {
  params: Promise<{ month: string }>
}) {
  const { month } = await params
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  if (!/^\d{4}-\d{2}$/.test(month)) notFound()

  const supabase = await createClient()

  const [year, mon] = month.split('-').map(Number)
  const startDate = new Date(year, mon - 1, 1).toISOString()
  const endDate   = new Date(year, mon, 1).toISOString()

  // ── DEBUG 1: confirm who the user is and what importer record exists ────────
  const { data: importer } = await supabase
    .from('importers')
    .select('id, store_slug, user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  console.log('[pre-orders/page] auth user id :', user.id)
  console.log('[pre-orders/page] importer row  :', importer)

  // The store_id on orders is importer.id — which equals user.id only when
  // the importer was created with id = user.id (as in your auth callback).
  // Use user.id directly since that's what your code inserts as importer.id.
  const storeId = user.id

  // ── DEBUG 2: check raw orders exist for this store at all ───────────────────
  const { data: allOrders, error: allErr } = await supabase
    .from('orders')
    .select('id, status, created_at, store_id')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(10)

  console.log('[pre-orders/page] all recent orders (any month):', allOrders?.length, allErr?.message)
  console.log('[pre-orders/page] date range:', startDate, '→', endDate)
  if (allOrders?.length) {
    console.log('[pre-orders/page] sample created_at values:', allOrders.slice(0, 3).map(o => o.created_at))
  }

  // ── Main query ──────────────────────────────────────────────────────────────
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id, status, created_at, total, shipping_fee, shipping_note,
      momo_number, payment_reference,
      customers ( id, full_name, username, contact, location ),
      order_items (
        id, quantity, price,
        products ( id, name, image_url, tracking_number, supplier_name )
      )
    `)
    .eq('store_id', storeId)
    .gte('created_at', startDate)
    .lt('created_at', endDate)
    .order('created_at', { ascending: false })

  console.log('[pre-orders/page] filtered orders count:', orders?.length, error?.message)
  if (orders?.length) {
    console.log('[pre-orders/page] first order:', JSON.stringify(orders[0], null, 2))
  }

  // ── Group by product ────────────────────────────────────────────────────────
  const productMap = new Map<string, ProductGroup>()

  for (const order of (orders || []) as any[]) {
    const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers
    const custName = customer?.full_name || customer?.username || 'Unknown'

    const items = order.order_items || []
    console.log(`[pre-orders/page] order ${order.id} → ${items.length} items, customer:`, custName)

    for (const item of items as any[]) {
      const product = Array.isArray(item.products) ? item.products[0] : item.products
      console.log('[pre-orders/page]   item product:', product?.id, product?.name)

      if (!product) continue

      if (!productMap.has(product.id)) {
        productMap.set(product.id, {
          productId: product.id,
          productName: product.name,
          productImage: product.image_url ?? null,
          trackingNumber: product.tracking_number ?? null,
          supplierName: product.supplier_name ?? null,
          customers: [],
        })
      }

      productMap.get(product.id)!.customers.push({
        orderId: order.id,
        name: custName,
        contact: customer?.contact || '',
        location: customer?.location || '',
        quantity: item.quantity,
        unitPrice: parseFloat(String(item.price)) || 0,
        status: order.status?.toLowerCase() || 'pending',
        shippingFee: order.shipping_fee ? parseFloat(String(order.shipping_fee)) : null,
        shippingNote: order.shipping_note ?? null,
        momoNumber: order.momo_number ?? null,
        paymentRef: order.payment_reference ?? null,
      })
    }
  }

  const groups = Array.from(productMap.values())
  console.log('[pre-orders/page] final groups:', groups.length)

  const label       = monthLabel(month)
  const totalOrders = orders?.length || 0
  const totalItems  = groups.reduce((s, g) => s + g.customers.length, 0)

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href="/dashboard/pre-orders"
          className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[var(--color-text-muted)]" />
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-light)] shrink-0">
            <Calendar className="h-5 w-5 text-[var(--color-brand)]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">{label}</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              {groups.length} product{groups.length !== 1 ? 's' : ''} ·{' '}
              {totalOrders} order{totalOrders !== 1 ? 's' : ''} ·{' '}
              {totalItems} customer order{totalItems !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Temporary debug panel — remove after fixing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-xs font-mono space-y-1">
          <p className="font-bold text-yellow-800 mb-2">🔍 Debug info (dev only)</p>
          <p><span className="text-yellow-600">store_id used:</span> {storeId}</p>
          <p><span className="text-yellow-600">importer.id:</span> {importer?.id ?? 'not found'}</p>
          <p><span className="text-yellow-600">date range:</span> {startDate.slice(0,10)} → {endDate.slice(0,10)}</p>
          <p><span className="text-yellow-600">orders in month:</span> {totalOrders}</p>
          <p><span className="text-yellow-600">product groups:</span> {groups.length}</p>
        </div>
      )}

      <PreOrderMonthClient groups={groups} monthLabel={label} />
    </div>
  )
}