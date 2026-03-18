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

  // Fetch my shipment items — products only, no order join needed
  const { data: myItems } = await supabase
    .from('shipment_items')
    .select(`
      *,
      products ( id, name, price )
    `)
    .eq('batch_id', batchId)
    .order('created_at', { ascending: false })

  // Fetch freight manifest
  const { data: manifestItems } = await supabase
    .from('freight_manifest_items')
    .select('*')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: false })

  // Fetch all products for the product dropdown
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price')
    .eq('importer_id', user.id)
    .order('name')

  return (
    <BatchReconciliation
      batch={batch}
      myItems={myItems || []}
      manifestItems={manifestItems || []}
      products={products || []}
    />
  )
}