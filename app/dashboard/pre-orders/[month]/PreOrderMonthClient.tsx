'use client'

import { useState } from 'react'
import {
  Package, Hash, Phone, MapPin, ChevronDown, ChevronRight,
  ScanBarcode, AlertCircle, Clock, CheckCircle2,
} from 'lucide-react'

export type { CustomerRow, ProductGroup } from './types'
import type { CustomerRow, ProductGroup } from './types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('en-GH', { maximumFractionDigits: 0 })

// Statuses that count as "paid / in progress"
const PAID_STATUSES = new Set([
  'product_paid', 'processing', 'arrived',
  'shipping_billed', 'shipping_paid', 'delivered',
])

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

// ── Customer Row ──────────────────────────────────────────────────────────────

function CustomerRow({ c, i }: { c: CustomerRow; i: number }) {
  return (
    <div className="grid grid-cols-[28px_1fr_84px_116px] gap-x-3 items-center px-4 py-3 hover:bg-[var(--color-surface)] transition-colors">
      <span className="text-xs font-bold text-[var(--color-text-muted)] text-center">{i + 1}</span>

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

      <div className="text-right">
        <p className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">
          GH₵{fmt(c.unitPrice * c.quantity)}
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">qty {c.quantity}</p>
      </div>

      <div>
        <StatusBadge status={c.status} />
      </div>
    </div>
  )
}

// ── Section (Paid or Pending) ─────────────────────────────────────────────────

function CustomerSection({
  title, icon, customers, emptyText,
  headerClass, dividerClass,
}: {
  title: string
  icon: React.ReactNode
  customers: CustomerRow[]
  emptyText: string
  headerClass: string
  dividerClass: string
}) {
  return (
    <div>
      {/* Section label */}
      <div className={`grid grid-cols-[28px_1fr_84px_116px] gap-x-3 items-center px-4 py-2 border-y border-[var(--color-border)] ${headerClass}`}>
        <span />
        <div className="flex items-center gap-2 col-span-3">
          {icon}
          <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
          <span className="ml-auto text-xs font-semibold tabular-nums">{customers.length}</span>
        </div>
      </div>

      {customers.length === 0 ? (
        <p className="px-4 py-3 text-xs text-[var(--color-text-muted)] italic">{emptyText}</p>
      ) : (
        <div className={`divide-y ${dividerClass}`}>
          {customers.map((c, i) => (
            <CustomerRow key={c.orderId} c={c} i={i} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({ group }: { group: ProductGroup }) {
  const [expanded, setExpanded] = useState(true)

  const paid    = group.customers.filter(c => PAID_STATUSES.has(c.status))
  const pending = group.customers.filter(c => c.status === 'pending')

  const totalQty     = group.customers.reduce((s, c) => s + c.quantity, 0)
  const totalRevenue = paid.reduce((s, c) => s + c.unitPrice * c.quantity, 0)

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">

      {/* ── Product Header ── */}
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
                <span className="font-semibold text-[var(--color-text-primary)]">{group.customers.length}</span> order{group.customers.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                <span className="font-semibold text-[var(--color-text-primary)]">{totalQty}</span> unit{totalQty !== 1 ? 's' : ''}
              </span>
              {/* Paid vs pending pill summary */}
              {paid.length > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-success)]">
                  <CheckCircle2 className="h-3 w-3" />
                  {paid.length} paid
                  {totalRevenue > 0 && <span className="text-[var(--color-text-muted)] font-normal ml-0.5">· GH₵{fmt(totalRevenue)}</span>}
                </span>
              )}
              {pending.length > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-warning)]">
                  <Clock className="h-3 w-3" />
                  {pending.length} pending
                </span>
              )}
            </div>
          </div>

          {/* Tracking number — desktop */}
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

      {/* ── Two Sections ── */}
      {expanded && (
        <>
          {/* ── PAID ── */}
          <CustomerSection
            title="Paid"
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)]" />}
            customers={paid}
            emptyText="No payments received yet."
            headerClass="bg-[var(--color-success-light)]"
            dividerClass="divide-[var(--color-border)]"
          />

          {/* ── PENDING ── */}
          <CustomerSection
            title="Awaiting Payment"
            icon={<Clock className="h-3.5 w-3.5 text-[var(--color-warning)]" />}
            customers={pending}
            emptyText="No pending payments."
            headerClass="bg-[var(--color-warning-light)]"
            dividerClass="divide-[var(--color-border)]"
          />
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
  const totalOrders    = groups.reduce((s, g) => s + g.customers.length, 0)
  const totalPaid      = groups.reduce((s, g) => s + g.customers.filter(c => PAID_STATUSES.has(c.status)).length, 0)
  const totalPending   = groups.reduce((s, g) => s + g.customers.filter(c => c.status === 'pending').length, 0)
  const needsTracking  = groups.filter(g => !g.trackingNumber).length

  return (
    <div className="space-y-4">

      {/* ── Summary bar ── */}
      {groups.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 flex items-center gap-4 flex-wrap shadow-sm">
          <span className="text-sm text-[var(--color-text-muted)]">
            <span className="font-semibold text-[var(--color-text-primary)]">{groups.length}</span> product{groups.length !== 1 ? 's' : ''}
          </span>
          <span className="h-4 w-px bg-[var(--color-border)]" />
          <span className="text-sm text-[var(--color-text-muted)]">
            <span className="font-semibold text-[var(--color-text-primary)]">{totalOrders}</span> total orders
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
          {needsTracking > 0 && (
            <>
              <span className="h-4 w-px bg-[var(--color-border)]" />
              <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-muted)]">
                <AlertCircle className="h-3.5 w-3.5" />
                {needsTracking} missing tracking
              </span>
            </>
          )}
        </div>
      )}

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