'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { getTokensForUsers, sendPushNotifications } from '@/lib/notifications/push'

// Resolve the customer's auth user_id and the store_id from an order
async function getOrderParties(supabase: Awaited<ReturnType<typeof createClient>>, orderId: string) {
  const { data } = await supabase
    .from('orders')
    .select('store_id, customers(user_id)')
    .eq('id', orderId)
    .single()
  if (!data) return { customerUserId: null, storeId: null }
  const customer = Array.isArray(data.customers) ? data.customers[0] : data.customers
  return {
    customerUserId: (customer as any)?.user_id as string | null,
    storeId: data.store_id as string | null,
  }
}

// Importer: set shipping fee and bill the customer
export async function billShippingAction(orderId: string, shippingFee: number, note?: string) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

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

  revalidatePath('/dashboard/orders')
  return { success: true }
}

// Importer: verify the customer's MoMo payment for shipping (does NOT mark as delivered)
export async function markShippingPaidAction(orderId: string) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'shipping_paid', // stays here until importer physically delivers
    })
    .eq('id', orderId)
    .eq('store_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/orders')
  return { success: true }
}

// Importer: mark order as delivered (only after physically handing over to customer)
export async function markDeliveredAction(orderId: string) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'delivered',
    })
    .eq('id', orderId)
    .eq('store_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/orders')
  return { success: true }
}

// Importer: update order status manually
export async function updateOrderStatusAction(orderId: string, status: string) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .eq('store_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/orders')
  return { success: true }
}

// Customer: confirm they've sent MoMo payment for shipping
export async function customerConfirmShippingPaymentAction(
  orderId: string,
  momoNumber: string,
  paymentReference: string
) {
  const supabase = await createClient()

  const { storeId } = await getOrderParties(supabase, orderId)

  const { error } = await supabase
    .from('orders')
    .update({
      momo_number: momoNumber,
      payment_reference: paymentReference,
      status: 'shipping_paid',
    })
    .eq('id', orderId)

  if (error) return { error: error.message }

  // Notify the importer that shipping payment was confirmed
  if (storeId) {
    const tokens = await getTokensForUsers([storeId])
    await sendPushNotifications(
      tokens,
      'Shipping payment received 💰',
      'A customer confirmed their shipping payment. Prepare their order for delivery.',
      { screen: 'orders' }
    )
  }

  revalidatePath('/dashboard/orders')
  return { success: true }
}

// Importer: confirm customer has paid for product (first payment)
export async function markProductPaidAction(orderId: string, reference?: string) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { customerUserId } = await getOrderParties(supabase, orderId)

  const { error } = await supabase
    .from('orders')
    .update({
      product_paid: true,
      product_payment_reference: reference || null,
      status: 'product_paid',
    })
    .eq('id', orderId)
    .eq('store_id', user.id)

  if (error) return { error: error.message }

  // Notify customer their product payment was confirmed
  if (customerUserId) {
    const tokens = await getTokensForUsers([customerUserId])
    await sendPushNotifications(
      tokens,
      'Payment confirmed ✅',
      'Your product payment has been received. We\'ll notify you when your order is on its way.',
      { screen: 'store-orders' }
    )
  }

  revalidatePath('/dashboard/orders')
  return { success: true }
}

// Importer: move order to processing (after product paid, while waiting for shipment)
export async function markProcessingAction(orderId: string) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { customerUserId } = await getOrderParties(supabase, orderId)

  const { error } = await supabase
    .from('orders')
    .update({ status: 'processing' })
    .eq('id', orderId)
    .eq('store_id', user.id)

  if (error) return { error: error.message }

  if (customerUserId) {
    const tokens = await getTokensForUsers([customerUserId])
    await sendPushNotifications(
      tokens,
      'Order in progress 📦',
      'Your order is being processed. We\'ll let you know when it arrives.',
      { screen: 'store-orders' }
    )
  }

  revalidatePath('/dashboard/orders')
  return { success: true }
}

// Importer: mark shipment as arrived (ready to bill shipping)
export async function markArrivedAction(orderId: string) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { customerUserId } = await getOrderParties(supabase, orderId)

  const { error } = await supabase
    .from('orders')
    .update({ status: 'arrived' })
    .eq('id', orderId)
    .eq('store_id', user.id)

  if (error) return { error: error.message }

  if (customerUserId) {
    const tokens = await getTokensForUsers([customerUserId])
    await sendPushNotifications(
      tokens,
      'Your order has arrived! 🎉',
      'Your item is in Ghana. Your shipping fee will be sent to you shortly.',
      { screen: 'store-orders' }
    )
  }

  revalidatePath('/dashboard/orders')
  return { success: true }
}