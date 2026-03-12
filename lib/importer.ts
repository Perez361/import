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

  return data
}

// You can create a client-side version in components or another lib/client.ts

