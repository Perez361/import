'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, Save, X, Package, Clock, Truck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/components/store/StoreContext'
import { toast } from 'sonner'


interface CustomerProfile {
  full_name: string
  username: string
  contact: string
  email: string
  location: string
  shipping_address: string
  importers: {
    store_slug: string
  }
}

interface Order {
  id: string
  total_amount: number
  status: string
  created_at: string
  order_items: {
    id: string
    quantity: number
    products: {
      name: string
      price: number
    }
  }[]
}

export default function ProfileDrawer({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    contact: '',
    location: '',
    shipping_address: ''
  })
  const [saving, setSaving] = useState(false)

  const store = useStore()

  useEffect(() => {
    if (!store.customerId || store.loading) return

    const fetchData = async () => {
      setLoading(true)
      const supabase = createClient()

      // Fetch profile
      const { data: customer } = await supabase
        .from('customers')
        .select(`
          *,
          importers!store_id(store_slug)
        `)
        .eq('id', store.customerId)
        .single()

      if (customer) {
        setProfile(customer)
        setFormData({
          full_name: customer.full_name || '',
          username: customer.username || '',
          contact: customer.contact || '',
          location: customer.location || '',
          shipping_address: customer.shipping_address || ''
        })
      }

      // Fetch orders
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('customer_id', store.customerId)
        .order('created_at', { ascending: false })

      setOrders(orderData || [])

      setLoading(false)
    }

    fetchData()
  }, [store.customerId])

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setSaving(true)

      const supabase = createClient()

      const { error } = await supabase
        .from('customers')
        .update({
          full_name: formData.full_name,
          username: formData.username,
          contact: formData.contact,
          location: formData.location,
          shipping_address: formData.shipping_address
        })
        .eq('id', store.customerId!)

      if (error) {
        toast.error('Update failed')
      } else {
        toast.success('Profile updated!')
        // Refresh profile
        const { data: updatedCustomer } = await supabase
          .from('customers')
          .select('*')
          .eq('id', store.customerId!)
          .single()
        setProfile(updatedCustomer)
      }

      setSaving(false)
    }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          Loading profile...
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Profile Info */}
          {profile && (
            <div className="flex items-center gap-4 p-6 bg-blue-50 rounded-xl">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{profile.full_name}</h3>
                <p className="text-sm text-gray-500">{profile.email}</p>
              </div>
            </div>
          )}

          {/* Edit Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="Full Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="Username"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="tel"
                value={formData.contact}
                onChange={(e) => setFormData({...formData, contact: e.target.value})}
                placeholder="Contact Number"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Location"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <textarea
                rows={3}
                value={formData.shipping_address}
                onChange={(e) => setFormData({...formData, shipping_address: e.target.value})}
                placeholder="Shipping Address"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>

          {/* Order History */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order History ({orders.length})
            </h3>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No orders yet
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-900">Order #{order.id.slice(-6)}</span>
                      <span className="text-sm font-medium text-gray-700">
                        GH₵{order.total_amount}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        <Clock className="h-3 w-3" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                        <Truck className="h-3 w-3" />
                        {order.status.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {order.order_items.map((item, index) => (
                        <div key={index} className="text-gray-600">
                          {item.products.name} x{item.quantity}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
