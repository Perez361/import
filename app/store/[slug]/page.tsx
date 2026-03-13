import { getImporterBySlug, getProductsBySlug } from '@/lib/store'
import { CartProvider } from '@/components/store/CartContext'
import StoreContent from '@/components/store/StoreContent'

interface Product {
  id: string
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

  return (
    <CartProvider slug={slug}>
      <StoreContent 
        slug={slug} 
        importer={{
          business_name: importer.business_name,
          phone: importer.phone,
          location: importer.location
        }} 
        products={products} 
      />
    </CartProvider>
  )
}
