'use client'

import { useState } from 'react'
import {
  Package, Hash, Phone, MapPin, ChevronDown, ChevronRight,
  ScanBarcode, AlertCircle, Clock, CheckCircle2,
  DollarSign, Send, Loader2, MessageCircle, PackageCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { billProductShippingAction, markDeliveredAction } from './actions'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CustomerRow {
  orderId: string
  name: string
  contact: string
  location: string
  quantity: number
  unitPrice: number
  status: string
  shippingFee: number | null
  shippingNote: string | null
  momoNumber: string | null
  paymentRef: string | null
}

interface ProductGroup {
  productId: string
  productName: string
  productImage: string | null
  trackingNumber: string | null
  supplierName: string | null
  customers: CustomerRow[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('en-GH', { maximumFractionDigits: 0 })

// Statuses that count as "paid / in progress" — eligible to be billed shipping
const PAID_STATUSES = new Set([
  'product_paid', 'processing', 'arrived',
  'shipping_billed', 'shipping_paid', 'delivered',
])

// Statuses that can still be billed a shipping fee
const BILLABLE_STATUSES = new Set(['product_paid', 'processing', 'arrived'])

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  pending:         { label: 'Pending',       dot: 'bg-gray-400',    text: 'text-gray-500',    bg: 'bg-gray-100' },
  product_paid:    { label: 'Product Paid',  dot: 'bg-blue-500',    text: 'text-blue-700',    bg: 'bg-blue-50' },
  processing:      { label: 'Processing',    dot: 'bg-indigo-500',  text: 'text-indigo-700',  bg: 'bg-indigo-50' },
  arrived:         { label: 'Arrived',       dot: 'bg-purple-500',  text: 'text-purple-700',  bg: 'bg-purple-50' },
  shipping_billed: { label: 'Shipping Due',  dot: 'bg-orange-500',  text: 'text-orange-700',  bg: 'bg-orange-50' },
  shipping_paid:   { label: 'Shipping Paid', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  delivered:       { label: 'Delivered',     dot: 'bg-green-500',   text: 'text-green-700',   bg: 'bg-green-50' },
  cancelled:       { label: 'Cancelled',     dot: 'bg-red-400',     text: 'text-red-600',     bg: 'bg-red-50' },
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

function waMsg(
  name: string, contact: string, productName: string,
  qty: number, productTotal: number, fee: number, note?: string | null
) {
  const num = contact.replace(/\D/g, '')
  const msg = encodeURIComponent(
    `Hello ${name}! 👋\n\nYour item has arrived! 📦\n\n` +
    `*${productName}* × ${qty}\n` +
    `✅ Product (already paid): GH₵${fmt(productTotal)}\n` +
    `🚚 Shipping fee due: *GH₵${fmt(fee)}*\n` +
    (note ? `📝 ${note}\n\n` : '\n') +
    `Please send GH₵${fmt(fee)} via MoMo to receive your order. Thank you! 🙏`
  )
  return `https://wa.me/${num}?text=${msg}`
}

// ── Customer row ──────────────────────────────────────────────────────────────

function CustomerRow({
  c, i, productName, shippingFeePreview, onDeliver, delivering,
}: {
  c: CustomerRow
  i: number
  productName: string
  shippingFeePreview: string   // the fee currently typed in the input (not yet billed)
  onDeliver: (orderId: string) => void
  delivering: boolean
}) {
  const productTotal = c.unitPrice * c.quantity
  const billedFee    = c.shippingFee ?? 0

  return (
    <div className="grid grid-cols-[28px_1fr_90px_130px_auto] gap-x-3 items-center px-4 py-3 hover:bg-[var(--color-surface)] transition-colors">

      {/* Index */}
      <span className="text-xs font-bold text-[var(--color-text-muted)] text-center">{i + 1}</span>

      {/* Customer */}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{c.name}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {c.contact && (
            <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
              <Phone className="h-2.5 w-2.5 shrink-0" />{c.contact}
            </span>
          )}
          {c.location && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
              <MapPin className="h-2.5 w-2.5 shrink-0" />{c.location}
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right">
        <p className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">
          GH₵{fmt(productTotal)}
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">qty {c.quantity}</p>
      </div>

      {/* Status + shipping fee info */}
      <div className="space-y-1">
        <StatusBadge status={c.status} />
        {/* Show billed fee */}
        {billedFee > 0 && (
          <p className="text-[10px] font-semibold text-orange-600 tabular-nums">
            +GH₵{fmt(billedFee)} shipping
          </p>
        )}
        {/* Preview fee before billing */}
        {!billedFee && shippingFeePreview && parseFloat(shippingFeePreview) > 0 && BILLABLE_STATUSES.has(c.status) && (
          <p className="text-[10px] font-medium text-[var(--color-text-muted)] tabular-nums">
            will be billed GH₵{fmt(parseFloat(shippingFeePreview))}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* WhatsApp — show when billed or when fee is previewed */}
        {c.contact && c.status === 'shipping_billed' && billedFee > 0 && (
          <a
            href={waMsg(c.name, c.contact, productName, c.quantity, productTotal, billedFee, c.shippingNote)}
            target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
            title="WhatsApp"
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </a>
        )}

        {/* Deliver button for shipping_paid */}
        {c.status === 'shipping_paid' && (
          <button
            disabled={delivering}
            onClick={() => onDeliver(c.orderId)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 text-white text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {delivering
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <PackageCheck className="h-3 w-3" />}
            Deliver
          </button>
        )}

        {/* Delivered indicator */}
        {c.status === 'delivered' && (
          <span className="flex items-center gap-1 text-xs font-semibold text-[var(--color-success)]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Done
          </span>
        )}
      </div>
    </div>
  )
}

// ── Section (Paid or Pending) ─────────────────────────────────────────────────

function CustomerSection({
  title, icon, customers, emptyText, headerClass,
  productName, shippingFeePreview, onDeliver, delivering,
}: {
  title: string
  icon: React.ReactNode
  customers: CustomerRow[]
  emptyText: string
  headerClass: string
  productName: string
  shippingFeePreview: string
  onDeliver: (orderId: string) => void
  delivering: Record<string, boolean>
}) {
  return (
    <div>
      {/* Section header */}
      <div className={`flex items-center gap-2 px-4 py-2 border-y border-[var(--color-border)] ${headerClass}`}>
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        <span className="ml-auto text-xs font-semibold text-[var(--color-text-muted)] tabular-nums">
          {customers.length}
        </span>
      </div>

      {customers.length === 0 ? (
        <p className="px-4 py-3 text-xs text-[var(--color-text-muted)] italic">{emptyText}</p>
      ) : (
        <>
          {/* Column headers */}
          <div className="grid grid-cols-[28px_1fr_90px_130px_auto] gap-x-3 items-center px-4 py-1.5 bg-[var(--color-surface)]">
            <span />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Customer</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] text-right">Amount</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Status</span>
            <span />
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {customers.map((c, i) => (
              <CustomerRow
                key={c.orderId}
                c={c}
                i={i}
                productName={productName}
                shippingFeePreview={shippingFeePreview}
                onDeliver={onDeliver}
                delivering={!!delivering[c.orderId]}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({ group }: { group: ProductGroup }) {
  const [expanded,   setExpanded]   = useState(true)
  const [customers,  setCustomers]  = useState<CustomerRow[]>(group.customers)
  const [fee,        setFee]        = useState('')
  const [note,       setNote]       = useState('')
  const [billing,    setBilling]    = useState(false)
  const [delivering, setDelivering] = useState<Record<string, boolean>>({})

  const updateCustomer = (orderId: string, patch: Partial<CustomerRow>) =>
    setCustomers(prev => prev.map(c => c.orderId === orderId ? { ...c, ...patch } : c))

  const paid    = customers.filter(c => PAID_STATUSES.has(c.status))
  const pending = customers.filter(c => c.status === 'pending')

  // Customers who are paid but NOT yet billed shipping
  const billable = customers.filter(c => BILLABLE_STATUSES.has(c.status))

  const totalQty    = customers.reduce((s, c) => s + c.quantity, 0)
  const paidRevenue = paid.reduce((s, c) => s + c.unitPrice * c.quantity, 0)

  const handleBillShipping = async () => {
    const feeNum = parseFloat(fee)
    if (!feeNum || feeNum <= 0) { toast.error('Enter a valid shipping fee'); return }
    if (!billable.length) { toast.error('No eligible orders to bill'); return }

    setBilling(true)
    const result: any = await billProductShippingAction(
      billable.map(c => c.orderId),
      feeNum,
      note || undefined,
    )
    setBilling(false)

    if (result?.error) { toast.error(result.error); return }

    toast.success(`Shipping fee of GH₵${fmt(feeNum)} billed to ${billable.length} customer${billable.length !== 1 ? 's' : ''}!`)
    billable.forEach(c =>
      updateCustomer(c.orderId, {
        status: 'shipping_billed',
        shippingFee: feeNum,
        shippingNote: note || null,
      })
    )
    setFee('')
    setNote('')
  }

  const handleDeliver = async (orderId: string) => {
    setDelivering(p => ({ ...p, [orderId]: true }))
    const result: any = await markDeliveredAction(orderId)
    setDelivering(p => ({ ...p, [orderId]: false }))
    if (result?.error) { toast.error(result.error); return }
    toast.success('Order marked as delivered!')
    updateCustomer(orderId, { status: 'delivered' })
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">

      {/* ── Product header ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 bg-[var(--color-surface)] hover:bg-[var(--color-border)]/20 transition-colors"
      >
        <div className="flex items-center gap-4">

          {/* Thumbnail */}
          <div className="shrink-0">
            {group.productImage ? (
              <img
                src={group.productImage}
                alt={group.productName}
                className="h-12 w-12 rounded-xl object-cover border border-[var(--color-border)]"
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-[var(--color-brand-light)] flex items-center justify-center border border-[var(--color-border)]">
                <Package className="h-5 w-5 text-[var(--color-brand)]" />
              </div>
            )}
          </div>

          {/* Name + stats */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[var(--color-text-primary)] text-base leading-tight truncate">
              {group.productName}
            </p>
            {group.supplierName && (
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{group.supplierName}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-xs text-[var(--color-text-muted)]">
                <span className="font-semibold text-[var(--color-text-primary)]">{customers.length}</span>{' '}
                order{customers.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                <span className="font-semibold text-[var(--color-text-primary)]">{totalQty}</span>{' '}
                unit{totalQty !== 1 ? 's' : ''}
              </span>
              {paid.length > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-success)]">
                  <CheckCircle2 className="h-3 w-3" />
                  {paid.length} paid · GH₵{fmt(paidRevenue)}
                </span>
              )}
              {pending.length > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-warning)]">
                  <Clock className="h-3 w-3" />
                  {pending.length} pending
                </span>
              )}
              {billable.length > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-orange-600">
                  <DollarSign className="h-3 w-3" />
                  {billable.length} need shipping billed
                </span>
              )}
            </div>
          </div>

          {/* Tracking — desktop */}
          <div className="shrink-0 hidden sm:block">
            {group.trackingNumber ? (
              <span className="inline-flex items-center gap-2 font-mono text-sm font-bold bg-[var(--color-success-light)] border border-[var(--color-success)]/20 text-[var(--color-success)] px-3 py-1.5 rounded-lg">
                <ScanBarcode className="h-3.5 w-3.5 shrink-0" />
                {group.trackingNumber}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-warning)] border border-dashed border-[var(--color-warning)]/40 bg-[var(--color-warning-light)] px-2.5 py-1.5 rounded-lg">
                <Hash className="h-3.5 w-3.5" />
                No tracking
              </span>
            )}
          </div>

          {/* Chevron */}
          <div className="shrink-0 text-[var(--color-text-muted)]">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </div>

        {/* Tracking — mobile */}
        <div className="sm:hidden mt-2.5">
          {group.trackingNumber ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold bg-[var(--color-success-light)] border border-[var(--color-success)]/20 text-[var(--color-success)] px-2.5 py-1 rounded-lg">
              <ScanBarcode className="h-3 w-3" />
              {group.trackingNumber}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-warning)] border border-dashed border-[var(--color-warning)]/40 bg-[var(--color-warning-light)] px-2 py-1 rounded-lg">
              <Hash className="h-3 w-3" />
              No tracking
            </span>
          )}
        </div>
      </button>

      {/* ── Expanded body ── */}
      {expanded && (
        <>
          {/* ── SHIPPING FEE PANEL — only when there are billable orders ── */}
          {billable.length > 0 && (
            <div className="px-5 py-4 bg-orange-50 border-b border-orange-200">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-orange-500 shrink-0" />
                <p className="text-sm font-semibold text-orange-800">
                  Set shipping fee for this product
                </p>
                <span className="text-xs text-orange-600 ml-1">
                  — applies to all {billable.length} paid customer{billable.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-end gap-3 flex-wrap">
                {/* Fee input */}
                <div>
                  <label className="block text-xs font-medium text-orange-700 mb-1">
                    Shipping fee (GH₵) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 50"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="w-32 px-3 py-2 rounded-lg border border-orange-300 bg-white text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                </div>

                {/* Note input */}
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs font-medium text-orange-700 mb-1">
                    Note to customers (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Send to 055-XXX-XXXX"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-orange-300 bg-white text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                </div>

                {/* Bill button */}
                <button
                  disabled={billing || !fee || parseFloat(fee) <= 0}
                  onClick={handleBillShipping}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {billing
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />}
                  Bill {billable.length > 1 ? `All ${billable.length}` : 'Customer'}
                </button>

                {/* Per-customer WhatsApp buttons — shown once fee is typed */}
                {fee && parseFloat(fee) > 0 && billable.map(c => (
                  c.contact ? (
                    <a
                      key={c.orderId}
                      href={waMsg(c.name, c.contact, group.productName, c.quantity, c.unitPrice * c.quantity, parseFloat(fee), note)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                      title={`WhatsApp ${c.name}`}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {billable.length > 1 ? c.name.split(' ')[0] : 'WhatsApp'}
                    </a>
                  ) : null
                ))}
              </div>
            </div>
          )}

          {/* ── PAID customers ── */}
          <CustomerSection
            title="Paid"
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)]" />}
            customers={paid}
            emptyText="No payments received yet."
            headerClass="bg-[var(--color-success-light)]"
            productName={group.productName}
            shippingFeePreview={fee}
            onDeliver={handleDeliver}
            delivering={delivering}
          />

          {/* ── PENDING customers ── */}
          <CustomerSection
            title="Awaiting Payment"
            icon={<Clock className="h-3.5 w-3.5 text-[var(--color-warning)]" />}
            customers={pending}
            emptyText="No pending payments."
            headerClass="bg-[var(--color-warning-light)]"
            productName={group.productName}
            shippingFeePreview=""
            onDeliver={handleDeliver}
            delivering={delivering}
          />
        </>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function PreOrderMonthClient({
  groups,
  monthLabel,
}: {
  groups: ProductGroup[]
  monthLabel: string
}) {
  const totalOrders    = groups.reduce((s, g) => s + g.customers.length, 0)
  const totalPaid      = groups.reduce((s, g) => s + g.customers.filter(c => PAID_STATUSES.has(c.status)).length, 0)
  const totalPending   = groups.reduce((s, g) => s + g.customers.filter(c => c.status === 'pending').length, 0)
  const needsBilling   = groups.reduce((s, g) => s + g.customers.filter(c => BILLABLE_STATUSES.has(c.status)).length, 0)
  const needsTracking  = groups.filter(g => !g.trackingNumber).length

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] p-12 text-center">
        <Package className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
        <p className="text-sm font-medium text-[var(--color-text-muted)]">No orders for {monthLabel}.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Summary bar */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 flex items-center gap-4 flex-wrap shadow-sm">
        <span className="text-sm text-[var(--color-text-muted)]">
          <span className="font-semibold text-[var(--color-text-primary)]">{groups.length}</span>{' '}
          product{groups.length !== 1 ? 's' : ''}
        </span>
        <span className="h-4 w-px bg-[var(--color-border)]" />
        <span className="text-sm text-[var(--color-text-muted)]">
          <span className="font-semibold text-[var(--color-text-primary)]">{totalOrders}</span>{' '}
          order{totalOrders !== 1 ? 's' : ''}
        </span>
        {totalPaid > 0 && (
          <>
            <span className="h-4 w-px bg-[var(--color-border)]" />
            <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-success)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {totalPaid} paid
            </span>
          </>
        )}
        {totalPending > 0 && (
          <>
            <span className="h-4 w-px bg-[var(--color-border)]" />
            <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-warning)]">
              <Clock className="h-3.5 w-3.5" />
              {totalPending} pending
            </span>
          </>
        )}
        {needsBilling > 0 && (
          <>
            <span className="h-4 w-px bg-[var(--color-border)]" />
            <span className="flex items-center gap-1.5 text-sm font-medium text-orange-600">
              <DollarSign className="h-3.5 w-3.5" />
              {needsBilling} need shipping billed
            </span>
          </>
        )}
        {needsTracking > 0 && (
          <>
            <span className="h-4 w-px bg-[var(--color-border)]" />
            <span className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
              <AlertCircle className="h-3.5 w-3.5" />
              {needsTracking} missing tracking
            </span>
          </>
        )}
      </div>

      {/* Product cards */}
      {groups.map((g) => (
        <ProductCard key={g.productId} group={g} />
      ))}
    </div>
  )
}