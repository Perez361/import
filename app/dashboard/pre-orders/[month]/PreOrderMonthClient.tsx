'use client'

import { useState } from 'react'
import {
  Package, Hash, Phone, MapPin, ChevronDown, ChevronRight,
  ScanBarcode, AlertCircle,
} from 'lucide-react'

export type { CustomerRow, ProductGroup } from './types'
import type { CustomerRow, ProductGroup } from './types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('en-GH', { maximumFractionDigits: 0 })

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  pending:         { label: 'Pending',       dot: 'bg-gray-400',    text: 'text-gray-600',    bg: 'bg-gray-100' },
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

// ── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({ group }: { group: { productId: string; productName: string; productImage: string | null; trackingNumber: string | null; supplierName: string | null; customers: any[] } }) {
  const [expanded, setExpanded] = useState(true)

  const totalQty = group.customers.reduce((s: number, c: any) => s + c.quantity, 0)
  const totalRevenue = group.customers.reduce((s: number, c: any) => s + c.unitPrice * c.quantity, 0)
  const delivered = group.customers.filter((c: any) => c.status === 'delivered').length

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
                <span className="font-semibold text-[var(--color-text-primary)]">{group.customers.length}</span> customer{group.customers.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                <span className="font-semibold text-[var(--color-text-primary)]">{totalQty}</span> unit{totalQty !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                <span className="font-semibold text-[var(--color-brand)]">GH₵{fmt(totalRevenue)}</span>
              </span>
              {delivered > 0 && (
                <span className="text-xs text-[var(--color-success)] font-medium">
                  {delivered}/{group.customers.length} delivered
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
            {expanded
              ? <ChevronDown className="h-4 w-4" />
              : <ChevronRight className="h-4 w-4" />
            }
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

      {/* ── Customer List ── */}
      {expanded && (
        <>
          {/* Column headers */}
          <div className="grid grid-cols-[28px_1fr_84px_116px] gap-x-3 items-center px-4 py-2 border-y border-[var(--color-border)] bg-[var(--color-surface)]">
            <span />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Customer</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] text-right">Amount</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Status</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[var(--color-border)]">
            {group.customers.map((c: any, i: number) => (
              <div
                key={c.orderId}
                className="grid grid-cols-[28px_1fr_84px_116px] gap-x-3 items-center px-4 py-3 hover:bg-[var(--color-surface)] transition-colors"
              >
                {/* Index */}
                <span className="text-xs font-bold text-[var(--color-text-muted)] text-center">{i + 1}</span>

                {/* Customer info */}
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
                    GH₵{fmt(c.unitPrice * c.quantity)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">qty {c.quantity}</p>
                </div>

                {/* Status */}
                <div>
                  <StatusBadge status={c.status} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function PreOrderMonthClient({ groups, monthLabel }: {
  groups: { productId: string; productName: string; productImage: string | null; trackingNumber: string | null; supplierName: string | null; customers: any[] }[]
  monthLabel: string
}) {
  const totalOrders = groups.reduce((s, g) => s + g.customers.length, 0)
  const needsTracking = groups.filter(g => !g.trackingNumber).length

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
            <span className="font-semibold text-[var(--color-text-primary)]">{totalOrders}</span> order{totalOrders !== 1 ? 's' : ''}
          </span>
          {needsTracking > 0 && (
            <>
              <span className="h-4 w-px bg-[var(--color-border)]" />
              <span className="flex items-center gap-1.5 text-sm text-[var(--color-warning)] font-medium">
                <AlertCircle className="h-3.5 w-3.5" />
                {needsTracking} product{needsTracking !== 1 ? 's' : ''} missing tracking
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