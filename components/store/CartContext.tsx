'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CartItem {
  id: string
  quantity: number
  product_id: string
  products: {
    id: string
    name: string
    price: number
    image_url: string | null
  }
}

interface CartContextType {
  cartCount: number
  cartItems: CartItem[]
  addToCart: (productId: string) => Promise<void>
  customerId: string | null
  storeId: string | null
  loading: boolean
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({
  children,
  slug
}: {
  children: ReactNode
  slug: string
}) {
  const [cartCount, setCartCount] = useState(0)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initCart = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const userId = session.user.id
        
        // First get the store by slug to find the UUID
        const { data: importer } = await supabase
          .from('importers')
          .select('id')
          .eq('store_slug', slug)
          .single()
        
        if (importer) {
          // Then query customer by user_id and store UUID
          const { data: customer } = await supabase
            .from('customers')
            .select('id, store_id')
            .eq('user_id', userId)
            .eq('store_id', importer.id)
            .single()
          
          if (customer) {
            setCustomerId(customer.id)
            setStoreId(customer.store_id)
            
            // Load cart
            const { data: cartData } = await supabase
              .from('carts')
              .select(`
                id,
                cart_items (
                  id,
                  product_id,
                  quantity,
                  products (
                    id,
                    name,
                    price,
                    image_url
                  )
                )
              `)
              .eq('customer_id', customer.id)
              .single()
            
            if (cartData?.cart_items) {
              const items = cartData.cart_items.map((item: any): CartItem => ({
                ...item,
                products: item.products as {
                  id: string
                  name: string
                  price: number
                  image_url: string | null
                }
              }))
              setCartItems(items)
              setCartCount(items.reduce((sum: number, item) => sum + item.quantity, 0))
            }
          }
        }
      }
      
      setLoading(false)
    }

    initCart()
  }, [slug])

  const addToCart = async (productId: string) => {
    if (!customerId || !storeId) {
      window.location.href = `/store/${slug}/login?redirect=${encodeURIComponent(window.location.href)}`
      return
    }

    const supabase = createClient()
    try {
      // Upsert cart item client-side
      const { data: cart } = await supabase
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
      }

      await supabase
        .from('cart_items')
        .upsert({ 
          cart_id: cart?.id || (await supabase.from('carts').select('id').eq('customer_id', customerId).single()).data?.id, 
          product_id: productId, 
          quantity: 1 
        }, { onConflict: 'cart_id,product_id' })
      
      // Refresh cart data locally instead of full page reload
      const { data: updatedCart } = await supabase
        .from('carts')
        .select(`
          id,
          cart_items (
            id,
            product_id,
            quantity,
            products (
              id,
              name,
              price,
              image_url
            )
          )
        `)
        .eq('customer_id', customerId)
        .single()
      
      if (updatedCart?.cart_items) {
        const items = updatedCart.cart_items.map((item: any): CartItem => ({
          ...item,
          products: item.products as {
            id: string
            name: string
            price: number
            image_url: string | null
          }
        }))
        setCartItems(items)
        setCartCount(items.reduce((sum: number, item) => sum + item.quantity, 0))
      }
    } catch (error) {
      console.error('Add to cart error:', error)
    }
  }

  const value = {
    cartCount,
    cartItems,
    addToCart,
    customerId,
    storeId,
    loading
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
