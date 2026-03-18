'use client'

import { useState } from 'react'
import {
  Phone, MessageCircle, CheckCircle2, Loader2,
  CreditCard, PackageCheck, AlertCircle, ChevronDown, ChevronRight,
  Package, ShoppingCart,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  markProductPaidAction,
  markShippingPaidAction,
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

type CustomerShape = {
  full_name?: string
  username?: string
  contact?: string
  email?: string
} | null

function getCustomer(customers: any): CustomerShape {
  if (!customers) return null
  return Array.isArray(customers) ? (customers[0] ?? null) : customers
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  pending:         { label: 'Pending',        dot: 'bg-gray-400',    text: 'text-gray-600',                        bg: 'bg-gray-100' },
  product_paid:    { label: 'Product Paid',   dot: 'bg-blue-500',    text: 'text-blue-700',                        bg: 'bg-blue-50' },
  processing:      { label: 'Processing',     dot: 'bg-indigo-500',  text: 'text-indigo-700',                      bg: 'bg-indigo-50' },
  arrived:         { label: 'Arrived',        dot: 'bg-purple-500',  text: 'text-purple-700',                      bg: 'bg-purple-50' },
  shipping_billed: { label: 'Shipping Due',   dot: 'bg-orange-500',  text: 'text-orange-700',                      bg: 'bg-orange-50' },
  shipping_paid:   { label: 'Shipping Paid',  dot: 'bg-emerald-500', text: 'text-emerald-700',                     bg: 'bg-emerald-50' },
  delivered:       { label: 'Delivered',      dot: 'bg-green-500',   text: 'text-[var(--color-success)]',          bg: 'bg-[var(--color-success-light)]' },
  cancelled:       { label: 'Cancelled',      dot: 'bg-red-400',     text: 'text-[var(--color-danger)]',           bg: 'bg-[var(--color-danger-light)]' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['pending']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ── WhatsApp reminder links ───────────────────────────────────────────────────

function buildProductPaymentWa(order: Order, customer: CustomerShape): string {
  const name = customer?.full_name || customer?.username || 'Customer'
  const contact = customer?.contact?.replace(/\D/g, '') || ''
  const productTotal = n(order.total)
  const items = order.order_items
    ?.map((i: any) => `  • ${i.products?.name || 'Item'} ×${i.quantity}`)
    .join('\n') || ''
  const msg = encodeURIComponent(
    `Hello ${name}! 👋\n\n` +
    `Just a reminder that your product payment of *GH₵${fmt(productTotal)}* is still pending.\n\n` +
    `📦 Order #${order.id.slice(-8).toUpperCase()}\n${items}\n\n` +
    `Please send GH₵${fmt(productTotal)} via MoMo to confirm your order. Thank you! 🙏`
  )
  return `https://wa.me/${contact}?text=${msg}`
}

function buildShippingPaymentWa(order: Order, customer: CustomerShape): string {
  const name = customer?.full_name || customer?.username || 'Customer'
  const contact = customer?.contact?.replace(/\D/g, '') || ''
  const shippingFee = n(order.shipping_fee)
  const items = order.order_items
    ?.map((i: any) => `  • ${i.products?.name || 'Item'} ×${i.quantity}`)
    .join('\n') || ''
  const msg = encodeURIComponent(
    `Hello ${name}! 👋\n\n` +
    `Reminder: your shipping fee of *GH₵${fmt(shippingFee)}* is still pending.\n\n` +
    `📦 Order #${order.id.slice(-8).toUpperCase()}\n${items}\n\n` +
    (order.shipping_note ? `📝 ${order.shipping_note}\n\n` : '') +
    `Please send GH₵${fmt(shippingFee)} via MoMo to receive your order. Thank you! 🙏`
  )
  return `https://wa.me/${contact}?text=${msg}`
}

// ── Order Card ────────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const [localOrder, setLocalOrder] = useState(order)
  const [expanded, setExpanded] = useState(false)
  const [ref, setRef] = useState('')
  const [confirmingProduct, setConfirmingProduct] = useState(false)
  const [confirmingShipping, setConfirmingShipping] = useState(false)

  const patch = (p: Partial<Order>) => setLocalOrder(prev => ({ ...prev, ...p }))

  const customer     = getCustomer(localOrder.customers)
  const customerName = customer?.full_name || customer?.username || 'Unknown'
  const status       = localOrder.status?.toLowerCase() || 'pending'
  const productTotal = n(localOrder.total)
  const shippingFee  = n(localOrder.shipping_fee)
  const grandTotal   = productTotal + shippingFee
  const items        = localOrder.order_items || []

  const handleConfirmProduct = async () => {
    setConfirmingProduct(true)
    const result: any = await markProductPaidAction(localOrder.id, ref)
    setConfirmingProduct(false)
    if (result?.error) { toast.error(result.error); return }
    toast.success('Product payment confirmed!')
    patch({ product_paid: true, status: 'product_paid', product_payment_reference: ref || null })
    setRef('')
  }

  const handleConfirmShipping = async () => {
    setConfirmingShipping(true)
    const result: any = await markShippingPaidAction(localOrder.id)
    setConfirmingShipping(false)
    if (result?.error) { toast.error(result.error); return }
    toast.success('Order marked as delivered!')
    patch({ shipping_paid: true, status: 'delivered' })
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">

      {/* ── Card header ── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">

          {/* Avatar */}
          <div className="h-10 w-10 rounded-full bg-[var(--color-brand-light)] flex items-center justify-center text-[var(--color-brand)] font-bold text-sm shrink-0">
            {customerName.charAt(0).toUpperCase()}
          </div>

          {/* Name + contact + time */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[var(--color-text-primary)] truncate">{customerName}</p>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {customer?.contact && (
                <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                  <Phone className="h-2.5 w-2.5 shrink-0" />{customer.contact}
                </span>
              )}
              <span className="text-xs text-[var(--color-text-muted)]">{timeAgo(localOrder.created_at)}</span>
            </div>
          </div>

          {/* Status + amount */}
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <StatusBadge status={status} />
            <p className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">
              GH₵{fmt(productTotal)}
              {shippingFee > 0 && (
                <span className="text-xs text-orange-600 font-semibold ml-1">+GH₵{fmt(shippingFee)}</span>
              )}
            </p>
          </div>
        </div>

        {/* Items preview (always visible, collapsed) */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {items.slice(0, 2).map((item: any, i: number) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-0.5 rounded-full text-[var(--color-text-muted)]">
                <Package className="h-2.5 w-2.5" />
                {item.products?.name || 'Item'} ×{item.quantity}
              </span>
            ))}
            {items.length > 2 && (
              <span className="text-xs text-[var(--color-text-muted)]">+{items.length - 2} more</span>
            )}
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors ml-2 shrink-0"
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {expanded ? 'Less' : 'Details'}
          </button>
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="border-t border-[var(--color-border)] px-4 py-4 space-y-4 bg-[var(--color-surface)]">

          {/* Full items breakdown */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] divide-y divide-[var(--color-border)] overflow-hidden">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-[var(--color-text-primary)]">
                  {item.products?.name || 'Item'} × {item.quantity}
                </span>
                <span className="font-semibold tabular-nums">GH₵{fmt(n(item.price) * item.quantity)}</span>
              </div>
            ))}
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

          {/* ── Action: confirm product payment ── */}
          {status === 'pending' && (
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
                  className="flex-1 px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm font-mono focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
                <button
                  disabled={confirmingProduct}
                  onClick={handleConfirmProduct}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shrink-0"
                >
                  {confirmingProduct
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <CheckCircle2 className="h-4 w-4" />
                  }
                  Confirm Paid
                </button>
              </div>
              {/* WhatsApp reminder for pending product payment */}
              {customer?.contact && (
                <a
                  href={buildProductPaymentWa(localOrder, customer)}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-800 transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Send payment reminder on WhatsApp
                </a>
              )}
            </div>
          )}

          {/* ── Product paid confirmation strip ── */}
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

          {/* ── Action: awaiting shipping payment (WhatsApp reminder only) ── */}
          {status === 'shipping_billed' && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-orange-700">
                    Shipping payment pending — GH₵{fmt(shippingFee)}
                  </p>
                  {localOrder.shipping_note && (
                    <p className="text-xs text-orange-600 mt-0.5">{localOrder.shipping_note}</p>
                  )}
                </div>
              </div>
              {customer?.contact && (
                <a
                  href={buildShippingPaymentWa(localOrder, customer)}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors shrink-0"
                >
                  <MessageCircle className="h-4 w-4" /> Remind
                </a>
              )}
            </div>
          )}

          {/* ── Action: verify & deliver ── */}
          {status === 'shipping_paid' && (
            <div className="rounded-xl border border-[var(--color-success)] bg-[var(--color-success-light)] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[var(--color-success)] shrink-0" />
                <p className="text-sm font-semibold text-[var(--color-success)]">
                  Customer confirmed shipping payment — GH₵{fmt(shippingFee)}
                </p>
              </div>
              {(localOrder.momo_number || localOrder.payment_reference) && (
                <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] flex-wrap">
                  {localOrder.momo_number && (
                    <span>MoMo: <span className="font-semibold text-[var(--color-text-primary)]">{localOrder.momo_number}</span></span>
                  )}
                  {localOrder.payment_reference && (
                    <span>Ref: <span className="font-mono font-semibold text-[var(--color-text-primary)]">{localOrder.payment_reference}</span></span>
                  )}
                </div>
              )}
              <button
                disabled={confirmingShipping}
                onClick={handleConfirmShipping}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {confirmingShipping
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <PackageCheck className="h-4 w-4" />
                }
                Verify & Mark Delivered
              </button>
            </div>
          )}

          {/* ── Delivered ── */}
          {status === 'delivered' && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-[var(--color-success)] shrink-0" />
              <p className="text-sm font-semibold text-[var(--color-success)]">
                Order complete — GH₵{fmt(grandTotal)} collected
              </p>
            </div>
          )}

          {/* ── Cancelled ── */}
          {status === 'cancelled' && (
            <div className="rounded-xl border border-[var(--color-danger-light)] bg-[var(--color-danger-light)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--color-danger)]">Order cancelled</p>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function OrdersTable({ orders }: Props) {
  return (
    <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}