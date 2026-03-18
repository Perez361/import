'use client'

import { useState } from 'react'
import {
  ChevronDown, ChevronUp, Package, Phone,
  MessageCircle, CheckCircle2, Loader2, CreditCard,
  Truck, PackageCheck, AlertCircle, Send, DollarSign,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  billShippingAction,
  markShippingPaidAction,
  updateOrderStatusAction,
  markProductPaidAction,
} from './actions'

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (v: number) => v.toLocaleString('en-GH', { maximumFractionDigits: 0 })
const n = (v: any) => parseFloat(String(v || 0)) || 0

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

type CustomerShape = { full_name?: string; username?: string; contact?: string; email?: string } | null
function getCustomer(customers: any): CustomerShape {
  if (!customers) return null
  return Array.isArray(customers) ? (customers[0] ?? null) : customers
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:         { label: 'Pending',         color: 'text-gray-600',                        bg: 'bg-gray-100' },
  product_paid:    { label: 'Product Paid',     color: 'text-blue-700',                        bg: 'bg-blue-50' },
  processing:      { label: 'Processing',       color: 'text-indigo-700',                      bg: 'bg-indigo-50' },
  arrived:         { label: 'Arrived',          color: 'text-purple-700',                      bg: 'bg-purple-50' },
  shipping_billed: { label: 'Shipping Billed',  color: 'text-orange-700',                      bg: 'bg-orange-50' },
  shipping_paid:   { label: 'Shipping Paid',    color: 'text-emerald-700',                     bg: 'bg-emerald-50' },
  delivered:       { label: 'Delivered',        color: 'text-[var(--color-success)]',          bg: 'bg-[var(--color-success-light)]' },
  cancelled:       { label: 'Cancelled',        color: 'text-[var(--color-danger)]',           bg: 'bg-[var(--color-danger-light)]' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['pending']
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

// ── Stage-specific action panels ──────────────────────────────────────────────

// STAGE 1: Confirm product payment received
function ConfirmProductPayment({ order, onConfirmed }: {
  order: Order
  onConfirmed: (ref?: string) => void
}) {
  const [ref, setRef] = useState('')
  const [loading, setLoading] = useState(false)
  const productTotal = n(order.total)

  const handle = async () => {
    setLoading(true)
    const result: any = await markProductPaidAction(order.id, ref)
    setLoading(false)
    if (result?.error) { toast.error(result.error); return }
    toast.success('Product payment confirmed!')
    onConfirmed(ref)
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-blue-600 shrink-0" />
        <p className="text-sm font-semibold text-blue-700">
          Confirm product payment — <span className="tabular-nums">GH₵{fmt(productTotal)}</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="MoMo reference (optional)"
          value={ref}
          onChange={e => setRef(e.target.value)}
          onClick={e => e.stopPropagation()}
          className="flex-1 px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm font-mono focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
        <button
          disabled={loading}
          onClick={e => { e.stopPropagation(); handle() }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Confirm Paid
        </button>
      </div>
    </div>
  )
}

// STAGE 2: Bill shipping fee
function BillShipping({ order, onBilled }: {
  order: Order
  onBilled: (fee: number, note?: string) => void
}) {
  const [fee, setFee] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const customer = getCustomer(order.customers)
  const productTotal = n(order.total)

  const handle = async () => {
    const feeNum = parseFloat(fee)
    if (!feeNum || feeNum <= 0) { toast.error('Enter a valid shipping fee'); return }
    setLoading(true)
    const result: any = await billShippingAction(order.id, feeNum, note)
    setLoading(false)
    if (result?.error) { toast.error(result.error); return }
    toast.success('Shipping fee billed!')
    onBilled(feeNum, note)
  }

  const waLink = () => {
    const feeNum = parseFloat(fee) || 0
    const contact = customer?.contact?.replace(/\D/g, '') || ''
    const name = customer?.full_name || customer?.username || 'Customer'
    const items = order.order_items?.map((i: any) => `• ${i.products?.name || 'Item'} ×${i.quantity}`).join('\n') || ''
    const msg = encodeURIComponent(
      `Hello ${name}! 👋\n\nYour items have arrived! Here's your shipping bill:\n\n` +
      `📦 Order #${order.id.slice(-8).toUpperCase()}\n${items}\n\n` +
      `✅ Product (already paid): GH₵${fmt(productTotal)}\n` +
      `🚚 Shipping fee due: *GH₵${fmt(feeNum)}*\n` +
      (note ? `📝 ${note}\n\n` : '\n') +
      `Please send GH₵${fmt(feeNum)} via MoMo. Thank you! 🙏`
    )
    return `https://wa.me/${contact}?text=${msg}`
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-orange-600 shrink-0" />
        <p className="text-sm font-semibold text-orange-700">Set & bill shipping fee</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="number" step="0.01" min="0" placeholder="Shipping fee (GH₵)"
          value={fee}
          onChange={e => setFee(e.target.value)}
          onClick={e => e.stopPropagation()}
          className="w-40 px-3 py-2 rounded-lg border border-orange-200 bg-white text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
        />
        <input
          type="text" placeholder="Note, e.g. send to 055-XXX"
          value={note}
          onChange={e => setNote(e.target.value)}
          onClick={e => e.stopPropagation()}
          className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-orange-200 bg-white text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={loading}
          onClick={e => { e.stopPropagation(); handle() }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Bill Customer
        </button>
        {customer?.contact && fee && parseFloat(fee) > 0 && (
          <a
            href={waLink()}
            target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}

// STAGE 3: Awaiting shipping payment (customer hasn't paid yet)
function AwaitingShipping({ order }: { order: Order }) {
  const customer = getCustomer(order.customers)
  const shippingFee = n(order.shipping_fee)

  const waLink = () => {
    const contact = customer?.contact?.replace(/\D/g, '') || ''
    const name = customer?.full_name || customer?.username || 'Customer'
    const items = order.order_items?.map((i: any) => `• ${i.products?.name || 'Item'} ×${i.quantity}`).join('\n') || ''
    const msg = encodeURIComponent(
      `Hello ${name}! 👋 Reminder: your shipping fee of *GH₵${fmt(shippingFee)}* is still pending.\n\n` +
      `📦 Order #${order.id.slice(-8).toUpperCase()}\n${items}\n\n` +
      (order.shipping_note ? `📝 ${order.shipping_note}\n\n` : '') +
      `Please send GH₵${fmt(shippingFee)} via MoMo. Thank you! 🙏`
    )
    return `https://wa.me/${contact}?text=${msg}`
  }

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-orange-700">
            Awaiting shipping payment — <span className="tabular-nums">GH₵{fmt(shippingFee)}</span>
          </p>
          {order.shipping_note && (
            <p className="text-xs text-orange-600 mt-0.5">{order.shipping_note}</p>
          )}
        </div>
      </div>
      {customer?.contact && (
        <a
          href={waLink()}
          target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5" /> Remind
        </a>
      )}
    </div>
  )
}

// STAGE 4: Verify shipping payment and mark delivered
function VerifyAndDeliver({ order, onDelivered }: {
  order: Order
  onDelivered: () => void
}) {
  const [loading, setLoading] = useState(false)
  const shippingFee = n(order.shipping_fee)

  const handle = async () => {
    setLoading(true)
    const result: any = await markShippingPaidAction(order.id)
    setLoading(false)
    if (result?.error) { toast.error(result.error); return }
    toast.success('Order marked as delivered!')
    onDelivered()
  }

  return (
    <div className="rounded-xl border border-[var(--color-success)] bg-[var(--color-success-light)] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-[var(--color-success)] shrink-0" />
        <p className="text-sm font-semibold text-[var(--color-success)]">
          Customer confirmed shipping payment — GH₵{fmt(shippingFee)}
        </p>
      </div>
      <div className="flex items-center gap-4 text-sm flex-wrap">
        {order.momo_number && (
          <span className="text-[var(--color-text-muted)]">
            MoMo: <span className="font-semibold text-[var(--color-text-primary)]">{order.momo_number}</span>
          </span>
        )}
        {order.payment_reference && (
          <span className="text-[var(--color-text-muted)]">
            Ref: <span className="font-semibold font-mono text-[var(--color-text-primary)]">{order.payment_reference}</span>
          </span>
        )}
      </div>
      <button
        disabled={loading}
        onClick={e => { e.stopPropagation(); handle() }}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 text-white text-sm font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
        Verify & Mark Delivered
      </button>
    </div>
  )
}

// ── Order Row ─────────────────────────────────────────────────────────────────

function OrderRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false)
  const [localOrder, setLocalOrder] = useState(order)

  const customer    = getCustomer(localOrder.customers)
  const status      = localOrder.status?.toLowerCase() || 'pending'
  const productTotal = n(localOrder.total)
  const shippingFee  = n(localOrder.shipping_fee)
  const grandTotal   = productTotal + shippingFee
  const items        = localOrder.order_items || []

  const patch = (p: Partial<Order>) => setLocalOrder(prev => ({ ...prev, ...p }))

  return (
    <div className="border-b border-[var(--color-border)] last:border-b-0">

      {/* ── Collapsed row ── */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 sm:px-5 cursor-pointer hover:bg-[var(--color-surface)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Order ID */}
        <span className="font-mono text-xs font-bold text-[var(--color-text-muted)] shrink-0 hidden sm:block">
          #{localOrder.id.slice(-8).toUpperCase()}
        </span>

        {/* Customer */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
            {customer?.full_name || customer?.username || 'Unknown'}
          </p>
          {customer?.contact && (
            <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
              <Phone className="h-2.5 w-2.5" />{customer.contact}
            </p>
          )}
        </div>

        {/* Status */}
        <StatusBadge status={status} />

        {/* Amount */}
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">
            GH₵{fmt(productTotal)}
          </p>
          {shippingFee > 0 && (
            <p className="text-xs text-orange-600 tabular-nums">+GH₵{fmt(shippingFee)}</p>
          )}
        </div>

        {/* Time + chevron */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-[var(--color-text-muted)] hidden sm:block">
            {timeAgo(localOrder.created_at)}
          </span>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-[var(--color-text-muted)]" />
            : <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
          }
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="px-4 sm:px-5 pb-5 space-y-4 bg-[var(--color-surface)] border-t border-[var(--color-border)]">

          {/* Items */}
          {items.length > 0 && (
            <div className="pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
                Items ordered
              </p>
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] divide-y divide-[var(--color-border)]">
                {items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-[var(--color-text-primary)]">
                      {item.products?.name || 'Item'} × {item.quantity}
                    </span>
                    <span className="font-semibold tabular-nums">
                      GH₵{fmt(n(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
                {/* Totals */}
                <div className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold bg-[var(--color-surface)]">
                  <span>Product total</span>
                  <span className="tabular-nums">GH₵{fmt(productTotal)}</span>
                </div>
                {shippingFee > 0 && (
                  <>
                    <div className="flex items-center justify-between px-4 py-2.5 text-sm text-orange-600">
                      <span>Shipping fee</span>
                      <span className="font-semibold tabular-nums">GH₵{fmt(shippingFee)}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 text-sm font-bold">
                      <span>Grand total</span>
                      <span className="text-[var(--color-success)] tabular-nums">GH₵{fmt(grandTotal)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Stage-specific action */}
          <div>
            {status === 'pending' && (
              <ConfirmProductPayment
                order={localOrder}
                onConfirmed={(ref) => patch({
                  product_paid: true,
                  status: 'product_paid',
                  product_payment_reference: ref || null,
                })}
              />
            )}

            {(status === 'product_paid' || status === 'processing' || status === 'arrived') && (
              <BillShipping
                order={localOrder}
                onBilled={(fee, note) => patch({
                  shipping_fee: fee,
                  shipping_note: note || null,
                  status: 'shipping_billed',
                })}
              />
            )}

            {status === 'shipping_billed' && (
              <AwaitingShipping order={localOrder} />
            )}

            {status === 'shipping_paid' && (
              <VerifyAndDeliver
                order={localOrder}
                onDelivered={() => patch({ status: 'delivered', shipping_paid: true })}
              />
            )}

            {status === 'delivered' && (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-[var(--color-success)]" />
                <p className="text-sm font-semibold text-[var(--color-success)]">
                  Order complete — GH₵{fmt(grandTotal)} collected
                </p>
              </div>
            )}

            {status === 'cancelled' && (
              <div className="rounded-xl border border-[var(--color-danger-light)] bg-[var(--color-danger-light)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--color-danger)]">Order cancelled</p>
              </div>
            )}
          </div>

          {/* Product payment confirmation banner (persists after stage 1) */}
          {localOrder.product_paid && status !== 'pending' && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-2.5 flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <p className="text-xs text-blue-700">
                Product payment received — GH₵{fmt(productTotal)}
                {localOrder.product_payment_reference && (
                  <span className="font-mono ml-1.5 text-blue-500">({localOrder.product_payment_reference})</span>
                )}
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function OrdersTable({ orders, importerPhone, storeSlug }: Props) {
  return (
    <div className="divide-y divide-[var(--color-border)]">
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} />
      ))}
    </div>
  )
}