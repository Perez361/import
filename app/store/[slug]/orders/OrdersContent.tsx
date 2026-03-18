'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Clock, Truck, AlertCircle, CheckCircle2,
  DollarSign, Loader2, ShoppingBag, Package, Receipt,
  ChevronDown, ChevronUp, XCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/components/store/StoreContext'
import { toast } from 'sonner'
import { customerConfirmShippingPaymentAction } from '@/app/dashboard/orders/actions'
import { cancelOrderAction } from './actions'

interface OrderItem {
  id: string
  quantity: number
  products: { name: string; price: number; image_url?: string | null }
}

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
  order_items: OrderItem[]
}

interface MonthInvoice {
  key: string
  label: string
  orders: Order[]
}

const STATUS_COLOR: Record<string, string> = {
  pending:         'bg-yellow-100 text-yellow-700',
  product_paid:    'bg-blue-100 text-blue-700',
  processing:      'bg-indigo-100 text-indigo-700',
  arrived:         'bg-purple-100 text-purple-700',
  shipping_billed: 'bg-orange-100 text-orange-700',
  shipping_paid:   'bg-green-100 text-green-700',
  delivered:       'bg-emerald-100 text-emerald-700',
  cancelled:       'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  pending:         'Pending',
  product_paid:    'Product Paid',
  processing:      'Processing',
  arrived:         'Arrived',
  shipping_billed: 'Shipping Due',
  shipping_paid:   'Shipping Paid',
  delivered:       'Delivered',
  cancelled:       'Cancelled',
}

function monthKey(d: string) {
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('en', { month: 'long', year: 'numeric' })
}

const fmt = (n: number) => n.toLocaleString('en-GH', { maximumFractionDigits: 0 })
const nv = (v: any) => parseFloat(String(v || 0)) || 0

// ── Single order card ─────────────────────────────────────────────────────────

function OrderCard({ order, slug, onUpdate }: {
  order: Order
  slug: string
  onUpdate: (id: string, patch: Partial<Order>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [form, setForm] = useState({ momoNumber: order.momo_number || '', reference: order.payment_reference || '' })
  const [paying, setPaying] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const status = order.status?.toLowerCase() || 'pending'
  const productTotal = nv(order.total)
  const shippingFee = nv(order.shipping_fee)
  const grandTotal = productTotal + shippingFee
  const isPending = status === 'pending'
  const needsShippingPayment = status === 'shipping_billed'
  const paymentSubmitted = status === 'shipping_paid'

  const handlePay = async () => {
    if (!form.momoNumber || !form.reference) {
      toast.error('Enter your MoMo number and transaction reference')
      return
    }
    setPaying(true)
    const result = await customerConfirmShippingPaymentAction(order.id, form.momoNumber, form.reference)
    setPaying(false)
    if (result?.error) { toast.error(result.error); return }
    toast.success('Payment submitted! The importer will verify and deliver your order.')
    onUpdate(order.id, { status: 'shipping_paid', momo_number: form.momoNumber, payment_reference: form.reference })
  }

  const handleCancel = async () => {
    setCancelling(true)
    const result = await cancelOrderAction(order.id)
    setCancelling(false)
    if (result?.error) { toast.error(result.error); return }
    toast.success('Order cancelled.')
    onUpdate(order.id, { status: 'cancelled' })
    setShowCancelConfirm(false)
    setExpanded(false)

    // Notify importer via WhatsApp
    if ((result as any).whatsappUrl) {
      window.open((result as any).whatsappUrl, '_blank')
    }
  }

  return (
    <div className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-card)]">

      {/* Order summary row */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--color-surface)] transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
            <Package className="h-4 w-4 text-[var(--color-text-muted)]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--color-text-primary)] font-mono">
              #{order.id.slice(-8).toUpperCase()}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {order.order_items.map(i => `${i.products?.name} ×${i.quantity}`).join(', ')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">GH₵{fmt(grandTotal)}</p>
            {shippingFee > 0 && <p className="text-xs text-orange-600">+GH₵{fmt(shippingFee)} shipping</p>}
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[status] || 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABEL[status] || status.replace(/_/g, ' ')}
          </span>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-[var(--color-text-muted)]" />
            : <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[var(--color-border)] px-4 py-4 space-y-4 bg-[var(--color-surface)]">

          {/* ── Items breakdown with thumbnails ── */}
          <div className="rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] overflow-hidden">
            {order.order_items.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-2.5 ${
                  i < order.order_items.length - 1 ? 'border-b border-[var(--color-border)]' : ''
                }`}
              >
                {/* Thumbnail */}
                <div className="h-10 w-10 rounded-lg overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] shrink-0">
                  {item.products?.image_url ? (
                    <img
                      src={item.products.image_url}
                      alt={item.products.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-4 w-4 text-[var(--color-text-muted)]" />
                    </div>
                  )}
                </div>

                {/* Name + qty */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {item.products?.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">Qty: {item.quantity}</p>
                </div>

                {/* Price */}
                <span className="text-sm font-semibold tabular-nums text-[var(--color-text-primary)] shrink-0">
                  GH₵{fmt(nv(item.products?.price) * item.quantity)}
                </span>
              </div>
            ))}

            {/* Totals footer */}
            <div className="px-3 py-2.5 bg-[var(--color-surface)] border-t border-[var(--color-border)] space-y-1.5 text-sm">
              <div className="flex justify-between text-[var(--color-text-muted)]">
                <span>Product Total</span>
                <span className="tabular-nums font-medium">GH₵{fmt(productTotal)}</span>
              </div>
              {shippingFee > 0 && (
                <div className="flex justify-between text-orange-600 font-semibold">
                  <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Shipping Fee</span>
                  <span className="tabular-nums">GH₵{fmt(shippingFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-[var(--color-border)] pt-1.5">
                <span>Grand Total</span>
                <span className="tabular-nums text-[var(--color-success)]">GH₵{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* ── Pending: awaiting product payment + cancel option ── */}
          {isPending && (
            <div className="space-y-3">
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 flex items-start gap-2">
                <Clock className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <p className="text-sm text-yellow-700">
                  Awaiting product payment. The importer will process your order once payment is confirmed.
                </p>
              </div>

              {/* Cancel section */}
              {!showCancelConfirm ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Cancel this order
                </button>
              ) : (
                <div className="rounded-xl border-2 border-red-200 bg-red-50 p-3 space-y-3">
                  <p className="text-sm font-semibold text-red-700">Cancel this order?</p>
                  <p className="text-xs text-red-600">This cannot be undone. Your order will be marked as cancelled.</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                      Yes, cancel order
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      Keep order
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Shipping payment form ── */}
          {needsShippingPayment && (
            <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-orange-700 text-sm">Shipping fee due — GH₵{fmt(shippingFee)}</p>
                  <p className="text-xs text-orange-600 mt-0.5">Your items have arrived! Pay the shipping fee via MoMo to receive your order.</p>
                  {order.shipping_note && (
                    <p className="text-xs text-gray-700 mt-1 bg-white rounded-lg px-3 py-1.5 border border-orange-200">📝 {order.shipping_note}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Your MoMo Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 0551234567"
                    value={form.momoNumber}
                    onChange={e => setForm(p => ({ ...p, momoNumber: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-orange-200 bg-white text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">MoMo Transaction Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. ABC123456"
                    value={form.reference}
                    onChange={e => setForm(p => ({ ...p, reference: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-orange-200 bg-white text-sm font-mono focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                  Submit Shipping Payment
                </button>
              </div>
            </div>
          )}

          {/* ── Payment submitted ── */}
          {paymentSubmitted && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-700">Payment submitted</p>
                <p className="text-xs text-green-600 mt-0.5">The importer will verify your payment and arrange delivery.</p>
              </div>
            </div>
          )}

          {/* ── Delivered ── */}
          {status === 'delivered' && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-700">Order delivered — enjoy your items! 🎉</p>
            </div>
          )}

          {/* ── Cancelled ── */}
          {status === 'cancelled' && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-600">Order cancelled</p>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

// ── Month invoice card ────────────────────────────────────────────────────────

function MonthInvoiceCard({ invoice, slug, onUpdate }: {
  invoice: MonthInvoice
  slug: string
  onUpdate: (id: string, patch: Partial<Order>) => void
}) {
  const [open, setOpen] = useState(true)
  const [orders, setOrders] = useState(invoice.orders)

  const onUpdate2 = (id: string, patch: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o))
    onUpdate(id, patch)
  }

  const totalProducts = orders.reduce((s, o) => s + nv(o.total), 0)
  const totalShipping = orders.reduce((s, o) => s + nv(o.shipping_fee), 0)
  const grandTotal = totalProducts + totalShipping

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <Receipt className="h-5 w-5 text-blue-500 shrink-0" />
          <div>
            <p className="font-bold text-gray-900">{invoice.label}</p>
            <p className="text-xs text-gray-500">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <p className="text-sm font-bold text-gray-900 tabular-nums">GH₵{fmt(grandTotal)}</p>
          {open
            ? <ChevronUp className="h-4 w-4 text-[var(--color-text-muted)]" />
            : <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--color-border)] p-4 space-y-3">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} slug={slug} onUpdate={onUpdate2} />
          ))}
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-3 text-sm space-y-1.5">
            <div className="flex justify-between text-[var(--color-text-muted)]">
              <span>Products total</span>
              <span className="tabular-nums font-medium">GH₵{fmt(totalProducts)}</span>
            </div>
            {totalShipping > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>Shipping total</span>
                <span className="tabular-nums font-medium">GH₵{fmt(totalShipping)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t border-[var(--color-border)] pt-1.5">
              <span>Grand Total</span>
              <span className="tabular-nums text-[var(--color-success)]">GH₵{fmt(grandTotal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function OrdersContent({ slug }: { slug: string }) {
  const store = useStore()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])

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
          products ( name, price, image_url )
        )
      `)
      .eq('customer_id', store.customerId)
      .order('created_at', { ascending: false })
      .then(({ data }: any) => {
        if (cancelled) return
        setOrders(data || [])
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [store.loading, store.customerId])

  const updateOrder = (id: string, patch: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o))
  }

  // Group by month
  const invoiceMap = new Map<string, MonthInvoice>()
  for (const order of orders) {
    const key = monthKey(order.created_at)
    if (!invoiceMap.has(key)) {
      invoiceMap.set(key, { key, label: monthLabel(key), orders: [] })
    }
    invoiceMap.get(key)!.orders.push(order)
  }
  const invoices = Array.from(invoiceMap.values())

  // Auth guard
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
      <div className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center gap-3">
            <Link href={`/store/${slug}`} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
              <p className="text-sm text-gray-500">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} · {orders.length} order{orders.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {invoices.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No orders yet</p>
            <Link href={`/store/${slug}`} className="mt-3 inline-block text-blue-600 font-medium text-sm">
              Start shopping →
            </Link>
          </div>
        ) : (
          invoices.map(invoice => (
            <MonthInvoiceCard
              key={invoice.key}
              invoice={invoice}
              slug={slug}
              onUpdate={updateOrder}
            />
          ))
        )}
      </div>
    </div>
  )
}