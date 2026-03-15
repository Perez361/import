import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { getImporter } from '@/lib/importer'
import { getCustomerUser, getCustomerStoreSlug } from '@/lib/auth/user-type'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import DashboardHeader from '@/components/dashboard/DashboardHeader'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  // Block customers from dashboard
  const customer = await getCustomerUser()
  if (customer) {
    const storeSlug = await getCustomerStoreSlug()
    redirect(`/store/${storeSlug}`)
  }

  let importer = await getImporter(user.id)

  if (!importer) {
    // Importer record is created in auth/callback (email-confirmation flow).
    // If email confirmation is disabled in Supabase the callback never runs,
    // so we create the record here as a fallback on first dashboard visit.
    const supabase = await createClient()

    // Derive a safe unique username/slug from the email address so that the
    // INSERT never violates a UNIQUE constraint due to empty strings.
    const emailPrefix = (user.email || '')
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 30)
    const fallbackUsername = user.user_metadata?.username || emailPrefix || user.id.slice(0, 8)
    const fallbackSlug     = fallbackUsername

    const { error: insertError } = await supabase.from('importers').insert({
      user_id: user.id,
      email: user.email,
      business_name: user.user_metadata?.business_name || emailPrefix,
      full_name: user.user_metadata?.full_name || '',
      username: fallbackUsername,
      phone: user.user_metadata?.phone || '',
      location: user.user_metadata?.location || '',
      store_slug: fallbackSlug,
    })

    if (insertError) {
      console.error('[dashboard/layout] Failed to create importer profile:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      })
    }

    // Retry after creation
    importer = await getImporter(user.id)
  }

  if (!importer) {
    redirect('/login')
  }

  const businessName = importer.business_name
  const email = user.email || ''

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <DashboardHeader businessName={businessName} email={email} />
      <div className="flex">
        <Sidebar businessName={businessName} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

