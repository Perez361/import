import { getCustomerForStore } from '@/lib/auth/store-session'
import { StorefrontWrapper } from '@/components/store/StorefrontWrapper'
import CustomerInactivityGuard from '@/components/store/CustomerInactivityGuard'
import { Toaster } from 'sonner'

export const dynamic = 'force-dynamic'

export default async function StoreSlugLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const initialCustomer = await getCustomerForStore(slug)

  return (
    <StorefrontWrapper slug={slug} initialCustomer={initialCustomer}>
      <Toaster position="top-right" richColors />
      <CustomerInactivityGuard slug={slug}>
        {children}
      </CustomerInactivityGuard>
    </StorefrontWrapper>
  )
}