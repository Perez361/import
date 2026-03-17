'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/session'

export async function createProductAction(formData: FormData) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const name = formData.get('name') as string
  const price = formData.get('price') as string
  const description = (formData.get('description') as string) || ''
  const imageFile = formData.get('image') as File | null

  if (!name || !price) {
    return { error: 'Name and price are required' }
  }

  let imageUrl = ''

  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop() || 'jpg'
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const path = `${user.id}/${fileName}`

    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, buffer, {
        contentType: imageFile.type || 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      return { error: 'Image upload failed: ' + uploadError.message }
    }

    imageUrl = supabase.storage
      .from('product-images')
      .getPublicUrl(path).data.publicUrl
  }

  const slug = name
    .toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product'

  const { error: insertError } = await supabase.from('products').insert({
    importer_id: user.id,
    name,
    slug,
    price: parseFloat(price),
    description,
    image_url: imageUrl,
  })

  if (insertError) {
    // Clean up orphaned image if insert fails
    if (imageUrl) {
      const path = imageUrl.split('/product-images/')[1]
      if (path) await supabase.storage.from('product-images').remove([path])
    }
    return { error: 'Failed to save product: ' + insertError.message }
  }

  revalidatePath('/dashboard/products')
  return { success: true }
}