import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import NewProductForm from './NewProductForm'

export default async function NewProductPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  return <NewProductForm userId={user.id} />
}