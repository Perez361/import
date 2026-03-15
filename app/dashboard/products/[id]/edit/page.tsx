'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Package, Upload, Image as ImageIcon, X, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  price: number
  description: string
  image_url: string
  slug: string
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: ''
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      const supabase = createClient()
      
      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch product
      const { data: productData, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('importer_id', user.id)
        .single()

      if (error || !productData) {
        toast.error('Product not found')
        router.push('/dashboard/products')
        return
      }

      setProduct(productData)
      setFormData({
        name: productData.name || '',
        price: productData.price?.toString() || '',
        description: productData.description || ''
      })
      setImagePreview(productData.image_url || null)
      setLoading(false)
    }

    fetchProduct()
  }, [productId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.price) return

    setSaving(true)
    const supabase = createClient()

    try {
      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Login required')
        setSaving(false)
        return
      }

      let imageUrl = product?.image_url || ''

      // Upload new image if selected
      if (imageFile) {
        // Delete old image if exists
        if (product?.image_url) {
          const oldPath = product.image_url.split('/product-images/')[1]
          if (oldPath) {
            await supabase.storage.from('product-images').remove([oldPath])
          }
        }

        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${fileExt}`
        const path = `${user.id}/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, imageFile)

        if (uploadError) {
          toast.error('Upload failed: ' + uploadError.message)
          setSaving(false)
          return
        }

        imageUrl = supabase.storage
          .from('product-images')
          .getPublicUrl(path).data.publicUrl
      }

      // Update product
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: formData.name,
          price: parseFloat(formData.price),
          description: formData.description || '',
          image_url: imageUrl
        })
        .eq('id', productId)
        .eq('importer_id', user.id)

      if (updateError) {
        toast.error('Failed to update product: ' + updateError.message)
      } else {
        toast.success('Product updated successfully!')
        router.push('/dashboard/products')
        router.refresh()
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-2xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading product...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Edit Product</h1>
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
                    onClick={(e) => {
                      e.stopPropagation()
                      setImagePreview(null)
                      setImageFile(null)
                    }}>
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

          <button type="submit" disabled={saving} className="w-full bg-[var(--color-success)] hover:bg-[var(--color-success-dark)] text-white font-semibold py-3 rounded-xl transition-all shadow-lg disabled:opacity-50">
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2 inline" />
                Save Changes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
