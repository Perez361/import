import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

// Get importer by store_slug
export async function getImporterBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('importers')
    .select('*')
    .eq('LOWER(store_slug)', slug.toLowerCase())
    .single()

  if (error || !data) return null
  return data
}

// Get products by store slug
export async function getProductsBySlug(slug: string) {
  const importer = await getImporterBySlug(slug)
  if (!importer) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('importer_id', importer.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching store products:', error)
    return []
  }
  return data || []
}

