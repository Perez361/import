'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Package, ArrowLeft, Save, User, Edit2, MapPin, Phone,
  Clock, Truck, AlertCircle, CheckCircle2, DollarSign, Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/components/store/StoreContext'
import { toast } from 'sonner'
import { customerConfirmShippingPaymentAction } from '@/app/dashboard/orders/actions'

interface Order {
  id: string
  total: number
  status: string
  created_at: string
  shipping_fee?: number | null
  shipping_paid?: boolean
  shipping_note?: string | null
  payment_reference?: string | null
  momo_number?: string | null
  order_items: {
    id: string
    quantity: number
    products: { name: string; price: number }
  }[]
}

export default function ProfileContent({ slug }: { slug: string }) {
  const store = useStore()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [email, setEmail] = useState('')
  const [formData, setFormData] = useState({
    full_name: '', username: '', contact: '', location: '', shipping_address: ''
  })
  // Shipping payment confirmation state per order
  const [paymentForms, setPaymentForms] = useState<
    Record<string, { momoNumber: string; reference: string }>
  >({})
  const [paymentLoading, setPaymentLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Still loading auth — wait
    if (store.loading) return

    // Auth resolved but no customer logged in — stop loading and redirect
    if (!store.customerId) {
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', store.customerId)
        .single()

      const { data: { user } } = await supabase.auth.getUser()

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

      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          id, total, status, created_at,
          shipping_fee, shipping_paid, shipping_note,
          payment_reference, momo_number,
          order_items (
            id, quantity,
            products ( name, price )
          )
        `)
        .eq('customer_id', store.customerId)
        .order('created_at', { ascending: false })

      setOrders(orderData || [])
      setLoading(false)
    }

    fetchProfile()
  }, [store.customerId, store.loading])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('customers')
      .update(formData)
      .eq('id', store.customerId!)
    if (error) {
      toast.error('Failed to update profile')
    } else {
      toast.success('Profile updated!')
      setIsEditing(false)
      setProfile((prev: any) => ({ ...prev, ...formData }))
    }
    setSaving(false)
  }

  const handleConfirmPayment = async (orderId: string) => {
    const form = paymentForms[orderId]
    if (!form?.momoNumber || !form?.reference) {
      toast.error('Please enter your MoMo number and payment reference')
      return
    }
    setPaymentLoading((prev) => ({ ...prev, [orderId]: true }))
    const result = await customerConfirmShippingPaymentAction(
      orderId,
      form.momoNumber,
      form.reference
    )
    setPaymentLoading((prev) => ({ ...prev, [orderId]: false }))
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Payment confirmed! The importer will verify and release your order.')
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'shipping_paid' } : o
        )
      )
    }
  }

  const fmt = (n: number) => n.toLocaleString('en-GH', { maximumFractionDigits: 0 })
  const n = (v: any) => parseFloat(String(v || 0)) || 0

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    arrived: 'bg-purple-100 text-purple-700',
    shipping_billed: 'bg-orange-100 text-orange-700',
    shipping_paid: 'bg-green-100 text-green-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Not logged in
  if (!store.customerId) {
    if (typeof window !== 'undefined') {
      window.location.href = `/store/${slug}/login?redirect=/store/${slug}/profile`
    }
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href={`/store/${slug}`} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {profile?.full_name || profile?.username || 'Customer'}
                  </h2>
                  <p className="text-sm text-gray-500">{email}</p>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
              )}
            </div>

            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Full Name', value: profile?.full_name, icon: User },
                  { label: 'Username', value: profile?.username, icon: User },
                  { label: 'Contact', value: profile?.contact, icon: Phone },
                  { label: 'Location', value: profile?.location, icon: MapPin },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-medium text-gray-900">{value || 'Not set'}</p>
                    </div>
                  </div>
                ))}
                <div className="md:col-span-2 flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Shipping Address</p>
                    <p className="text-sm font-medium text-gray-900">
                      {profile?.shipping_address || 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ))}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
                    <textarea
                      value={formData.shipping_address}
                      onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                      placeholder="123 Street, Accra"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">My Orders</h2>
                <p className="text-sm text-gray-500">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No orders yet</p>
              <Link href={`/store/${slug}`} className="mt-3 inline-block text-blue-600 hover:text-blue-700 font-medium text-sm">
                Start shopping →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map((order) => {
                const status = order.status?.toLowerCase() || 'pending'
                const productTotal = n(order.total)
                const shippingFee = n(order.shipping_fee)
                const grandTotal = productTotal + shippingFee
                const needsPayment = status === 'shipping_billed'
                const paymentConfirmed = status === 'shipping_paid'
                const form = paymentForms[order.id] || { momoNumber: '', reference: '' }

                return (
                  <div key={order.id} className="p-6">
                    {/* Order header */}
                    <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                      <div>
                        <p className="font-bold text-gray-900 font-mono">
                          #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleDateString('en', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColor[status] || 'bg-gray-100 text-gray-600'}`}>
                        {status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
                      {order.order_items?.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.products?.name} × {item.quantity}</span>
                          <span className="font-medium">GH₵{fmt(n(item.products?.price) * item.quantity)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                        <span className="font-medium text-gray-700">Product Total</span>
                        <span className="font-bold">GH₵{fmt(productTotal)}</span>
                      </div>
                      {shippingFee > 0 && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-orange-600 flex items-center gap-1">
                              <Truck className="h-3 w-3" /> Shipping Fee
                            </span>
                            <span className="font-bold text-orange-600">GH₵{fmt(shippingFee)}</span>
                          </div>
                          <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
                            <span className="font-bold text-gray-900">Grand Total</span>
                            <span className="font-bold text-gray-900">GH₵{fmt(grandTotal)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* SHIPPING BILLED — customer needs to pay */}
                    {needsPayment && (
                      <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-4 space-y-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-bold text-orange-700 text-sm">
                              Shipping fee due — GH₵{fmt(shippingFee)}
                            </p>
                            <p className="text-xs text-orange-600 mt-0.5">
                              Your items have arrived! Please pay the shipping fee via MoMo to receive your order.
                            </p>
                            {order.shipping_note && (
                              <p className="text-xs text-gray-600 mt-1 bg-white rounded-lg px-3 py-1.5">
                                📝 {order.shipping_note}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-gray-700 mb-1 block">
                              Your MoMo Number
                            </label>
                            <input
                              type="tel"
                              placeholder="e.g. 0551234567"
                              value={form.momoNumber}
                              onChange={(e) =>
                                setPaymentForms((prev) => ({
                                  ...prev,
                                  [order.id]: { ...form, momoNumber: e.target.value },
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-orange-300 bg-white text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-700 mb-1 block">
                              MoMo Transaction Reference
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. A123456789"
                              value={form.reference}
                              onChange={(e) =>
                                setPaymentForms((prev) => ({
                                  ...prev,
                                  [order.id]: { ...form, reference: e.target.value },
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-orange-300 bg-white text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                            />
                          </div>
                          <button
                            disabled={paymentLoading[order.id]}
                            onClick={() => handleConfirmPayment(order.id)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-all disabled:opacity-50"
                          >
                            {paymentLoading[order.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <DollarSign className="h-4 w-4" />
                            )}
                            I've Sent the Payment
                          </button>
                        </div>
                      </div>
                    )}

                    {/* SHIPPING PAID — waiting for importer to verify */}
                    {paymentConfirmed && (
                      <div className="rounded-xl border border-green-300 bg-green-50 p-4 flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-green-700 text-sm">Payment submitted!</p>
                          <p className="text-xs text-green-600 mt-0.5">
                            Your MoMo payment is being verified. You'll receive your order once confirmed.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}