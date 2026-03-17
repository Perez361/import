import { Metadata } from 'next'
import OrdersContent from './OrdersContent'

export const metadata: Metadata = { title: 'My Orders' }

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <OrdersContent slug={slug} />
}