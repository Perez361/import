'use client'

import { useState } from 'react'
import {
  ChevronDown, ChevronUp, Package, Phone, MessageCircle,
  DollarSign, CheckCircle2, Clock, Truck, XCircle,
  PackageCheck, AlertCircle, Send, Loader2, CreditCard
} from 'lucide-react'
import { toast } from 'sonner'
import {
  billShippingAction,
  markShippingPaidAction,
  updateOrderStatusAction,
  markProductPaidAction,
} from './actions'

interface Order {
  id: string
  total: number | string
  status: string
  created_at: string
  shipping_fee?: number | null
  shipping_paid?: boolean
  product_paid?: boolean
  product_payment_reference?: string | null
  shipping_billed_at?: string | null
  shipping_paid_at?: string | null
  shipping_note?: string | null
  payment_reference?: string | null
  momo_number?: string | null
  customers?: any
  order_items?: any[]
}

interface Props {
  orders: Order[]
  importerPhone: string
  storeSlug: string
}

// Full status flow with labels, colors, icons
const STATUS_CONFIG: Record<string, { label: string; classes: string; icon: React.ReactNode; step: number }> = {
  pending:         { label: 'Pending',         classes: 'bg-gray-100 text-gray-600',                                  icon: <Clock className="h-3 w-3" />,       step: 1 },
  product_paid:    { label: 'Product Paid',    classes: 'bg-blue-100 text-blue-700',                                  icon: <CreditCard className="h-3 w-3" />,   step: 2 },
  processing:      { label: 'Processing',      classes: 'bg-[var(--color-brand-light)] text-[var(--color-brand)]',   icon: <Package className="h-3 w-3" />,     step: 3 },
  arrived:         { label: 'Arrived',         classes: 'bg-purple-100 text-purple-600',                              icon: <Truck className="h-3 w-3" />,        step: 4 },
  shipping_billed: { label: 'Shipping Billed', classes: 'bg-orange-100 text-orange-600',                              icon: <DollarSign className="h-3 w-3" />,   step: 5 },
  shipping_paid:   { label: 'Shipping Paid',   classes: 'bg-[var(--color-success-light)] text-[var(--color-success)]', icon: <CheckCircle2 className="h-3 w-3" />, step: 6 },
  delivered:       { label: 'Delivered',       classes: 'bg-[var(--color-success-light)] text-[var(--color-success)]', icon: <PackageCheck className="h-3 w-3" />, step: 7 },
  cancelled:       { label: 'Cancelled',       classes: 'bg-[var(--color-danger-light)] text-[var(--color-danger)]', icon: <XCircle className="h-3 w-3" />,      step: 0 },
}

const STATUS_FLOW = ['pending', 'product_paid', 'processing', 'arrived', 'shipping_billed', 'shipping_paid', 'delivered']

// Payment flow steps for progress indicator
const PAYMENT_STEPS = [
  { key: 'pending',         label: 'Order placed' },
  { key: 'product_paid',   label: 'Product paid' },
  { key: 'processing',      label: 'Processing' },
  { key: 'arrived',         label: 'Arrived' },
  { key: 'shipping_billed', label: 'Shipping billed' },
  { key: 'shipping_paid',   label: 'Shipping paid' },
  { key: 'delivered',       label: 'Delivered' },
]

function fmt(v: number) { return v.toLocaleString('en-GH', { maximumFractionDigits: 0 }) }
function n(v: any) { return parseFloat(String(v || 0)) || 0 }
function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

type CustomerShape = { id?: string; full_name?: string; username?: string; contact?: string; email?: string } | null
function getCustomer(customers: any): CustomerShape {
  if (!customers) return null
  return Array.isArray(customers) ? (customers[0] ?? null) : customers
}

export default function OrdersTable({ orders, importerPhone, storeSlug }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [shippingFees, setShippingFees] = useState<Record<string, string>>({})
  const [shippingNotes, setShippingNotes] = useState<Record<string, string>>({})
  const [productRefs, setProductRefs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [localOrders, setLocalOrders] = useState<Order[]>(orders)

  const setLoad = (key: string, val: boolean) => setLoading(p => ({ ...p, [key]: val }))
  const updateLocal = (id: string, patch: Partial<Order>) =>
    setLocalOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o))

  // ── Mark product paid ─────────────────────────────────────────────────────
  const handleMarkProductPaid = async (order: Order) => {
    setLoad(order.id + '_ppaid', true)
    const result: any = await markProductPaidAction(order.id, productRefs[order.id])
    setLoad(order.id + '_ppaid', false)
    if (result?.error) { toast.error(result.error); return }
    updateLocal(order.id, {
      product_paid: true,
      status: 'product_paid',
      product_payment_reference: productRefs[order.id] || null,
    })
    toast.success('Product payment confirmed!')
  }

  // ── Bill shipping ─────────────────────────────────────────────────────────
  const handleBillShipping = async (order: Order) => {
    const fee = parseFloat(shippingFees[order.id] || '0')
    if (!fee || fee <= 0) { toast.error('Enter a valid shipping fee'); return }
    setLoad(order.id, true)
    const result: any = await billShippingAction(order.id, fee, shippingNotes[order.id])
    setLoad(order.id, false)
    if (result?.error) { toast.error(result.error); return }
    updateLocal(order.id, {
      shipping_fee: fee,
      shipping_note: shippingNotes[order.id] || null,
      status: 'shipping_billed',
      shipping_billed_at: new Date().toISOString(),
    })
    toast.success('Shipping fee billed!')
  }

  // ── Mark shipping paid ────────────────────────────────────────────────────
  const handleMarkShippingPaid = async (order: Order) => {
    setLoad(order.id + '_spaid', true)
    const result: any = await markShippingPaidAction(order.id)
    setLoad(order.id + '_spaid', false)
    if (result?.error) { toast.error(result.error); return }
    updateLocal(order.id, { shipping_paid: true, status: 'delivered' })
    toast.success('Order marked as delivered!')
  }

  // ── Update status manually ────────────────────────────────────────────────
  const handleStatusChange = async (order: Order, newStatus: string) => {
    setLoad(order.id + '_status', true)
    const result: any = await updateOrderStatusAction(order.id, newStatus)
    setLoad(order.id + '_status', false)
    if (result?.error) { toast.error(result.error); return }
    updateLocal(order.id, { status: newStatus })
    toast.success(`Status → ${newStatus.replace(/_/g, ' ')}`)
  }

  // ── WhatsApp shipping bill ────────────────────────────────────────────────
  const whatsappLink = (order: Order) => {
    const customer = getCustomer(order.customers)
    const contact = customer?.contact?.replace(/\D/g, '') || ''
    const name = customer?.full_name || customer?.username || 'Customer'
    const productTotal = n(order.total)
    const shippingFee = n(order.shipping_fee)
    const grandTotal = productTotal + shippingFee
    const items = order.order_items?.map((i: any) => `• ${i.products?.name || 'Item'} x${i.quantity}`).join('\n') || ''
    const message = encodeURIComponent(
      `Hello ${name}! 👋\n\nYour items have arrived! Here's your shipping bill:\n\n` +
      `📦 *Order #${order.id.slice(-8).toUpperCase()}*\n${items}\n\n` +
      `✅ Product Total (already paid): GH₵${fmt(productTotal)}\n` +
      `🚚 Shipping Fee due: *GH₵${fmt(shippingFee)}*\n` +
      (order.shipping_note ? `📝 ${order.shipping_note}\n\n` : '\n') +
      `Please send GH₵${fmt(shippingFee)} via MoMo to receive your order. Thank you! 🙏`
    )
    return `https://wa.me/${contact}?text=${message}`
  }

  return (
    <div className="divide-y divide-[var(--color-border)]">
      {localOrders.map((order) => {
        const customer = getCustomer(order.customers)
        const customerName = customer?.full_name || customer?.username || 'Unknown'
        const status = order.status?.toLowerCase() || 'pending'
        const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG['pending']
        const productTotal = n(order.total)
        const shippingFee = n(order.shipping_fee)
        const grandTotal = productTotal + shippingFee
        const isExpanded = expanded === order.id
        const items = order.order_items || []
        const currentStep = statusCfg.step

        return (
          <div key={order.id}>
            {/* ── Row ── */}
            <div
              className="px-4 py-4 sm:px-6 cursor-pointer hover:bg-[var(--color-surface)] transition-colors"
              onClick={() => setExpanded(isExpanded ? null : order.id)}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-bold text-[var(--color-text-primary)]">
                    #{order.id.slice(-8).toUpperCase()}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.classes}`}>
                    {statusCfg.icon} {statusCfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-muted)]">{timeAgo(order.created_at)}</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-[var(--color-text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{customerName}</p>
                  {customer?.contact && (
                    <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" />{customer.contact}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">
                    GH₵{fmt(productTotal)}
                    {order.product_paid && <span className="ml-1 text-xs text-[var(--color-success)]">✓ paid</span>}
                  </p>
                  {shippingFee > 0 && (
                    <p className="text-xs text-orange-600 font-medium tabular-nums">
                      +GH₵{fmt(shippingFee)} shipping
                      {order.shipping_paid && <span className="ml-1">✓</span>}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Expanded panel ── */}
            {isExpanded && (
              <div className="px-4 pb-5 sm:px-6 space-y-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">

                {/* Payment flow progress */}
                <div className="pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-3">
                    Payment Flow
                  </p>
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {PAYMENT_STEPS.map((step, i) => {
                      const stepNum = STATUS_CONFIG[step.key]?.step ?? 0
                      const isDone = stepNum < currentStep
                      const isActive = step.key === status

                      return (
                        <div key={step.key} className="flex items-center gap-1 shrink-0">
                          <div className={`flex flex-col items-center gap-0.5`}>
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                              isDone ? 'bg-[var(--color-success)] text-white' :
                              isActive ? 'bg-[var(--color-brand)] text-white ring-2 ring-[var(--color-brand)] ring-offset-1' :
                              'bg-gray-100 text-gray-400'
                            }`}>
                              {isDone ? '✓' : i + 1}
                            </div>
                            <span className={`text-[9px] font-medium text-center leading-tight max-w-[48px] ${
                              isActive ? 'text-[var(--color-brand)]' : isDone ? 'text-[var(--color-success)]' : 'text-gray-400'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                          {i < PAYMENT_STEPS.length - 1 && (
                            <div className={`h-0.5 w-4 rounded mb-4 shrink-0 ${isDone ? 'bg-[var(--color-success)]' : 'bg-gray-200'}`} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Items */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">Items</p>
                  <div className="space-y-1.5 bg-[var(--color-card)] rounded-xl p-3 border border-[var(--color-border)]">
                    {items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-primary)]">{item.products?.name || 'Item'} × {item.quantity}</span>
                        <span className="font-semibold tabular-nums">GH₵{fmt(n(item.price) * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-2 border-t border-[var(--color-border)]">
                      <span className="font-semibold">Product Total</span>
                      <span className="font-bold tabular-nums">GH₵{fmt(productTotal)}</span>
                    </div>
                    {shippingFee > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-orange-600 font-medium">Shipping Fee</span>
                          <span className="font-bold text-orange-600 tabular-nums">GH₵{fmt(shippingFee)}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-1 border-t border-[var(--color-border)]">
                          <span className="font-bold">Grand Total</span>
                          <span className="font-bold tabular-nums">GH₵{fmt(grandTotal)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* ── STEP 1: Confirm product payment received ── */}
                {status === 'pending' && (
                  <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-semibold text-blue-700">Confirm Product Payment Received</p>
                    </div>
                    <p className="text-xs text-blue-600">
                      Once the customer sends <strong>GH₵{fmt(productTotal)}</strong> via MoMo, confirm it here to start processing their order.
                    </p>
                    <div>
                      <label className="text-xs text-[var(--color-text-muted)] mb-1 block">MoMo Reference (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. A123456789"
                        value={productRefs[order.id] || ''}
                        onChange={(e) => setProductRefs(p => ({ ...p, [order.id]: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm font-mono focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                    <button
                      disabled={loading[order.id + '_ppaid']}
                      onClick={(e) => { e.stopPropagation(); handleMarkProductPaid(order) }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {loading[order.id + '_ppaid'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Confirm Payment Received
                    </button>
                  </div>
                )}

                {/* Product payment confirmed banner */}
                {order.product_paid && status !== 'pending' && (
                  <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-2.5 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-blue-700">
                        Product payment received — GH₵{fmt(productTotal)}
                      </p>
                      {order.product_payment_reference && (
                        <p className="text-[10px] text-blue-500 font-mono">Ref: {order.product_payment_reference}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Bill shipping (when arrived) ── */}
                {(status === 'arrived' || status === 'processing' || status === 'product_paid') && (
                  <div className="rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-orange-600" />
                      <p className="text-sm font-semibold text-orange-700">
                        {status === 'arrived' ? 'Items Arrived — Bill Shipping Fee' : 'Bill Shipping Fee'}
                      </p>
                    </div>
                    <p className="text-xs text-orange-600">
                      Customer already paid <strong>GH₵{fmt(productTotal)}</strong> for the product.
                      Now enter the shipping fee for this order.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Shipping fee (GH₵) *</label>
                        <input
                          type="number" step="0.01" min="0" placeholder="e.g. 50"
                          value={shippingFees[order.id] || ''}
                          onChange={(e) => setShippingFees(p => ({ ...p, [order.id]: e.target.value }))}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Note to customer</label>
                        <input
                          type="text" placeholder="e.g. Send to 0551234567"
                          value={shippingNotes[order.id] || ''}
                          onChange={(e) => setShippingNotes(p => ({ ...p, [order.id]: e.target.value }))}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={loading[order.id]}
                        onClick={(e) => { e.stopPropagation(); handleBillShipping(order) }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-50"
                      >
                        {loading[order.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Bill Customer
                      </button>
                      {customer?.contact && shippingFees[order.id] && (
                        <a
                          href={whatsappLink({ ...order, shipping_fee: parseFloat(shippingFees[order.id] || '0') })}
                          target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold"
                        >
                          <MessageCircle className="h-4 w-4" /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Awaiting shipping payment */}
                {status === 'shipping_billed' && (
                  <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <p className="text-sm font-semibold text-orange-700">Awaiting shipping payment</p>
                      </div>
                      {customer?.contact && (
                        <a
                          href={whatsappLink(order)} target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold"
                        >
                          <MessageCircle className="h-3 w-3" /> Resend
                        </a>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><p className="text-xs text-[var(--color-text-muted)]">Product (paid)</p><p className="font-semibold text-[var(--color-success)] tabular-nums">GH₵{fmt(productTotal)} ✓</p></div>
                      <div><p className="text-xs text-[var(--color-text-muted)]">Shipping due</p><p className="font-bold text-orange-600 tabular-nums">GH₵{fmt(shippingFee)}</p></div>
                    </div>
                    {order.shipping_note && <p className="text-xs text-[var(--color-text-muted)]">Note: {order.shipping_note}</p>}
                  </div>
                )}

                {/* Shipping paid — verify */}
                {status === 'shipping_paid' && (
                  <div className="rounded-xl border border-[var(--color-success)] bg-[var(--color-success-light)] p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
                      <p className="text-sm font-semibold text-[var(--color-success)]">Customer confirmed shipping payment</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div><p className="text-xs text-[var(--color-text-muted)]">MoMo Number</p><p className="font-semibold">{order.momo_number || '—'}</p></div>
                      <div><p className="text-xs text-[var(--color-text-muted)]">Reference</p><p className="font-semibold font-mono">{order.payment_reference || '—'}</p></div>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Verify GH₵{fmt(shippingFee)} MoMo payment, then mark as delivered.
                    </p>
                    <button
                      disabled={loading[order.id + '_spaid']}
                      onClick={(e) => { e.stopPropagation(); handleMarkShippingPaid(order) }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-success)] text-white text-sm font-semibold disabled:opacity-50"
                    >
                      {loading[order.id + '_spaid'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
                      Confirm & Mark Delivered
                    </button>
                  </div>
                )}

                {/* Delivered */}
                {status === 'delivered' && (
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <PackageCheck className="h-4 w-4 text-[var(--color-success)]" />
                      <p className="text-sm font-semibold text-[var(--color-success)]">Order fully completed</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div><p className="text-xs text-[var(--color-text-muted)]">Product</p><p className="font-semibold tabular-nums">GH₵{fmt(productTotal)}</p></div>
                      <div><p className="text-xs text-[var(--color-text-muted)]">Shipping</p><p className="font-semibold tabular-nums">GH₵{fmt(shippingFee)}</p></div>
                      <div><p className="text-xs text-[var(--color-text-muted)]">Total received</p><p className="font-bold text-[var(--color-success)] tabular-nums">GH₵{fmt(grandTotal)}</p></div>
                    </div>
                  </div>
                )}

                {/* Manual status override */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
                    Move to status
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_FLOW.filter(s => s !== status).map(s => (
                      <button
                        key={s}
                        disabled={loading[order.id + '_status']}
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(order, s) }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)] transition-all disabled:opacity-50"
                      >
                        → {s.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}