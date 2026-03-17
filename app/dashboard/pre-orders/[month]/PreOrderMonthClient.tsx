'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Package, Hash, CheckCircle2, AlertCircle, MessageCircle,
  Edit2, X, Check, Loader2, Send, Truck, Phone, MapPin,
  ChevronDown, ChevronUp, DollarSign, PackageCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { saveTrackingAction, billShippingAction, markDeliveredAction } from './actions'

// ── Types ─────────────────────────────────────────────────────────────────────

export type { CustomerRow, ProductGroup } from './types'
import type { CustomerRow, ProductGroup } from './types'

// ── Helpers ───────────────────────────────────────────────────────────────────

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

const fmt = (n: number) => n.toLocaleString('en-GH', { maximumFractionDigits: 0 })

function waLink(name: string, contact: string, productName: string, qty: number, productTotal: number, fee: number, note?: string | null) {
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

// ── Tracking inline editor ────────────────────────────────────────────────────

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
      <button onClick={() => setEditing(true)} className="group flex items-center gap-1.5 text-left">
        {initial ? (
          <span className="flex items-center gap-1.5 font-mono text-sm bg-white border border-[var(--color-border)] group-hover:border-[var(--color-brand)] px-3 py-1.5 rounded-lg text-[var(--color-text-primary)] transition-colors font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)] shrink-0" />
            {initial}
            <Edit2 className="h-3 w-3 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-orange-600 font-semibold border border-dashed border-orange-300 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors">
            <Hash className="h-3.5 w-3.5" />
            Add tracking number
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setValue(initial || ''); setEditing(false) } }}
        placeholder="e.g. 1Z999AA10123456784"
        className="w-52 px-3 py-1.5 rounded-lg border border-[var(--color-brand)] bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
      />
      <button onClick={save} disabled={saving} className="p-1.5 rounded-lg bg-[var(--color-success)] text-white hover:opacity-90 disabled:opacity-50">
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      </button>
      <button onClick={() => { setValue(initial || ''); setEditing(false) }} className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)]">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ── Customer row with billing actions ─────────────────────────────────────────

function CustomerCard({ customer, productName, onUpdate }: {
  customer: CustomerRow
  productName: string
  onUpdate: (orderId: string, patch: Partial<CustomerRow>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [fee, setFee] = useState(customer.shippingFee ? String(customer.shippingFee) : '')
  const [note, setNote] = useState(customer.shippingNote || '')
  const [billing, setBilling] = useState(false)
  const [delivering, setDelivering] = useState(false)

  const productTotal = customer.unitPrice * customer.quantity
  const shippingFee = customer.shippingFee || 0
  const status = customer.status

  const handleBill = async () => {
    const feeNum = parseFloat(fee)
    if (!feeNum || feeNum <= 0) { toast.error('Enter a valid shipping fee'); return }
    setBilling(true)
    const r: any = await billShippingAction(customer.orderId, feeNum, note)
    setBilling(false)
    if (r.error) { toast.error(r.error); return }
    toast.success('Shipping fee billed!')
    onUpdate(customer.orderId, { status: 'shipping_billed', shippingFee: feeNum, shippingNote: note })
  }

  const handleDeliver = async () => {
    setDelivering(true)
    const r: any = await markDeliveredAction(customer.orderId)
    setDelivering(false)
    if (r.error) { toast.error(r.error); return }
    toast.success('Order marked as delivered!')
    onUpdate(customer.orderId, { status: 'delivered' })
  }

  return (
    <div className="border-b border-[var(--color-border)] last:border-0">
      {/* Summary row */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div className="h-9 w-9 rounded-full bg-[var(--color-brand-light)] flex items-center justify-center text-[var(--color-brand)] text-sm font-bold shrink-0">
          {customer.name.charAt(0).toUpperCase()}
        </div>

        {/* Name + contact */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--color-text-primary)] text-sm truncate">{customer.name}</p>
          <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
            {customer.contact && <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{customer.contact}</span>}
            {customer.location && <span className="flex items-center gap-1 hidden sm:flex"><MapPin className="h-2.5 w-2.5" />{customer.location}</span>}
          </div>
        </div>

        {/* Qty + amount */}
        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">GH₵{fmt(productTotal)}</p>
          <p className="text-xs text-[var(--color-text-muted)]">qty {customer.quantity}</p>
        </div>

        {/* Status */}
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[status] || 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABEL[status] || status.replace(/_/g, ' ')}
        </span>

        {expanded
          ? <ChevronUp className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
          : <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />}
      </div>

      {/* Expanded actions panel */}
      {expanded && (
        <div className="px-5 pb-4 space-y-3 bg-[var(--color-surface)] border-t border-[var(--color-border)]">

          {/* Order details */}
          <div className="flex gap-4 pt-3 text-sm flex-wrap">
            <div><p className="text-xs text-[var(--color-text-muted)]">Order ID</p><p className="font-mono font-semibold">#{customer.orderId.slice(-8).toUpperCase()}</p></div>
            <div><p className="text-xs text-[var(--color-text-muted)]">Product total</p><p className="font-semibold tabular-nums">GH₵{fmt(productTotal)}</p></div>
            {shippingFee > 0 && <div><p className="text-xs text-[var(--color-text-muted)]">Shipping fee</p><p className="font-semibold text-orange-600 tabular-nums">GH₵{fmt(shippingFee)}</p></div>}
            {customer.location && <div className="sm:hidden"><p className="text-xs text-[var(--color-text-muted)]">Location</p><p className="font-semibold">{customer.location}</p></div>}
          </div>

          {/* ── Bill shipping (arrived, product_paid, processing) ── */}
          {['arrived', 'product_paid', 'processing'].includes(status) && (
            <div className="rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Bill Shipping Fee
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Shipping fee (GH₵) *</label>
                  <input
                    type="number" step="0.01" min="0" placeholder="e.g. 50"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Note (optional)</label>
                  <input
                    type="text" placeholder="e.g. Send to 055-XXX-XXXX"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={billing}
                  onClick={(e) => { e.stopPropagation(); handleBill() }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {billing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Bill Customer
                </button>
                {customer.contact && fee && parseFloat(fee) > 0 && (
                  <a
                    href={waLink(customer.name, customer.contact, productName, customer.quantity, productTotal, parseFloat(fee), note)}
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

          {/* ── Shipping billed — waiting ── */}
          {status === 'shipping_billed' && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 space-y-2">
              <p className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Awaiting shipping payment — GH₵{fmt(shippingFee)}
              </p>
              {customer.shippingNote && <p className="text-xs text-[var(--color-text-muted)]">Note: {customer.shippingNote}</p>}
              {customer.contact && (
                <a
                  href={waLink(customer.name, customer.contact, productName, customer.quantity, productTotal, shippingFee, customer.shippingNote)}
                  target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Resend reminder
                </a>
              )}
            </div>
          )}

          {/* ── Shipping paid — verify & deliver ── */}
          {status === 'shipping_paid' && (
            <div className="rounded-xl border border-[var(--color-success)] bg-[var(--color-success-light)] p-4 space-y-3">
              <p className="text-sm font-semibold text-[var(--color-success)] flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Customer confirmed shipping payment
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {customer.momoNumber && <div><p className="text-xs text-[var(--color-text-muted)]">MoMo Number</p><p className="font-semibold">{customer.momoNumber}</p></div>}
                {customer.paymentRef && <div><p className="text-xs text-[var(--color-text-muted)]">Reference</p><p className="font-semibold font-mono">{customer.paymentRef}</p></div>}
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">Verify GH₵{fmt(shippingFee)} in your MoMo, then mark as delivered.</p>
              <button
                disabled={delivering}
                onClick={(e) => { e.stopPropagation(); handleDeliver() }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-success)] text-white text-sm font-semibold disabled:opacity-50"
              >
                {delivering ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
                Confirm & Mark Delivered
              </button>
            </div>
          )}

          {/* ── Delivered ── */}
          {status === 'delivered' && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 flex items-center gap-2 text-sm">
              <PackageCheck className="h-4 w-4 text-[var(--color-success)]" />
              <span className="text-[var(--color-success)] font-semibold">Order completed</span>
              <span className="text-[var(--color-text-muted)] ml-auto tabular-nums">GH₵{fmt(productTotal + shippingFee)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Product group card ────────────────────────────────────────────────────────

function ProductCard({ group }: { group: ProductGroup }) {
  const [tracking, setTracking] = useState(group.trackingNumber)
  const [customers, setCustomers] = useState(group.customers)

  const updateCustomer = (orderId: string, patch: Partial<CustomerRow>) => {
    setCustomers(prev => prev.map(c => c.orderId === orderId ? { ...c, ...patch } : c))
  }

  const totalQty = customers.reduce((s, c) => s + c.quantity, 0)
  const totalValue = customers.reduce((s, c) => s + c.unitPrice * c.quantity, 0)
  const needsBilling = customers.filter(c => ['arrived', 'product_paid', 'processing'].includes(c.status)).length
  const awaitingPayment = customers.filter(c => c.status === 'shipping_billed').length
  const awaitingVerification = customers.filter(c => c.status === 'shipping_paid').length

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
      {/* Product header */}
      <div className={`px-5 py-4 border-b border-[var(--color-border)] ${!tracking ? 'bg-orange-50' : 'bg-[var(--color-surface)]'}`}>
        <div className="flex items-start gap-4 flex-wrap">
          {/* Image + name */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {group.productImage ? (
              <img src={group.productImage} alt={group.productName} className="h-12 w-12 rounded-xl object-cover border border-[var(--color-border)] shrink-0" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-[var(--color-brand-light)] flex items-center justify-center shrink-0">
                <Package className="h-6 w-6 text-[var(--color-brand)]" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-[var(--color-text-primary)] truncate">{group.productName}</p>
              {group.supplierName && <p className="text-xs text-[var(--color-text-muted)]">{group.supplierName}</p>}
            </div>
          </div>

          {/* Tracking + stats */}
          <div className="flex items-center gap-3 flex-wrap">
            <TrackingEditor productId={group.productId} initial={tracking} onSaved={setTracking} />

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand)] text-xs font-semibold">
              {customers.length} customer{customers.length !== 1 ? 's' : ''} · {totalQty} unit{totalQty !== 1 ? 's' : ''}
            </div>

            <span className="text-sm font-bold text-[var(--color-success)] tabular-nums">GH₵{fmt(totalValue)}</span>
          </div>
        </div>

        {/* Action alerts */}
        {(needsBilling > 0 || awaitingPayment > 0 || awaitingVerification > 0) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {needsBilling > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
                {needsBilling} to bill
              </span>
            )}
            {awaitingPayment > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
                {awaitingPayment} awaiting payment
              </span>
            )}
            {awaitingVerification > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                {awaitingVerification} to verify & deliver
              </span>
            )}
          </div>
        )}
      </div>

      {/* Customers */}
      <div>
        {customers.map((c) => (
          <CustomerCard key={c.orderId} customer={c} productName={group.productName} onUpdate={updateCustomer} />
        ))}
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function PreOrderMonthClient({ groups, monthLabel }: { groups: ProductGroup[]; monthLabel: string }) {
  return (
    <div className="space-y-5">
      {groups.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] p-10 text-center">
          <Package className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--color-text-muted)]">No active orders for {monthLabel}.</p>
        </div>
      ) : (
        groups.map((g) => <ProductCard key={g.productId} group={g} />)
      )}
    </div>
  )
}