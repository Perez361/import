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
  
  // Generate slug - fallback if empty
  const slug = productData.name ? slugify(productData.name) : 'no-name-product'
  
  const { data, error } = await supabase
    .from('products')
    .insert({
      importer_id: importerId,
      name: productData.name || 'Unnamed Product',
      slug,
      price: productData.price,
      description: productData.description || '',
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

// Server-side: Delete product
export async function deleteProduct(productId: string, importerId: string) {
  const supabase = await createClient()
  
  // First verify the product belongs to this importer
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('id, importer_id')
    .eq('id', productId)
    .single()

  if (fetchError || !product) {
    console.error('Error fetching product:', fetchError)
    throw new Error('Product not found')
  }

  // Security check: ensure the product belongs to the logged-in importer
  if (product.importer_id !== importerId) {
    throw new Error('Unauthorized: This product does not belong to you')
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) {
    console.error('Error deleting product:', error)
    throw error
  }

  return { success: true }
}

// Server-side: Update product
export async function updateProduct(productId: string, importerId: string, productData: {
  name?: string
  price?: number
  description?: string
  image_url?: string
}) {
  const supabase = await createClient()
  
  // First verify the product belongs to this importer
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('id, importer_id')
    .eq('id', productId)
    .single()

  if (fetchError || !product) {
    console.error('Error fetching product:', fetchError)
    throw new Error('Product not found')
  }

  // Security check: ensure the product belongs to the logged-in importer
  if (product.importer_id !== importerId) {
    throw new Error('Unauthorized: This product does not belong to you')
  }

  const { data, error } = await supabase
    .from('products')
    .update({
      name: productData.name,
      price: productData.price,
      description: productData.description,
      image_url: productData.image_url,
    })
    .eq('id', productId)
    .select()
    .single()

  if (error) {
    console.error('Error updating product:', error)
    throw error
  }

  return data
}


