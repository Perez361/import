import CartContent from './CartContent'
import { StorefrontWrapper } from '@/components/store/StorefrontWrapper'
import { getCustomerForStore } from '@/lib/auth/store-session'

export default async function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const initialCustomer = await getCustomerForStore(slug)
  
  return (
    <StorefrontWrapper slug={slug} initialCustomer={initialCustomer}>
      <CartContent slug={slug} />
    </StorefrontWrapper>
  )
}
