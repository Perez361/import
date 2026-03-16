import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { getImporter } from '@/lib/importer'
import { getCustomerUser, getCustomerStoreSlug } from '@/lib/auth/user-type'
import { createClient } from '@/lib/supabase/server'
import MobileDashboardShell from '@/components/dashboard/MobileDashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const customer = await getCustomerUser()
  if (customer) {
    const storeSlug = await getCustomerStoreSlug()
    redirect(`/store/${storeSlug}`)
  }

  let importer = await getImporter(user.id)

  if (!importer) {
    const supabase = await createClient()
    const emailPrefix = (user.email || '')
      .split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)
    const fallbackUsername = user.user_metadata?.username || emailPrefix || user.id.slice(0, 8)

    const { error: insertError } = await supabase.from('importers').insert({
      user_id: user.id,
      email: user.email,
      business_name: user.user_metadata?.business_name || emailPrefix,
      full_name: user.user_metadata?.full_name || '',
      username: fallbackUsername,
      phone: user.user_metadata?.phone || '',
      location: user.user_metadata?.location || '',
      store_slug: fallbackUsername,
    })

    if (insertError) {
      console.error('[dashboard/layout] Failed to create importer profile:', insertError)
    }

    importer = await getImporter(user.id)
  }

  if (!importer) redirect('/login')

  return (
    <MobileDashboardShell
      businessName={importer.business_name}
      email={user.email || ''}
    >
      {children}
    </MobileDashboardShell>
  )
}