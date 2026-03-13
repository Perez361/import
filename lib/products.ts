import { createClient } from '@/lib/supabase/server'

// Slugify function (duplicated from utils.ts for self-contained)
function slugify(text: string): string {
  return text.toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Server-side: Get products by importer
export async function getProductsByImporter(importerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('importer_id', importerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }
  return data || []
}

// Server-side: Create product
export async function createProduct(importerId: string, productData: {
  name: string
  price: number
  description?: string
  image_url?: string
}) {
  const supabase = await createClient()
  
  // Generate slug
  const slug = slugify(productData.name)
  
  const { data, error } = await supabase
    .from('products')
    .insert({
      importer_id: importerId,
      name: productData.name,
      slug,
      price: productData.price,
      description: productData.description,
      image_url: productData.image_url,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    throw error
  }

  return data
}

