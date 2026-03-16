import { redirect, notFound } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import BatchReconciliation from './BatchReconciliation'

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: batchId } = await params
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // Fetch batch
  const { data: batch } = await supabase
    .from('shipment_batches')
    .select('*')
    .eq('id', batchId)
    .eq('importer_id', user.id)
    .single()

  if (!batch) notFound()

  // Fetch my shipment items with linked product/order info
  const { data: myItems } = await supabase
    .from('shipment_items')
    .select(`
      *,
      products ( id, name, price ),
      orders ( id, total, status, customers ( full_name, username, contact ) )
    `)
    .eq('batch_id', batchId)
    .order('created_at', { ascending: false })

  // Fetch freight manifest
  const { data: manifestItems } = await supabase
    .from('freight_manifest_items')
    .select('*')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: false })

  // Fetch all products for linking dropdown
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price')
    .eq('importer_id', user.id)
    .order('name')

  // Fetch pending/processing orders for linking dropdown
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, total, status,
      customers ( full_name, username )
    `)
    .eq('store_id', user.id)
    .in('status', ['pending', 'processing', 'arrived', 'shipping_billed'])
    .order('created_at', { ascending: false })

  return (
    <BatchReconciliation
      batch={batch}
      myItems={myItems || []}
      manifestItems={manifestItems || []}
      products={products || []}
      orders={orders || []}
    />
  )
}