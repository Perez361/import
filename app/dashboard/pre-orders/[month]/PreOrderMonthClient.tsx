'use client'

import { useState } from 'react'
import {
  Package, Hash, Phone, MapPin, ChevronDown, ChevronRight,
  ScanBarcode, AlertCircle, Clock, CheckCircle2,
  MessageCircle, Layers, Receipt,
} from 'lucide-react'

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
  // added by page.tsx when building groups
  productName?: string
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

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1 — PRODUCTS VIEW
// ─────────────────────────────────────────────────────────────────────────────

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
      <div><StatusBadge status={c.status} /></div>
    </div>
  )
}

function CustomerSection({
  title, icon, customers, emptyText, headerClass, dividerClass,
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
      <div className={`flex items-center gap-2 px-4 py-2 border-y border-[var(--color-border)] ${headerClass}`}>
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        <span className="ml-auto text-xs font-semibold tabular-nums text-[var(--color-text-muted)]">
          {customers.length}
        </span>
      </div>
      {customers.length === 0 ? (
        <p className="px-4 py-3 text-xs text-[var(--color-text-muted)] italic">{emptyText}</p>
      ) : (
        <div className={`divide-y ${dividerClass}`}>
          {customers.map((c, i) => <CustomerRow key={c.orderId} c={c} i={i} />)}
        </div>
      )}
    </div>
  )
}

function ProductCard({ group }: { group: ProductGroup }) {
  const [expanded, setExpanded] = useState(true)

  const paid    = group.customers.filter(c => PAID_STATUSES.has(c.status))
  const pending = group.customers.filter(c => c.status === 'pending')

  const totalQty    = group.customers.reduce((s, c) => s + c.quantity, 0)
  const paidRevenue = paid.reduce((s, c) => s + c.unitPrice * c.quantity, 0)

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
            <p className="font-bold text-[var(--color-text-primary)] text-base leading-tight truncate">{group.productName}</p>
            {group.supplierName && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{group.supplierName}</p>}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-xs text-[var(--color-text-muted)]">
                <span className="font-semibold text-[var(--color-text-primary)]">{group.customers.length}</span> order{group.customers.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                <span className="font-semibold text-[var(--color-text-primary)]">{totalQty}</span> unit{totalQty !== 1 ? 's' : ''}
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
            </div>
          </div>
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
          <div className="shrink-0 text-[var(--color-text-muted)]">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </div>
        <div className="sm:hidden mt-2.5">
          {group.trackingNumber ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold bg-[var(--color-success-light)] border border-[var(--color-success)]/20 text-[var(--color-success)] px-2.5 py-1 rounded-lg">
              <ScanBarcode className="h-3 w-3" />{group.trackingNumber}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-warning)] border border-dashed border-[var(--color-warning)]/40 bg-[var(--color-warning-light)] px-2 py-1 rounded-lg">
              <Hash className="h-3 w-3" />No tracking
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <>
          <CustomerSection
            title="Paid"
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)]" />}
            customers={paid}
            emptyText="No payments received yet."
            headerClass="bg-[var(--color-success-light)]"
            dividerClass="divide-[var(--color-border)]"
          />
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

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2 — SHIPPING INVOICES (grouped by customer)
// ─────────────────────────────────────────────────────────────────────────────

interface ShippingInvoiceLine {
  orderId: string
  productName: string
  quantity: number
  unitPrice: number
  shippingFee: number
  shippingNote: string | null
}

interface CustomerInvoice {
  name: string
  contact: string
  location: string
  lines: ShippingInvoiceLine[]
  totalShipping: number
}

function buildWhatsappMessage(invoice: CustomerInvoice, monthLabel: string): string {
  const itemLines = invoice.lines
    .map(l => `  • ${l.productName} × ${l.quantity} — Shipping: GH₵${fmt(l.shippingFee)}`)
    .join('\n')

  const msg =
    `Hello ${invoice.name}! 👋\n\n` +
    `Your items from the *${monthLabel}* batch have arrived! ` +
    `Here's your shipping invoice:\n\n` +
    `${itemLines}\n\n` +
    `💰 *Total shipping due: GH₵${fmt(invoice.totalShipping)}*\n\n` +
    `Please send GH₵${fmt(invoice.totalShipping)} via MoMo to complete your delivery. Thank you! 🙏`

  return `https://wa.me/${invoice.contact.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
}

function ShippingInvoiceCard({
  invoice,
  monthLabel,
}: {
  invoice: CustomerInvoice
  monthLabel: string
}) {
  const [expanded, setExpanded] = useState(true)
  const hasContact = !!invoice.contact

  return (
    <div className="rounded-2xl border border-orange-200 bg-[var(--color-card)] shadow-sm overflow-hidden">

      {/* Customer header */}
      <div className="px-5 py-4 bg-orange-50 flex items-center gap-4">
        {/* Avatar */}
        <div className="h-10 w-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold text-sm shrink-0">
          {invoice.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-[var(--color-text-primary)]">{invoice.name}</p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {invoice.contact && (
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <Phone className="h-2.5 w-2.5" />{invoice.contact}
              </span>
            )}
            {invoice.location && (
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <MapPin className="h-2.5 w-2.5" />{invoice.location}
              </span>
            )}
          </div>
        </div>

        {/* Total + WhatsApp */}
        <div className="shrink-0 flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-[var(--color-text-muted)]">Total shipping</p>
            <p className="text-lg font-bold text-orange-600 tabular-nums">
              GH₵{fmt(invoice.totalShipping)}
            </p>
          </div>

          {hasContact ? (
            <a
              href={buildWhatsappMessage(invoice, monthLabel)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)] italic">No contact</span>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-orange-100 transition-colors text-[var(--color-text-muted)]"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Line items */}
      {expanded && (
        <div className="divide-y divide-[var(--color-border)]">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_60px_80px] gap-x-3 px-5 py-2 bg-[var(--color-surface)]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Product</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] text-center">Qty</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] text-right">Shipping</span>
          </div>

          {invoice.lines.map((line) => (
            <div key={line.orderId} className="grid grid-cols-[1fr_60px_80px] gap-x-3 items-center px-5 py-3 hover:bg-[var(--color-surface)] transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{line.productName}</p>
                {line.shippingNote && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">📝 {line.shippingNote}</p>
                )}
              </div>
              <p className="text-sm text-[var(--color-text-muted)] text-center tabular-nums">{line.quantity}</p>
              <p className="text-sm font-bold text-orange-600 text-right tabular-nums">
                GH₵{fmt(line.shippingFee)}
              </p>
            </div>
          ))}

          {/* Total row */}
          <div className="grid grid-cols-[1fr_60px_80px] gap-x-3 items-center px-5 py-3 bg-orange-50">
            <p className="text-sm font-bold text-[var(--color-text-primary)]">Total due</p>
            <span />
            <p className="text-sm font-bold text-orange-600 text-right tabular-nums">
              GH₵{fmt(invoice.totalShipping)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function PreOrderMonthClient({
  groups,
  monthLabel,
}: {
  groups: ProductGroup[]
  monthLabel: string
}) {
  const [tab, setTab] = useState<'products' | 'invoices'>('products')

  // Summary counts
  const totalOrders   = groups.reduce((s, g) => s + g.customers.length, 0)
  const totalPaid     = groups.reduce((s, g) => s + g.customers.filter(c => PAID_STATUSES.has(c.status)).length, 0)
  const totalPending  = groups.reduce((s, g) => s + g.customers.filter(c => c.status === 'pending').length, 0)
  const needsTracking = groups.filter(g => !g.trackingNumber).length

  // Build customer invoices from orders that have shipping_billed status
  // (shippingFee > 0 and status is shipping_billed)
  const invoiceMap = new Map<string, CustomerInvoice>()

  for (const group of groups) {
    for (const c of group.customers) {
      if (c.status !== 'shipping_billed' || !c.shippingFee) continue

      if (!invoiceMap.has(c.name)) {
        invoiceMap.set(c.name, {
          name: c.name,
          contact: c.contact,
          location: c.location,
          lines: [],
          totalShipping: 0,
        })
      }

      const inv = invoiceMap.get(c.name)!
      inv.lines.push({
        orderId: c.orderId,
        productName: group.productName,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        shippingFee: c.shippingFee,
        shippingNote: c.shippingNote,
      })
      inv.totalShipping += c.shippingFee
    }
  }

  const invoices = Array.from(invoiceMap.values()).sort((a, b) => a.name.localeCompare(b.name))

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
          <span className="font-semibold text-[var(--color-text-primary)]">{groups.length}</span> product{groups.length !== 1 ? 's' : ''}
        </span>
        <span className="h-4 w-px bg-[var(--color-border)]" />
        <span className="text-sm text-[var(--color-text-muted)]">
          <span className="font-semibold text-[var(--color-text-primary)]">{totalOrders}</span> order{totalOrders !== 1 ? 's' : ''}
        </span>
        {totalPaid > 0 && (
          <>
            <span className="h-4 w-px bg-[var(--color-border)]" />
            <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-success)]">
              <CheckCircle2 className="h-3.5 w-3.5" />{totalPaid} paid
            </span>
          </>
        )}
        {totalPending > 0 && (
          <>
            <span className="h-4 w-px bg-[var(--color-border)]" />
            <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-warning)]">
              <Clock className="h-3.5 w-3.5" />{totalPending} pending
            </span>
          </>
        )}
        {needsTracking > 0 && (
          <>
            <span className="h-4 w-px bg-[var(--color-border)]" />
            <span className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
              <AlertCircle className="h-3.5 w-3.5" />{needsTracking} missing tracking
            </span>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border)]">
        <button
          onClick={() => setTab('products')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all ${
            tab === 'products'
              ? 'border-[var(--color-brand)] text-[var(--color-brand)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Layers className="h-4 w-4" />
          Products
        </button>
        <button
          onClick={() => setTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all ${
            tab === 'invoices'
              ? 'border-[var(--color-brand)] text-[var(--color-brand)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Receipt className="h-4 w-4" />
          Shipping Invoices
          {invoices.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              tab === 'invoices'
                ? 'bg-[var(--color-brand)] text-white'
                : 'bg-orange-100 text-orange-700'
            }`}>
              {invoices.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab: Products */}
      {tab === 'products' && (
        <div className="space-y-4">
          {groups.map((g) => <ProductCard key={g.productId} group={g} />)}
        </div>
      )}

      {/* Tab: Shipping Invoices */}
      {tab === 'invoices' && (
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] p-10 text-center">
              <Receipt className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
              <p className="text-sm font-medium text-[var(--color-text-primary)]">No shipping invoices yet</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Customers appear here once their orders are marked <span className="font-semibold">Shipping Billed</span>.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-[var(--color-text-muted)]">
                {invoices.length} customer{invoices.length !== 1 ? 's' : ''} with shipping due —
                tap WhatsApp to send each their full invoice in one message.
              </p>
              {invoices.map((inv) => (
                <ShippingInvoiceCard key={inv.name} invoice={inv} monthLabel={monthLabel} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}