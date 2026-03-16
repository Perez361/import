'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { createBatchAction } from './actions'

export default function NewBatchForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', shipping_company: '', notes: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) { toast.error('Batch name is required'); return }
    setLoading(true)
    const result = await createBatchAction(form)
    setLoading(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Batch created!')
      router.push(`/dashboard/shipments/${result.id}`)
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--color-surface)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-[var(--color-brand)]" />
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            Create New Shipment Batch
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-[var(--color-text-muted)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
        )}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-5 pb-5 border-t border-[var(--color-border)] pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">
                Batch Name *
              </label>
              <input
                type="text"
                placeholder="e.g. July 2025 Batch"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">
                Shipping Company
              </label>
              <input
                type="text"
                placeholder="e.g. Speedaf, DHL, FedEx"
                value={form.shipping_company}
                onChange={(e) => setForm({ ...form, shipping_company: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">
              Notes (optional)
            </label>
            <input
              type="text"
              placeholder="Any notes about this batch..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-brand)] text-white text-sm font-semibold hover:bg-[var(--color-brand-dark)] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create Batch
          </button>
        </form>
      )}
    </div>
  )
}