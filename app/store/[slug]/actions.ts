'use server'

import { createAdminClient } from '@/lib/supabase/admin-client'
import { getTokensForUsers, sendPushNotifications } from '@/lib/notifications/push'

// Called after a customer places an order — notifies the importer on their phone
export async function notifyImporterNewOrderAction(
  storeId: string,
  customerName: string,
  productNames: string[],
) {
  const tokens = await getTokensForUsers([storeId])
  if (!tokens.length) return

  const itemList = productNames.length === 1
    ? productNames[0]
    : `${productNames[0]} +${productNames.length - 1} more`

  await sendPushNotifications(
    tokens,
    'New order placed 🛍️',
    `${customerName} ordered ${itemList}`,
    { screen: 'orders' }
  )
}
