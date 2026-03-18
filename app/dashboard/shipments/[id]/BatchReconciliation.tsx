'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle2, AlertCircle, HelpCircle, Loader2,
  Plus, Trash2, GitMerge, Send, ChevronDown, ChevronUp,
  Package, Truck, DollarSign, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import {
  addShipmentItemAction,
  deleteShipmentItemAction,
  saveFreightManifestAction,
  reconcileAction,
  deleteBatchAction,
} from '../actions'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Batch {
  id: string
  name: string
  shipping_company?: string
  status: string
  notes?: string
  created_at: string
}

interface MyItem {
  id: string
  tracking_number: string
  status: string
  freight_cost: number
  pushed_to_order: boolean
  product_id?: string
  products?: { id: string; name: string; price: number } | null
}

interface ManifestItem {
  id: string
  tracking_number: string
  freight_cost: number
  weight_kg?: number
  notes?: string
  matched: boolean
}

interface Props {
  batch: Batch
  myItems: MyItem[]
  manifestItems: ManifestItem[]
  products: { id: string; name: string; price: number }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString('en-GH', { maximumFractionDigits: 2 })
}

// ─── Status config ────────────────────────────────────────────────────────────

const itemStatusConfig: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
  pending:  { label: 'Pending',  classes: 'bg-gray-100 text-gray-600',    icon: <HelpCircle className="h-3 w-3" /> },
  received: { label: 'Received', classes: 'bg-green-100 text-green-700',  icon: <CheckCircle2 className="h-3 w-3" /> },
  missing:  { label: 'Missing',  classes: 'bg-red-100 text-red-700',      icon: <AlertCircle className="h-3 w-3" /> },
  extra:    { label: 'Extra',    classes: 'bg-yellow-100 text-yellow-700', icon: <HelpCircle className="h-3 w-3" /> },
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BatchReconciliation({
  batch, myItems: initialMyItems, manifestItems: initialManifest, products
}: Props) {
  const router = useRouter()
  const [myItems, setMyItems] = useState<MyItem[]>(initialMyItems)
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<'mine' | 'manifest' | 'reconcile'>('mine')

  // New items form — no order linking
  const [newItems, setNewItems] = useState([{ tracking_number: '', product_id: '' }])

  // Manifest paste state
  const [manifestText, setManifestText] = useState('')
  const [manifestRows, setManifestRows] = useState<
    { tracking_number: string; freight_cost: string; weight_kg: string; notes: string }[]
  >([])
  const [manifestItems, setManifestItems] = useState<ManifestItem[]>(initialManifest)

  const setLoad = (key: string, val: boolean) =>
    setLoading(prev => ({ ...prev, [key]: val }))

  // ── Add tracking items ────────────────────────────────────────────────────

  const handleAddMyItems = async () => {
    const valid = newItems.filter(i => i.tracking_number.trim())
    if (!valid.length) { toast.error('Enter at least one tracking number'); return }
    setLoad('addItems', true)
    const result: any = await addShipmentItemAction(
      batch.id,
      valid.map(i => ({
        tracking_number: i.tracking_number.trim().toUpperCase(),
        product_id: i.product_id || undefined,
      }))
    )
    setLoad('addItems', false)
    if (result?.error) { toast.error(result.error); return }
    toast.success(`${valid.length} item${valid.length > 1 ? 's' : ''} added`)
    setNewItems([{ tracking_number: '', product_id: '' }])
    router.refresh()
  }

  // ── Delete item ───────────────────────────────────────────────────────────

  const handleDeleteMyItem = async (itemId: string) => {
    if (!confirm('Remove this tracking item?')) return
    setLoad('del_' + itemId, true)
    const result: any = await deleteShipmentItemAction(itemId, batch.id)
    setLoad('del_' + itemId, false)
    if (result?.error) { toast.error(result.error); return }
    setMyItems(prev => prev.filter(i => i.id !== itemId))
    toast.success('Item removed')
  }

  // ── Parse manifest ────────────────────────────────────────────────────────

  const parseManifestText = () => {
    const lines = manifestText.trim().split('\n').filter(Boolean)
    const parsed = lines.map(line => {
      const parts = line.includes('\t') ? line.split('\t') : line.split(',')
      return {
        tracking_number: (parts[0] || '').trim().toUpperCase(),
        freight_cost: (parts[1] || '0').trim().replace(/[^0-9.]/g, ''),
        weight_kg: (parts[2] || '').trim().replace(/[^0-9.]/g, ''),
        notes: (parts[3] || '').trim(),
      }
    }).filter(r => r.tracking_number)
    setManifestRows(parsed)
  }

  const handleSaveManifest = async () => {
    const valid = manifestRows.filter(r => r.tracking_number)
    if (!valid.length) { toast.error('No valid rows to save'); return }
    setLoad('saveManifest', true)
    const result: any = await saveFreightManifestAction(
      batch.id,
      valid.map(r => ({
        tracking_number: r.tracking_number,
        freight_cost: parseFloat(r.freight_cost) || 0,
        weight_kg: r.weight_kg ? parseFloat(r.weight_kg) : undefined,
        notes: r.notes || undefined,
      }))
    )
    setLoad('saveManifest', false)
    if (result?.error) { toast.error(result.error); return }
    toast.success(`${valid.length} manifest items saved`)
    setManifestText('')
    setManifestRows([])
    router.refresh()
  }

  // ── Reconcile ─────────────────────────────────────────────────────────────

  const handleReconcile = async () => {
    if (myItems.length === 0) { toast.error('Add your tracking items first'); return }
    if (manifestItems.length === 0) { toast.error('Add the freight manifest first'); return }
    setLoad('reconcile', true)
    const result: any = await reconcileAction(batch.id)
    setLoad('reconcile', false)
    if (result?.error) { toast.error(result.error); return }
    toast.success('Reconciliation complete!')
    setActiveTab('reconcile')
    router.refresh()
  }

  // ── Delete batch ──────────────────────────────────────────────────────────

  const handleDeleteBatch = async () => {
    if (!confirm(`Delete batch "${batch.name}"? This cannot be undone.`)) return
    setLoad('deleteBatch', true)
    const result: any = await deleteBatchAction(batch.id)
    setLoad('deleteBatch', false)
    if (result?.error) { toast.error(result.error); return }
    toast.success('Batch deleted')
    router.push('/dashboard/shipments')
  }

  // ── Summary stats ─────────────────────────────────────────────────────────

  const received   = myItems.filter(i => i.status === 'received').length
  const missing    = myItems.filter(i => i.status === 'missing').length
  const extras     = manifestItems.filter(i => !i.matched).length
  const totalFreight = myItems
    .filter(i => i.status === 'received')
    .reduce((s, i) => s + (i.freight_cost || 0), 0)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/shipments" className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors">
            <ArrowLeft className="h-5 w-5 text-[var(--color-text-muted)]" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{batch.name}</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              {batch.shipping_company || 'No company'} ·{' '}
              <span className={`font-medium ${
                batch.status === 'reconciled' ? 'text-green-600' :
                batch.status === 'received'   ? 'text-yellow-600' : 'text-blue-600'
              }`}>
                {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {batch.status !== 'reconciled' && myItems.length > 0 && manifestItems.length > 0 && (
            <button
              onClick={handleReconcile}
              disabled={loading['reconcile']}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-brand)] text-white text-sm font-semibold hover:bg-[var(--color-brand-dark)] transition-all disabled:opacity-50"
            >
              {loading['reconcile'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />}
              Reconcile Now
            </button>
          )}
          <button
            onClick={handleDeleteBatch}
            disabled={loading['deleteBatch']}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--color-danger)] text-[var(--color-danger)] text-sm font-medium hover:bg-[var(--color-danger-light)] transition-all disabled:opacity-50"
          >
            {loading['deleteBatch'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </button>
        </div>
      </div>

      {/* ── Summary cards (after reconciliation) ── */}
      {batch.status === 'reconciled' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'My Items',         value: myItems.length, color: 'text-[var(--color-text-primary)]', icon: Package },
            { label: 'Received',         value: received,       color: 'text-green-600',                   icon: CheckCircle2 },
            { label: 'Missing',          value: missing,        color: 'text-red-600',                     icon: AlertCircle },
            { label: 'Extras (freight)', value: extras,         color: 'text-yellow-600',                  icon: HelpCircle },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-center">
              <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
              <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border)]">
        {[
          { key: 'mine',      label: `My Items (${myItems.length})` },
          { key: 'manifest',  label: `Freight Manifest (${manifestItems.length})` },
          { key: 'reconcile', label: 'Reconciliation' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${
              activeTab === tab.key
                ? 'border-[var(--color-brand)] text-[var(--color-brand)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: MY ITEMS ─────────────────────────────────────────────────── */}
      {activeTab === 'mine' && (
        <div className="space-y-4">

          {/* Add form */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-3">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <Plus className="h-4 w-4 text-[var(--color-brand)]" />
              Add Tracking Numbers
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Enter tracking numbers from the overseas store. Link each to a product — customers are auto-traced through their orders.
            </p>

            {newItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Tracking Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 1Z999AA1..."
                    value={item.tracking_number}
                    onChange={e => {
                      const u = [...newItems]; u[idx].tracking_number = e.target.value; setNewItems(u)
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm font-mono focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Product</label>
                  <select
                    value={item.product_id}
                    onChange={e => {
                      const u = [...newItems]; u[idx].product_id = e.target.value; setNewItems(u)
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent"
                  >
                    <option value="">— Select product —</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setNewItems([...newItems, { tracking_number: '', product_id: '' }])}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Add Row
              </button>
              <button
                onClick={handleAddMyItems}
                disabled={loading['addItems']}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-brand)] text-white text-sm font-semibold hover:bg-[var(--color-brand-dark)] transition-all disabled:opacity-50"
              >
                {loading['addItems'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Save Items
              </button>
            </div>
          </div>

          {/* Items list */}
          {myItems.length > 0 && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
              <div className="px-5 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  My Tracking List ({myItems.length} item{myItems.length !== 1 ? 's' : ''})
                </p>
              </div>
              <div className="divide-y divide-[var(--color-border)]">
                {myItems.map(item => {
                  const cfg = itemStatusConfig[item.status] || itemStatusConfig['pending']
                  return (
                    <div key={item.id} className="px-5 py-4 flex items-center gap-4 flex-wrap hover:bg-[var(--color-surface)] transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-semibold text-[var(--color-text-primary)]">
                            {item.tracking_number}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.classes}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-text-muted)] flex-wrap">
                          {item.products && (
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />{item.products.name}
                            </span>
                          )}
                          {item.freight_cost > 0 && (
                            <span className="flex items-center gap-1 text-orange-600 font-medium">
                              <DollarSign className="h-3 w-3" />
                              GH₵{fmt(item.freight_cost)} freight
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteMyItem(item.id)}
                        disabled={loading['del_' + item.id]}
                        className="p-1.5 text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] rounded-lg transition-all disabled:opacity-50 shrink-0"
                      >
                        {loading['del_' + item.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: FREIGHT MANIFEST ─────────────────────────────────────────── */}
      {activeTab === 'manifest' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                Enter Freight Company List
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mb-3">
                Paste the shipping company's manifest. One row per line.<br />
                <strong>Format:</strong> <code className="bg-gray-100 px-1 rounded">TRACKING_NUMBER, COST, WEIGHT_KG, NOTES</code>
              </p>
              <textarea
                value={manifestText}
                onChange={e => setManifestText(e.target.value)}
                rows={8}
                placeholder={`1Z999AA10123456784, 45.00, 1.2, fragile\nABC123DEF456, 32.50\n1ZEXAMPLE1234, 55.00, 2.0`}
                className="w-full px-3 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-mono focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent resize-y"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={parseManifestText}
                disabled={!manifestText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--color-brand)] text-[var(--color-brand)] text-sm font-semibold hover:bg-[var(--color-brand-light)] transition-all disabled:opacity-40"
              >
                <RefreshCw className="h-4 w-4" /> Parse
              </button>
              {manifestRows.length > 0 && (
                <button
                  onClick={handleSaveManifest}
                  disabled={loading['saveManifest']}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-brand)] text-white text-sm font-semibold hover:bg-[var(--color-brand-dark)] transition-all disabled:opacity-50"
                >
                  {loading['saveManifest'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Save {manifestRows.length} Items
                </button>
              )}
            </div>

            {manifestRows.length > 0 && (
              <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                <div className="bg-[var(--color-surface)] px-4 py-2 border-b border-[var(--color-border)]">
                  <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Preview — {manifestRows.length} rows parsed
                  </p>
                </div>
                <div className="divide-y divide-[var(--color-border)] max-h-64 overflow-y-auto">
                  {manifestRows.map((row, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center gap-4 text-sm">
                      <span className="font-mono font-semibold text-[var(--color-text-primary)] flex-1">{row.tracking_number}</span>
                      <span className="text-orange-600 font-medium">GH₵{row.freight_cost || '0'}</span>
                      {row.weight_kg && <span className="text-[var(--color-text-muted)]">{row.weight_kg}kg</span>}
                      {row.notes && <span className="text-[var(--color-text-muted)] truncate max-w-32">{row.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {manifestItems.length > 0 && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
              <div className="px-5 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Saved Manifest ({manifestItems.length} items) ·{' '}
                  Total: GH₵{fmt(manifestItems.reduce((s, i) => s + (i.freight_cost || 0), 0))}
                </p>
              </div>
              <div className="divide-y divide-[var(--color-border)]">
                {manifestItems.map(item => (
                  <div key={item.id} className="px-5 py-3 flex items-center gap-4 hover:bg-[var(--color-surface)] transition-colors">
                    <span className="font-mono text-sm font-semibold flex-1 text-[var(--color-text-primary)]">
                      {item.tracking_number}
                    </span>
                    <span className="text-sm font-semibold text-orange-600 tabular-nums">
                      GH₵{fmt(item.freight_cost)}
                    </span>
                    {item.weight_kg && (
                      <span className="text-xs text-[var(--color-text-muted)]">{item.weight_kg}kg</span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      item.matched
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.matched ? <CheckCircle2 className="h-3 w-3" /> : <HelpCircle className="h-3 w-3" />}
                      {item.matched ? 'Matched' : 'Extra'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: RECONCILIATION ───────────────────────────────────────────── */}
      {activeTab === 'reconcile' && (
        <div className="space-y-4">
          {batch.status !== 'reconciled' ? (
            <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] p-10 text-center">
              <GitMerge className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                Not reconciled yet
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">
                Add your tracking items and the freight manifest, then click Reconcile Now.
              </p>
              {myItems.length > 0 && manifestItems.length > 0 && (
                <button
                  onClick={handleReconcile}
                  disabled={loading['reconcile']}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-brand)] text-white text-sm font-semibold hover:bg-[var(--color-brand-dark)] transition-all disabled:opacity-50"
                >
                  {loading['reconcile'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />}
                  Reconcile Now
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">

              {/* Received */}
              <ReconcileSection title={`✅ Received (${myItems.filter(i => i.status === 'received').length})`} color="border-green-200 bg-green-50">
                {myItems.filter(i => i.status === 'received').map(item => (
                  <ReconcileRow key={item.id} item={item} />
                ))}
              </ReconcileSection>

              {/* Missing */}
              {myItems.filter(i => i.status === 'missing').length > 0 && (
                <ReconcileSection title={`⚠️ Missing (${myItems.filter(i => i.status === 'missing').length})`} color="border-red-200 bg-red-50">
                  {myItems.filter(i => i.status === 'missing').map(item => (
                    <ReconcileRow key={item.id} item={item} />
                  ))}
                </ReconcileSection>
              )}

              {/* Extras */}
              {manifestItems.filter(i => !i.matched).length > 0 && (
                <ReconcileSection title={`❓ Extras — in freight list but not in my list (${manifestItems.filter(i => !i.matched).length})`} color="border-yellow-200 bg-yellow-50">
                  {manifestItems.filter(i => !i.matched).map(item => (
                    <div key={item.id} className="flex items-center gap-3 py-2.5">
                      <span className="font-mono text-sm font-semibold text-[var(--color-text-primary)] flex-1">
                        {item.tracking_number}
                      </span>
                      <span className="text-sm text-orange-600 font-semibold tabular-nums">
                        GH₵{fmt(item.freight_cost)}
                      </span>
                      {item.notes && <span className="text-xs text-[var(--color-text-muted)]">{item.notes}</span>}
                    </div>
                  ))}
                </ReconcileSection>
              )}

              {/* Total */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Total Freight Cost (received items)
                </span>
                <span className="text-lg font-bold text-orange-600 tabular-nums">
                  GH₵{fmt(totalFreight)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReconcileSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className={`rounded-2xl border-2 ${color} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3"
      >
        <span className="text-sm font-bold text-gray-800">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
      </button>
      {open && (
        <div className="px-5 pb-4 divide-y divide-white/60">
          {children}
        </div>
      )}
    </div>
  )
}

function ReconcileRow({ item }: { item: MyItem }) {
  return (
    <div className="flex items-center gap-3 py-3 flex-wrap">
      <div className="flex-1 min-w-0">
        <span className="font-mono text-sm font-semibold text-[var(--color-text-primary)]">
          {item.tracking_number}
        </span>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-600 flex-wrap">
          {item.products && (
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3" />{item.products.name}
            </span>
          )}
        </div>
      </div>
      {item.freight_cost > 0 && (
        <span className="text-sm font-bold text-orange-600 tabular-nums shrink-0">
          GH₵{fmt(item.freight_cost)}
        </span>
      )}
    </div>
  )
}