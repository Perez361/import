'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/session'

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

  const { error } = await supabase
    .from('orders')
    .update({
      momo_number: momoNumber,
      payment_reference: paymentReference,
      status: 'shipping_paid',
    })
    .eq('id', orderId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/orders')
  return { success: true }
}

// Importer: confirm customer has paid for product (first payment)
export async function markProductPaidAction(orderId: string, reference?: string) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

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

  revalidatePath('/dashboard/orders')
  return { success: true }
}

// Importer: move order to processing (after product paid, while waiting for shipment)
export async function markProcessingAction(orderId: string) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'processing',
    })
    .eq('id', orderId)
    .eq('store_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/orders')
  return { success: true }
}

// Importer: mark shipment as arrived (ready to bill shipping)
export async function markArrivedAction(orderId: string) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'arrived',
    })
    .eq('id', orderId)
    .eq('store_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/orders')
  return { success: true }
}