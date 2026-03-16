'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Image, Edit3, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  price: number
  description: string
  image_url: string
  created_at: string
}

interface ProductsTableProps {
  initialProducts: Product[]
}

export default function ProductsTable({ initialProducts }: ProductsTableProps) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (productId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this product? This action cannot be undone.')
    if (!confirmed) return

    setDeletingId(productId)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      setProducts(products.filter((p) => p.id !== productId))
      toast.success('Product deleted successfully')
    } catch (error: any) {
      console.error('Error deleting product:', error)
      toast.error(error.message || 'Failed to delete product')
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (productId: string) => {
    router.push(`/dashboard/products/${productId}/edit`)
  }

  const demoProducts = products.map((p) => ({
    id: `#P${p.id.slice(-4)}`,
    realId: p.id,
    name: p.name,
    price: p.price.toString(),
    description: p.description || '',
    image: !!p.image_url,
    stock: 'Pre-order',
    costPrice: '0',
    sellingPrice: p.price.toString(),
    status: 'Active',
  }))

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">ID</th>
            <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Product</th>
            <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Stock</th>
            <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Cost</th>
            <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Selling</th>
            <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Profit</th>
            <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Status</th>
            <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {demoProducts.map((product) => (
            <tr key={product.id} className="hover:bg-[var(--color-surface)] transition-colors">
              <td className="px-6 py-4 font-mono text-sm text-[var(--color-text-muted)]">{product.id}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-muted)] overflow-hidden">
                    {product.image ? (
                      <Image className="h-6 w-6 text-[var(--color-text-muted)]" />
                    ) : (
                      <Package className="h-6 w-6 text-[var(--color-text-muted)]" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--color-text-primary)]">{product.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">SKU: PRD-{product.id.slice(2)}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-brand-light)] text-[var(--color-brand)]">
                  {product.stock}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-[var(--color-text-muted)]">GH₵{product.costPrice}</td>
              <td className="px-6 py-4 font-semibold text-[var(--color-text-primary)]">GH₵{product.sellingPrice}</td>
              <td className="px-6 py-4 font-semibold text-[var(--color-success)]">
                {(parseInt(product.sellingPrice) - parseInt(product.costPrice)).toLocaleString()}
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-[var(--color-success-light)] text-[var(--color-success)] text-xs rounded-full font-medium">
                  Active
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(product.realId)}
                    className="p-1.5 text-[var(--color-brand)] hover:bg-[var(--color-brand-light)] rounded-lg transition-all"
                    title="Edit product"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.realId)}
                    disabled={deletingId === product.realId}
                    className="p-1.5 text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] rounded-lg transition-all disabled:opacity-50"
                    title="Delete product"
                  >
                    {deletingId === product.realId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
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
