import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { getImporter } from '@/lib/importer'
import { Settings, User, Phone, MapPin, Globe, Lock, Save, Trash2 } from 'lucide-react'

export default async function SettingsPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  const importer = await getImporter(user.id)
  const businessName = importer?.business_name || ''
  const phone = importer?.phone || ''
  const storeSlug = importer?.store_slug || ''
  const address = importer?.address || ''

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-light)]">
          <Settings className="h-6 w-6 text-[var(--color-brand)]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Settings</h1>
          <p className="text-[var(--color-text-muted)]">Manage your importer profile and store</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-[var(--color-muted)]" />
              Business Profile
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">Business Name</label>
                <input 
                  type="text" 
                  defaultValue={businessName}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-all"
                  placeholder="Enter business name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  defaultValue={phone}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-all"
                  placeholder="+233 24 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">Store Slug</label>
                <div className="flex gap-3">
                  <span className="px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] font-mono text-sm">importflow.app/store/</span>
                  <input 
                    type="text" 
                    defaultValue={storeSlug}
                    className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-all"
                    placeholder="your-store"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[var(--color-muted)]" />
              Business Address
            </h2>
            <textarea 
              defaultValue={address}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-all resize-vertical"
              placeholder="Enter your business address"
            />
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
              <Lock className="h-5 w-5 text-[var(--color-muted)]" />
              Security
            </h2>
            <div className="space-y-4">
              <button className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-all">
                <Lock className="h-4 w-4" />
                Change Password
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-dashed border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] transition-all">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
              <Globe className="h-5 w-5 text-[var(--color-muted)]" />
              Notifications
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-surface)] transition-all cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded-lg text-[var(--color-brand)] focus:ring-[var(--color-brand)]" />
                <span className="text-sm text-[var(--color-text-primary)]">New order notifications</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-surface)] transition-all cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded-lg text-[var(--color-brand)] focus:ring-[var(--color-brand)]" />
                <span className="text-sm text-[var(--color-text-primary)]">Low stock alerts</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-surface)] transition-all cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded-lg text-[var(--color-brand)] focus:ring-[var(--color-brand)] checked:bg-[var(--color-success)]" />
                <span className="text-sm text-[var(--color-text-primary)]">Shipment updates</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-8 border-t border-[var(--color-border)] mt-12">
        <button className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[var(--color-brand)] text-white font-semibold hover:bg-[var(--color-brand)]/90 transition-all shadow-lg">
          <Save className="h-5 w-5" />
          Save Changes
        </button>
        <button className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-[var(--color-border)] text-[var(--color-text-primary)] font-semibold hover:bg-[var(--color-surface)] transition-all">
          Cancel
        </button>
      </div>
    </div>
  )
}

