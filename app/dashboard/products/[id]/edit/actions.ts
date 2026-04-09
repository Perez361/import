'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/session'

export async function updateProductAction(productId: string, formData: FormData) {
  const user = await getAuthenticatedUser()
  if (!user) return { error: 'Not authenticated' }

  const supabase = await createClient()

  const name = formData.get('name') as string
  const price = formData.get('price') as string
  const description = (formData.get('description') as string) || ''
  const shipping_tag = (formData.get('shipping_tag') as string) || 'without shipping fee'
  const tracking_number = ((formData.get('tracking_number') as string) || '').trim().toUpperCase() || null
  const supplier_name = (formData.get('supplier_name') as string) || null
  const supplier_url = (formData.get('supplier_url') as string) || null
  const imageFile = formData.get('image') as File | null
  const existingImageUrl = (formData.get('existing_image_url') as string) || ''

  if (!name || !price) return { error: 'Name and price are required' }

  // Verify this product belongs to this importer
  const { data: existing } = await supabase
    .from('products')
    .select('id, image_url')
    .eq('id', productId)
    .eq('importer_id', user.id)
    .single()

  if (!existing) return { error: 'Product not found' }

  let imageUrl = existingImageUrl || existing.image_url || ''

  if (imageFile && imageFile.size > 0) {
    // Delete old image if exists
    if (existing.image_url) {
      const oldPath = existing.image_url.split('/product-images/')[1]
      if (oldPath) {
        await supabase.storage.from('product-images').remove([decodeURIComponent(oldPath)])
      }
    }

    const fileExt = imageFile.name.split('.').pop() || 'webp'
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const path = `${user.id}/${fileName}`

    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, buffer, {
        contentType: imageFile.type || 'image/webp',
        upsert: false,
      })

    if (uploadError) {
      return { error: 'Image upload failed: ' + uploadError.message }
    }

    imageUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
  }

  const { error: updateError } = await supabase
    .from('products')
    .update({
      name,
      price: parseFloat(price),
      description,
      image_url: imageUrl,
      shipping_tag,
      tracking_number,
      supplier_name,
      supplier_url,
    })
    .eq('id', productId)
    .eq('importer_id', user.id)

  if (updateError) {
    return { error: 'Failed to update product: ' + updateError.message }
  }

  revalidatePath('/dashboard/products')
  revalidatePath(`/dashboard/products/${productId}/edit`)
  return { success: true }
}