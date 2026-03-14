import ProfileContent from './ProfileContent'

// Force dynamic rendering to ensure session is always checked
export const dynamic = 'force-dynamic'

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  return (
    <ProfileContent slug={slug} />
  )
}
