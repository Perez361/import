'use client'

import { useState, useEffect } from 'react'
import {
  Phone, MessageCircle, CheckCircle2, Loader2,
  CreditCard, PackageCheck, AlertCircle, Package,
  ChevronDown, ChevronRight, Truck,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  markProductPaidAction,
  markShippingPaidAction,
  markDeliveredAction,
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

interface ProductGroup {
  productId: string
  productName: string
  productImage: string | null
  orders: Order[]
}

interface Props {
  orders: Order[]
  importerPhone: string
  storeSlug: string
  storeId: string
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

function getCustomer(customers: any) {
  if (!customers) return null
  return Array.isArray(customers) ? (customers[0] ?? null) : customers
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  pending:         { label: 'Pending',       dot: 'bg-gray-400',    text: 'text-gray-600',                bg: 'bg-gray-100' },
  product_paid:    { label: 'Product Paid',  dot: 'bg-blue-500',    text: 'text-blue-700',                bg: 'bg-blue-50' },
  processing:      { label: 'Processing',    dot: 'bg-indigo-500',  text: 'text-indigo-700',              bg: 'bg-indigo-50' },
  arrived:         { label: 'Arrived',       dot: 'bg-purple-500',  text: 'text-purple-700',              bg: 'bg-purple-50' },
  shipping_billed: { label: 'Shipping Due',  dot: 'bg-orange-500',  text: 'text-orange-700',              bg: 'bg-orange-50' },
  shipping_paid:   { label: 'Shipping Paid', dot: 'bg-emerald-500', text: 'text-emerald-700',             bg: 'bg-emerald-50' },
  delivered:       { label: 'Delivered',     dot: 'bg-green-500',   text: 'text-[var(--color-success)]',  bg: 'bg-[var(--color-success-light)]' },
  cancelled:       { label: 'Cancelled',     dot: 'bg-red-400',     text: 'text-[var(--color-danger)]',   bg: 'bg-[var(--color-danger-light)]' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['pending']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ── WhatsApp links ────────────────────────────────────────────────────────────

function productPaymentWa(order: Order, customerName: string, contact: string): string {
  const productTotal = n(order.total)
  const items = order.order_items
    ?.map((i: any) => `  • ${i.products?.name || 'Item'} ×${i.quantity}`)
    .join('\n') || ''
  const msg = encodeURIComponent(
    `Hello ${customerName}! 👋\n\n` +
    `Reminder: your product payment of *GH₵${fmt(productTotal)}* is still pending.\n\n` +
    `📦 Order #${order.id.slice(-8).toUpperCase()}\n${items}\n\n` +
    `Please send GH₵${fmt(productTotal)} via MoMo to confirm your order. Thank you! 🙏`
  )
  return `https://wa.me/${contact.replace(/\D/g, '')}?text=${msg}`
}

function shippingPaymentWa(order: Order, customerName: string, contact: string): string {
  const shippingFee = n(order.shipping_fee)
  const items = order.order_items
    ?.map((i: any) => `  • ${i.products?.name || 'Item'} ×${i.quantity}`)
    .join('\n') || ''
  const msg = encodeURIComponent(
    `Hello ${customerName}! 👋\n\n` +
    `Reminder: your shipping fee of *GH₵${fmt(shippingFee)}* is still pending.\n\n` +
    `📦 Order #${order.id.slice(-8).toUpperCase()}\n${items}\n\n` +
    (order.shipping_note ? `📝 ${order.shipping_note}\n\n` : '') +
    `Please send GH₵${fmt(shippingFee)} via MoMo to receive your order. Thank you! 🙏`
  )
  return `https://wa.me/${contact.replace(/\D/g, '')}?text=${msg}`
}

// ── Customer Row ──────────────────────────────────────────────────────────────

function CustomerRow({ order, onPatch }: {
  order: Order
  onPatch: (id: string, patch: Partial<Order>) => void
}) {
  const [expanded, setExpanded]     = useState(false)
  const [ref, setRef]               = useState('')
  const [confirmingProduct, setCP]  = useState(false)
  const [confirmingShipping, setCS] = useState(false)
  const [markingDelivered, setMD]   = useState(false)

  const customer     = getCustomer(order.customers)
  const customerName = customer?.full_name || customer?.username || 'Unknown'
  const contact      = customer?.contact || ''
  const status       = order.status?.toLowerCase() || 'pending'
  const productTotal = n(order.total)
  const shippingFee  = n(order.shipping_fee)
  const grandTotal   = productTotal + shippingFee

  const handleConfirmProduct = async () => {
    setCP(true)
    const result: any = await markProductPaidAction(order.id, ref)
    setCP(false)
    if (result?.error) { toast.error(result.error); return }
    toast.success('Product payment confirmed!')
    onPatch(order.id, { product_paid: true, status: 'product_paid', product_payment_reference: ref || null })
    setRef('')
  }

  // Step 1: verify the customer's MoMo payment — stays at shipping_paid, does NOT deliver
  const handleVerifyShippingPayment = async () => {
    setCS(true)
    const result: any = await markShippingPaidAction(order.id)
    setCS(false)
    if (result?.error) { toast.error(result.error); return }
    toast.success('Shipping payment verified!')
    onPatch(order.id, { shipping_paid: true, status: 'shipping_paid' })
  }

  // Step 2: physically hand over to customer → mark delivered
  const handleMarkDelivered = async () => {
    setMD(true)
    const result: any = await markDeliveredAction(order.id)
    setMD(false)
    if (result?.error) { toast.error(result.error); return }
    toast.success('Order marked as delivered!')
    onPatch(order.id, { status: 'delivered' })
  }

  return (
    <>
      {/* ── Main row ── */}
      <div
        className="grid grid-cols-[1fr_110px_120px_32px] gap-x-3 items-center px-4 py-3 hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{customerName}</p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {contact && (
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <Phone className="h-2.5 w-2.5 shrink-0" />{contact}
              </span>
            )}
            <span className="text-xs text-[var(--color-text-muted)]">{timeAgo(order.created_at)}</span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">GH₵{fmt(productTotal)}</p>
          {shippingFee > 0 && (
            <p className="text-xs text-orange-600 font-semibold tabular-nums">+GH₵{fmt(shippingFee)}</p>
          )}
        </div>

        <div className="flex justify-end">
          <StatusBadge status={status} />
        </div>

        <div className="text-[var(--color-text-muted)]">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </div>

      {/* ── Expanded panel ── */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 bg-[var(--color-surface)] border-t border-[var(--color-border)]">

          {/* ── Confirm product payment ── */}
          {status === 'pending' && (
            <div className="mt-3 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-3 space-y-2.5">
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
                  className="flex-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-sm font-mono focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
                <button
                  disabled={confirmingProduct}
                  onClick={e => { e.stopPropagation(); handleConfirmProduct() }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shrink-0"
                >
                  {confirmingProduct ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Confirm
                </button>
              </div>
              {contact && (
                <a
                  href={productPaymentWa(order, customerName, contact)}
                  target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-800 transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Send payment reminder on WhatsApp
                </a>
              )}
            </div>
          )}

          {/* ── Product paid strip ── */}
          {order.product_paid && status !== 'pending' && (
            <div className="mt-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <p className="text-xs text-blue-700">
                Product payment received — GH₵{fmt(productTotal)}
                {order.product_payment_reference && (
                  <span className="font-mono ml-1.5 text-blue-500">({order.product_payment_reference})</span>
                )}
              </p>
            </div>
          )}

          {/* ── Shipping billed — WhatsApp reminder ── */}
          {status === 'shipping_billed' && (
            <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-orange-700">
                    Shipping pending — GH₵{fmt(shippingFee)}
                  </p>
                  {order.shipping_note && (
                    <p className="text-xs text-orange-600 mt-0.5 truncate">{order.shipping_note}</p>
                  )}
                </div>
              </div>
              {contact && (
                <a
                  href={shippingPaymentWa(order, customerName, contact)}
                  target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors shrink-0"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Remind
                </a>
              )}
            </div>
          )}

          {/* ── STEP 1: Customer submitted payment — verify MoMo ── */}
          {status === 'shipping_paid' && !order.shipping_paid && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-sm font-semibold text-emerald-700">
                  Customer submitted shipping payment — GH₵{fmt(shippingFee)}
                </p>
              </div>
              {(order.momo_number || order.payment_reference) && (
                <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] flex-wrap">
                  {order.momo_number && (
                    <span>MoMo: <span className="font-semibold text-[var(--color-text-primary)]">{order.momo_number}</span></span>
                  )}
                  {order.payment_reference && (
                    <span>Ref: <span className="font-mono font-semibold text-[var(--color-text-primary)]">{order.payment_reference}</span></span>
                  )}
                </div>
              )}
              <button
                disabled={confirmingShipping}
                onClick={e => { e.stopPropagation(); handleVerifyShippingPayment() }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {confirmingShipping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Verify Payment
              </button>
            </div>
          )}

          {/* ── STEP 2: Payment verified — mark delivered when physically handed over ── */}
          {status === 'shipping_paid' && order.shipping_paid && (
            <div className="mt-3 rounded-xl border border-[var(--color-success)] bg-[var(--color-success-light)] p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[var(--color-success)] shrink-0" />
                <p className="text-sm font-semibold text-[var(--color-success)]">
                  Payment verified — GH₵{fmt(shippingFee)} received
                </p>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                Once you've physically handed the item to the customer, mark it as delivered.
              </p>
              <button
                disabled={markingDelivered}
                onClick={e => { e.stopPropagation(); handleMarkDelivered() }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {markingDelivered ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
                Mark as Delivered
              </button>
            </div>
          )}

          {/* ── Delivered ── */}
          {status === 'delivered' && (
            <div className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5 flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-[var(--color-success)] shrink-0" />
              <p className="text-sm font-semibold text-[var(--color-success)]">
                Complete — GH₵{fmt(grandTotal)} collected
              </p>
            </div>
          )}

          {/* ── Cancelled ── */}
          {status === 'cancelled' && (
            <div className="mt-3 rounded-lg border border-[var(--color-danger-light)] bg-[var(--color-danger-light)] px-3 py-2.5">
              <p className="text-sm font-semibold text-[var(--color-danger)]">Order cancelled</p>
            </div>
          )}

        </div>
      )}
    </>
  )
}

// ── Product Group Card ────────────────────────────────────────────────────────

function ProductGroupCard({ group }: { group: ProductGroup }) {
  const [expanded, setExpanded] = useState(true)
  const [orders, setOrders]     = useState<Order[]>(group.orders)

  const patchOrder = (id: string, patch: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o))
  }

  const pending   = orders.filter(o => o.status === 'pending').length
  const paid      = orders.filter(o => o.status !== 'pending' && o.status !== 'cancelled').length
  const delivered = orders.filter(o => o.status === 'delivered').length
  const totalRevenue = orders.reduce((s, o) => s + n(o.total), 0)

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 bg-[var(--color-surface)] hover:bg-[var(--color-border)]/20 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            {group.productImage ? (
              <img src={group.productImage} alt={group.productName} className="h-12 w-12 rounded-xl object-cover border border-[var(--color-border)]" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-[var(--color-brand-light)] flex items-center justify-center border border-[var(--color-border)]">
                <Package className="h-5 w-5 text-[var(--color-brand)]" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[var(--color-text-primary)] text-base leading-tight truncate">
              {group.productName}
            </p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-xs text-[var(--color-text-muted)]">
                <span className="font-semibold text-[var(--color-text-primary)]">{orders.length}</span> order{orders.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs font-semibold text-[var(--color-brand)] tabular-nums">
                GH₵{fmt(totalRevenue)}
              </span>
              {paid > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-success)]">
                  <CheckCircle2 className="h-3 w-3" />{paid} paid
                </span>
              )}
              {pending > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-warning)]">
                  <AlertCircle className="h-3 w-3" />{pending} pending
                </span>
              )}
              {delivered > 0 && delivered === orders.length && (
                <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-success)]">
                  <PackageCheck className="h-3 w-3" />All delivered
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-[var(--color-text-muted)]">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {expanded && (
        <>
          <div className="grid grid-cols-[1fr_110px_120px_32px] gap-x-3 items-center px-4 py-2 border-y border-[var(--color-border)] bg-[var(--color-surface)]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Customer</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] text-right">Amount</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] text-right">Status</span>
            <span />
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {orders.map(order => (
              <CustomerRow key={order.id} order={order} onPatch={patchOrder} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Main export — groups orders by product ────────────────────────────────────

export default function OrdersTable({ orders, storeId }: Props & { storeId: string }) {
  const [groups, setGroups] = useState<ProductGroup[]>([])

  // Real-time subscription for order updates
  useEffect(() => {
    if (!storeId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`orders-${storeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `store_id=eq.${storeId}`,
      }, () => {
        // Refresh the page to show updated orders
        window.location.reload()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId])

  useEffect(() => {
    const map = new Map<string, ProductGroup>()

    for (const order of orders) {
      const items = order.order_items || []
      if (items.length === 0) {
        const key = '__unlinked__'
        if (!map.has(key)) {
          map.set(key, { productId: key, productName: 'Unlinked Orders', productImage: null, orders: [] })
        }
        map.get(key)!.orders.push(order)
        continue
      }

      for (const item of items) {
        const product = Array.isArray(item.products) ? item.products[0] : item.products
        if (!product?.id) continue
        const key = product.id
        if (!map.has(key)) {
          map.set(key, {
            productId:    product.id,
            productName:  product.name,
            productImage: product.image_url ?? null,
            orders:       [],
          })
        }
        if (!map.get(key)!.orders.find(o => o.id === order.id)) {
          map.get(key)!.orders.push(order)
        }
      }
    }

    setGroups(Array.from(map.values()))
  }, [orders])

  if (groups.length === 0) return null

  return (
    <div className="p-4 sm:p-5 space-y-4">
      {groups.map(g => (
        <ProductGroupCard key={g.productId} group={g} />
      ))}
    </div>
  )
}