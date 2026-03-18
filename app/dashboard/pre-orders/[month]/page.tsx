import { redirect, notFound } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Calendar } from 'lucide-react'
import PreOrderMonthClient from './PreOrderMonthClient'
// ✅ Import types from types.ts — NOT from the client component
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
  const endDate = new Date(year, mon, 1).toISOString()

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
    .eq('store_id', user.id)
    .gte('created_at', startDate)
    .lt('created_at', endDate)
    .order('created_at', { ascending: false })

  if (error) console.error('Pre-order month fetch error:', error)

  // Group by product
  const productMap = new Map<string, ProductGroup>()

  for (const order of (orders || []) as any[]) {
    const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers
    const custName = customer?.full_name || customer?.username || 'Unknown'

    for (const item of (order.order_items || []) as any[]) {
      const product = Array.isArray(item.products) ? item.products[0] : item.products
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
  const label = monthLabel(month)
  const totalOrders = orders?.length || 0
  const totalItems = groups.reduce((s, g) => s + g.customers.length, 0)

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

      <PreOrderMonthClient groups={groups} monthLabel={label} />
    </div>
  )
}