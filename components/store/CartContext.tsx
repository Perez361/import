'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/components/store/StoreContext'

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
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>
  removeFromCart: (cartItemId: string) => Promise<void>
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
  const [loading, setLoading] = useState(true)
  const store = useStore()

  const loadCart = useCallback(async () => {
    if (!store.customerId || !store.storeId) {
      setCartItems([])
      setCartCount(0)
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
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
        .eq('customer_id', store.customerId)
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
        setCartCount(items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0))
      } else {
        setCartItems([])
        setCartCount(0)
      }
    } catch (error) {
      console.error('Load cart error:', error)
    } finally {
      setLoading(false)
    }
  }, [store.customerId, store.storeId])

  useEffect(() => {
    loadCart()
  }, [store.customerId, store.storeId, loadCart])

  const addToCart = async (productId: string) => {
    if (!store.customerId || !store.storeId) {
      window.location.href = `/store/${slug}/login?redirect=${encodeURIComponent(window.location.href)}`
      return
    }

    const supabase = createClient()
    try {
      // Upsert cart item client-side
      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('customer_id', store.customerId)
        .eq('store_id', store.storeId)
        .single()

      if (!cart) {
        const { data: newCart } = await supabase
          .from('carts')
          .insert({ customer_id: store.customerId!, store_id: store.storeId! })
          .select('id')
          .single()
      }

      await supabase
        .from('cart_items')
        .upsert({ 
          cart_id: cart?.id || (await supabase.from('carts').select('id').eq('customer_id', store.customerId!).single()).data?.id, 
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
        .eq('customer_id', store.customerId!)
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
       setCartCount(items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0))
      }
    } catch (error) {
      console.error('Add to cart error:', error)
    }
  }

 const updateQuantity = async (cartItemId: string, quantity: number) => {
  if (!store.customerId || !store.storeId) return

  // Optimistic update first
  if (quantity <= 0) {
    setCartItems(prev => {
      const updated = prev.filter(item => item.id !== cartItemId)
      setCartCount(updated.reduce((sum, item) => sum + item.quantity, 0))
      return updated
    })
  } else {
    setCartItems(prev => {
      const updated = prev.map(item =>
        item.id === cartItemId ? { ...item, quantity } : item
      )
      setCartCount(updated.reduce((sum, item) => sum + item.quantity, 0))
      return updated
    })
  }

  // Then sync to Supabase in background
  const supabase = createClient()
  try {
    if (quantity <= 0) {
      await supabase.from('cart_items').delete().eq('id', cartItemId)
    } else {
      await supabase.from('cart_items').update({ quantity }).eq('id', cartItemId)
    }
  } catch (error) {
    console.error('Update quantity sync error:', error)
    // Reload cart to restore correct state if sync failed
    loadCart()
  }
}

  const removeFromCart = async (cartItemId: string) => {
  if (!store.customerId || !store.storeId) return

  // Optimistic update first
  setCartItems(prev => {
    const updated = prev.filter(item => item.id !== cartItemId)
    setCartCount(updated.reduce((sum, item) => sum + item.quantity, 0))
    return updated
  })

  // Then sync to Supabase in background
  const supabase = createClient()
  try {
    await supabase.from('cart_items').delete().eq('id', cartItemId)
  } catch (error) {
    console.error('Remove from cart sync error:', error)
    // Reload cart to restore correct state if sync failed
    loadCart()
  }
}

  const value = {
    cartCount,
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    customerId: store.customerId || null,
    storeId: store.storeId || null,
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
