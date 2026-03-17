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

// Bill ALL customers for a product with the same shipping fee at once
export async function billProductShippingAction(
  orderIds: string[],
  shippingFee: number,
  note?: string,
) {
  const user = await getAuthenticatedUser()
  if (!user) return { error: 'Not authenticated' }
  if (!shippingFee || shippingFee <= 0) return { error: 'Enter a valid shipping fee' }
  if (!orderIds.length) return { error: 'No orders to bill' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({
      shipping_fee: shippingFee,
      shipping_note: note || null,
      status: 'shipping_billed',
      shipping_billed_at: new Date().toISOString(),
    })
    .in('id', orderIds)
    .eq('store_id', user.id)

  if (error) return { error: error.message }

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