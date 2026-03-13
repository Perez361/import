import { CartProvider } from '@/components/store/CartContext'
import CartContent from './CartContent'

export default async function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  return (
    <CartProvider slug={slug}>
      <CartContent slug={slug} />
    </CartProvider>
  )
}
