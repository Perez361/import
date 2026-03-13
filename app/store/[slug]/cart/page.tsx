"use client"

import Link from 'next/link'
import { ShoppingCart, Trash2, CreditCard } from 'lucide-react'
import { useCart } from '@/components/store/CartContext'
import { createClient } from '@/lib/supabase/client'
import { createOrder } from '@/lib/store'
import { toast } from 'sonner'

export default function CartPage() {
  const { cartItems, customerId, storeId, cartCount } = useCart()

  if (cartCount === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Add some products to get started.</p>
          <Link
            href="/store/[slug]"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  const total = cartItems.reduce((sum, item) => sum + (item.quantity * item.products.price), 0)

  const handleCheckout = async () => {
    if (!customerId || !storeId) {
      toast.error('Please log in to checkout')
      return
    }

    try {
      await createOrder(customerId, storeId)
      toast.success('Order placed successfully!')
      // Redirect or clear cart
    } catch (error) {
      toast.error('Checkout failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-500">{cartCount} items</p>
          </div>

          <div className="p-8">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 py-4 border-b border-gray-100 last:border-b-0">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center">
                  {item.products.image_url ? (
                    <img src={item.products.image_url} alt={item.products.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <ShoppingCart className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{item.products.name}</h3>
                  <p className="text-2xl font-bold text-blue-600">GH₵{item.products.price}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-gray-700">Qty: {item.quantity}</span>
                    <button className="text-sm text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">GH₵{item.quantity * item.products.price}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center text-2xl font-bold text-gray-900 mb-6">
              <span>Total:</span>
              <span>GH₵{total}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              <CreditCard className="h-5 w-5" />
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

