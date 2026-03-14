import { getImporterBySlug, getProductsBySlug } from '@/lib/store'
import StoreContent from '@/components/store/StoreContent'

// Force dynamic rendering to ensure session is always checked
export const dynamic = 'force-dynamic'

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
    <StoreContent 
      slug={slug} 
      importer={{
        business_name: importer.business_name,
        phone: importer.phone,
        location: importer.location
      }} 
      products={products} 
    />
  )
}

