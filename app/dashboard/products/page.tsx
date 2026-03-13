import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { getImporter } from '@/lib/importer'
import { Package, Image, DollarSign, Tag, Edit3, Trash2, ShoppingCart } from 'lucide-react'
import { getProductsByImporter } from '@/lib/products'

export default async function ProductsPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  const importer = await getImporter(user.id)

  const products = await getProductsByImporter(user.id) || []

  const totalProducts = products.length

  const demoProducts = products.length === 0 ? [] : products.map((p: any) => ({
    id: `#P${p.id.slice(-4)}`,
    name: p.name,
    price: p.price.toString(),
    description: p.description || '',
    image: !!p.image_url,
    stock: 'Pre-order',
    costPrice: '0',
    sellingPrice: p.price.toString(),
    status: 'Active'
  }))

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Products</h1>
        <a href="/dashboard/products/new" className="flex items-center gap-2 rounded-xl bg-[var(--color-success)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-[var(--color-success)]/90 transition-all">
          <Package className="h-4 w-4" />
          + Add New Product
        </a>
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
              <p className="font-semibold text-[var(--color-text-primary)]">{totalProducts} products total</p>
              <p className="text-sm text-[var(--color-text-muted)]">Pre-order available</p>
            </div>
          </div>
        </div>
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
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
Number(product.stock) > 10 ? 'bg-[var(--color-success-light)] text-[var(--color-success)]' :
                      Number(product.stock) > 0 ? 'bg-[var(--color-warning-light)] text-[var(--color-warning)]' :
                      'bg-[var(--color-danger-light)] text-[var(--color-danger)]'
                    }`}>
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
                      <button className="p-1.5 text-[var(--color-brand)] hover:bg-[var(--color-brand-light)] rounded-lg transition-all">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] rounded-lg transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 text-center py-12 text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
          Full product management (bulk import, variants, images, categories) coming soon
        </div>
      </div>
    </div>
  )
}

