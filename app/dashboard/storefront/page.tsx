// app/dashboard/storefront/page.tsx
import { getAuthenticatedUser } from '@/lib/auth/session'
import { getImporter } from '@/lib/importer'
import { redirect } from 'next/navigation'
import StorefrontClient from './StorefrontClient'
import { createClient } from '@/lib/supabase/server'

export default async function StorefrontPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const importer = await getImporter(user.id)
  if (!importer) redirect('/login')

  // Fetch products server-side
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('importer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <StorefrontClient importer={importer} products={products || []} />
  )
}