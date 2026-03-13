'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Store, Eye, Link, Share2 } from 'lucide-react'

// Types
interface Importer {
  business_name: string
  username: string
  store_slug: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  shipping_tag: string
}

// Inline slugify
function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function StorefrontPage() {
  const [importer, setImporter] = useState<Importer | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: importerData } = await supabase.from('importers').select('*').eq('id', user.id).single()
        setImporter(importerData as Importer)
        const { data: prods } = await supabase.from('products').select('*').eq('importer_id', user.id).order('created_at', { ascending: false })
        setProducts(prods || [])
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!importer) {
    return <div className="p-8">No importer data</div>
  }

  const businessName = importer.business_name || 'My Store'
  const storeSlug = importer.store_slug || slugify(importer.username || 'my-store')
  const storeUrl = `https://importation.vercel.app/store/${storeSlug}` // Update to your Vercel URL

  const handleCopy = async () => {
    await navigator.clipboard.writeText(storeUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePreview = () => {
    window.open(`/store/${storeSlug}`, '_blank')
  }

  const totalProducts = products.length

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
          <button onClick={handlePreview} className="flex items-center gap-2 rounded-xl bg-[var(--color-success)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-success)]/90">
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button onClick={handleCopy} className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]">
            <Link className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Store URL</h2>
          <div className="flex gap-3 p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] items-center">
            <span className="font-mono text-sm text-[var(--color-text-muted)] truncate flex-1">{storeUrl}</span>
            <button onClick={handleCopy} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--color-brand)] text-white text-xs font-semibold hover:bg-[var(--color-brand)]/90">
              <Share2 className="h-3 w-3" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Stats</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-sm text-[var(--color-text-muted)]">Products</span>
              <span className="font-semibold text-[var(--color-text-primary)]">{totalProducts}</span>
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
          {products.map((product) => (
            <div key={product.id} className="border border-[var(--color-border)] rounded-xl p-6 hover:shadow-lg transition-all group">
              <div className="w-full h-32 rounded-lg mb-4 group-hover:scale-105 transition-transform overflow-hidden bg-[var(--color-muted)]" 
                   style={{ 
                     backgroundImage: product.image_url ? `url(${product.image_url})` : 'none',
                     backgroundSize: 'cover', 
                     backgroundPosition: 'center' 
                   }}>
                {!product.image_url && (
                  <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)]">
                    <Store className="h-8 w-8" />
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-1 truncate">{product.name}</h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-2 line-clamp-2">{product.description || 'Pre-order now'}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-[var(--color-success)]">GH₵{product.price?.toLocaleString()}</span>
                <span className="text-xs bg-[var(--color-success-light)] text-[var(--color-success)] px-2 py-1 rounded-full font-medium">
                  {product.shipping_tag}
                </span>
              </div>
            </div>
          ))}
        </div>
        {products.length === 0 && (
          <div className="col-span-full text-center py-12 text-[var(--color-text-muted)] border-2 border-dashed border-[var(--color-border)] rounded-2xl">
            <Store className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No products yet</h3>
            <p>Add your first pre-order product at <a href="/dashboard/products/new" className="text-[var(--color-brand)] hover:underline">Products</a></p>
          </div>
        )}
      </div>
    </div>
  )
}

