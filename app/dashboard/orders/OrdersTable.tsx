'use client'

import { useState } from 'react'
import {
  ChevronDown, ChevronUp, Package, Phone, MessageCircle,
  DollarSign, CheckCircle2, Clock, Truck, XCircle,
  PackageCheck, AlertCircle, Send, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import {
  billShippingAction,
  markShippingPaidAction,
  updateOrderStatusAction,
} from './actions'

interface Order {
  id: string
  total: number | string
  status: string
  created_at: string
  shipping_fee?: number | null
  shipping_paid?: boolean
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

const STATUS_CONFIG: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    classes: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
    icon: <Clock className="h-3 w-3" />,
  },
  processing: {
    label: 'Processing',
    classes: 'bg-[var(--color-brand-light)] text-[var(--color-brand)]',
    icon: <Package className="h-3 w-3" />,
  },
  arrived: {
    label: 'Arrived',
    classes: 'bg-purple-100 text-purple-600',
    icon: <Truck className="h-3 w-3" />,
  },
  shipping_billed: {
    label: 'Shipping Billed',
    classes: 'bg-orange-100 text-orange-600',
    icon: <DollarSign className="h-3 w-3" />,
  },
  shipping_paid: {
    label: 'Shipping Paid',
    classes: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  delivered: {
    label: 'Delivered',
    classes: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
    icon: <PackageCheck className="h-3 w-3" />,
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-[var(--color-danger-light)] text-[var(--color-danger)]',
    icon: <XCircle className="h-3 w-3" />,
  },
}

const STATUS_FLOW = ['pending', 'processing', 'arrived', 'shipping_billed', 'shipping_paid', 'delivered']

function fmt(v: number) {
  return v.toLocaleString('en-GH', { maximumFractionDigits: 0 })
}

function n(v: any) {
  return parseFloat(String(v || 0)) || 0
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

type CustomerShape = {
  id?: string
  full_name?: string
  username?: string
  contact?: string
  email?: string
} | null

// Supabase can return joined rows as array or object depending on relation type
function getCustomer(customers: any): CustomerShape {
  if (!customers) return null
  return Array.isArray(customers) ? (customers[0] ?? null) : customers
}

export default function OrdersTable({ orders, importerPhone, storeSlug }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [shippingFees, setShippingFees] = useState<Record<string, string>>({})
  const [shippingNotes, setShippingNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [localOrders, setLocalOrders] = useState<Order[]>(orders)

  const setLoad = (id: string, val: boolean) =>
    setLoading((prev) => ({ ...prev, [id]: val }))

  const updateLocal = (id: string, patch: Partial<Order>) =>
    setLocalOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))

  const handleBillShipping = async (order: Order) => {
    const fee = parseFloat(shippingFees[order.id] || '0')
    if (!fee || fee <= 0) {
      toast.error('Enter a valid shipping fee')
      return
    }
    setLoad(order.id, true)
    const result = await billShippingAction(order.id, fee, shippingNotes[order.id])
    setLoad(order.id, false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      updateLocal(order.id, {
        shipping_fee: fee,
        shipping_note: shippingNotes[order.id] || null,
        status: 'shipping_billed',
        shipping_billed_at: new Date().toISOString(),
      })
      toast.success('Shipping fee sent to customer!')
    }
  }

  const handleMarkPaid = async (order: Order) => {
    setLoad(order.id + '_paid', true)
    const result = await markShippingPaidAction(order.id)
    setLoad(order.id + '_paid', false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      updateLocal(order.id, {
        shipping_paid: true,
        status: 'delivered',
        shipping_paid_at: new Date().toISOString(),
      })
      toast.success('Order marked as delivered!')
    }
  }

  const handleStatusChange = async (order: Order, newStatus: string) => {
    setLoad(order.id + '_status', true)
    const result = await updateOrderStatusAction(order.id, newStatus)
    setLoad(order.id + '_status', false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      updateLocal(order.id, { status: newStatus })
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`)
    }
  }

  const whatsappLink = (order: Order) => {
    const customer = getCustomer(order.customers)
    const contact = customer?.contact?.replace(/\D/g, '') || ''
    const name = customer?.full_name || customer?.username || 'Customer'
    const productTotal = n(order.total)
    const shippingFee = n(order.shipping_fee)
    const grandTotal = productTotal + shippingFee
    const items =
      order.order_items
        ?.map((i) => `• ${i.products?.name || 'Item'} x${i.quantity}`)
        .join('\n') || ''

    const message = encodeURIComponent(
      `Hello ${name}! 👋\n\nYour pre-order has arrived! Here's your invoice:\n\n` +
      `📦 *Order #${order.id.slice(-8).toUpperCase()}*\n${items}\n\n` +
      `💰 Product Total: GH₵${fmt(productTotal)}\n` +
      `🚚 Shipping Fee: GH₵${fmt(shippingFee)}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `*Total Due: GH₵${fmt(grandTotal)}*\n\n` +
      `Please send GH₵${fmt(shippingFee)} via MoMo to complete delivery.\n` +
      (order.shipping_note ? `📝 Note: ${order.shipping_note}\n\n` : '\n') +
      `Thank you! 🙏`
    )
    return `https://wa.me/${contact}?text=${message}`
  }

  return (
    <div className="divide-y divide-[var(--color-border)]">
      {/* Table header */}
      <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1fr] gap-4 px-6 py-3 bg-[var(--color-surface)]">
        {['Order', 'Customer', 'Product Total', 'Shipping', 'Status', 'Actions'].map((h) => (
          <span key={h} className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {h}
          </span>
        ))}
      </div>

      {localOrders.map((order) => {
        const customer = getCustomer(order.customers)
        const customerName = customer?.full_name || customer?.username || 'Unknown'
        const status = order.status?.toLowerCase() || 'pending'
        const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG['pending']
        const productTotal = n(order.total)
        const shippingFee = n(order.shipping_fee)
        const grandTotal = productTotal + shippingFee
        const isExpanded = expanded === order.id
        const isLoading = loading[order.id]
        const items = order.order_items || []

        return (
          <div key={order.id} className="hover:bg-[var(--color-surface)/50] transition-colors">
            {/* Main row */}
            <div
              className="grid md:grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1fr] gap-4 px-6 py-4 cursor-pointer items-center"
              onClick={() => setExpanded(isExpanded ? null : order.id)}
            >
              {/* Order ID + date */}
              <div>
                <p className="font-mono text-sm font-semibold text-[var(--color-text-primary)]">
                  #{order.id.slice(-8).toUpperCase()}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {timeAgo(order.created_at)}
                </p>
              </div>

              {/* Customer */}
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {customerName}
                </p>
                {customer?.contact && (
                  <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" />
                    {customer.contact}
                  </p>
                )}
              </div>

              {/* Product total */}
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)] tabular-nums">
                  GH₵{fmt(productTotal)}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Shipping fee */}
              <div>
                {shippingFee > 0 ? (
                  <>
                    <p className="text-sm font-semibold text-orange-600 tabular-nums">
                      GH₵{fmt(shippingFee)}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {order.shipping_paid ? '✅ paid' : '⏳ pending'}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-[var(--color-text-muted)]">Not billed</p>
                )}
              </div>

              {/* Status badge */}
              <div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.classes}`}>
                  {statusCfg.icon}
                  {statusCfg.label}
                </span>
                {shippingFee > 0 && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 tabular-nums">
                    Total: GH₵{fmt(grandTotal)}
                  </p>
                )}
              </div>

              {/* Expand toggle */}
              <div className="flex justify-end">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-[var(--color-text-muted)]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
                )}
              </div>
            </div>

            {/* Expanded panel */}
            {isExpanded && (
              <div className="px-6 pb-6 space-y-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">

                {/* Items list */}
                <div className="pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
                    Order Items
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-[var(--color-text-primary)]">
                          {item.products?.name || 'Item'} × {item.quantity}
                        </span>
                        <span className="font-semibold text-[var(--color-text-primary)] tabular-nums">
                          GH₵{fmt(n(item.price) * item.quantity)}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-[var(--color-border)]">
                      <span className="font-semibold text-[var(--color-text-primary)]">Product Total</span>
                      <span className="font-bold text-[var(--color-text-primary)] tabular-nums">
                        GH₵{fmt(productTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status pipeline */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
                    Update Status
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {STATUS_FLOW.filter((s) => s !== status).map((s) => (
                      <button
                        key={s}
                        disabled={loading[order.id + '_status']}
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(order, s) }}
                        className="px-3 py-1 rounded-lg text-xs font-medium border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)] transition-all disabled:opacity-50"
                      >
                        {loading[order.id + '_status'] ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          `→ ${s.replace('_', ' ')}`
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shipping billing panel — show when arrived or not yet billed */}
                {(status === 'arrived' || status === 'processing' || status === 'pending') && (
                  <div className="rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-orange-600" />
                      <p className="text-sm font-semibold text-orange-700">Bill Shipping Fee</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-[var(--color-text-muted)] mb-1 block">
                          Shipping fee (GH₵)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 50"
                          value={shippingFees[order.id] || ''}
                          onChange={(e) =>
                            setShippingFees((prev) => ({ ...prev, [order.id]: e.target.value }))
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--color-text-muted)] mb-1 block">
                          Note to customer (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Pay to 0551234567"
                          value={shippingNotes[order.id] || ''}
                          onChange={(e) =>
                            setShippingNotes((prev) => ({ ...prev, [order.id]: e.target.value }))
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        disabled={isLoading}
                        onClick={(e) => { e.stopPropagation(); handleBillShipping(order) }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-all disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Bill Customer
                      </button>
                      {customer?.contact && shippingFees[order.id] && (
                        <a
                          href={whatsappLink({ ...order, shipping_fee: parseFloat(shippingFees[order.id] || '0') })}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-all"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Send WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Already billed — show details + WhatsApp resend */}
                {status === 'shipping_billed' && (
                  <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <p className="text-sm font-semibold text-orange-700">
                          Shipping billed — awaiting customer payment
                        </p>
                      </div>
                      {customer?.contact && (
                        <a
                          href={whatsappLink(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-all"
                        >
                          <MessageCircle className="h-3 w-3" />
                          Resend WhatsApp
                        </a>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)]">Shipping Fee</p>
                        <p className="font-bold text-orange-600">GH₵{fmt(shippingFee)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)]">Grand Total</p>
                        <p className="font-bold text-[var(--color-text-primary)]">GH₵{fmt(grandTotal)}</p>
                      </div>
                    </div>
                    {order.shipping_note && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Note: {order.shipping_note}
                      </p>
                    )}
                  </div>
                )}

                {/* Customer has confirmed payment — show MoMo reference + verify button */}
                {status === 'shipping_paid' && (
                  <div className="rounded-xl border border-[var(--color-success)] bg-[var(--color-success-light)] p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
                      <p className="text-sm font-semibold text-[var(--color-success)]">
                        Customer confirmed MoMo payment
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)]">MoMo Number</p>
                        <p className="font-semibold text-[var(--color-text-primary)]">
                          {order.momo_number || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)]">Payment Reference</p>
                        <p className="font-semibold text-[var(--color-text-primary)] font-mono">
                          {order.payment_reference || '—'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Verify the MoMo payment of{' '}
                      <strong>GH₵{fmt(shippingFee)}</strong> from the reference above, then mark as delivered.
                    </p>
                    <button
                      disabled={loading[order.id + '_paid']}
                      onClick={(e) => { e.stopPropagation(); handleMarkPaid(order) }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 text-white text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {loading[order.id + '_paid'] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <PackageCheck className="h-4 w-4" />
                      )}
                      Confirm & Mark Delivered
                    </button>
                  </div>
                )}

                {/* Delivered summary */}
                {status === 'delivered' && (
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <PackageCheck className="h-4 w-4 text-[var(--color-success)]" />
                      <p className="text-sm font-semibold text-[var(--color-success)]">
                        Order completed
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)]">Product Total</p>
                        <p className="font-semibold tabular-nums">GH₵{fmt(productTotal)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)]">Shipping</p>
                        <p className="font-semibold tabular-nums">GH₵{fmt(shippingFee)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)]">Grand Total</p>
                        <p className="font-bold text-[var(--color-success)] tabular-nums">
                          GH₵{fmt(grandTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}