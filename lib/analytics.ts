import { createClient } from '@/lib/supabase/server'

export interface AnalyticsOrder {
  id: string
  total: number | string
  shipping_fee?: number | null
  status: string
  created_at: string
  customer_id: string
}

export interface AnalyticsCustomer {
  id: string
  created_at: string
}

export interface AnalyticsProduct {
  id: string
  name: string
  price: number | string
}

export interface AnalyticsOrderItem {
  product_id: string
  quantity: number
  price: number | string
  order_id: string
}

export interface AnalyticsData {
  orders: AnalyticsOrder[]
  prevOrders: AnalyticsOrder[]
  allOrders: AnalyticsOrder[]
  customers: AnalyticsCustomer[]
  prevCustomers: AnalyticsCustomer[]
  products: AnalyticsProduct[]
  orderItems: AnalyticsOrderItem[]
  allTimeRevenue: number
}

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y'

const PERIOD_DAYS: Record<AnalyticsPeriod, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
}

export function n(v: any): number {
  return parseFloat(String(v || 0)) || 0
}

/**
 * Single shared data-fetching function used by both /analytics and /finances.
 * Fetches all data needed for revenue, orders, customers, and product breakdowns.
 */
export async function fetchAnalyticsData(
  importerId: string,
  period: AnalyticsPeriod
): Promise<AnalyticsData> {
  const supabase = await createClient()
  const days = PERIOD_DAYS[period] || 30

  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceISO = since.toISOString()

  const prevSince = new Date()
  prevSince.setDate(prevSince.getDate() - days * 2)
  const prevSinceISO = prevSince.toISOString()

  const [
    { data: orders },
    { data: prevOrders },
    { data: allOrders },
    { data: customers },
    { data: prevCustomers },
    { data: products },
    { data: allTimeOrders },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total, shipping_fee, status, created_at, customer_id')
      .eq('store_id', importerId)
      .gte('created_at', sinceISO),
    supabase
      .from('orders')
      .select('id, total, shipping_fee, status, created_at, customer_id')
      .eq('store_id', importerId)
      .gte('created_at', prevSinceISO)
      .lt('created_at', sinceISO),
    supabase
      .from('orders')
      .select('id, total, shipping_fee, status, created_at, customer_id')
      .eq('store_id', importerId)
      .order('created_at', { ascending: false })
      .limit(500),
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
    supabase
      .from('orders')
      .select('total, shipping_fee, status')
      .eq('store_id', importerId),
  ])

  const currentOrderIds = (orders || []).map((o) => o.id)
  const { data: orderItems } = currentOrderIds.length
    ? await supabase
        .from('order_items')
        .select('product_id, quantity, price, order_id')
        .in('order_id', currentOrderIds)
    : { data: [] }

  const allTimeRevenue = (allTimeOrders || [])
    .filter((o) => o.status !== 'cancelled')
    .reduce((s, o) => s + n(o.total) + n(o.shipping_fee), 0)

  return {
    orders: orders || [],
    prevOrders: prevOrders || [],
    allOrders: allOrders || [],
    customers: customers || [],
    prevCustomers: prevCustomers || [],
    products: products || [],
    orderItems: orderItems || [],
    allTimeRevenue,
  }
}
