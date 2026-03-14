import { createClient } from '@/lib/supabase/server'

export type InitialCustomer = {
  id: string
  storeId: string
  name: string
} | null

/**
 * Get customer session for specific store slug (server-side)
 */
export async function getCustomerForStore(slug: string): Promise<InitialCustomer> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Inline importer fetch
  const { data: importer } = await supabase
    .from('importers')
    .select('id')
    .eq('store_slug', slug)
    .single()
  if (!importer) return null

  // Get customer for this user + store
  const { data: customer } = await supabase
    .from('customers')
    .select('id, store_id, full_name, username')
    .eq('user_id', user.id)
    .eq('store_id', importer.id)
    .single()

  if (!customer) return null

  return {
    id: customer.id,
    storeId: customer.store_id,
    name: customer.full_name || customer.username || ''
  }
}

