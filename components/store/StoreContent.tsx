'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  ShoppingCart, User, LogOut, Plus, X, Trash2, Minus,
  CheckCircle2, MapPin, Phone, Package, Search,
  Sparkles, ShoppingBag, Star,
} from 'lucide-react'
import Link from 'next/link'

import { useCart } from '@/components/store/CartContext'
import { useStore } from '@/components/store/StoreContext'
import { toast } from 'sonner'
import { createCustomerClient } from '@/lib/supabase/customer-client'

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('en-GH', { maximumFractionDigits: 0 })

// ─── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({ product, slug, index }: { product: Product; slug: string; index: number }) {
  const { addToCart, customerId } = useCart()
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  const handleAddToCart = async () => {
    if (!customerId) {
      window.location.href = `/store/${slug}/login?redirect=${encodeURIComponent(window.location.href)}`
      return
    }
    setAdding(true)
    try {
      await addToCart(product.id, {
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url ?? null,
      })
      setAdded(true)
      setTimeout(() => setAdded(false), 1800)
    } catch (e) { console.error(e) } finally { setAdding(false) }
  }

  return (
    <div
      className="product-card group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Image */}
      <div className="relative h-56 sm:h-64 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-slate-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-amber-700 px-2.5 py-1 rounded-full border border-amber-200/50 shadow-sm">
            <Sparkles className="h-2.5 w-2.5" /> Pre-order
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 mb-1 group-hover:text-amber-700 transition-colors duration-200">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-slate-400 line-clamp-1 mb-3 hidden sm:block">{product.description}</p>
        )}

        <div className="flex items-end justify-between gap-2 mt-3">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Price</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums leading-none">
              GH₵<span className="text-amber-600">{fmt(product.price)}</span>
            </p>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={adding}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 active:scale-95 shadow-md ${
              added
                ? 'bg-emerald-500 text-white shadow-emerald-200'
                : 'bg-slate-900 text-white hover:bg-amber-600 shadow-slate-200 hover:shadow-amber-200'
            }`}
          >
            {added ? (
              <><CheckCircle2 className="h-3.5 w-3.5" /> Added!</>
            ) : adding ? (
              <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Plus className="h-3.5 w-3.5" /> Add</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Cart Drawer ───────────────────────────────────────────────────────────────

function CartDrawer({ slug, onClose }: { slug: string; onClose: () => void }) {
  const store = useStore()
  const { cartItems, cartCount, updateQuantity, removeFromCart, clearCart } = useCart()
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [placing, setPlacing] = useState(false)
  const total = cartItems.reduce((s, i) => s + i.quantity * i.products.price, 0)

  const handleCheckout = async () => {
    if (!store.customerId) {
      window.location.href = `/store/${slug}/login?redirect=${encodeURIComponent(window.location.href)}`
      return
    }
    if (cartItems.length === 0) { toast.error('Your cart is empty'); return }

    setPlacing(true)
    const supabase = createCustomerClient(slug)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ customer_id: store.customerId, store_id: store.storeId!, total, status: 'pending' })
      .select('id')
      .single()

    if (orderError || !order) { toast.error('Failed to place order'); setPlacing(false); return }

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.products.price,
      })))

    if (itemsError) { toast.error('Order placed but items missing. Contact support.'); setPlacing(false); return }

    clearCart()
    setOrderPlaced(true)
    setPlacing(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.2s ease' }}
      />

      {/* Drawer */}
      <div
        className="relative w-full max-w-[400px] bg-white h-full shadow-2xl flex flex-col"
        style={{ animation: 'slideInRight 0.3s cubic-bezier(0.32, 0.72, 0, 1)' }}
      >
        {orderPlaced ? (
          /* Success screen */
          <div className="flex flex-col h-full items-center justify-center px-8 text-center gap-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-200">
              <CheckCircle2 className="h-12 w-12 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Order Confirmed!</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Your order has been placed. The importer will process it and notify you once your items arrive.
              </p>
            </div>
            <Link
              href={`/store/${slug}/orders`}
              onClick={onClose}
              className="w-full py-3.5 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-amber-600 transition-colors"
            >
              Track My Order
            </Link>
            <button onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600">
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-slate-900 flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Your Cart</h2>
                  <p className="text-xs text-slate-400">{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-2xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="h-4 w-4 text-slate-600" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {cartCount === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
                  <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-400 text-center">Your cart is empty.<br />Add something to get started!</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 p-3 bg-slate-50 rounded-2xl group">
                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-white shrink-0 shadow-sm">
                      {item.products.image_url
                        ? <img src={item.products.image_url} alt={item.products.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package className="h-6 w-6 text-slate-300" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 line-clamp-1">{item.products.name}</p>
                      <p className="text-sm font-black text-amber-600 tabular-nums mt-0.5">GH₵{fmt(item.products.price)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-7 w-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:border-slate-400 transition-colors"
                        >
                          <Minus className="h-3 w-3 text-slate-600" />
                        </button>
                        <span className="text-sm font-bold text-slate-900 w-5 text-center tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-7 w-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:border-slate-400 transition-colors"
                        >
                          <Plus className="h-3 w-3 text-slate-600" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="ml-auto h-7 w-7 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cartCount > 0 && (
              <div className="px-6 pb-6 pt-4 border-t border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Subtotal</span>
                  <span className="text-xl font-black text-slate-900 tabular-nums">GH₵{fmt(total)}</span>
                </div>
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                  <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    <span className="font-bold">No shipping fee now.</span> You&apos;ll pay shipping once your items arrive.
                  </p>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={placing}
                  className="w-full py-4 bg-slate-900 text-white text-sm font-black rounded-2xl hover:bg-amber-600 transition-all duration-300 active:scale-[0.98] shadow-lg hover:shadow-amber-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {placing ? (
                    <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Placing order…</>
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

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function StoreContent({ slug, importer, products }: StoreContentProps) {
  const { cartCount, cartItems } = useCart()
  const store = useStore()
  const [showCart, setShowCart] = useState(false)
  const [search, setSearch] = useState('')
  const [pendingOrderCount, setPendingOrderCount] = useState(0)

  // Derive cart total from cartItems for the floating button
  const cartTotal = cartItems.reduce((s, i) => s + i.quantity * i.products.price, 0)

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

  const filtered = products.filter((p) =>
    search.trim() === '' ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  const { isLoggedIn, customerName, customerAvatar } = store

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');

        :root {
          --store-font-display: 'Playfair Display', Georgia, serif;
          --store-font-body: 'DM Sans', system-ui, sans-serif;
        }

        .store-page { font-family: var(--store-font-body); }
        .store-display { font-family: var(--store-font-display); }

        @keyframes fadeIn {
          from { opacity: 0 } to { opacity: 1 }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%) } to { transform: translateX(0) }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) }
          to { opacity: 1; transform: translateY(0) }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) }
          to { opacity: 1; transform: scale(1) }
        }

        .product-card { animation: scaleIn 0.4s ease both; }
        .hero-text { animation: slideUp 0.6s ease both; }
        .hero-sub { animation: slideUp 0.6s 0.1s ease both; }
        .hero-stats { animation: slideUp 0.6s 0.2s ease both; }
        .search-bar { animation: slideUp 0.5s 0.15s ease both; }
      `}</style>

      <div className="store-page min-h-screen bg-[#F8F6F1]">

        {/* ── Sticky Header ── */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4">

            <Link href={`/store/${slug}`} className="flex items-center gap-3 shrink-0">
              <div className="h-8 w-8 rounded-xl bg-slate-900 flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-amber-400" />
              </div>
              <span className="store-display text-base font-bold text-slate-900 hidden sm:block truncate max-w-[160px]">
                {importer.business_name}
              </span>
            </Link>

            {/* Search — desktop */}
            <div className="hidden md:flex flex-1 max-w-md relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-100 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
              />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 shrink-0">
              {isLoggedIn && customerName ? (
                <>
                  <Link
                    href={`/store/${slug}/orders`}
                    className="relative hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                  >
                    Orders
                    {pendingOrderCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-amber-500 text-white text-[9px] font-black">
                        {pendingOrderCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href={`/store/${slug}/profile`}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all"
                  >
                    {customerAvatar ? (
                      <img src={customerAvatar} alt={customerName} className="h-7 w-7 rounded-xl object-cover ring-2 ring-amber-400/30" />
                    ) : (
                      <div className="h-7 w-7 rounded-xl bg-slate-900 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-amber-400" />
                      </div>
                    )}
                    <span className="hidden sm:inline text-xs font-semibold text-slate-700 max-w-[80px] truncate">{customerName}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link href={`/store/${slug}/login`} className="hidden sm:flex px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                    Login
                  </Link>
                  <Link href={`/store/${slug}/register`} className="px-4 py-2 rounded-xl text-xs font-black bg-slate-900 text-white hover:bg-amber-600 transition-all shadow-md hover:shadow-amber-200">
                    Sign up
                  </Link>
                </>
              )}

              {/* Cart button */}
              <button
                onClick={() => setShowCart(true)}
                className="relative h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center hover:bg-amber-600 transition-all shadow-md active:scale-95"
              >
                <ShoppingCart className="h-4 w-4 text-white" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-black ring-2 ring-white">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-slate-900">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }} />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-amber-400 opacity-10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-amber-500 opacity-5 blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <div className="max-w-2xl">
              <div className="hero-text inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-full px-4 py-1.5 mb-6">
                <Star className="h-3.5 w-3.5 text-amber-400" fill="currentColor" />
                <span className="text-xs font-bold text-amber-400 tracking-widest uppercase">Official Store</span>
              </div>
              <h1 className="store-display hero-text text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4">
                {importer.business_name}
              </h1>
              <p className="hero-sub text-slate-400 text-sm sm:text-base leading-relaxed mb-8 max-w-md">
                Pre-order directly from our curated collection. Pay product price now, shipping fee when your items arrive.
              </p>
              <div className="hero-stats flex flex-wrap gap-3">
                {importer.location && (
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                    <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="text-xs text-slate-300 font-medium">{importer.location}</span>
                  </div>
                )}
                {importer.phone && (
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                    <Phone className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="text-xs text-slate-300 font-medium">{importer.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                  <Package className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="text-xs text-slate-300 font-medium">{products.length} product{products.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Products Section ── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="store-display text-2xl sm:text-3xl font-black text-slate-900">All Products</h2>
              <p className="text-sm text-slate-400 mt-1">{filtered.length} of {products.length} available</p>
            </div>
            {/* Search — mobile */}
            <div className="search-bar relative sm:hidden">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-400 shadow-sm transition-all"
              />
            </div>
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="h-24 w-24 rounded-3xl bg-white flex items-center justify-center shadow-sm">
                <Package className="h-10 w-10 text-slate-300" />
              </div>
              <div className="text-center">
                <h3 className="store-display text-xl font-bold text-slate-900 mb-1">No products yet</h3>
                <p className="text-sm text-slate-400">Check back soon — new items are on the way.</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Search className="h-10 w-10 text-slate-300" />
              <div className="text-center">
                <h3 className="font-bold text-slate-900 mb-1">No results for &ldquo;{search}&rdquo;</h3>
                <button onClick={() => setSearch('')} className="text-sm text-amber-600 font-semibold">Clear search</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} slug={slug} index={i} />
              ))}
            </div>
          )}
        </main>

        {/* ── Footer ── */}
        <footer className="bg-slate-900 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-amber-400" />
              </div>
              <span className="store-display text-sm font-bold text-white">{importer.business_name}</span>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Pre-orders only · Payment collected at product level · Shipping billed on arrival
            </p>
            {!isLoggedIn && (
              <div className="flex items-center gap-3">
                <Link href={`/store/${slug}/login`} className="text-xs text-slate-400 hover:text-white transition-colors">Login</Link>
                <Link href={`/store/${slug}/register`} className="text-xs font-bold px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-400 transition-colors">Sign up</Link>
              </div>
            )}
          </div>
        </footer>

        {/* ── Floating cart button (mobile) — now shows real total ── */}
        {cartCount > 0 && (
          <div className="fixed bottom-6 right-4 z-30 sm:hidden">
            <button
              onClick={() => setShowCart(true)}
              className="flex items-center gap-2 pl-4 pr-5 py-3.5 bg-slate-900 text-white rounded-2xl shadow-2xl active:scale-95 transition-all"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="text-sm font-black">{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
              <span className="text-sm font-bold text-amber-400">· GH₵{fmt(cartTotal)}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Cart Drawer ── */}
      {showCart && <CartDrawer slug={slug} onClose={() => setShowCart(false)} />}
    </>
  )
}
