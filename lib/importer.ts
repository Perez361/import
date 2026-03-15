import { createClient } from '@/lib/supabase/server'

// Server-side function to get importer profile by user ID
export async function getImporter(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('importers')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching importer:', error)
    return null
  }

  // Auto-generate store_slug if null
  if (!data.store_slug) {
    const slug = slugify(data.business_name || data.username)
    const { error: updateError } = await supabase
      .from('importers')
      .update({ store_slug: slug })
      .eq('id', data.id)
    if (!updateError) {
      data.store_slug = slug
    }
  }

  return data
}

// Slugify
function slugify(text: string): string {
  return text.toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// You can create a client-side version in components or another lib/client.ts


