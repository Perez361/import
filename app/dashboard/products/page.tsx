import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Package } from 'lucide-react'
import ProductsTable from './ProductsTable'

export const metadata = {
  title: 'Products – ImportFlow PRO',
}

export default async function ProductsPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('importer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
  }

  const productList = products || []

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Products</h1>
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-2 rounded-xl bg-[var(--color-success)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-[var(--color-success)]/90 transition-all"
        >
          <Package className="h-4 w-4" />
          + Add New Product
        </Link>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-[var(--color-brand-light)] border-2 border-[var(--color-card)]" />
              <div className="w-8 h-8 rounded-full bg-[var(--color-success-light)] border-2 border-[var(--color-card)]" />
              <div className="w-8 h-8 rounded-full bg-[var(--color-warning-light)] border-2 border-[var(--color-card)]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">{productList.length} products total</p>
              <p className="text-sm text-[var(--color-text-muted)]">Pre-order available</p>
            </div>
          </div>
        </div>

        {productList.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-16 w-16 text-[var(--color-text-muted)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No products yet</h3>
            <p className="text-[var(--color-text-muted)] mb-6">Get started by adding your first pre-order product</p>
            <Link
              href="/dashboard/products/new"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-success)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-[var(--color-success)]/90 transition-all"
            >
              <Package className="h-4 w-4" />
              + Add New Product
            </Link>
          </div>
        ) : (
          <ProductsTable initialProducts={productList} />
        )}

        <div className="p-6 text-center py-4 text-[var(--color-text-muted)] border-t border-[var(--color-border)] text-sm">
          Showing {productList.length} product{productList.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}
