import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { getImporter } from '@/lib/importer'
import { slugify } from '@/lib/utils'
import { getProductsByImporter } from '@/lib/products'
import { Store, Eye, Link, Share2, Edit3, Trash2 } from 'lucide-react'

export default async function StorefrontPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  const importer = await getImporter(user.id)
  const businessName = importer?.business_name || 'My Store'
  const storeSlug = importer?.store_slug || slugify(businessName)

  const products = await getProductsByImporter(user.id) || []

  const demoProducts = products.map((p: any) => ({
    name: p.name,
    price: `GH₵${p.price}`,
    stock: 'Pre-order | Without shipping fee'
  }))
    { name: 'Nike Air Max', price: 'GH₵650', stock: '12 in stock' },
    { name: 'iPhone 15 Pro', price: 'GH₵9,800', stock: '5 in stock' },
    { name: 'Samsung Galaxy S24', price: 'GH₵7,500', stock: '8 in stock' },
    { name: 'MacBook Air M2', price: 'GH₵12,400', stock: '3 in stock' },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-brand-light)]">
          <Store className="h-8 w-8 text-[var(--color-brand)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{businessName}</h1>
            <p className="text-sm text-[var(--color-text-muted)]">Your public storefront</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-xl bg-[var(--color-success)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-success)]/90">
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]">
            <Link className="h-4 w-4" />
            Copy Link
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Store URL</h2>
          <div className="flex gap-3 p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] items-center">
            <span className="font-mono text-sm text-[var(--color-text-muted)]">importflow.app/store/{storeSlug}</span>
            <button className="flex items-center gap-1 ml-auto px-3 py-1.5 rounded-lg bg-[var(--color-brand)] text-white text-xs font-semibold hover:bg-[var(--color-brand)]/90 transition">
              <Share2 className="h-3 w-3" />
              Share
            </button>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Stats</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-sm text-[var(--color-text-muted)]">Products</span>
              <span className="font-semibold text-[var(--color-text-primary)]">{products.length}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-[var(--color-text-muted)]">Visitors</span>
              <span className="font-semibold text-[var(--color-text-primary)]">156</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-[var(--color-text-muted)]">Orders</span>
              <span className="font-semibold text-[var(--color-success)]">7</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Preview Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {demoProducts.map((product, index) => (
            <div key={index} className="border border-[var(--color-border)] rounded-xl p-6 hover:shadow-lg transition-all group">
              <div className="w-full h-32 bg-[var(--color-muted)] rounded-lg mb-4 group-hover:scale-105 transition-transform"></div>
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">{product.name}</h3>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-[var(--color-success)]">GH₵{product.price}</span>
                <span className="text-sm text-[var(--color-success)]">{product.stock}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 p-6 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] text-center text-[var(--color-text-muted)]">
        <Edit3 className="h-12 w-12 mx-auto mb-4 text-[var(--color-muted)]" />
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Customize Your Store</h3>
        <p>Store customization, themes, banners, and SEO settings coming soon.</p>
      </div>
    </div>
  )
}

