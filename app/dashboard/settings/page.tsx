import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { getImporter } from '@/lib/importer'
import SettingsClient from './SettingsClient'

export const metadata = {
  title: 'Settings – ImportFlow PRO',
}

export default async function SettingsPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const importer = await getImporter(user.id)
  if (!importer) redirect('/login')

  return (
    <SettingsClient
      importer={{
        business_name: importer.business_name || '',
        full_name: importer.full_name || '',
        phone: importer.phone || '',
        location: importer.location || '',
        store_slug: importer.store_slug || '',
        email: user.email || '',
        username: importer.username || '',
        created_at: importer.created_at || new Date().toISOString(),
      }}
      email={user.email || ''}
    />
  )
}