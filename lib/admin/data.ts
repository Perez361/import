import { createClient } from '@/lib/supabase/server'

export async function getAdminOverviewStats() {
  const supabase = await createClient()

  const [
    { count: totalImporters },
    { count: totalCustomers },
    { count: totalOrders },
    { data: subStats },
    { data: recentImporters },
    { data: revenueData },
  ] = await Promise.all([
    supabase.from('importers').select('*', { count: 'exact', head: true }),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase
      .from('importer_subscriptions')
      .select('status, subscription_plans(name, price_monthly)')
      .eq('status', 'active'),
    supabase
      .from('importers')
      .select('id, business_name, email, store_slug, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('orders')
      .select('total, shipping_fee, status, created_at')
      .neq('status', 'cancelled')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  // MRR from active paid subscriptions
  const mrr = (subStats || []).reduce((sum: number, s: any) => {
    const price = s.subscription_plans?.price_monthly || 0
    return sum + Number(price)
  }, 0)

  // Plan breakdown
  const planCounts: Record<string, number> = {}
  ;(subStats || []).forEach((s: any) => {
    const name = s.subscription_plans?.name || 'free'
    planCounts[name] = (planCounts[name] || 0) + 1
  })

  // 30-day platform revenue (sum of all importer order revenue - for analytics)
  const thirtyDayRevenue = (revenueData || []).reduce((sum: number, o: any) => {
    return sum + (Number(o.total) || 0) + (Number(o.shipping_fee) || 0)
  }, 0)

  return {
    totalImporters: totalImporters || 0,
    totalCustomers: totalCustomers || 0,
    totalOrders: totalOrders || 0,
    mrr,
    planCounts,
    recentImporters: recentImporters || [],
    thirtyDayRevenue,
  }
}

export async function getAdminImportersList(search = '', planFilter = '', page = 0) {
  const supabase = await createClient()
  const limit = 20
  const offset = page * limit

  let query = supabase
    .from('importers')
    .select(`
      id, business_name, email, username, store_slug,
      phone, location, created_at,
      importer_subscriptions (
        id, status, current_period_end,
        subscription_plans ( name, display_name, price_monthly )
      )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`business_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`)
  }

  const { data, error, count } = await query

  // If plan filter needed, filter client-side (joining is complex with Supabase)
  let results = data || []
  if (planFilter) {
    results = results.filter((i: any) =>
      i.importer_subscriptions?.[0]?.subscription_plans?.name === planFilter
    )
  }

  return { importers: results, total: count || 0, error }
}

export async function getAdminImporterDetail(importerId: string) {
  const supabase = await createClient()

  const [
    { data: importer },
    { count: productCount },
    { count: customerCount },
    { data: orders },
    { data: subscription },
  ] = await Promise.all([
    supabase.from('importers').select('*').eq('id', importerId).single(),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('importer_id', importerId),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('store_id', importerId),
    supabase
      .from('orders')
      .select('total, shipping_fee, status, created_at')
      .eq('store_id', importerId)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('importer_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('importer_id', importerId)
      .single(),
  ])

  const paidOrders = (orders || []).filter(o => o.status !== 'cancelled')
  const totalRevenue = paidOrders.reduce((s: number, o: any) =>
    s + (Number(o.total) || 0) + (Number(o.shipping_fee) || 0), 0)

  return {
    importer,
    productCount: productCount || 0,
    customerCount: customerCount || 0,
    totalOrders: orders?.length || 0,
    totalRevenue,
    subscription,
    recentOrders: (orders || []).slice(0, 10),
  }
}

export async function getAllPlans() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('sort_order')
  return data || []
}