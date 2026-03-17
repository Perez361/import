'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Package, ArrowLeft, Clock, Truck, AlertCircle,
  CheckCircle2, DollarSign, Loader2, ShoppingBag,
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

export default function OrdersContent({ slug }: { slug: string }) {
  const store = useStore()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [paymentForms, setPaymentForms] = useState<
    Record<string, { momoNumber: string; reference: string }>
  >({})
  const [paymentLoading, setPaymentLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (store.loading) return
    if (!store.customerId) { setLoading(false); return }

    let cancelled = false
    const supabase = createClient()

    supabase
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
      .then(({ data }: { data: Order[] | null }) => {
        if (cancelled) return
        setOrders(data || [])
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [store.loading, store.customerId])

  const handleConfirmPayment = async (orderId: string) => {
    const form = paymentForms[orderId]
    if (!form?.momoNumber || !form?.reference) {
      toast.error('Please enter your MoMo number and payment reference')
      return
    }
    setPaymentLoading((p) => ({ ...p, [orderId]: true }))
    const result = await customerConfirmShippingPaymentAction(
      orderId, form.momoNumber, form.reference
    )
    setPaymentLoading((p) => ({ ...p, [orderId]: false }))
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Payment confirmed! The importer will verify and release your order.')
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, status: 'shipping_paid' } : o)
      )
    }
  }

  const fmt = (n: number) => n.toLocaleString('en-GH', { maximumFractionDigits: 0 })
  const n = (v: any) => parseFloat(String(v || 0)) || 0

  // ── Auth guard ──────────────────────────────────────────────────────────────
  if (!store.loading && !store.customerId) {
    if (typeof window !== 'undefined') {
      window.location.href = `/store/${slug}/login?redirect=/store/${slug}/orders`
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
            <Link
              href={`/store/${slug}`}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
              <p className="text-sm text-gray-500">
                {orders.length} order{orders.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No orders yet</p>
            <Link
              href={`/store/${slug}`}
              className="mt-3 inline-block text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Start shopping →
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const status = order.status?.toLowerCase() || 'pending'
            const productTotal = n(order.total)
            const shippingFee = n(order.shipping_fee)
            const grandTotal = productTotal + shippingFee
            const needsPayment = status === 'shipping_billed'
            const paymentConfirmed = status === 'shipping_paid'
            const form = paymentForms[order.id] || { momoNumber: '', reference: '' }

            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Order header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div>
                    <p className="font-bold text-gray-900 font-mono text-sm">
                      #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {new Date(order.created_at).toLocaleDateString('en', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[status] || 'bg-gray-100 text-gray-600'}`}
                  >
                    {STATUS_LABEL[status] || status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Items */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    {order.order_items?.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.products?.name} × {item.quantity}
                        </span>
                        <span className="font-medium">
                          GH₵{fmt(n(item.products?.price) * item.quantity)}
                        </span>
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

                  {/* Shipping payment form */}
                  {needsPayment && (
                    <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-orange-700 text-sm">
                            Shipping fee due — GH₵{fmt(shippingFee)}
                          </p>
                          <p className="text-xs text-orange-600 mt-0.5">
                            Your items have arrived! Pay the shipping fee via MoMo to receive your order.
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
                              setPaymentForms((p) => ({
                                ...p,
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
                              setPaymentForms((p) => ({
                                ...p,
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

                  {/* Payment confirmed */}
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
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}