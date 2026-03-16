import { redirect, notFound } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import EditProductForm from './EditProductForm'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: productId } = await params

  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('importer_id', user.id)
    .single()

  if (error || !product) notFound()

  return <EditProductForm product={product} userId={user.id} />
}