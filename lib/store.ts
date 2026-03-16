import { createServerSupabase } from '@/lib/supabase/server-only'
import { slugify } from '@/lib/utils'

export async function createClient() {
  return createServerSupabase()
}

// Get importer by store_slug
export async function getImporterBySlug(slug: string) {
  const supabase = await createClient()

  // First try exact store_slug match
  const { data, error } = await supabase
    .from('importers')
    .select('*')
    .eq('store_slug', slug)
    .single()

  if (data) return data

  // Fallback 1: case-insensitive store_slug
  const { data: fallbackData } = await supabase
    .from('importers')
    .select('*')
    .ilike('store_slug', `%${slug}%`)
    .limit(1)
    .single()

  if (fallbackData) return fallbackData

  // Fallback 2: username
  const { data: fallbackData2 } = await supabase
    .from('importers')
    .select('*')
    .ilike('username', `%${slug}%`)
    .limit(1)
    .single()

  if (fallbackData2) return fallbackData2

  return null
}

// Get products by store slug — explicitly excludes internal fields
// tracking_number, supplier_url, supplier_name are NEVER sent to the storefront
export async function getProductsBySlug(slug: string) {
  const importer = await getImporterBySlug(slug)
  if (!importer) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, description, image_url, slug, shipping_tag, created_at')
    .eq('importer_id', importer.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching store products:', error)
    return []
  }
  return data || []
}

export async function getOrCreateCustomer(userId: string, storeId: string, customerData: any) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .eq('store_id', storeId)
    .single()

  if (data) return data

  const { data: newCustomer } = await supabase
    .from('customers')
    .insert({ store_id: storeId, user_id: userId, ...customerData })
    .select()
    .single()

  return newCustomer
}

export async function upsertCartItem(customerId: string, storeId: string, productId: string, quantity: number = 1) {
  const supabase = await createClient()

  let { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('customer_id', customerId)
    .eq('store_id', storeId)
    .single()

  if (!cart) {
    const { data: newCart } = await supabase
      .from('carts')
      .insert({ customer_id: customerId, store_id: storeId })
      .select('id')
      .single()
    cart = newCart
  }

  await supabase
    .from('cart_items')
    .upsert({ cart_id: cart!.id, product_id: productId, quantity }, { onConflict: 'cart_id,product_id' })

  return cart
}

export async function getCartItems(customerId: string, storeId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('carts')
    .select(`
      id,
      cart_items (
        id, product_id, quantity,
        products ( name, price, image_url )
      )
    `)
    .eq('customer_id', customerId)
    .eq('store_id', storeId)
    .single()

  return data?.cart_items || []
}

export async function getCartCount(customerId: string, storeId: string) {
  const items = await getCartItems(customerId, storeId)
  return items.reduce((sum: number, item: any) => sum + item.quantity, 0)
}

export async function createOrder(customerId: string, storeId: string) {
  const supabase = await createClient()

  const cartItems = await getCartItems(customerId, storeId)
  if (cartItems.length === 0) throw new Error('Cart empty')

  const total = cartItems.reduce(
    (sum: number, item: any) => sum + (item.quantity * item.products.price),
    0
  )

  const { data: order } = await supabase
    .from('orders')
    .insert({ customer_id: customerId, store_id: storeId, total })
    .select()
    .single()

  if (order) {
    await supabase.from('order_items').insert(
      cartItems.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.products.price,
      }))
    )

    await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', (
        await supabase.from('carts').select('id').eq('customer_id', customerId).single()
      ).data?.id)
  }

  return order
}