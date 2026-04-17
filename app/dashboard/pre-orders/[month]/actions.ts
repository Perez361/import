'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/session'

export async function saveTrackingAction(productId: string, trackingNumber: string) {
  const user = await getAuthenticatedUser()
  if (!user) return { error: 'Not authenticated' }
  const supabase = await createClient()

  const value = trackingNumber.trim().toUpperCase() || null

  const { error } = await supabase
    .from('products')
    .update({ tracking_number: value })
    .eq('id', productId)
    .eq('importer_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/pre-orders')
  revalidatePath('/dashboard/products')
  return { success: true }
}

// Bill all customers for a specific product with the same shipping fee.
// Tracks the fee per order_item so different products in the same order
// can each have their own shipping fee. The order-level shipping_fee is
// the sum of all item fees, and the order only becomes 'shipping_billed'
// once every item in it has been billed.
export async function billProductShippingAction(
  orderIds: string[],
  productId: string,
  shippingFee: number,
  note?: string,
) {
  const user = await getAuthenticatedUser()
  if (!user) return { error: 'Not authenticated' }
  if (!shippingFee || shippingFee <= 0) return { error: 'Enter a valid shipping fee' }
  if (!orderIds.length) return { error: 'No orders to bill' }

  const supabase = await createClient()
  const now = new Date().toISOString()

  // Step 1: set shipping_fee on the specific product's order_items
  const { error: itemError } = await supabase
    .from('order_items')
    .update({ shipping_fee: shippingFee, shipping_billed_at: now })
    .in('order_id', orderIds)
    .eq('product_id', productId)

  if (itemError) return { error: itemError.message }

  // Step 2: for each order, recalculate the total shipping and decide
  // whether ALL items are now billed (which promotes order status)
  for (const orderId of orderIds) {
    const { data: items, error: fetchErr } = await supabase
      .from('order_items')
      .select('shipping_fee')
      .eq('order_id', orderId)

    if (fetchErr || !items) continue

    const totalShipping = items.reduce((s, i) => s + (i.shipping_fee ?? 0), 0)
    const allBilled = items.every(i => i.shipping_fee != null)

    await supabase
      .from('orders')
      .update({
        shipping_fee: totalShipping,
        shipping_note: note || null,
        ...(allBilled
          ? { status: 'shipping_billed', shipping_billed_at: now }
          : {}),
      })
      .eq('id', orderId)
      .eq('store_id', user.id)
  }

  revalidatePath('/dashboard/pre-orders')
  revalidatePath('/dashboard/orders')
  return { success: true }
}

// Bill a single customer's order (for cases where fees differ)
export async function billSingleShippingAction(
  orderId: string,
  shippingFee: number,
  note?: string,
) {
  const user = await getAuthenticatedUser()
  if (!user) return { error: 'Not authenticated' }
  if (!shippingFee || shippingFee <= 0) return { error: 'Enter a valid shipping fee' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({
      shipping_fee: shippingFee,
      shipping_note: note || null,
      status: 'shipping_billed',
      shipping_billed_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('store_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/pre-orders')
  revalidatePath('/dashboard/orders')
  return { success: true }
}

export async function markDeliveredAction(orderId: string) {
  const user = await getAuthenticatedUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({
      shipping_paid: true,
      shipping_paid_at: new Date().toISOString(),
      status: 'delivered',
    })
    .eq('id', orderId)
    .eq('store_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/pre-orders')
  revalidatePath('/dashboard/orders')
  return { success: true }
}