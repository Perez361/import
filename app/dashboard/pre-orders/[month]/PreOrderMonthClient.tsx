'use client'

import { useState } from 'react'
import {
  Package, Hash, CheckCircle2, AlertCircle, MessageCircle,
  Edit2, X, Check, Loader2, Send, Phone, MapPin,
  PackageCheck, DollarSign, ChevronDown, ChevronUp,
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

const STATUS_COLOR: Record<string, string> = {
  pending:         'bg-gray-100 text-gray-600',
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
  shipping_paid:   'Shipping Paid ✓',
  delivered:       'Delivered',
  cancelled:       'Cancelled',
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

// ── Inline tracking editor ────────────────────────────────────────────────────

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
        className="group flex items-center gap-2 text-left"
        title="Click to edit"
      >
        {initial ? (
          <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[var(--color-success-light)] border border-[var(--color-success)]/30 text-[var(--color-success)] px-2.5 py-1 rounded-lg group-hover:border-[var(--color-success)] transition-colors">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            {initial}
            <Edit2 className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-orange-600 font-semibold border border-dashed border-orange-300 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition-colors">
            <Hash className="h-3 w-3" />
            Add tracking
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') { setValue(initial || ''); setEditing(false) }
        }}
        placeholder="Tracking number"
        className="w-44 px-2.5 py-1 rounded-lg border border-[var(--color-brand)] bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
      />
      <button onClick={save} disabled={saving} className="p-1 rounded-lg bg-[var(--color-success)] text-white disabled:opacity-50">
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
      </button>
      <button onClick={() => { setValue(initial || ''); setEditing(false) }} className="p-1 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)]">
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

// ── Product card — the main unit ──────────────────────────────────────────────

function ProductCard({ group }: { group: ProductGroup }) {
  const [tracking, setTracking] = useState(group.trackingNumber)
  const [customers, setCustomers] = useState<CustomerRow[]>(group.customers)

  // Shared shipping fee for the whole product (bills all at once)
  const [sharedFee, setSharedFee] = useState('')
  const [sharedNote, setSharedNote] = useState('')
  const [billingAll, setBillingAll] = useState(false)

  // Per-customer deliver state
  const [delivering, setDelivering] = useState<Record<string, boolean>>({})

  const updateCustomer = (orderId: string, patch: Partial<CustomerRow>) =>
    setCustomers(prev => prev.map(c => c.orderId === orderId ? { ...c, ...patch } : c))

  // Orders that can still be billed (not yet billed, delivered, or cancelled)
  const billableOrders = customers.filter(c =>
    ['pending', 'product_paid', 'processing', 'arrived'].includes(c.status)
  )
  const awaitingPayment = customers.filter(c => c.status === 'shipping_billed')
  const awaitingVerification = customers.filter(c => c.status === 'shipping_paid')

  const handleBillAll = async () => {
    const feeNum = parseFloat(sharedFee)
    if (!feeNum || feeNum <= 0) { toast.error('Enter a shipping fee first'); return }
    if (!billableOrders.length) { toast.error('No orders to bill'); return }
    setBillingAll(true)
    const ids = billableOrders.map(c => c.orderId)
    const r: any = await billProductShippingAction(ids, feeNum, sharedNote)
    setBillingAll(false)
    if (r.error) { toast.error(r.error); return }
    toast.success(`Shipping fee of GH₵${fmt(feeNum)} billed to ${ids.length} customer${ids.length !== 1 ? 's' : ''}!`)
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

  const totalQty = customers.reduce((s, c) => s + c.quantity, 0)

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">

      {/* ── Product header ── */}
      <div className={`px-5 py-4 ${!tracking ? 'bg-orange-50 border-b border-orange-100' : 'bg-[var(--color-surface)] border-b border-[var(--color-border)]'}`}>
        <div className="flex items-center gap-3 flex-wrap">

          {/* Thumbnail */}
          {group.productImage ? (
            <img src={group.productImage} alt={group.productName} className="h-11 w-11 rounded-xl object-cover border border-[var(--color-border)] shrink-0" />
          ) : (
            <div className="h-11 w-11 rounded-xl bg-[var(--color-brand-light)] flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-[var(--color-brand)]" />
            </div>
          )}

          {/* Name */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[var(--color-text-primary)] text-base">{group.productName}</p>
            {group.supplierName && <p className="text-xs text-[var(--color-text-muted)]">{group.supplierName}</p>}
          </div>

          {/* Tracking badge */}
          <TrackingEditor productId={group.productId} initial={tracking} onSaved={setTracking} />

          {/* Customer count */}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand)]">
            {customers.length} customer{customers.length !== 1 ? 's' : ''} · {totalQty} unit{totalQty !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Status alerts */}
        {(awaitingPayment.length > 0 || awaitingVerification.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-2.5">
            {awaitingPayment.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                {awaitingPayment.length} awaiting payment
              </span>
            )}
            {awaitingVerification.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                {awaitingVerification.length} to verify & deliver
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Customer list ── */}
      <div className="divide-y divide-[var(--color-border)]">
        {customers.map((c, i) => {
          const productTotal = c.unitPrice * c.quantity
          const fee = c.shippingFee || 0
          const status = c.status

          return (
            <div key={c.orderId} className="px-5 py-3.5">

              {/* Customer summary row — always visible */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Number */}
                <span className="text-sm font-bold text-[var(--color-text-muted)] w-5 shrink-0">{i + 1}.</span>

                {/* Avatar initial */}
                <div className="h-8 w-8 rounded-full bg-[var(--color-brand-light)] flex items-center justify-center text-[var(--color-brand)] text-xs font-bold shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>

                {/* Name + contact */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--color-text-primary)] text-sm">{c.name}</p>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] flex-wrap">
                    {c.contact && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-2.5 w-2.5" />{c.contact}
                      </span>
                    )}
                    {c.location && (
                      <span className="flex items-center gap-1">
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

                {/* Status badge */}
                <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_COLOR[status] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABEL[status] || status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* ── Shipping billed: show fee + resend WA ── */}
              {status === 'shipping_billed' && (
                <div className="mt-2.5 ml-11 flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg">
                    Shipping: GH₵{fmt(fee)} due
                  </span>
                  {c.contact && (
                    <a
                      href={waMsg(c.name, c.contact, group.productName, c.quantity, productTotal, fee, c.shippingNote)}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <MessageCircle className="h-3 w-3" /> Remind on WhatsApp
                    </a>
                  )}
                </div>
              )}

              {/* ── Shipping paid: verify + deliver ── */}
              {status === 'shipping_paid' && (
                <div className="mt-2.5 ml-11 p-3 rounded-xl border border-[var(--color-success)] bg-[var(--color-success-light)] space-y-2">
                  <p className="text-xs font-semibold text-[var(--color-success)] flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Customer paid shipping — GH₵{fmt(fee)}
                  </p>
                  {(c.momoNumber || c.paymentRef) && (
                    <div className="flex gap-4 text-xs text-[var(--color-text-muted)]">
                      {c.momoNumber && <span>MoMo: <strong className="text-[var(--color-text-primary)]">{c.momoNumber}</strong></span>}
                      {c.paymentRef && <span>Ref: <strong className="font-mono text-[var(--color-text-primary)]">{c.paymentRef}</strong></span>}
                    </div>
                  )}
                  <button
                    disabled={delivering[c.orderId]}
                    onClick={() => handleDeliver(c.orderId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-success)] text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {delivering[c.orderId] ? <Loader2 className="h-3 w-3 animate-spin" /> : <PackageCheck className="h-3 w-3" />}
                    Verify & Mark Delivered
                  </button>
                </div>
              )}

              {/* ── Delivered ── */}
              {status === 'delivered' && (
                <div className="mt-2 ml-11 flex items-center gap-1.5 text-xs text-[var(--color-success)] font-semibold">
                  <PackageCheck className="h-3.5 w-3.5" />
                  Delivered · GH₵{fmt(productTotal + fee)} collected
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Shipping fee panel (only if there are unbilled orders) ── */}
      {billableOrders.length > 0 && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-orange-500" />
            Set shipping fee for this product
            <span className="text-xs font-normal text-[var(--color-text-muted)]">— bills all {billableOrders.length} unbilled customer{billableOrders.length !== 1 ? 's' : ''} at once</span>
          </p>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Shipping fee (GH₵) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 50"
                value={sharedFee}
                onChange={(e) => setSharedFee(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-white text-sm focus:ring-2 focus:ring-[var(--color-brand)] focus:outline-none"
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Note to customer (optional)</label>
              <input
                type="text"
                placeholder="e.g. Send to 055-XXX-XXXX"
                value={sharedNote}
                onChange={(e) => setSharedNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-white text-sm focus:ring-2 focus:ring-[var(--color-brand)] focus:outline-none"
              />
            </div>
            <div className="flex gap-2 pb-0">
              <button
                disabled={billingAll}
                onClick={handleBillAll}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {billingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Bill {billableOrders.length > 1 ? `All ${billableOrders.length}` : 'Customer'}
              </button>

              {/* WhatsApp all buttons — only shown once fee is entered */}
              {sharedFee && parseFloat(sharedFee) > 0 && billableOrders.map(c => (
                c.contact ? (
                  <a
                    key={c.orderId}
                    href={waMsg(c.name, c.contact, group.productName, c.quantity, c.unitPrice * c.quantity, parseFloat(sharedFee), sharedNote)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors whitespace-nowrap"
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
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function PreOrderMonthClient({ groups, monthLabel }: {
  groups: ProductGroup[]
  monthLabel: string
}) {
  return (
    <div className="space-y-5">
      {groups.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] p-10 text-center">
          <Package className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--color-text-muted)]">No orders for {monthLabel}.</p>
        </div>
      ) : (
        groups.map((g) => <ProductCard key={g.productId} group={g} />)
      )}
    </div>
  )
}