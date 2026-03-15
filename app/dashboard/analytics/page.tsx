import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { getImporter } from '@/lib/importer'
import { createClient } from '@/lib/supabase/server'
import AnalyticsDashboard from './AnalyticsDashboard'

export const metadata = {
  title: 'Analytics – ImportFlow PRO',
}

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { period?: string }
}) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const importer = await getImporter(user.id)
  if (!importer) redirect('/login')

  const period = (searchParams.period as '7d' | '30d' | '90d' | '1y') || '30d'
  const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[period] || 30

  const supabase = await createClient()

  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceISO = since.toISOString()

  const prevSince = new Date()
  prevSince.setDate(prevSince.getDate() - days * 2)
  const prevSinceISO = prevSince.toISOString()

  // Get importer's storefront ID
  const { data: storefront } = await supabase
    .from('importers')
    .select('id')
    .eq('id', user.id)
    .single()

  const importerId = storefront?.id || user.id

  const [
    { data: orders },
    { data: prevOrders },
    { data: allOrders },
    { data: customers },
    { data: prevCustomers },
    { data: products },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total, status, created_at, customer_id')
      .eq('store_id', importerId)
      .gte('created_at', sinceISO),
    supabase
      .from('orders')
      .select('id, total, status, created_at, customer_id')
      .eq('store_id', importerId)
      .gte('created_at', prevSinceISO)
      .lt('created_at', sinceISO),
    supabase
      .from('orders')
      .select('id, total, status, created_at, customer_id')
      .eq('store_id', importerId)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('customers')
      .select('id, created_at')
      .eq('store_id', importerId)
      .gte('created_at', sinceISO),
    supabase
      .from('customers')
      .select('id, created_at')
      .eq('store_id', importerId)
      .gte('created_at', prevSinceISO)
      .lt('created_at', sinceISO),
    supabase
      .from('products')
      .select('id, name, price')
      .eq('importer_id', importerId),
  ])

  // Fetch order items for current period orders
  const currentOrderIds = (orders || []).map((o) => o.id)
  const { data: orderItems } = currentOrderIds.length
    ? await supabase
        .from('order_items')
        .select('product_id, quantity, price, order_id')
        .in('order_id', currentOrderIds)
    : { data: [] }

  return (
    <AnalyticsDashboard
      period={period}
      orders={orders || []}
      prevOrders={prevOrders || []}
      allOrders={allOrders || []}
      customers={customers || []}
      prevCustomers={prevCustomers || []}
      products={products || []}
      orderItems={orderItems || []}
    />
  )
}
