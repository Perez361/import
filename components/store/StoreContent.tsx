'use client'

import { useState, useCallback } from 'react'
import { Package, Phone, MapPin, ShoppingCart, User, LogOut, Plus, X, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/components/store/CartContext'
import { useStore } from '@/components/store/StoreContext'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { logoutAction } from '@/lib/actions'
import ProfileDrawer from '@/components/store/ProfileDrawer'

const handleLogout = useCallback(async () => {
  try {
    await logoutAction()
    // Context will update via auth listener
  } catch (error) {
    toast.error('Logout failed')
  }
}, [])

interface Product {
  id: string
  name: string
  price: number
  image_url?: string
  description?: string
}

interface StoreContentProps {
  slug: string
  importer: {
    business_name: string
    phone: string
    location: string
  }
  products: Product[]
}

function StoreHeader({ slug, isLoggedIn, customerName }: { 
  slug: string
  isLoggedIn: boolean
  customerName: string
}) {
  const { cartCount } = useCart()
  
  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-start">
          {/* Left: Business Info */}
          <div>
            {/* This will be passed as prop */}
          </div>

          {/* Right: Profile & Cart */}
          <div className="flex items-center gap-2">
            {isLoggedIn && customerName ? (
              <>
                <Link href={`/store/${slug}/profile`} className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">{customerName}</span>
                </Link>
                <button 
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5 text-gray-700" />
                </button>
              </>
            ) : (
              <>
                <Link 
                  href={`/store/${slug}/login`}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  href={`/store/${slug}/register`}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Account
                </Link>
              </>
            )}
            <Link href={`/store/${slug}/cart`} className="p-2 rounded-full hover:bg-gray-100 transition-colors relative ml-2">
              <ShoppingCart className="h-6 w-6 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product, slug }: { product: Product; slug: string }) {
  const { addToCart, customerId } = useCart()
  
  const handleAddToCart = async () => {
    if (!customerId) {
      window.location.href = `/store/${slug}/login?redirect=${encodeURIComponent(window.location.href)}`
      return
    }
    
    try {
      await addToCart(product.id)
    } catch (error) {
      console.error('Add to cart error:', error)
    }
  }
  
  return (
    <div className="group bg-white rounded-2xl border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all overflow-hidden">
      <div className="relative h-64 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <Package className="h-20 w-20 text-gray-400" />
        )}
      </div>
      <div className="p-6">
        <h3 className="font-semibold text-lg text-gray-900 mb-2 leading-tight line-clamp-2">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
        )}
                <div className="flex flex-col gap-1 items-start">
                  <span className="text-2xl font-bold text-blue-600">GH₵{product.price}</span>
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Without shipping fee</span>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="w-full mt-2 flex items-center justify-center gap-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add to Cart
                </button>
      </div>
    </div>
  )
}

export default function StoreContent({ slug, importer, products }: StoreContentProps) {
  const { customerId } = useCart()
  const store = useStore()
  const [showCart, setShowCart] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  
  if (store.loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading store...</div>
  }

  const { isLoggedIn, customerName } = store

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            {/* Left: Business Info */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {importer.business_name}
              </h1>
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {importer.phone}
                </span>
                <span className="text-gray-400">|</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {importer.location}
                </span>
              </div>
            </div>

            {/* Right: Profile & Cart */}
            <div className="flex items-center gap-2">
              {isLoggedIn && customerName ? (
                <>
                  <Link href={`/store/${slug}/profile`} className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">{customerName}</span>
                  </Link>
                  <button 
                    type="button"
                    onClick={handleLogout}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5 text-gray-700" />
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href={`/store/${slug}/login`}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Login
                  </Link>
                  <Link 
                    href={`/store/${slug}/register`}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Account
                  </Link>
                </>
              )}
              <button 
                onClick={() => setShowCart(true)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors relative ml-2"
              >
                <ShoppingCart className="h-6 w-6 text-gray-700" />
                <CartBadge />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Available Products</h2>
          <div className="text-sm text-gray-500">{products.length} items</div>
        </div>
        {products.length === 0 ? (
          <div className="text-center py-24">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500">Check back later for new pre-orders!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} slug={slug} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-500">
          Pre-order only • Without shipping fee • {new Date().getFullYear()}
        </div>
      </div>

      {/* Profile Drawer */}
      {showProfile && <ProfileDrawer slug={slug} onClose={() => setShowProfile(false)} />}
      
      {/* Cart Drawer */}
      {showCart && <CartDrawer slug={slug} onClose={() => setShowCart(false)} />}
    </div>
  )
}

function CartBadge() {
  const { cartCount } = useCart()
  if (cartCount === 0) return null
  return (
    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
      {cartCount}
    </span>
  )
}

function CartDrawer({ slug, onClose }: { slug: string; onClose: () => void }) {
  const store = useStore()
  const { cartItems, cartCount, updateQuantity, removeFromCart } = useCart()
  const total = cartItems.reduce((sum, item) => sum + (item.quantity * item.products.price), 0)
  
  const handleCheckout = async () => {
    if (!store.customerId) {
      window.location.href = `/store/${slug}/login?redirect=${encodeURIComponent(window.location.href)}`
      return
    }
    
    const supabase = createClient()
    const { error } = await supabase.from('orders').insert({
      customer_id: store.customerId,
      store_id: store.storeId!,
      total_amount: total,
      status: 'pending'
    })
    
    if (error) {
      toast.error('Failed to place order')
    } else {
      toast.success('Order placed successfully!')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Shopping Cart</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-700" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {cartCount === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 border-b border-gray-100">
                  {/* Product Image */}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.products.image_url ? (
                      <img 
                        src={item.products.image_url} 
                        alt={item.products.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.products.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">GH₵{item.products.price} each</p>
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <p className="font-bold text-gray-900">GH₵{item.quantity * item.products.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {cartCount > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-blue-600">GH₵{total}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Place Order
            </button>
          </div>
        )}
      </div>
    </div>
  )
}