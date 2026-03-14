import CartContent from './CartContent'

// Force dynamic rendering to ensure session is always checked
export const dynamic = 'force-dynamic'

export default async function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  return (
    <CartContent slug={slug} />
  )
}
