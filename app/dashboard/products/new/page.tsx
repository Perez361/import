'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Package, Upload, Image as ImageIcon, X } from 'lucide-react'
import { Input, Button, Textarea } from '@/components/ui' // Assume or use FormInput from auth

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

  const handleImageUpload = async () => {
    if (!imageFile) return

    setLoading(true)

    // Upload to storage: product-images/{userId}/{uuid}.jpg
    const user = supabase.auth.getUser()
    const userId = (await user).data.user?.id
    if (!userId) {
      alert('User not found')
      return
    }

    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const bucket = 'product-images'
    const path = `${userId}/${fileName}`

    const { data: { publicUrl }, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, imageFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      alert('Image upload failed: ' + uploadError.message)
      setLoading(false)
      return
    }

    // Create product
    const { error: createError } = await supabase
      .rpc('create_product', { // Or direct insert; use server func later?
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description,
        image_url: publicUrl
      })

    if (createError) {
      alert('Product creation failed: ' + createError.message)
    } else {
      router.push('/dashboard/products')
      router.refresh()
    }

    setLoading(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleImageUpload()
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
          {/* Image Upload */}
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
                  <p className="text-[var(--color-text-muted)] mb-1">Click to upload or drag image</p>
                  <p className="text-xs text-[var(--color-text-muted)]">PNG, JPG up to 5MB</p>
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
            />
          </div>

          {/* Form Fields */}
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
              "Without shipping fee" tag auto-added
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-[var(--color-success)] hover:bg-[var(--color-success-dark)] text-white font-semibold py-3 rounded-xl transition-all">
            {loading ? 'Creating...' : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Create Product
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

