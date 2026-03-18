'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function cancelOrderAction(orderId: string) {
  const supabase = await createClient()

  // Verify the order exists and is still pending before allowing cancel
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, status, customer_id')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) return { error: 'Order not found' }
  if (order.status !== 'pending') return { error: 'Only pending orders can be cancelled' }

  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .eq('status', 'pending') // double-check: only cancel if still pending

  if (error) return { error: error.message }

  revalidatePath('/store')
  return { success: true }
}