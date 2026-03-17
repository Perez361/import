'use client'

import { useState, useTransition } from 'react'
import {
  User, Store, Lock, Eye, EyeOff,
  Save, Loader2, CheckCircle2, AlertCircle,
  ExternalLink, Copy, Check, Edit2, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { updateProfileAction, changePasswordAction } from './actions'

interface Importer {
  business_name: string
  full_name: string
  phone: string
  location: string
  store_slug: string
  email: string
  username: string
  created_at: string
}

interface Props {
  importer: Importer
  email: string
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</label>
      {children}
      {hint && <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props
  return (
    <input
      {...rest}
      className={`w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    />
  )
}

function Section({
  icon: Icon, title, description, children,
}: {
  icon: React.ElementType
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-light)]">
            <Icon className="h-4 w-4 text-[var(--color-brand)]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">{title}</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function ResultBanner({ result }: { result: { error?: string; success?: boolean } | null }) {
  if (!result) return null
  if (result.success) return (
    <div className="flex items-center gap-2 rounded-xl bg-[var(--color-success-light)] px-4 py-3 text-sm font-medium text-[var(--color-success)]">
      <CheckCircle2 className="h-4 w-4 shrink-0" /> Saved successfully
    </div>
  )
  if (result.error) return (
    <div className="flex items-center gap-2 rounded-xl bg-[var(--color-danger-light)] px-4 py-3 text-sm font-medium text-[var(--color-danger)]">
      <AlertCircle className="h-4 w-4 shrink-0" /> {result.error}
    </div>
  )
  return null
}

// ── Static read-only profile row ──────────────────────────────────────────────
function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-[var(--color-text-primary)]">
        {value || <span className="text-[var(--color-text-muted)] italic">Not set</span>}
      </span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SettingsClient({ importer, email }: Props) {
  // Profile
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileResult, setProfileResult] = useState<{ error?: string; success?: boolean } | null>(null)
  const [isPendingProfile, startProfile] = useTransition()
  const [slug, setSlug] = useState(importer.store_slug)
  // Live profile values so read-only view reflects edits after save
  const [profileData, setProfileData] = useState({
    business_name: importer.business_name,
    full_name: importer.full_name,
    phone: importer.phone,
    location: importer.location,
    store_slug: importer.store_slug,
  })

  // Password
  const [passwordResult, setPasswordResult] = useState<{ error?: string; success?: boolean } | null>(null)
  const [isPendingPassword, startPassword] = useTransition()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Store URL copy
  const [copied, setCopied] = useState(false)
  const storeUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/store/${profileData.store_slug}`
    : `/store/${profileData.store_slug}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(storeUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Store URL copied!')
  }

  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    setProfileResult(null)
    setSlug(profileData.store_slug)
  }

  const handleProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setProfileResult(null)
    const fd = new FormData(e.currentTarget)
    startProfile(async () => {
      const result = await updateProfileAction(fd) as any
      setProfileResult(result)
      if (result.success) {
        // Update local read-only view
        setProfileData({
          business_name: (fd.get('business_name') as string) || profileData.business_name,
          full_name: (fd.get('full_name') as string) || profileData.full_name,
          phone: (fd.get('phone') as string) || profileData.phone,
          location: (fd.get('location') as string) || profileData.location,
          store_slug: slug,
        })
        toast.success('Profile updated!')
        setIsEditingProfile(false)
        setProfileResult(null)
      }
    })
  }

  const handlePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordResult(null)
    const fd = new FormData(e.currentTarget)
    startPassword(async () => {
      const result = await changePasswordAction(fd) as any
      setPasswordResult(result)
      if (result.success) {
        toast.success('Password changed successfully!')
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  const memberSince = new Date(importer.created_at).toLocaleDateString('en', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Manage your business profile and account security</p>
      </div>

      {/* Account overview */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-light)] text-[var(--color-brand)] text-xl font-bold shrink-0 select-none">
            {(profileData.business_name || profileData.full_name || email).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[var(--color-text-primary)] truncate">{profileData.business_name || 'My Business'}</p>
            <p className="text-sm text-[var(--color-text-muted)] truncate">{email}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Member since {memberSince}</p>
          </div>
          <a
            href={`/store/${profileData.store_slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand)] transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View store
          </a>
        </div>

        {/* Store URL pill */}
        <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <Store className="h-3.5 w-3.5 text-[var(--color-text-muted)] shrink-0" />
          <span className="text-xs font-mono text-[var(--color-text-muted)] flex-1 truncate">
            /store/<span className="text-[var(--color-brand)] font-semibold">{profileData.store_slug}</span>
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-brand)] transition-colors"
          >
            {copied
              ? <><Check className="h-3.5 w-3.5 text-[var(--color-success)]" /> Copied</>
              : <><Copy className="h-3.5 w-3.5" /> Copy</>}
          </button>
        </div>
      </div>

      {/* ── Business Profile ───────────────────────────────────────────── */}
      <Section
        icon={User}
        title="Business Profile"
        description="Your storefront display name, contact details, and store URL"
      >
        {!isEditingProfile ? (
          /* ── Read-only view ── */
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <ProfileRow label="Business Name" value={profileData.business_name} />
              <ProfileRow label="Full Name" value={profileData.full_name} />
              <ProfileRow label="Phone Number" value={profileData.phone} />
              <ProfileRow label="Location" value={profileData.location} />
              <ProfileRow label="Store URL" value={`/store/${profileData.store_slug}`} />
              <ProfileRow label="Email Address" value={email} />
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsEditingProfile(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-all"
              >
                <Edit2 className="h-4 w-4" /> Edit Profile
              </button>
            </div>
          </div>
        ) : (
          /* ── Edit form ── */
          <form onSubmit={handleProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Business Name" hint="Shown as your store's display name">
                <Input name="business_name" defaultValue={profileData.business_name} placeholder="Alby Imports" required />
              </Field>
              <Field label="Full Name">
                <Input name="full_name" defaultValue={profileData.full_name} placeholder="John Doe" />
              </Field>
              <Field label="Phone Number" hint="May appear on order communications">
                <Input name="phone" type="tel" defaultValue={profileData.phone} placeholder="+233 24 000 0000" />
              </Field>
              <Field label="Location">
                <Input name="location" defaultValue={profileData.location} placeholder="Accra, Ghana" />
              </Field>
            </div>

            <Field label="Store URL" hint="Lowercase letters, numbers and hyphens only. Changing this breaks existing shared links.">
              <div className="flex items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--color-brand)]">
                <span className="px-3 py-2.5 text-xs text-[var(--color-text-muted)] border-r border-[var(--color-border)] whitespace-nowrap font-mono shrink-0">
                  /store/
                </span>
                <input
                  name="store_slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="my-store"
                  required
                  className="flex-1 px-3 py-2.5 text-sm bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none font-mono"
                />
              </div>
            </Field>

            <Field label="Email Address" hint="Contact support to change your email address">
              <Input value={email} disabled readOnly className="opacity-60" />
            </Field>

            <ResultBanner result={profileResult} />

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-all"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
              <button
                type="submit"
                disabled={isPendingProfile}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-brand)] text-white text-sm font-semibold hover:bg-[var(--color-brand-dark)] disabled:opacity-50 transition-all"
              >
                {isPendingProfile
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  : <><Save className="h-4 w-4" /> Save Changes</>}
              </button>
            </div>
          </form>
        )}
      </Section>

      {/* ── Security / Change Password ─────────────────────────────────── */}
      <Section
        icon={Lock}
        title="Change Password"
        description="Verify your current password before setting a new one"
      >
        <form onSubmit={handlePassword} className="space-y-4">

          {/* Current password */}
          <Field label="Current Password">
            <div className="relative">
              <Input
                name="current_password"
                type={showCurrent ? 'text' : 'password'}
                placeholder="Enter your current password"
                required
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-text-muted)]">New password</span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>

          {/* New password */}
          <Field label="New Password" hint="Minimum 8 characters">
            <div className="relative">
              <Input
                name="new_password"
                type={showNew ? 'text' : 'password'}
                placeholder="Enter new password"
                minLength={8}
                required
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {/* Confirm new password */}
          <Field label="Confirm New Password">
            <div className="relative">
              <Input
                name="confirm_password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat new password"
                required
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <ResultBanner result={passwordResult} />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPendingPassword}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-brand)] text-white text-sm font-semibold hover:bg-[var(--color-brand-dark)] disabled:opacity-50 transition-all"
            >
              {isPendingPassword
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</>
                : <><Lock className="h-4 w-4" /> Update Password</>}
            </button>
          </div>
        </form>
      </Section>

      {/* ── Danger Zone ───────────────────────────────────────────────── */}
      <Section
        icon={AlertCircle}
        title="Danger Zone"
        description="Irreversible actions — proceed with caution"
      >
        <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-danger-light)] bg-[var(--color-danger-light)]">
          <div>
            <p className="text-sm font-semibold text-[var(--color-danger)]">Delete Account</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Permanently deletes your account, store, products and all customer data.
            </p>
          </div>
          <button
            type="button"
            onClick={() => toast.error('To delete your account please contact support.')}
            className="ml-4 shrink-0 px-4 py-2 rounded-xl border border-[var(--color-danger)] text-[var(--color-danger)] text-sm font-semibold hover:bg-[var(--color-danger)] hover:text-white transition-all"
          >
            Delete
          </button>
        </div>
      </Section>

    </div>
  )
}