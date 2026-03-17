'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { validateImageFile, optimizeProductImage, formatBytes, MAX_INPUT_SIZE_MB } from '@/lib/imageOptimizer'
import { createProductAction } from '../actions'

interface Props {
  userId: string
}

export default function NewProductForm({ userId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [optimizing, setOptimizing] = useState(false)
  const [optimizeInfo, setOptimizeInfo] = useState<{ original: number; optimized: number } | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile) { toast.error('Please select a product image'); return }
    if (!name.trim()) { toast.error('Please enter a product name'); return }
    if (!price) { toast.error('Please enter a price'); return }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('name', name.trim())
      fd.append('price', price)
      fd.append('description', description)
      fd.append('image', imageFile, imageFile.name)

      const result = await createProductAction(fd)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Product created!')
        router.push('/dashboard/products')
        router.refresh()
      }
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button type="button" onClick={() => router.back()}
          className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition">
          <X className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Add New Product</h1>
      </div>

      <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Image */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Product Image
            </label>
            <div
              className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center hover:border-[var(--color-brand)] transition-colors cursor-pointer"
              onClick={() => !optimizing && fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  <button type="button"
                    className="absolute top-2 right-2 p-1 bg-[var(--color-danger)] text-white rounded-full"
                    onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null); setOptimizeInfo(null); if (fileInputRef.current) fileInputRef.current.value = '' }}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : optimizing ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand)]" />
                  <p className="text-sm text-[var(--color-text-muted)]">Optimizing image…</p>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 mx-auto mb-4 text-[var(--color-text-muted)]" />
                  <p className="text-[var(--color-text-muted)] mb-1">Click to upload image</p>
                  <p className="text-xs text-[var(--color-text-muted)]">PNG, JPG, WebP — max {MAX_INPUT_SIZE_MB} MB · auto-optimized</p>
                </>
              )}
            </div>
            {optimizeInfo && !optimizing && (
              <p className="mt-2 text-xs text-[var(--color-success)]">
                ✓ Compressed {formatBytes(optimizeInfo.original)} → {formatBytes(optimizeInfo.optimized)}
              </p>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          {/* Name & Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">Product Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition"
                placeholder="e.g. Nike Air Max 90" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">Price (GH₵) *</label>
              <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition"
                placeholder="650" required />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition resize-vertical"
              placeholder="Product details, sizes, pre-order info..." />
            <p className="text-xs text-[var(--color-text-muted)] mt-1">"Without shipping fee" tag is automatically added</p>
          </div>

          <button type="submit" disabled={loading || optimizing}
            className="w-full bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 text-white font-semibold py-3 rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : <><Package className="h-4 w-4" /> Create Product</>}
          </button>
        </form>
      </div>
    </div>
  )
}