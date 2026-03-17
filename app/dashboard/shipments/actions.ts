'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/session'

// ─── Batches ──────────────────────────────────────────────────────────────────

export async function createBatchAction(data: {
  name: string
  shipping_company: string
  notes?: string
}) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  const { data: batch, error } = await supabase
    .from('shipment_batches')
    .insert({ ...data, importer_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/shipments')
  return { success: true, id: batch.id }
}

export async function updateBatchStatusAction(batchId: string, status: string) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  const { error } = await supabase
    .from('shipment_batches')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', batchId)
    .eq('importer_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/shipments')
  return { success: true }
}

export async function deleteBatchAction(batchId: string) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  const { error } = await supabase
    .from('shipment_batches')
    .delete()
    .eq('id', batchId)
    .eq('importer_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/shipments')
  return { success: true }
}

// ─── My Shipment Items ────────────────────────────────────────────────────────

export async function addShipmentItemAction(
  batchId: string,
  items: { tracking_number: string; description?: string; product_id?: string; order_id?: string }[]
) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  const rows = items.map((i) => ({
    ...i,
    batch_id: batchId,
    importer_id: user.id,
  }))

  const { error } = await supabase.from('shipment_items').upsert(rows, {
    onConflict: 'batch_id,tracking_number',
  })

  if (error) return { error: error.message }

  // Auto-sync: when a shipment item is linked to a product, update that
  // product's tracking_number so Products page and Pre-orders stay in sync
  const withProduct = items.filter((i) => i.product_id && i.tracking_number)
  for (const item of withProduct) {
    await supabase
      .from('products')
      .update({ tracking_number: item.tracking_number.trim().toUpperCase() })
      .eq('id', item.product_id!)
      .eq('importer_id', user.id)
  }

  revalidatePath(`/dashboard/shipments/${batchId}`)
  revalidatePath('/dashboard/products')
  revalidatePath('/dashboard/pre-orders')
  return { success: true }
}

export async function deleteShipmentItemAction(itemId: string, batchId: string) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  const { error } = await supabase
    .from('shipment_items')
    .delete()
    .eq('id', itemId)
    .eq('importer_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/shipments/${batchId}`)
  return { success: true }
}

// ─── Freight Manifest (shipping company list) ─────────────────────────────────

export async function saveFreightManifestAction(
  batchId: string,
  items: { tracking_number: string; freight_cost: number; weight_kg?: number; notes?: string }[]
) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  // Verify batch belongs to user
  const { data: batch } = await supabase
    .from('shipment_batches')
    .select('id')
    .eq('id', batchId)
    .eq('importer_id', user.id)
    .single()

  if (!batch) return { error: 'Batch not found' }

  // Delete existing manifest for this batch and re-insert
  await supabase.from('freight_manifest_items').delete().eq('batch_id', batchId)

  const rows = items.map((i) => ({ ...i, batch_id: batchId }))
  const { error } = await supabase.from('freight_manifest_items').insert(rows)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/shipments/${batchId}`)
  return { success: true }
}

// ─── Reconciliation ───────────────────────────────────────────────────────────

export async function reconcileAction(batchId: string) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  // Fetch my items and freight manifest
  const [{ data: myItems }, { data: freightItems }] = await Promise.all([
    supabase.from('shipment_items').select('*').eq('batch_id', batchId),
    supabase.from('freight_manifest_items').select('*').eq('batch_id', batchId),
  ])

  const myTrackingSet = new Set((myItems || []).map((i) => i.tracking_number.trim().toUpperCase()))
  const freightTrackingMap = new Map(
    (freightItems || []).map((i) => [i.tracking_number.trim().toUpperCase(), i])
  )

  // Update my items: received if found in freight list, missing if not
  for (const item of myItems || []) {
    const key = item.tracking_number.trim().toUpperCase()
    const freightMatch = freightTrackingMap.get(key)
    await supabase
      .from('shipment_items')
      .update({
        status: freightMatch ? 'received' : 'missing',
        freight_cost: freightMatch ? freightMatch.freight_cost : item.freight_cost,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id)
  }

  // Mark freight manifest items as matched or extra
  for (const fItem of freightItems || []) {
    const key = fItem.tracking_number.trim().toUpperCase()
    await supabase
      .from('freight_manifest_items')
      .update({ matched: myTrackingSet.has(key) })
      .eq('id', fItem.id)
  }

  // Update batch status to reconciled
  await supabase
    .from('shipment_batches')
    .update({ status: 'reconciled', updated_at: new Date().toISOString() })
    .eq('id', batchId)
    .eq('importer_id', user.id)

  revalidatePath(`/dashboard/shipments/${batchId}`)
  return { success: true }
}

// ─── Push freight cost as shipping fee to order ───────────────────────────────

export async function pushFreightToOrderAction(shipmentItemId: string, batchId: string) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('shipment_items')
    .select('*')
    .eq('id', shipmentItemId)
    .eq('importer_id', user.id)
    .single()

  if (!item) return { error: 'Item not found' }
  if (!item.order_id) return { error: 'No order linked to this item' }
  if (!item.freight_cost || item.freight_cost <= 0) return { error: 'No freight cost set' }

  // Update the order shipping fee and status
  const { error } = await supabase
    .from('orders')
    .update({
      shipping_fee: item.freight_cost,
      status: 'shipping_billed',
      shipping_billed_at: new Date().toISOString(),
    })
    .eq('id', item.order_id)
    .eq('store_id', user.id)

  if (error) return { error: error.message }

  // Mark item as pushed
  await supabase
    .from('shipment_items')
    .update({ pushed_to_order: true })
    .eq('id', shipmentItemId)

  revalidatePath(`/dashboard/shipments/${batchId}`)
  revalidatePath('/dashboard/orders')
  return { success: true }
}