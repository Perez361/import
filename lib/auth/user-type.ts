import { createClient } from '@/lib/supabase/server'

/**
 * Check if the authenticated user is an importer (business owner)
 * Returns the importer profile if found, null otherwise
 */
export async function getImporterUser() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data: importer, error } = await supabase
    .from('importers')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !importer) return null
  return importer
}

/**
 * Check if the authenticated user is a customer (shopper)
 * Returns the customer profile if found, null otherwise
 */
export async function getCustomerUser() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data: customer, error } = await supabase
    .from('customers')
    .select('*, importers!store_id(store_slug)')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !customer) return null
  return customer
}


/**
 * Get the store slug for a customer user
 */
export async function getCustomerStoreSlug(): Promise<string | null> {
  const customer = await getCustomerUser()
  if (!customer) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('importers')
    .select('store_slug')
    .eq('id', customer.store_id)
    .single()
  return data?.store_slug || null
}
