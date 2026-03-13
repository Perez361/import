import { getImporterBySlug, getProductsBySlug } from '@/lib/store'
import { Package, Phone, MapPin, ShoppingCart } from 'lucide-react'
import Image from 'next/image'

interface Product {
  name: string
  price: number
  image_url?: string
  description?: string
}

export default async function StorePage({ params }: { params: { slug: string } }) {
  const importer = await getImporterBySlug(params.slug)
  if (!importer) {
    return <div className="p-8 text-center">Store not found</div>
  }

  const products = await getProductsBySlug(params.slug) as Product[]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              {importer.business_name}
            </h1>
            <p className="text-xl text-gray-600 mb-8">Mini Importation - Pre-Order Products</p>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center max-w-md mx-auto mb-12">
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="h-5 w-5" />
                {importer.phone}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-5 w-5" />
                {importer.location}
              </div>
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
                <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center overflow-hidden">
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

