'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Save, User, Edit2, MapPin, Phone,
  Loader2, Package, Clock, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/components/store/StoreContext'
import { toast } from 'sonner'

interface OrderSummary {
  id: string
  total: number
  status: string
  created_at: string
  shipping_fee?: number | null
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  product_paid: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  arrived: 'bg-purple-100 text-purple-700',
  shipping_billed: 'bg-orange-100 text-orange-700',
  shipping_paid: 'bg-green-100 text-green-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  product_paid: 'Product Paid',
  processing: 'Processing',
  arrived: 'Arrived',
  shipping_billed: 'Shipping Due',
  shipping_paid: 'Shipping Paid',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export default function ProfileContent({ slug }: { slug: string }) {
  const store = useStore()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([])
  const [email, setEmail] = useState('')
  const [formData, setFormData] = useState({
    full_name: '', username: '', contact: '', location: '', shipping_address: '',
  })

  useEffect(() => {
    if (store.loading) return
    if (!store.customerId) { setLoading(false); return }

    const supabase = createClient()
    const fetchAll = async () => {
      const [{ data: customer }, { data: { user } }, { data: orders }] = await Promise.all([
        supabase.from('customers').select('*').eq('id', store.customerId).single(),
        supabase.auth.getUser(),
        supabase
          .from('orders')
          .select('id, total, status, created_at, shipping_fee')
          .eq('customer_id', store.customerId)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      if (customer) {
        setProfile(customer)
        setEmail(user?.email || '')
        setFormData({
          full_name: customer.full_name || '',
          username: customer.username || '',
          contact: customer.contact || '',
          location: customer.location || '',
          shipping_address: customer.shipping_address || '',
        })
      }
      setRecentOrders(orders || [])
      setLoading(false)
    }
    fetchAll()
  }, [store.customerId, store.loading])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('customers').update(formData).eq('id', store.customerId!)
    if (error) {
      toast.error('Failed to update profile')
    } else {
      toast.success('Profile updated!')
      setIsEditing(false)
      setProfile((prev: any) => ({ ...prev, ...formData }))
    }
    setSaving(false)
  }

  const fmt = (n: number) => n.toLocaleString('en-GH', { maximumFractionDigits: 0 })
  const nv = (v: any) => parseFloat(String(v || 0)) || 0

  // ── Auth guard ──────────────────────────────────────────────────────────────
  if (!store.loading && !store.customerId) {
    if (typeof window !== 'undefined') {
      window.location.href = `/store/${slug}/login?redirect=/store/${slug}/profile`
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center gap-3">
            <Link href={`/store/${slug}`} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6">
            {/* Avatar + name + edit button */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {profile?.full_name || profile?.username || 'Customer'}
                  </h2>
                  <p className="text-sm text-gray-400">{email}</p>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
              )}
            </div>

            {!isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Full Name', value: profile?.full_name, icon: User },
                  { label: 'Username', value: profile?.username, icon: User },
                  { label: 'Contact', value: profile?.contact, icon: Phone },
                  { label: 'Location', value: profile?.location, icon: MapPin },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl">
                    <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-medium text-gray-900">{value || 'Not set'}</p>
                    </div>
                  </div>
                ))}
                <div className="sm:col-span-2 flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl">
                  <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Shipping Address</p>
                    <p className="text-sm font-medium text-gray-900">
                      {profile?.shipping_address || 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'full_name', label: 'Full Name', placeholder: 'John Doe' },
                    { key: 'username', label: 'Username', placeholder: 'johndoe' },
                    { key: 'contact', label: 'Contact', placeholder: '0551234567' },
                    { key: 'location', label: 'Location', placeholder: 'Accra, Ghana' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <input
                        type="text"
                        value={(formData as any)[key]}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        placeholder={placeholder}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
                    <textarea
                      value={formData.shipping_address}
                      onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="123 Street, Accra"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Order history (read-only, last 5) */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Order History</h2>
                <p className="text-xs text-gray-400">Recent orders</p>
              </div>
            </div>
            <Link
              href={`/store/${slug}/orders`}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-10 text-center">
              <Package className="h-10 w-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No orders yet</p>
              <Link
                href={`/store/${slug}`}
                className="mt-2 inline-block text-blue-600 hover:text-blue-700 font-medium text-xs"
              >
                Start shopping →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.map((order) => {
                const status = order.status?.toLowerCase() || 'pending'
                const total = nv(order.total) + nv(order.shipping_fee)
                return (
                  <div key={order.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                        <Package className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-mono font-semibold text-gray-800">
                          #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(order.created_at).toLocaleDateString('en', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[status] || status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-bold text-gray-800 tabular-nums w-20 text-right">
                        GH₵{fmt(Math.round(total))}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {recentOrders.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100">
              <Link
                href={`/store/${slug}/orders`}
                className="flex items-center justify-center gap-1.5 w-full py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                View all orders <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}