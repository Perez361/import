import { redirect } from 'next/navigation'
import { getCustomerForStore } from '@/lib/auth/store-session'
import { StorefrontWrapper } from '@/components/store/StorefrontWrapper'
import { Toaster } from 'sonner'

// Force dynamic rendering to ensure session is always checked
export const dynamic = 'force-dynamic'

export default async function StoreSlugLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  
  // Server-side auth check - get customer for this store
  const initialCustomer = await getCustomerForStore(slug)
  
  return (
    <StorefrontWrapper slug={slug} initialCustomer={initialCustomer}>
      <Toaster position="top-right" richColors />
      {children}
    </StorefrontWrapper>
  )
}
