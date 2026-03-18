'use client'

import { useState, useCallback, useEffect } from 'react'
import { Package, Phone, MapPin, ShoppingCart, User, LogOut, CheckCircle2, Plus, X, Trash2 } from 'lucide-react'
import Link from 'next/link'

import { useCart } from '@/components/store/CartContext'
import { useStore } from '@/components/store/StoreContext'
import { toast } from 'sonner'
import { createCustomerClient } from '@/lib/supabase/customer-client'  // ← only this client

interface Product {
  id: string
  name: string
  price: number
  image_url?: string
  description?: string
}

interface StoreContentProps {
  slug: string
  importer: { business_name: string; phone: string; location: string }
  products: Product[]
}

function ProductCard({ product, slug }: { product: Product; slug: string }) {
  const { addToCart, customerId } = useCart()

  const handleAddToCart = async () => {
    if (!customerId) {
      window.location.href = `/store/${slug}/login?redirect=${encodeURIComponent(window.location.href)}`
      return
    }
    try {
      await addToCart(product.id, {
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url ?? null,
      })
    } catch (e) { console.error(e) }
  }

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all overflow-hidden">
      <div className="relative h-44 sm:h-52 bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-14 w-14 text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4 flex flex-col gap-2">
        <h3 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2 leading-snug min-h-[40px]">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-2 hidden sm:block">{product.description}</p>
        )}
        <p className="text-lg sm:text-xl font-bold text-blue-600">GH₵{product.price.toLocaleString()}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full whitespace-nowrap">
            Without shipping fee
          </span>
          <button
            onClick={handleAddToCart}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add to Cart</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function StoreContent({ slug, importer, products }: StoreContentProps) {
  const { cartCount } = useCart()
  const store = useStore()
  const [showCart, setShowCart] = useState(false)
  const [pendingOrderCount, setPendingOrderCount] = useState(0)

  // ← use createCustomerClient so RLS sees the customer session
  useEffect(() => {
    if (!store.customerId) { setPendingOrderCount(0); return }
    const supabase = createCustomerClient(slug)
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', store.customerId)
      .eq('status', 'shipping_billed')
      .then(({ count }: { count: number | null }) => setPendingOrderCount(count || 0))
  }, [store.customerId, slug])

  const handleLogout = useCallback(async () => {
    try {
      await createCustomerClient(slug).auth.signOut()
      window.location.href = `/store/${slug}`
    } catch { toast.error('Logout failed') }
  }, [slug])

  if (store.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  const { isLoggedIn, customerName, customerAvatar } = store

  return (
    <div className="min-h-screen bg-gray-50 pb-6">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3">

            {/* Business name */}
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate leading-tight">
                {importer.business_name}
              </h1>
              <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                {importer.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{importer.phone}</span>}
                {importer.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{importer.location}</span>}
              </div>
            </div>

            {/* Auth + cart */}
            <div className="flex items-center gap-1.5 shrink-0">
              {isLoggedIn && customerName ? (
                <>
                  <Link
                    href={`/store/${slug}/orders`}
                    className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-gray-700 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    My Orders
                    {pendingOrderCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-orange-500 text-white text-[10px] font-bold">
                        {pendingOrderCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href={`/store/${slug}/profile`}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-gray-700 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    {customerAvatar ? (
                      <img src={customerAvatar} alt={customerName} className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline max-w-[80px] truncate">{customerName}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link href={`/store/${slug}/login`} className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    Login
                  </Link>
                  <Link href={`/store/${slug}/register`} className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                    Sign up
                  </Link>
                </>
              )}
              <button
                onClick={() => setShowCart(true)}
                className="relative p-2 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile contact row */}
          <div className="sm:hidden flex items-center gap-3 text-xs text-gray-500 pb-2">
            {importer.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{importer.phone}</span>}
            {importer.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{importer.location}</span>}
          </div>
        </div>
      </header>

      {/* Products */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Products</h2>
          <span className="text-xs sm:text-sm text-gray-500">{products.length} items</span>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-14 w-14 mx-auto mb-4 text-gray-300" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">No products yet</h3>
            <p className="text-sm text-gray-500">Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} slug={slug} />
            ))}
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
        Pre-order only · Without shipping fee
      </footer>

      {showCart && <CartDrawer slug={slug} onClose={() => setShowCart(false)} />}
    </div>
  )
}

function CartDrawer({ slug, onClose }: { slug: string; onClose: () => void }) {
  const store = useStore()
  const { cartItems, cartCount, updateQuantity, removeFromCart, clearCart } = useCart()
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [placing, setPlacing] = useState(false)
  const total = cartItems.reduce((s, i) => s + i.quantity * i.products.price, 0)
  const fmt = (n: number) => n.toLocaleString('en-GH', { maximumFractionDigits: 0 })

  const handleCheckout = async () => {
    if (!store.customerId) {
      window.location.href = `/store/${slug}/login?redirect=${encodeURIComponent(window.location.href)}`
      return
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    setPlacing(true)
    // ← use createCustomerClient so the insert is authenticated as the customer
    const supabase = createCustomerClient(slug)

    // 1. Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: store.customerId,
        store_id: store.storeId!,
        total,
        status: 'pending',
      })
      .select('id')
      .single()

    if (orderError || !order) {
      toast.error('Failed to place order')
      setPlacing(false)
      return
    }

    // 2. Insert order_items
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.products.price,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Failed to insert order_items:', itemsError)
      toast.error('Order placed but items may be missing. Contact support.')
      setPlacing(false)
      return
    }

    // 3. Clear cart and show success
    clearCart()
    setOrderPlaced(true)
    setPlacing(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-[360px] bg-white h-full shadow-2xl flex flex-col">

        {/* ── Order placed success screen ── */}
        {orderPlaced ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Order Placed!</h2>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Your order is confirmed!</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  The importer will process your order and ship your items. Once your items arrive,
                  you'll need to <span className="font-semibold text-orange-600">pay the shipping fee</span> before delivery.
                </p>
              </div>
              <Link
                href={`/store/${slug}/orders`}
                onClick={onClose}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                View My Orders
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Cart header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                Cart <span className="text-gray-400 font-normal text-sm">({cartCount} item{cartCount !== 1 ? 's' : ''})</span>
              </h2>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cartCount === 0 ? (
                <div className="text-center py-16">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">Your cart is empty</p>
                  <button onClick={onClose} className="mt-4 text-sm text-blue-600 font-medium">Continue shopping</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-gray-100 shrink-0">
                        {item.products.image_url
                          ? <img src={item.products.image_url} alt={item.products.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Package className="h-6 w-6 text-gray-300" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.products.name}</p>
                        <p className="text-sm font-bold text-blue-600">GH₵{fmt(item.products.price)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-6 w-6 flex items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 text-xs font-bold transition-colors">−</button>
                          <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-6 w-6 flex items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 text-xs font-bold transition-colors">+</button>
                          <button onClick={() => removeFromCart(item.id)} className="ml-auto text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart footer */}
            {cartCount > 0 && (
              <div className="p-4 border-t border-gray-100 space-y-3">
                <div className="flex justify-between text-sm font-semibold text-gray-900">
                  <span>Subtotal</span>
                  <span>GH₵{fmt(total)}</span>
                </div>
                <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
                  Shipping fee will be added once your items arrive.
                </p>
                <button
                  onClick={handleCheckout}
                  disabled={placing}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {placing ? (
                    <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Placing order…</>
                  ) : (
                    <>Place Order · GH₵{fmt(total)}</>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}