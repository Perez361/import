'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Image, Edit3, Trash2, Loader2, Hash, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { deleteProductAction } from './actions'


interface Product {
  id: string
  name: string
  price: number
  description: string
  image_url: string
  created_at: string
  tracking_number?: string | null
  supplier_name?: string | null
}

interface ProductsTableProps {
  initialProducts: Product[]
}

export default function ProductsTable({ initialProducts }: ProductsTableProps) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingTrackingId, setEditingTrackingId] = useState<string | null>(null)
  const [trackingInput, setTrackingInput] = useState('')
  const [savingTrackingId, setSavingTrackingId] = useState<string | null>(null)

  const handleDelete = async (productId: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    setDeletingId(productId)
    try {
      const result: any = await deleteProductAction(productId)
      if (result?.error) toast.error(result.error)
      else {
        setProducts((prev) => prev.filter((p) => p.id !== productId))
        toast.success('Product deleted')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  const startEditTracking = (product: Product) => {
    setEditingTrackingId(product.id)
    setTrackingInput(product.tracking_number || '')
  }

  const cancelEditTracking = () => {
    setEditingTrackingId(null)
    setTrackingInput('')
  }

  const saveTracking = async (productId: string) => {
    setSavingTrackingId(productId)
    const supabase = createClient()
    const value = trackingInput.trim().toUpperCase() || null
    const { error } = await supabase
      .from('products')
      .update({ tracking_number: value })
      .eq('id', productId)
    setSavingTrackingId(null)
    if (error) {
      toast.error('Failed to save tracking number')
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, tracking_number: value } : p))
      )
      setEditingTrackingId(null)
      toast.success(value ? 'Tracking number saved' : 'Tracking number cleared')
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {['Tracking No.', 'Product', 'Price', 'Status', 'Actions'].map((h) => (
              <th
                key={h}
                className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-[var(--color-surface)] transition-colors">

              {/* Tracking No. — inline editable */}
              <td className="px-6 py-4">
                {editingTrackingId === product.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      type="text"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTracking(product.id)
                        if (e.key === 'Escape') cancelEditTracking()
                      }}
                      placeholder="e.g. 1Z999AA1..."
                      className="w-44 px-2.5 py-1.5 rounded-lg border border-[var(--color-brand)] bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                    />
                    <button
                      onClick={() => saveTracking(product.id)}
                      disabled={savingTrackingId === product.id}
                      className="p-1.5 rounded-lg bg-[var(--color-success)] text-white hover:bg-[var(--color-success)]/90 disabled:opacity-50 transition-all"
                    >
                      {savingTrackingId === product.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={cancelEditTracking}
                      className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditTracking(product)}
                    className="group flex items-center gap-1.5 text-left"
                    title="Click to add/edit tracking number"
                  >
                    {product.tracking_number ? (
                      <span className="font-mono text-xs bg-[var(--color-surface)] border border-[var(--color-border)] group-hover:border-[var(--color-brand)] px-2.5 py-1.5 rounded-lg text-[var(--color-text-primary)] transition-colors">
                        {product.tracking_number}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] group-hover:text-[var(--color-brand)] border border-dashed border-[var(--color-border)] group-hover:border-[var(--color-brand)] px-2.5 py-1.5 rounded-lg transition-colors">
                        <Hash className="h-3 w-3" />
                        Add tracking
                      </span>
                    )}
                  </button>
                )}
              </td>

              {/* Product */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-muted)] overflow-hidden shrink-0">
                    {product.image_url
                      ? <Image className="h-5 w-5 text-[var(--color-text-muted)]" />
                      : <Package className="h-5 w-5 text-[var(--color-text-muted)]" />}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--color-text-primary)] text-sm">{product.name}</p>
                    {product.supplier_name && (
                      <p className="text-xs text-[var(--color-text-muted)]">{product.supplier_name}</p>
                    )}
                  </div>
                </div>
              </td>

              {/* Price */}
              <td className="px-6 py-4 font-semibold text-[var(--color-text-primary)]">
                GH₵{product.price.toLocaleString('en-GH')}
              </td>

              {/* Status */}
              <td className="px-6 py-4">
                <span className="px-2.5 py-1 bg-[var(--color-success-light)] text-[var(--color-success)] text-xs rounded-full font-semibold">
                  Active
                </span>
              </td>

              {/* Actions */}
              <td className="px-6 py-4">
                <div className="flex gap-1">
                  <button
                    onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
                    className="p-1.5 text-[var(--color-brand)] hover:bg-[var(--color-brand-light)] rounded-lg transition-all"
                    title="Edit product"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deletingId === product.id}
                    className="p-1.5 text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] rounded-lg transition-all disabled:opacity-50"
                    title="Delete product"
                  >
                    {deletingId === product.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}