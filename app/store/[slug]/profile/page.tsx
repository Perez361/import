import { redirect } from 'next/navigation'
import ProfileContent from './ProfileContent'
import { StorefrontWrapper } from '@/components/store/StorefrontWrapper'
import { getCustomerForStore } from '@/lib/auth/store-session'

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  // Server-side auth check
  const initialCustomer = await getCustomerForStore(slug)
  
  if (!initialCustomer) {
    redirect(`/store/${slug}/login?redirect=/store/${slug}/profile`)
  }
  
  return (
    <StorefrontWrapper slug={slug} initialCustomer={initialCustomer}>
      <ProfileContent slug={slug} />
    </StorefrontWrapper>
  )
}
