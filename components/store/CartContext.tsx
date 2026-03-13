'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCartCount, upsertCartItem } from '@/lib/store'

interface CartItem {
  id: string
  quantity: number
  product_id: string
  products: {
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
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // TODO: Get customer_id and store_id from user metadata or query
        // For now use dummy for demo
        // setCustomerId(user.user_metadata.customer_id)
        // setStoreId(user.user_metadata.store_id)
      }
      
      setLoading(false)
    }

    initCart()
  }, [])

  const addToCart = async (productId: string) => {
    if (!customerId || !storeId) {
      // Redirect to login
      window.location.href = `/store/${slug}/login?redirect=${encodeURIComponent(window.location.href)}`
      return
    }

    try {
      await upsertCartItem(customerId, storeId!, productId)
      // Update count
      const count = await getCartCount(customerId, storeId!)
      setCartCount(count)
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

