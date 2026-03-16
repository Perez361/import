'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Package, Upload, Image as ImageIcon, X, Loader2, ArrowLeft,
  Truck, ExternalLink, Hash
} from 'lucide-react'
import { toast } from 'sonner'
import { validateImageFile, optimizeProductImage, formatBytes, MAX_INPUT_SIZE_MB } from '@/lib/imageOptimizer'

interface Product {
  id: string
  name: string
  price: number
  description: string
  image_url: string
  slug: string
  tracking_number?: string | null
  supplier_url?: string | null
  supplier_name?: string | null
}



interface Props {
  product: Product
  userId: string
}

export default function EditProductForm({ product, userId }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [optimizeInfo, setOptimizeInfo] = useState<{ original: number; optimized: number } | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(product.image_url || null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: product.name || '',
    price: product.price?.toString() || '',
    description: product.description || '',
    tracking_number: product.tracking_number || '',
    supplier_name: product.supplier_name || '',
    supplier_url: product.supplier_url || '',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.price) return

    setSaving(true)
    const supabase = createClient()

    try {
      let imageUrl = product.image_url || ''

      if (imageFile) {
        if (product.image_url) {
          const oldPath = product.image_url.split('/product-images/')[1]
          if (oldPath) await supabase.storage.from('product-images').remove([oldPath])
        }
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${fileExt}`
        const path = `${userId}/${fileName}`
        const { error: uploadError } = await supabase.storage
          .from('product-images').upload(path, imageFile)
        if (uploadError) { toast.error('Upload failed: ' + uploadError.message); setSaving(false); return }
        imageUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: formData.name,
          price: parseFloat(formData.price),
          description: formData.description || '',
          image_url: imageUrl,
          tracking_number: formData.tracking_number.trim().toUpperCase() || null,
          supplier_name: formData.supplier_name || null,
          supplier_url: formData.supplier_url || null,
        })
        .eq('id', product.id)
        .eq('importer_id', userId)

      if (updateError) {
        toast.error('Failed to update: ' + updateError.message)
      } else {
        toast.success('Product updated!')
        router.push('/dashboard/products')
        router.refresh()
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[var(--color-text-muted)]" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Edit Product</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{product.name}</p>
        </div>
      </div>

      {/* Main form */}
      <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Image */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Product Image
            </label>
            <div
              className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-6 text-center hover:border-[var(--color-brand)] transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-44 object-cover rounded-lg" />
                  <button
                    type="button"
                    className="absolute top-2 right-2 p-1 bg-[var(--color-danger)] text-white rounded-full"
                    onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null) }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto mb-3 text-[var(--color-text-muted)]" />
                  <p className="text-sm text-[var(--color-text-muted)]">Click to upload image</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">PNG, JPG, WebP — max 5 MB · auto-optimized</p>
                </>
              )}
            </div>
            {optimizing && (
              <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <svg className="animate-spin h-3 w-3 text-[var(--color-brand)]" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                Optimizing image…
              </div>
            )}
            {optimizeInfo && !optimizing && (
              <p className="mt-2 text-xs text-[var(--color-success)]">
                ✓ Compressed {formatBytes(optimizeInfo.original)} → {formatBytes(optimizeInfo.optimized)}
              </p>
            )}
            <input
              ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const err = validateImageFile(file)
                if (err) { toast.error(err); e.target.value = ''; return }
                setOptimizing(true)
                setOptimizeInfo(null)
                try {
                  const result = await optimizeProductImage(file)
                  setImageFile(result.file)
                  setImagePreview(URL.createObjectURL(result.file))
                  setOptimizeInfo({ original: result.originalSize, optimized: result.optimizedSize })
                } catch {
                  toast.error('Failed to process image. Please try another file.')
                } finally {
                  setOptimizing(false)
                }
              }}
            />
          </div>

          {/* Name & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-[var(--color-text-primary)]">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent text-sm"
                placeholder="e.g. Nike Air Max 90"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-[var(--color-text-primary)]">
                Price (GH₵) *
              </label>
              <input
                type="number" step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent text-sm"
                placeholder="650"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-[var(--color-text-primary)]">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent text-sm resize-vertical"
              placeholder="Product details, sizes, pre-order info..."
            />
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--color-border)] pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3 flex items-center gap-2">
              <Truck className="h-3.5 w-3.5" /> Supplier & Tracking
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tracking number */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-[var(--color-text-primary)] flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={formData.tracking_number}
                  onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent text-sm font-mono"
                  placeholder="e.g. 1Z999AA10123456784"
                />
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Latest tracking number from the overseas store
                </p>
              </div>

              {/* Supplier name */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-[var(--color-text-primary)]">
                  Supplier / Store
                </label>
                <input
                  type="text"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent text-sm"
                  placeholder="e.g. Amazon, Shein, AliExpress"
                />
              </div>
            </div>

            {/* Supplier URL */}
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-1.5 text-[var(--color-text-primary)] flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                Supplier Product URL
              </label>
              <input
                type="url"
                value={formData.supplier_url}
                onChange={(e) => setFormData({ ...formData, supplier_url: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent text-sm"
                placeholder="https://amazon.com/dp/..."
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Link to the product page on the overseas store
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 text-white font-semibold py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Package className="h-4 w-4" /> Save Changes</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}