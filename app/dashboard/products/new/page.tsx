'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Package, Upload, Image as ImageIcon, X } from 'lucide-react'
import { validateImageFile, optimizeProductImage, formatBytes, MAX_INPUT_SIZE_MB } from '@/lib/imageOptimizer'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [optimizing, setOptimizing] = useState(false)
  const [optimizeInfo, setOptimizeInfo] = useState<{ original: number; optimized: number } | null>(null)
  const [formData, setFormData] = useState({ name: '', price: '', description: '' })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile || !formData.name || !formData.price) return

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('Login required'); setLoading(false); return }

    // Upload already-optimized file
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const path = `${user.id}/${fileName}`
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, imageFile)

    if (uploadError) { alert('Upload failed: ' + uploadError.message); setLoading(false); return }

    const publicUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl

    const slug = formData.name
      ? formData.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
      : 'unnamed'

    const { error: insertError } = await supabase.from('products').insert({
      importer_id: user.id,
      name: formData.name,
      slug,
      price: parseFloat(formData.price),
      description: formData.description || '',
      image_url: publicUrl,
    })

    if (insertError) {
      alert('Failed to save product: ' + insertError.message)
    } else {
      router.push('/dashboard/products')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition">
          <X className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Add New Product</h1>
      </div>

      <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Image upload */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Product Image
            </label>
            <div
              className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center hover:border-[var(--color-brand-light)] transition-colors cursor-pointer"
              onClick={() => !optimizing && fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  <button
                    type="button"
                    className="absolute top-2 right-2 p-1 bg-[var(--color-danger)] text-white rounded-full"
                    onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null); setOptimizeInfo(null) }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : optimizing ? (
                <div className="flex flex-col items-center gap-3">
                  <svg className="animate-spin h-8 w-8 text-[var(--color-brand)]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  <p className="text-sm text-[var(--color-text-muted)]">Optimizing image…</p>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 mx-auto mb-4 text-[var(--color-text-muted)]" />
                  <p className="text-[var(--color-text-muted)] mb-1">Click to upload image</p>
                  <p className="text-xs text-[var(--color-text-muted)]">PNG, JPG, WebP — max {MAX_INPUT_SIZE_MB} MB · auto-optimized to WebP</p>
                </>
              )}
            </div>

            {/* Optimization feedback */}
            {optimizeInfo && !optimizing && (
              <p className="mt-2 text-xs text-[var(--color-success)] flex items-center gap-1">
                <span>✓</span>
                <span>Compressed {formatBytes(optimizeInfo.original)} → {formatBytes(optimizeInfo.optimized)} — ready to upload</span>
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const err = validateImageFile(file)
                if (err) { alert(err); e.target.value = ''; return }
                setOptimizing(true)
                setOptimizeInfo(null)
                try {
                  const result = await optimizeProductImage(file)
                  setImageFile(result.file)
                  setImagePreview(URL.createObjectURL(result.file))
                  setOptimizeInfo({ original: result.originalSize, optimized: result.optimizedSize })
                } catch {
                  alert('Failed to process image. Please try another file.')
                } finally {
                  setOptimizing(false)
                }
              }}
              className="hidden"
              required
            />
          </div>

          {/* Name & Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition"
                placeholder="e.g. Nike Air Max 90"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">Price (GH₵)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition"
                placeholder="650"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition resize-vertical"
              placeholder="Product details, sizes, pre-order info..."
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              "Without shipping fee" tag is automatically added
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || optimizing}
            className="w-full bg-[var(--color-success)] hover:bg-[var(--color-success-dark)] text-white font-semibold py-3 rounded-xl transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Creating...' : (
              <span className="flex items-center justify-center gap-2">
                <Package className="h-4 w-4" />
                Create Product
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}