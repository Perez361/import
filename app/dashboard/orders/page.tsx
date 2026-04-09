'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import OrdersTable from './OrdersTable'

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Product Paid', value: 'product_paid' },
  { label: 'Processing', value: 'processing' },
  { label: 'Arrived', value: 'arrived' },
  { label: 'Shipping Billed', value: 'shipping_billed' },
  { label: 'Shipping Paid', value: 'shipping_paid' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
]

export default function OrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status') || 'all'

  const [orders, setOrders] = useState<any[]>([])
  const [importer, setImporter] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const supabase = createClient()

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/login')
        return
      }

      // Get importer
      const { data: importerData, error: importerError } = await supabase
        .from('importers')
        .select('*')
        .eq('id', user.id)
        .single()

      if (importerError || !importerData) {
        router.push('/login')
        return
      }

      setImporter(importerData)

      // Fetch orders
      let query = supabase
        .from('orders')
        .select(`
          id,
          total,
          status,
          created_at,
          shipping_fee,
          shipping_paid,
          product_paid,
          product_payment_reference,
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
            products ( id, name, image_url )
          )
        `)
        .eq('store_id', importerData.id)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data: ordersData, error: ordersError } = await query
      if (ordersError) {
        console.error('Error fetching orders:', ordersError)
        setError(ordersError.message)
      } else {
        setOrders(ordersData || [])
      }
    } catch (err: any) {
      console.error('Orders page error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const orderList = orders || []
  const awaitingProductPayment = orderList.filter((o) => o.status === 'pending').length
  const awaitingBill = orderList.filter((o) => o.status === 'arrived').length
  const awaitingVerification = orderList.filter((o) => o.status === 'shipping_paid').length

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">Orders</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
              Manage pre-orders and shipping billing
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden p-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[var(--color-brand)] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[var(--color-text-muted)]">Loading orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">Orders</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
              Manage pre-orders and shipping billing
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 shadow-sm overflow-hidden p-12 text-center">
          <p className="text-red-700 mb-4">Error loading orders: {error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

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
          {awaitingProductPayment > 0 && (
            <Link
              href="/dashboard/orders?status=pending"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-xs font-semibold"
            >
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              {awaitingProductPayment} awaiting product payment
            </Link>
          )}
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
            importerPhone={importer?.phone || ''}
            storeSlug={importer?.store_slug || ''}
            storeId={importer?.id || ''}
          />
        )}
      </div>
    </div>
  )
}