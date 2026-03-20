'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  ShoppingCart, User, LogOut, Plus, X, Trash2, Minus,
  CheckCircle2, MapPin, Phone, Package, Search,
  ShoppingBag, Star,
} from 'lucide-react'
import Link from 'next/link'

import { useCart } from '@/components/store/CartContext'
import { useStore } from '@/components/store/StoreContext'
import { toast } from 'sonner'
import { createCustomerClient } from '@/lib/supabase/customer-client'
import { getStoreTheme, type StoreTheme } from '@/lib/storeTheme'

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

const fmt = (n: number) => n.toLocaleString('en-GH', { maximumFractionDigits: 0 })

// ─── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({
  product, slug, index, theme,
}: {
  product: Product; slug: string; index: number; theme: StoreTheme
}) {
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
      className="product-card group relative overflow-hidden rounded-2xl transition-all duration-500"
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        animationDelay: `${index * 60}ms`,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = theme.cardHoverShadow }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
    >
      {/* Image */}
      <div className="relative h-52 sm:h-60 overflow-hidden" style={{ background: '#F1F5F9' }}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-14 w-14" style={{ color: '#CBD5E1' }} />
          </div>
        )}
        {/* Pre-order badge */}
        <div className="absolute top-3 left-3">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{
              background: theme.badgeBg,
              color: theme.badgeText,
              border: `1px solid ${theme.badgeBorder}`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Star style={{ width: 9, height: 9 }} /> Pre-order
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        <h3
          className="font-bold text-sm sm:text-base leading-snug line-clamp-2 mb-1 transition-colors duration-200"
          style={{ color: theme.cardNameColor, fontFamily: theme.fontDisplay }}
        >
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs line-clamp-1 mb-3 hidden sm:block" style={{ color: '#94A3B8' }}>
            {product.description}
          </p>
        )}
        <div className="flex items-end justify-between gap-2 mt-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: '#94A3B8' }}>Price</p>
            <p className="text-xl sm:text-2xl font-black tabular-nums leading-none" style={{ color: theme.priceColor }}>
              GH₵{fmt(product.price)}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 active:scale-95"
            style={{
              background: added ? theme.addedBg : (adding ? '#94A3B8' : theme.btnBg),
              color: theme.btnText,
            }}
            onMouseEnter={e => {
              if (!added && !adding) (e.currentTarget as HTMLButtonElement).style.background = theme.btnHoverBg
            }}
            onMouseLeave={e => {
              if (!added && !adding) (e.currentTarget as HTMLButtonElement).style.background = theme.btnBg
            }}
          >
            {added ? (
              <><CheckCircle2 style={{ width: 13, height: 13 }} /> Added!</>
            ) : adding ? (
              <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Plus style={{ width: 13, height: 13 }} /> Add</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Cart Drawer ───────────────────────────────────────────────────────────────

function CartDrawer({ slug, theme, onClose }: { slug: string; theme: StoreTheme; onClose: () => void }) {
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[400px] bg-white h-full shadow-2xl flex flex-col">
        {orderPlaced ? (
          <div className="flex flex-col h-full items-center justify-center px-8 text-center gap-6">
            <div
              className="h-24 w-24 rounded-full flex items-center justify-center"
              style={{ background: theme.heroAccent }}
            >
              <CheckCircle2 className="h-12 w-12 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-2" style={{ fontFamily: theme.fontDisplay }}>
                Order Confirmed!
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Your order has been placed. The importer will process it and notify you once your items arrive.
              </p>
            </div>
            <Link
              href={`/store/${slug}/orders`}
              onClick={onClose}
              className="w-full py-3.5 text-white text-sm font-bold rounded-2xl transition-colors"
              style={{ background: theme.btnBg }}
            >
              Track My Order
            </Link>
            <button onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600">Continue Shopping</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl flex items-center justify-center" style={{ background: theme.btnBg }}>
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
                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-white shrink-0">
                      {item.products.image_url
                        ? <img src={item.products.image_url} alt={item.products.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package className="h-6 w-6 text-slate-300" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 line-clamp-1">{item.products.name}</p>
                      <p className="text-sm font-black tabular-nums mt-0.5" style={{ color: theme.priceColor }}>
                        GH₵{fmt(item.products.price)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-7 w-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:border-slate-400 transition-colors">
                          <Minus className="h-3 w-3 text-slate-600" />
                        </button>
                        <span className="text-sm font-bold text-slate-900 w-5 text-center tabular-nums">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-7 w-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:border-slate-400 transition-colors">
                          <Plus className="h-3 w-3 text-slate-600" />
                        </button>
                        <button onClick={() => removeFromCart(item.id)} className="ml-auto h-7 w-7 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartCount > 0 && (
              <div className="px-6 pb-6 pt-4 border-t border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Subtotal</span>
                  <span className="text-xl font-black text-slate-900 tabular-nums">GH₵{fmt(total)}</span>
                </div>
                <div
                  className="flex items-start gap-2.5 rounded-2xl px-4 py-3"
                  style={{ background: theme.badgeBg, border: `1px solid ${theme.badgeBorder}` }}
                >
                  <Star style={{ width: 14, height: 14, color: theme.badgeText, marginTop: 2 }} />
                  <p className="text-xs leading-relaxed" style={{ color: theme.badgeText }}>
                    <span className="font-bold">No shipping fee now.</span> You'll pay shipping once your items arrive.
                  </p>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={placing}
                  className="w-full py-4 text-sm font-black rounded-2xl transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: theme.btnBg, color: theme.btnText }}
                >
                  {placing
                    ? <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Placing order…</>
                    : <>Place Order · GH₵{fmt(total)}</>}
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
  const theme = getStoreTheme(slug)
  const { cartCount, cartItems } = useCart()
  const store = useStore()
  const [showCart, setShowCart] = useState(false)
  const [search, setSearch] = useState('')
  const [pendingOrderCount, setPendingOrderCount] = useState(0)
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
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }
        .product-card { animation: scaleIn 0.4s ease both; }
      `}</style>

      <div className="min-h-screen" style={{ background: '#F8F6F1' }}>

        {/* ── Sticky Header ── */}
        <header
          className="sticky top-0 z-40 backdrop-blur-xl border-b"
          style={{ background: theme.headerBg, borderColor: theme.headerBorder }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4">

            <Link href={`/store/${slug}`} className="flex items-center gap-3 shrink-0">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: theme.btnBg }}>
                <ShoppingBag className="h-4 w-4" style={{ color: theme.btnText }} />
              </div>
              <span
                className="text-base font-bold hidden sm:block truncate max-w-[160px]"
                style={{ color: theme.cardNameColor, fontFamily: theme.fontDisplay }}
              >
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
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-100 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
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
                      <span
                        className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full text-white text-[9px] font-black"
                        style={{ background: theme.heroAccent }}
                      >
                        {pendingOrderCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href={`/store/${slug}/profile`}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all"
                  >
                    {customerAvatar ? (
                      <img src={customerAvatar} alt={customerName} className="h-7 w-7 rounded-xl object-cover" style={{ outline: `2px solid ${theme.heroAccent}30` }} />
                    ) : (
                      <div className="h-7 w-7 rounded-xl flex items-center justify-center" style={{ background: theme.btnBg }}>
                        <User className="h-3.5 w-3.5" style={{ color: theme.btnText }} />
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
                  <Link
                    href={`/store/${slug}/register`}
                    className="px-4 py-2 rounded-xl text-xs font-black transition-all"
                    style={{ background: theme.btnBg, color: theme.btnText }}
                  >
                    Sign up
                  </Link>
                </>
              )}

              {/* Cart */}
              <button
                onClick={() => setShowCart(true)}
                className="relative h-10 w-10 rounded-2xl flex items-center justify-center transition-all active:scale-95"
                style={{ background: theme.btnBg }}
              >
                <ShoppingCart className="h-4 w-4" style={{ color: theme.btnText }} />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center rounded-full text-white text-[10px] font-black ring-2 ring-white"
                    style={{ background: theme.heroAccent }}
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="relative overflow-hidden" style={{ background: theme.heroBg }}>
          <div
            className="absolute inset-0"
            style={{ background: theme.heroGradient }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <div className="max-w-2xl">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6"
                style={{ background: theme.heroBadgeBg, border: `1px solid ${theme.heroBadgeBorder}` }}
              >
                <Star style={{ width: 13, height: 13, color: theme.heroBadgeText }} />
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: theme.heroBadgeText }}>
                  Official Store
                </span>
              </div>
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4"
                style={{ color: theme.heroText, fontFamily: theme.fontDisplay }}
              >
                {importer.business_name}
              </h1>
              <p className="text-sm sm:text-base leading-relaxed mb-8 max-w-md" style={{ color: theme.heroSubText }}>
                Pre-order directly from our curated collection. Pay product price now, shipping fee when your items arrive.
              </p>
              <div className="flex flex-wrap gap-3">
                {importer.location && (
                  <div className="flex items-center gap-2 rounded-full px-4 py-2" style={{ background: theme.pillBg, border: `1px solid ${theme.pillBorder}` }}>
                    <MapPin style={{ width: 13, height: 13, color: theme.heroBadgeText, flexShrink: 0 }} />
                    <span className="text-xs font-medium" style={{ color: theme.pillText }}>{importer.location}</span>
                  </div>
                )}
                {importer.phone && (
                  <div className="flex items-center gap-2 rounded-full px-4 py-2" style={{ background: theme.pillBg, border: `1px solid ${theme.pillBorder}` }}>
                    <Phone style={{ width: 13, height: 13, color: theme.heroBadgeText, flexShrink: 0 }} />
                    <span className="text-xs font-medium" style={{ color: theme.pillText }}>{importer.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-full px-4 py-2" style={{ background: theme.pillBg, border: `1px solid ${theme.pillBorder}` }}>
                  <Package style={{ width: 13, height: 13, color: theme.heroBadgeText, flexShrink: 0 }} />
                  <span className="text-xs font-medium" style={{ color: theme.pillText }}>
                    {products.length} product{products.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Products Section ── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900" style={{ fontFamily: theme.fontDisplay }}>
                All Products
              </h2>
              <p className="text-sm text-slate-400 mt-1">{filtered.length} of {products.length} available</p>
            </div>
            {/* Search — mobile */}
            <div className="relative sm:hidden">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none shadow-sm transition-all"
              />
            </div>
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="h-24 w-24 rounded-3xl bg-white flex items-center justify-center shadow-sm">
                <Package className="h-10 w-10 text-slate-300" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-900 mb-1" style={{ fontFamily: theme.fontDisplay }}>No products yet</h3>
                <p className="text-sm text-slate-400">Check back soon — new items are on the way.</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Search className="h-10 w-10 text-slate-300" />
              <div className="text-center">
                <h3 className="font-bold text-slate-900 mb-1">No results for &ldquo;{search}&rdquo;</h3>
                <button onClick={() => setSearch('')} className="text-sm font-semibold" style={{ color: theme.priceColor }}>
                  Clear search
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} slug={slug} index={i} theme={theme} />
              ))}
            </div>
          )}
        </main>

        {/* ── Footer ── */}
        <footer style={{ background: theme.footerBg }} className="mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: theme.heroBadgeBg, border: `1px solid ${theme.heroBadgeBorder}` }}>
                <ShoppingBag style={{ width: 14, height: 14, color: theme.heroBadgeText }} />
              </div>
              <span className="text-sm font-bold" style={{ color: theme.heroText, fontFamily: theme.fontDisplay }}>
                {importer.business_name}
              </span>
            </div>
            <p className="text-xs text-center" style={{ color: theme.footerText }}>
              Pre-orders only · Payment collected at product level · Shipping billed on arrival
            </p>
            {!isLoggedIn && (
              <div className="flex items-center gap-3">
                <Link href={`/store/${slug}/login`} className="text-xs" style={{ color: theme.footerText }}>Login</Link>
                <Link
                  href={`/store/${slug}/register`}
                  className="text-xs font-bold px-4 py-2 rounded-xl"
                  style={{ background: theme.heroAccent, color: '#000' }}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </footer>

        {/* ── Floating cart (mobile) ── */}
        {cartCount > 0 && (
          <div className="fixed bottom-6 right-4 z-30 sm:hidden">
            <button
              onClick={() => setShowCart(true)}
              className="flex items-center gap-2 pl-4 pr-5 py-3.5 rounded-2xl shadow-2xl active:scale-95 transition-all"
              style={{ background: theme.btnBg, color: theme.btnText }}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="text-sm font-black">{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
              <span className="text-sm font-bold" style={{ color: theme.heroAccent }}>· GH₵{fmt(cartTotal)}</span>
            </button>
          </div>
        )}
      </div>

      {showCart && <CartDrawer slug={slug} theme={theme} onClose={() => setShowCart(false)} />}
    </>
  )
}