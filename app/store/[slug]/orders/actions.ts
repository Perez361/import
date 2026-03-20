'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function cancelOrderAction(orderId: string) {
  const supabase = await createClient()

  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  // Verify the order exists, is still pending, AND belongs to this customer
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, status, customer_id')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) return { error: 'Order not found' }
  if (order.status !== 'pending') return { error: 'Only pending orders can be cancelled' }

  // Verify ownership: look up the customer record for this user
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .eq('id', order.customer_id)
    .maybeSingle()

  if (customerError || !customer) {
    return { error: 'You do not have permission to cancel this order' }
  }

  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .eq('customer_id', customer.id) // double-lock: ownership enforced at DB level
    .eq('status', 'pending')        // double-lock: only cancel if still pending

  if (error) return { error: error.message }

  revalidatePath('/store')
  return { success: true }
}
