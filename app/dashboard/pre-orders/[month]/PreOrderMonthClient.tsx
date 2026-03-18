'use client'

import { useState } from 'react'
import {
  Package, Hash, CheckCircle2, AlertCircle, MessageCircle,
  Edit2, X, Check, Loader2, Send, Phone, MapPin,
  PackageCheck, DollarSign, ChevronDown, ChevronRight,
  Truck, ScanBarcode, Users,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  saveTrackingAction,
  billProductShippingAction,
  billSingleShippingAction,
  markDeliveredAction,
} from './actions'

export type { CustomerRow, ProductGroup } from './types'
import type { CustomerRow, ProductGroup } from './types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('en-GH', { maximumFractionDigits: 0 })

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  pending:         { label: 'Pending',          dot: 'bg-gray-400',                          text: 'text-gray-600',                         bg: 'bg-gray-100' },
  product_paid:    { label: 'Product Paid',      dot: 'bg-blue-500',                          text: 'text-blue-700',                         bg: 'bg-blue-50' },
  processing:      { label: 'Processing',        dot: 'bg-indigo-500',                        text: 'text-indigo-700',                       bg: 'bg-indigo-50' },
  arrived:         { label: 'Arrived',           dot: 'bg-purple-500',                        text: 'text-purple-700',                       bg: 'bg-purple-50' },
  shipping_billed: { label: 'Shipping Due',      dot: 'bg-orange-500',                        text: 'text-orange-700',                       bg: 'bg-orange-50' },
  shipping_paid:   { label: 'Shipping Paid',     dot: 'bg-emerald-500',                       text: 'text-emerald-700',                      bg: 'bg-emerald-50' },
  delivered:       { label: 'Delivered',         dot: 'bg-green-500',                         text: 'text-green-700',                        bg: 'bg-green-50' },
  cancelled:       { label: 'Cancelled',         dot: 'bg-red-400',                           text: 'text-red-600',                          bg: 'bg-red-50' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['pending']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function waMsg(name: string, contact: string, productName: string, qty: number, productTotal: number, fee: number, note?: string | null) {
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

// ── Inline Tracking Editor ────────────────────────────────────────────────────

function TrackingEditor({ productId, initial, onSaved }: {
  productId: string
  initial: string | null
  onSaved: (v: string | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initial || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const r: any = await saveTrackingAction(productId, value)
    setSaving(false)
    if (r.error) { toast.error(r.error); return }
    toast.success('Tracking number saved!')
    onSaved(value.trim().toUpperCase() || null)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="group flex items-center gap-2"
        title="Click to edit tracking number"
      >
        {initial ? (
          <span className="flex items-center gap-2 font-mono text-sm font-bold bg-[var(--color-success-light)] border border-[var(--color-success)]/20 text-[var(--color-success)] px-3 py-1.5 rounded-lg group-hover:border-[var(--color-success)]/60 transition-colors">
            <ScanBarcode className="h-3.5 w-3.5 shrink-0" />
            {initial}
            <Edit2 className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity" />
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-warning)] border border-dashed border-[var(--color-warning)]/40 bg-[var(--color-warning-light)] hover:bg-[var(--color-warning-light)] px-3 py-1.5 rounded-lg transition-colors">
            <Hash className="h-3.5 w-3.5" />
            Add tracking
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') { setValue(initial || ''); setEditing(false) }
        }}
        placeholder="e.g. CN123456789"
        className="w-48 px-3 py-1.5 rounded-lg border-2 border-[var(--color-brand)] bg-white text-sm font-mono focus:outline-none"
      />
      <button onClick={save} disabled={saving} className="p-1.5 rounded-lg bg-[var(--color-success)] text-white disabled:opacity-50 hover:bg-[var(--color-success)]/90 transition-colors">
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      </button>
      <button onClick={() => { setValue(initial || ''); setEditing(false) }} className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ── Customer Row ──────────────────────────────────────────────────────────────

function CustomerRow({
  c, idx, group,
  shippingFee, shippingNote,
  onDeliver, delivering,
}: {
  c: CustomerRow
  idx: number
  group: ProductGroup
  shippingFee: string
  shippingNote: string
  onDeliver: (orderId: string) => void
  delivering: boolean
}) {
  const productTotal = c.unitPrice * c.quantity
  const fee = c.shippingFee || 0
  const status = c.status

  return (
    <div className="grid grid-cols-[28px_1fr_auto_auto_auto] gap-x-3 items-center px-4 py-3 hover:bg-[var(--color-surface)] transition-colors border-b border-[var(--color-border)] last:border-b-0">
      {/* Index */}
      <span className="text-xs font-bold text-[var(--color-text-muted)] text-center">{idx + 1}</span>

      {/* Customer info */}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{c.name}</p>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {c.contact && (
            <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
              <Phone className="h-2.5 w-2.5" />{c.contact}
            </span>
          )}
          {c.location && (
            <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
              <MapPin className="h-2.5 w-2.5" />{c.location}
            </span>
          )}
        </div>
      </div>

      {/* Qty + amount */}
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">GH₵{fmt(productTotal)}</p>
        <p className="text-xs text-[var(--color-text-muted)]">qty {c.quantity}</p>
      </div>

      {/* Status */}
      <div className="shrink-0">
        <StatusBadge status={status} />
        {/* Extra info below badge */}
        {status === 'shipping_billed' && fee > 0 && (
          <p className="text-[10px] text-orange-600 font-semibold mt-0.5 text-right">GH₵{fmt(fee)} due</p>
        )}
        {status === 'shipping_paid' && (
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 text-right">Verify ↓</p>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-1.5">
        {/* WhatsApp button — show when billing fee entered or already billed */}
        {(status === 'shipping_billed' || (shippingFee && parseFloat(shippingFee) > 0)) && c.contact && (
          <a
            href={waMsg(
              c.name, c.contact, group.productName, c.quantity, productTotal,
              status === 'shipping_billed' ? fee : parseFloat(shippingFee || '0'),
              status === 'shipping_billed' ? c.shippingNote : undefined
            )}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
            title="WhatsApp"
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </a>
        )}

        {/* Deliver button */}
        {status === 'shipping_paid' && (
          <button
            disabled={delivering}
            onClick={() => onDeliver(c.orderId)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 text-white text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {delivering ? <Loader2 className="h-3 w-3 animate-spin" /> : <PackageCheck className="h-3 w-3" />}
            Deliver
          </button>
        )}

        {/* Delivered */}
        {status === 'delivered' && (
          <span className="flex items-center gap-1 text-xs font-semibold text-[var(--color-success)]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Done
          </span>
        )}
      </div>
    </div>
  )
}

// ── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({ group }: { group: ProductGroup }) {
  const [tracking, setTracking] = useState(group.trackingNumber)
  const [customers, setCustomers] = useState<CustomerRow[]>(group.customers)
  const [expanded, setExpanded] = useState(true)

  const [sharedFee, setSharedFee] = useState('')
  const [sharedNote, setSharedNote] = useState('')
  const [billingAll, setBillingAll] = useState(false)
  const [delivering, setDelivering] = useState<Record<string, boolean>>({})

  const updateCustomer = (orderId: string, patch: Partial<CustomerRow>) =>
    setCustomers(prev => prev.map(c => c.orderId === orderId ? { ...c, ...patch } : c))

  const billableOrders = customers.filter(c =>
    ['pending', 'product_paid', 'processing', 'arrived'].includes(c.status)
  )
  const awaitingPayment = customers.filter(c => c.status === 'shipping_billed').length
  const awaitingVerification = customers.filter(c => c.status === 'shipping_paid').length
  const delivered = customers.filter(c => c.status === 'delivered').length

  const totalQty = customers.reduce((s, c) => s + c.quantity, 0)
  const totalRevenue = customers.reduce((s, c) => s + c.unitPrice * c.quantity, 0)

  const handleBillAll = async () => {
    const feeNum = parseFloat(sharedFee)
    if (!feeNum || feeNum <= 0) { toast.error('Enter a shipping fee first'); return }
    if (!billableOrders.length) { toast.error('No orders to bill'); return }
    setBillingAll(true)
    const ids = billableOrders.map(c => c.orderId)
    const r: any = await billProductShippingAction(ids, feeNum, sharedNote)
    setBillingAll(false)
    if (r.error) { toast.error(r.error); return }
    toast.success(`Shipping billed to ${ids.length} customer${ids.length !== 1 ? 's' : ''}!`)
    ids.forEach(id => updateCustomer(id, { status: 'shipping_billed', shippingFee: feeNum, shippingNote: sharedNote }))
    setSharedFee('')
    setSharedNote('')
  }

  const handleDeliver = async (orderId: string) => {
    setDelivering(p => ({ ...p, [orderId]: true }))
    const r: any = await markDeliveredAction(orderId)
    setDelivering(p => ({ ...p, [orderId]: false }))
    if (r.error) { toast.error(r.error); return }
    toast.success('Order delivered!')
    updateCustomer(orderId, { status: 'delivered' })
  }

  const hasAlerts = awaitingPayment > 0 || awaitingVerification > 0 || !tracking

  return (
    <div className={`rounded-2xl border bg-[var(--color-card)] shadow-sm overflow-hidden transition-all ${
      hasAlerts ? 'border-orange-200' : 'border-[var(--color-border)]'
    }`}>

      {/* ── Product Header ── */}
      <div className={`px-5 py-4 ${hasAlerts ? 'bg-orange-50/60' : 'bg-[var(--color-surface)]'}`}>
        <div className="flex items-start gap-4 flex-wrap">

          {/* Thumbnail */}
          <div className="shrink-0">
            {group.productImage ? (
              <img
                src={group.productImage}
                alt={group.productName}
                className="h-14 w-14 rounded-xl object-cover border border-[var(--color-border)] shadow-sm"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-[var(--color-brand-light)] flex items-center justify-center border border-[var(--color-border)]">
                <Package className="h-6 w-6 text-[var(--color-brand)]" />
              </div>
            )}
          </div>

          {/* Product info + tracking */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-bold text-[var(--color-text-primary)] text-base leading-tight">{group.productName}</h3>
                {group.supplierName && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{group.supplierName}</p>
                )}
              </div>
              {/* Tracking — right side of title */}
              <TrackingEditor productId={group.productId} initial={tracking} onSaved={setTracking} />
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 mt-2.5 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                <Users className="h-3 w-3" />
                <span className="font-semibold text-[var(--color-text-primary)]">{customers.length}</span> customer{customers.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                <Package className="h-3 w-3" />
                <span className="font-semibold text-[var(--color-text-primary)]">{totalQty}</span> unit{totalQty !== 1 ? 's' : ''}
              </span>
              <span className="text-xs font-medium text-[var(--color-text-muted)]">
                <span className="font-semibold text-[var(--color-brand)]">GH₵{fmt(totalRevenue)}</span> product total
              </span>

              {/* Alert pills */}
              {awaitingPayment > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                  <AlertCircle className="h-3 w-3" />
                  {awaitingPayment} awaiting payment
                </span>
              )}
              {awaitingVerification > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  {awaitingVerification} to verify
                </span>
              )}
              {delivered > 0 && delivered === customers.length && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  <PackageCheck className="h-3 w-3" />
                  All delivered
                </span>
              )}
            </div>
          </div>

          {/* Expand/collapse toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors text-[var(--color-text-muted)] shrink-0"
          >
            {expanded
              ? <ChevronDown className="h-4 w-4" />
              : <ChevronRight className="h-4 w-4" />
            }
          </button>
        </div>
      </div>

      {/* ── Customer List ── */}
      {expanded && (
        <>
          {/* Column headers */}
          <div className="grid grid-cols-[28px_1fr_auto_auto_auto] gap-x-3 items-center px-4 py-2 bg-[var(--color-surface)] border-y border-[var(--color-border)]">
            <span />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Customer</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] text-right">Amount</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Status</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Actions</span>
          </div>

          {/* Rows */}
          <div>
            {customers.map((c, i) => (
              <CustomerRow
                key={c.orderId}
                c={c}
                idx={i}
                group={group}
                shippingFee={sharedFee}
                shippingNote={sharedNote}
                onDeliver={handleDeliver}
                delivering={!!delivering[c.orderId]}
              />
            ))}
          </div>

          {/* ── Shipping Fee Panel ── */}
          {billableOrders.length > 0 && (
            <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-orange-500" />
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Bill Shipping Fee
                </p>
                <span className="text-xs text-[var(--color-text-muted)]">
                  — bills all {billableOrders.length} unbilled customer{billableOrders.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-end gap-3 flex-wrap">
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Shipping fee (GH₵) *</label>
                  <input
                    type="number" step="0.01" min="0" placeholder="e.g. 50"
                    value={sharedFee}
                    onChange={(e) => setSharedFee(e.target.value)}
                    className="w-32 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:ring-2 focus:ring-[var(--color-brand)] focus:outline-none"
                  />
                </div>
                <div className="flex-1 min-w-[160px]">
                  <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Note to customer</label>
                  <input
                    type="text" placeholder="e.g. Send to 055-XXX-XXXX"
                    value={sharedNote}
                    onChange={(e) => setSharedNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:ring-2 focus:ring-[var(--color-brand)] focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={billingAll}
                    onClick={handleBillAll}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                  >
                    {billingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Bill {billableOrders.length > 1 ? `All ${billableOrders.length}` : 'Customer'}
                  </button>

                  {/* Individual WhatsApp buttons when fee is entered */}
                  {sharedFee && parseFloat(sharedFee) > 0 && billableOrders.map(c => (
                    c.contact ? (
                      <a
                        key={c.orderId}
                        href={waMsg(c.name, c.contact, group.productName, c.quantity, c.unitPrice * c.quantity, parseFloat(sharedFee), sharedNote)}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors"
                        title={`WhatsApp ${c.name}`}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {billableOrders.length > 1 ? c.name.split(' ')[0] : 'WhatsApp'}
                      </a>
                    ) : null
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function PreOrderMonthClient({ groups, monthLabel }: {
  groups: ProductGroup[]
  monthLabel: string
}) {
  // Summary stats
  const totalOrders = groups.reduce((s, g) => s + g.customers.length, 0)
  const totalProducts = groups.length
  const allDelivered = groups.every(g => g.customers.every(c => c.status === 'delivered'))
  const needsTracking = groups.filter(g => !g.trackingNumber).length
  const awaitingVerification = groups.reduce(
    (s, g) => s + g.customers.filter(c => c.status === 'shipping_paid').length, 0
  )

  return (
    <div className="space-y-4">

      {/* ── Month summary bar ── */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4 flex items-center gap-6 flex-wrap shadow-sm">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-[var(--color-brand)]" />
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{totalProducts} product{totalProducts !== 1 ? 's' : ''}</span>
        </div>
        <div className="h-4 w-px bg-[var(--color-border)]" />
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[var(--color-text-muted)]" />
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{totalOrders} order{totalOrders !== 1 ? 's' : ''}</span>
        </div>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {needsTracking > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-warning-light)] text-[var(--color-warning)] text-xs font-semibold">
              <Hash className="h-3 w-3" />
              {needsTracking} need tracking
            </span>
          )}
          {awaitingVerification > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="h-3 w-3" />
              {awaitingVerification} to verify & deliver
            </span>
          )}
          {allDelivered && totalOrders > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
              <PackageCheck className="h-3 w-3" />
              Batch complete
            </span>
          )}
        </div>
      </div>

      {/* ── Product Cards ── */}
      {groups.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] p-12 text-center">
          <Package className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
          <p className="text-sm font-medium text-[var(--color-text-muted)]">No orders for {monthLabel}.</p>
        </div>
      ) : (
        groups.map((g) => <ProductCard key={g.productId} group={g} />)
      )}
    </div>
  )
}