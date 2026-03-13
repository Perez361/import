import { getImporterBySlug, getProductsBySlug } from '@/lib/store'
import { getCustomerUser } from '@/lib/auth/user-type'
import { Package, Phone, MapPin, ShoppingCart, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

interface Product {
  name: string
  price: number
  image_url?: string
  description?: string
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const importer = await getImporterBySlug(slug)
  if (!importer) {
    return <div className="p-8 text-center">Store not found</div>
  }

  const products = await getProductsBySlug(slug) as Product[]

  // Check if customer is logged in for this store
  const customer = await getCustomerUser()
  const isLoggedIn = customer?.importers?.store_slug === slug
  const customerName = customer?.full_name || customer?.username || 'Customer'

  // Handle logout
  const handleLogout = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            {/* Left: Business Info */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {importer.business_name}
              </h1>
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {importer.phone}
                </span>
                <span className="text-gray-400">|</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {importer.location}
                </span>
              </div>
            </div>

            {/* Right: Profile & Cart */}
            <div className="flex items-center gap-2">
              {isLoggedIn ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">{customerName}</span>
                  </div>
                  <form action={async () => {
                    'use server'
                    const supabase = await createClient()
                    await supabase.auth.signOut()
                  }}>
                    <button 
                      type="submit"
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      title="Logout"
                    >
                      <LogOut className="h-5 w-5 text-gray-700" />
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link 
                    href={`/store/${slug}/login`}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Login
                  </Link>
                  <Link 
                    href={`/store/${slug}/register`}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Account
                  </Link>
                </>
              )}
              <Link href={`/store/${slug}/cart`} className="p-2 rounded-full hover:bg-gray-100 transition-colors relative ml-2">
                <ShoppingCart className="h-6 w-6 text-gray-700" />
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">0</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Available Products</h2>
          <div className="text-sm text-gray-500">{products.length} items</div>
        </div>
        {products.length === 0 ? (
          <div className="text-center py-24">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500">Check back later for new pre-orders!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <div key={index} className="group bg-white rounded-2xl border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all overflow-hidden">
                <div className="relative h-64 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <Package className="h-20 w-20 text-gray-400" />
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 leading-tight line-clamp-2">{product.name}</h3>
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-blue-600">GH₵{product.price}</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      Pre-Order Available
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-500">
          Pre-order only • Without shipping fee • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  )
}

