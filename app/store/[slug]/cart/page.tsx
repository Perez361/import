import CartContent from './CartContent'
import { StorefrontWrapper } from '@/components/store/StorefrontWrapper'

export default async function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  return (
    <StorefrontWrapper slug={slug}>
      <CartContent slug={slug} />
    </StorefrontWrapper>
  )
}
