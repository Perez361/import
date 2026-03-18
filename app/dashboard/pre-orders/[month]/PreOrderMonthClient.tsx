'use client'

import { useState } from 'react'
import {
  Package, Hash, Phone, MapPin, ChevronDown, ChevronRight,
  ScanBarcode, AlertCircle, Clock, CheckCircle2,
  MessageCircle, Layers, Receipt, ShoppingBag,
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
                <ScanBarcode className="h-3.5 w-3.5 shrink-0" />{group.trackingNumber}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-warning)] border border-dashed border-[var(--color-warning)]/40 bg-[var(--color-warning-light)] px-2.5 py-1.5 rounded-lg">
                <Hash className="h-3.5 w-3.5" />No tracking
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
// SHARED: Invoice card used by both Product Invoices and Shipping Invoices
// ─────────────────────────────────────────────────────────────────────────────

interface InvoiceLine {
  orderId: string
  productName: string
  quantity: number
  unitPrice: number
  amount: number        // productTotal for product invoice, shippingFee for shipping invoice
  note: string | null
}

interface CustomerInvoice {
  name: string
  contact: string
  location: string
  lines: InvoiceLine[]
  total: number
}

function buildProductWhatsapp(invoice: CustomerInvoice, monthLabel: string): string {
  const itemLines = invoice.lines
    .map(l => `  • ${l.productName} × ${l.quantity} — GH₵${fmt(l.amount)}`)
    .join('\n')

  const msg =
    `Hello ${invoice.name}! 👋\n\n` +
    `Here's your product payment invoice for the *${monthLabel}* batch:\n\n` +
    `${itemLines}\n\n` +
    `💰 *Total due: GH₵${fmt(invoice.total)}*\n\n` +
    `Please send GH₵${fmt(invoice.total)} via MoMo to confirm your order. Thank you! 🙏`

  return `https://wa.me/${invoice.contact.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
}

function buildShippingWhatsapp(invoice: CustomerInvoice, monthLabel: string): string {
  const itemLines = invoice.lines
    .map(l => `  • ${l.productName} × ${l.quantity} — Shipping: GH₵${fmt(l.amount)}`)
    .join('\n')

  const msg =
    `Hello ${invoice.name}! 👋\n\n` +
    `Your items from the *${monthLabel}* batch have arrived! ` +
    `Here's your shipping invoice:\n\n` +
    `${itemLines}\n\n` +
    `💰 *Total shipping due: GH₵${fmt(invoice.total)}*\n\n` +
    `Please send GH₵${fmt(invoice.total)} via MoMo to complete your delivery. Thank you! 🙏`

  return `https://wa.me/${invoice.contact.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
}

function InvoiceCard({
  invoice,
  monthLabel,
  accentColor,
  buildWhatsapp,
  amountLabel,
}: {
  invoice: CustomerInvoice
  monthLabel: string
  accentColor: 'blue' | 'orange'
  buildWhatsapp: (inv: CustomerInvoice, month: string) => string
  amountLabel: string
}) {
  const [expanded, setExpanded] = useState(true)
  const hasContact = !!invoice.contact

  const accent = {
    blue: {
      border: 'border-blue-200',
      header: 'bg-blue-50',
      avatar: 'bg-blue-100 text-blue-700',
      totalText: 'text-blue-600',
      colHeader: 'bg-blue-50/50',
      totalRow: 'bg-blue-50',
      hoverBtn: 'hover:bg-blue-100',
    },
    orange: {
      border: 'border-orange-200',
      header: 'bg-orange-50',
      avatar: 'bg-orange-100 text-orange-700',
      totalText: 'text-orange-600',
      colHeader: 'bg-orange-50/50',
      totalRow: 'bg-orange-50',
      hoverBtn: 'hover:bg-orange-100',
    },
  }[accentColor]

  return (
    <div className={`rounded-2xl border ${accent.border} bg-[var(--color-card)] shadow-sm overflow-hidden`}>

      {/* Customer header */}
      <div className={`px-5 py-4 ${accent.header} flex items-center gap-4`}>
        <div className={`h-10 w-10 rounded-full ${accent.avatar} flex items-center justify-center font-bold text-sm shrink-0`}>
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

        <div className="shrink-0 flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-[var(--color-text-muted)]">{amountLabel}</p>
            <p className={`text-lg font-bold tabular-nums ${accent.totalText}`}>
              GH₵{fmt(invoice.total)}
            </p>
          </div>

          {hasContact ? (
            <a
              href={buildWhatsapp(invoice, monthLabel)}
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
            className={`p-1.5 rounded-lg transition-colors text-[var(--color-text-muted)] ${accent.hoverBtn}`}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Line items */}
      {expanded && (
        <div className="divide-y divide-[var(--color-border)]">
          <div className={`grid grid-cols-[1fr_60px_80px] gap-x-3 px-5 py-2 ${accent.colHeader}`}>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Product</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] text-center">Qty</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] text-right">Amount</span>
          </div>

          {invoice.lines.map((line) => (
            <div key={line.orderId} className="grid grid-cols-[1fr_60px_80px] gap-x-3 items-center px-5 py-3 hover:bg-[var(--color-surface)] transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{line.productName}</p>
                {line.note && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">📝 {line.note}</p>
                )}
              </div>
              <p className="text-sm text-[var(--color-text-muted)] text-center tabular-nums">{line.quantity}</p>
              <p className={`text-sm font-bold text-right tabular-nums ${accent.totalText}`}>
                GH₵{fmt(line.amount)}
              </p>
            </div>
          ))}

          <div className={`grid grid-cols-[1fr_60px_80px] gap-x-3 items-center px-5 py-3 ${accent.totalRow}`}>
            <p className="text-sm font-bold text-[var(--color-text-primary)]">Total due</p>
            <span />
            <p className={`text-sm font-bold text-right tabular-nums ${accent.totalText}`}>
              GH₵{fmt(invoice.total)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shared empty state ────────────────────────────────────────────────────────

function EmptyInvoices({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] p-10 text-center">
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
      <p className="text-xs text-[var(--color-text-muted)] mt-1">{subtitle}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

type TabId = 'products' | 'product-invoices' | 'shipping-invoices'

export default function PreOrderMonthClient({
  groups,
  monthLabel,
}: {
  groups: ProductGroup[]
  monthLabel: string
}) {
  const [tab, setTab] = useState<TabId>('products')

  // Summary counts
  const totalOrders   = groups.reduce((s, g) => s + g.customers.length, 0)
  const totalPaid     = groups.reduce((s, g) => s + g.customers.filter(c => PAID_STATUSES.has(c.status)).length, 0)
  const totalPending  = groups.reduce((s, g) => s + g.customers.filter(c => c.status === 'pending').length, 0)
  const needsTracking = groups.filter(g => !g.trackingNumber).length

  // ── Build product invoices (pending status — haven't paid for product yet) ──
  const productInvoiceMap = new Map<string, CustomerInvoice>()
  for (const group of groups) {
    for (const c of group.customers) {
      if (c.status !== 'pending') continue
      const key = c.name
      if (!productInvoiceMap.has(key)) {
        productInvoiceMap.set(key, { name: c.name, contact: c.contact, location: c.location, lines: [], total: 0 })
      }
      const inv = productInvoiceMap.get(key)!
      const amount = c.unitPrice * c.quantity
      inv.lines.push({ orderId: c.orderId, productName: group.productName, quantity: c.quantity, unitPrice: c.unitPrice, amount, note: null })
      inv.total += amount
    }
  }
  const productInvoices = Array.from(productInvoiceMap.values()).sort((a, b) => a.name.localeCompare(b.name))

  // ── Build shipping invoices (shipping_billed — fee set, awaiting payment) ───
  const shippingInvoiceMap = new Map<string, CustomerInvoice>()
  for (const group of groups) {
    for (const c of group.customers) {
      if (c.status !== 'shipping_billed' || !c.shippingFee) continue
      const key = c.name
      if (!shippingInvoiceMap.has(key)) {
        shippingInvoiceMap.set(key, { name: c.name, contact: c.contact, location: c.location, lines: [], total: 0 })
      }
      const inv = shippingInvoiceMap.get(key)!
      inv.lines.push({ orderId: c.orderId, productName: group.productName, quantity: c.quantity, unitPrice: c.unitPrice, amount: c.shippingFee, note: c.shippingNote })
      inv.total += c.shippingFee
    }
  }
  const shippingInvoices = Array.from(shippingInvoiceMap.values()).sort((a, b) => a.name.localeCompare(b.name))

  const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'products',
      label: 'Products',
      icon: <Layers className="h-4 w-4" />,
    },
    {
      id: 'product-invoices',
      label: 'Product Invoices',
      icon: <ShoppingBag className="h-4 w-4" />,
      badge: productInvoices.length || undefined,
    },
    {
      id: 'shipping-invoices',
      label: 'Shipping Invoices',
      icon: <Receipt className="h-4 w-4" />,
      badge: shippingInvoices.length || undefined,
    },
  ]

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
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all whitespace-nowrap ${
              tab === t.id
                ? 'border-[var(--color-brand)] text-[var(--color-brand)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            {t.badge !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                tab === t.id ? 'bg-[var(--color-brand)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
              }`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Products */}
      {tab === 'products' && (
        <div className="space-y-4">
          {groups.map(g => <ProductCard key={g.productId} group={g} />)}
        </div>
      )}

      {/* Tab: Product Invoices */}
      {tab === 'product-invoices' && (
        <div className="space-y-4">
          {productInvoices.length === 0 ? (
            <EmptyInvoices
              icon={<ShoppingBag className="h-10 w-10 text-[var(--color-text-muted)]" />}
              title="No pending product payments"
              subtitle="All customers have paid for their products."
            />
          ) : (
            <>
              <p className="text-sm text-[var(--color-text-muted)]">
                {productInvoices.length} customer{productInvoices.length !== 1 ? 's' : ''} yet to pay for their products —
                tap WhatsApp to send each their full invoice.
              </p>
              {productInvoices.map(inv => (
                <InvoiceCard
                  key={inv.name}
                  invoice={inv}
                  monthLabel={monthLabel}
                  accentColor="blue"
                  buildWhatsapp={buildProductWhatsapp}
                  amountLabel="Product total due"
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Tab: Shipping Invoices */}
      {tab === 'shipping-invoices' && (
        <div className="space-y-4">
          {shippingInvoices.length === 0 ? (
            <EmptyInvoices
              icon={<Receipt className="h-10 w-10 text-[var(--color-text-muted)]" />}
              title="No shipping invoices yet"
              subtitle={`Customers appear here once their orders are marked Shipping Billed.`}
            />
          ) : (
            <>
              <p className="text-sm text-[var(--color-text-muted)]">
                {shippingInvoices.length} customer{shippingInvoices.length !== 1 ? 's' : ''} with shipping due —
                tap WhatsApp to send each their full invoice.
              </p>
              {shippingInvoices.map(inv => (
                <InvoiceCard
                  key={inv.name}
                  invoice={inv}
                  monthLabel={monthLabel}
                  accentColor="orange"
                  buildWhatsapp={buildShippingWhatsapp}
                  amountLabel="Total shipping due"
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}