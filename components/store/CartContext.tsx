'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react'
import { createCustomerClient } from '@/lib/supabase/customer-client'  // ← was createClient
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
  addToCart: (productId: string, productData?: { id: string; name: string; price: number; image_url: string | null }) => Promise<void>
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>
  removeFromCart: (cartItemId: string) => Promise<void>
  clearCart: () => Promise<void>
  customerId: string | null
  storeId: string | null
  loading: boolean
}

const CartContext = createContext<CartContextType | null>(null)

function parseItems(cartData: any): CartItem[] {
  if (!cartData?.cart_items) return []
  return cartData.cart_items.map((item: any): CartItem => ({
    ...item,
    products: item.products as { id: string; name: string; price: number; image_url: string | null },
  }))
}

function countItems(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

const CART_SELECT = `
  id,
  cart_items (
    id,
    product_id,
    quantity,
    products ( id, name, price, image_url )
  )
`

export function CartProvider({ children, slug }: { children: ReactNode; slug: string }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartCount, setCartCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const store = useStore()

  const cartIdRef = useRef<string | null>(null)

  const setItems = (items: CartItem[]) => {
    setCartItems(items)
    setCartCount(countItems(items))
  }

  const loadCart = useCallback(async () => {
    if (!store.customerId || !store.storeId) {
      setItems([])
      cartIdRef.current = null
      setLoading(false)
      return
    }

    try {
      const supabase = createCustomerClient(slug)  // ← customer session
      const { data } = await supabase
        .from('carts')
        .select(CART_SELECT)
        .eq('customer_id', store.customerId)
        .maybeSingle()

      if (data) {
        cartIdRef.current = data.id
        setItems(parseItems(data))
      } else {
        cartIdRef.current = null
        setItems([])
      }
    } catch (error) {
      console.error('Load cart error:', error)
    } finally {
      setLoading(false)
    }
  }, [store.customerId, store.storeId, slug])

  useEffect(() => {
    if (store.loading) return
    loadCart()
  }, [store.loading, store.customerId, loadCart])

  // ── Ensure cart row exists, return its id ──────────────────────────────────
  const ensureCartId = async (): Promise<string | null> => {
    if (cartIdRef.current) return cartIdRef.current
    if (!store.customerId || !store.storeId) return null

    const supabase = createCustomerClient(slug)  // ← customer session

    const { data: existing } = await supabase
      .from('carts')
      .select('id')
      .eq('customer_id', store.customerId)
      .eq('store_id', store.storeId)
      .maybeSingle()

    if (existing?.id) {
      cartIdRef.current = existing.id
      return existing.id
    }

    const { data: created } = await supabase
      .from('carts')
      .insert({ customer_id: store.customerId, store_id: store.storeId })
      .select('id')
      .single()

    cartIdRef.current = created?.id ?? null
    return cartIdRef.current
  }

  // ── addToCart ─────────────────────────────────────────────────────────────
  const addToCart = async (
    productId: string,
    productData?: { id: string; name: string; price: number; image_url: string | null }
  ) => {
    if (!store.customerId || !store.storeId) {
      window.location.href = `/store/${slug}/login?redirect=${encodeURIComponent(window.location.href)}`
      return
    }

    // Optimistic update immediately
    if (productData) {
      setCartItems((prev) => {
        const existing = prev.find((i) => i.product_id === productId)
        let updated: CartItem[]
        if (existing) {
          updated = prev.map((i) =>
            i.product_id === productId ? { ...i, quantity: i.quantity + 1 } : i
          )
        } else {
          updated = [
            ...prev,
            {
              id: `optimistic-${productId}`,
              product_id: productId,
              quantity: 1,
              products: productData,
            },
          ]
        }
        setCartCount(countItems(updated))
        return updated
      })
    }

    const supabase = createCustomerClient(slug)  // ← customer session
    try {
      const cartId = await ensureCartId()
      if (!cartId) return

      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('product_id', productId)
        .maybeSingle()

      if (existingItem) {
        await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id)
      } else {
        await supabase
          .from('cart_items')
          .insert({ cart_id: cartId, product_id: productId, quantity: 1 })
      }

      await loadCart()
    } catch (error) {
      console.error('Add to cart error:', error)
      await loadCart()
    }
  }

  // ── updateQuantity ────────────────────────────────────────────────────────
  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (!store.customerId) return

    setCartItems((prev) => {
      const updated =
        quantity <= 0
          ? prev.filter((i) => i.id !== cartItemId)
          : prev.map((i) => (i.id === cartItemId ? { ...i, quantity } : i))
      setCartCount(countItems(updated))
      return updated
    })

    const supabase = createCustomerClient(slug)  // ← customer session
    try {
      if (quantity <= 0) {
        await supabase.from('cart_items').delete().eq('id', cartItemId)
      } else {
        await supabase.from('cart_items').update({ quantity }).eq('id', cartItemId)
      }
    } catch (error) {
      console.error('Update quantity error:', error)
      loadCart()
    }
  }

  // ── removeFromCart ────────────────────────────────────────────────────────
  const removeFromCart = async (cartItemId: string) => {
    if (!store.customerId) return

    setCartItems((prev) => {
      const updated = prev.filter((i) => i.id !== cartItemId)
      setCartCount(countItems(updated))
      return updated
    })

    const supabase = createCustomerClient(slug)  // ← customer session
    try {
      await supabase.from('cart_items').delete().eq('id', cartItemId)
    } catch (error) {
      console.error('Remove from cart error:', error)
      loadCart()
    }
  }

  // ── clearCart ─────────────────────────────────────────────────────────────
  const clearCart = async () => {
    if (!store.customerId) return

    setItems([])

    const supabase = createCustomerClient(slug)  // ← customer session
    try {
      const cartId = cartIdRef.current
      if (cartId) {
        await supabase.from('cart_items').delete().eq('cart_id', cartId)
      }
    } catch (error) {
      console.error('Clear cart error:', error)
      loadCart()
    }
  }

  return (
    <CartContext.Provider
      value={{
        cartCount,
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        customerId: store.customerId || null,
        storeId: store.storeId || null,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}