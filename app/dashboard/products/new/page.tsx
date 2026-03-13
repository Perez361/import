'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Package, Upload, Image as ImageIcon, X } from 'lucide-react'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: ''
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile || !formData.name || !formData.price) return

    setLoading(true)

    // Get user ID
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Login required')
      setLoading(false)
      return
    }

    // Upload image
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const path = `${user.id}/${fileName}`
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, imageFile)

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setLoading(false)
      return
    }

    const publicUrl = supabase.storage
      .from('product-images')
      .getPublicUrl(path).data.publicUrl

    // Insert product
    const { error: insertError } = await supabase
      .from('products')
      .insert({
        importer_id: user.id,
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description || null,
        image_url: publicUrl
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
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition"
        >
          <X className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Add New Product</h1>
      </div>

      <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Product Image
            </label>
            <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center hover:border-[var(--color-brand-light)] transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}>
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  <button type="button" className="absolute top-2 right-2 p-1 bg-[var(--color-danger)] text-white rounded-full"
                    onClick={() => {setImagePreview(null); setImageFile(null)}}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 mx-auto mb-4 text-[var(--color-muted)]" />
                  <p className="text-[var(--color-text-muted)] mb-1">Click to upload image</p>
                  <p className="text-xs text-[var(--color-text-muted)]">PNG, JPG</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setImageFile(file)
                  setImagePreview(URL.createObjectURL(file))
                }
              }}
              className="hidden"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition"
                placeholder="650"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition resize-vertical"
              placeholder="Product details, sizes, pre-order info..."
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              "Without shipping fee" tag is automatically added
            </p>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[var(--color-success)] hover:bg-[var(--color-success-dark)] text-white font-semibold py-3 rounded-xl transition-all shadow-lg">
            {loading ? 'Creating...' : (
              <>
                <Package className="h-4 w-4 mr-2 inline" />
                Create Product
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

