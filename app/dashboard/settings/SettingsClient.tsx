'use client'

import { useState, useTransition } from 'react'
import {
  User, Store, Phone, MapPin, Lock, Eye, EyeOff,
  Save, Loader2, CheckCircle2, AlertCircle, ExternalLink,
  Copy, Check, ChevronRight,
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

// ── Reusable field ────────────────────────────────────────────────────────────
function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</label>
      {children}
      {hint && <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  )
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${props.className ?? ''}`}
    />
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
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

// ── Result banner ─────────────────────────────────────────────────────────────
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SettingsClient({ importer, email }: Props) {
  const [profileResult, setProfileResult] = useState<{ error?: string; success?: boolean } | null>(null)
  const [passwordResult, setPasswordResult] = useState<{ error?: string; success?: boolean } | null>(null)
  const [isPendingProfile, startProfile] = useTransition()
  const [isPendingPassword, startPassword] = useTransition()
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [slug, setSlug] = useState(importer.store_slug)
  const [copied, setCopied] = useState(false)

  const storeUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/store/${slug}`
    : `https://yourapp.com/store/${slug}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(storeUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Store URL copied!')
  }

  const handleProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setProfileResult(null)
    const fd = new FormData(e.currentTarget)
    startProfile(async () => {
      const result = await updateProfileAction(fd)
      setProfileResult(result as any)
      if ((result as any).success) toast.success('Profile updated!')
    })
  }

  const handlePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordResult(null)
    const fd = new FormData(e.currentTarget)
    startPassword(async () => {
      const result = await changePasswordAction(fd)
      setPasswordResult(result as any)
      if ((result as any).success) {
        toast.success('Password changed!')
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  const memberSince = new Date(importer.created_at).toLocaleDateString('en', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
          Manage your business profile and account
        </p>
      </div>

      {/* Account overview card */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-light)] text-[var(--color-brand)] text-xl font-bold shrink-0">
            {(importer.business_name || importer.full_name || email).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[var(--color-text-primary)] truncate">{importer.business_name || 'My Business'}</p>
            <p className="text-sm text-[var(--color-text-muted)] truncate">{email}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Member since {memberSince}</p>
          </div>
          <a
            href={`/store/${importer.store_slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand)] transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View store
          </a>
        </div>

        {/* Store URL row */}
        <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <Store className="h-3.5 w-3.5 text-[var(--color-text-muted)] shrink-0" />
          <span className="text-xs font-mono text-[var(--color-text-muted)] flex-1 truncate">
            /store/<span className="text-[var(--color-brand)] font-semibold">{slug}</span>
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-brand)] transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[var(--color-success)]" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* ── Business Profile ──────────────────────────────────────────────── */}
      <Section
        icon={User}
        title="Business Profile"
        description="This information is displayed on your storefront and used for order management"
      >
        <form onSubmit={handleProfile} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Business Name" hint="Shown as your store's display name">
              <Input
                name="business_name"
                defaultValue={importer.business_name}
                placeholder="Alby Imports"
                required
              />
            </Field>
            <Field label="Full Name">
              <Input
                name="full_name"
                defaultValue={importer.full_name}
                placeholder="John Doe"
              />
            </Field>
            <Field label="Phone Number" hint="Customers may see this on order communications">
              <Input
                name="phone"
                type="tel"
                defaultValue={importer.phone}
                placeholder="+233 24 000 0000"
              />
            </Field>
            <Field label="Location">
              <Input
                name="location"
                defaultValue={importer.location}
                placeholder="Accra, Ghana"
              />
            </Field>
          </div>

          {/* Store slug */}
          <Field
            label="Store URL"
            hint="Only lowercase letters, numbers, and hyphens. Changing this breaks any existing shared links."
          >
            <div className="flex items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--color-brand)]">
              <span className="px-3 py-2.5 text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] border-r border-[var(--color-border)] whitespace-nowrap font-mono">
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

          {/* Email — read only */}
          <Field label="Email Address" hint="Contact support to change your email address">
            <Input value={email} disabled className="opacity-60" readOnly />
          </Field>

          <ResultBanner result={profileResult} />

          <div className="flex justify-end">
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
      </Section>

      {/* ── Security ─────────────────────────────────────────────────────── */}
      <Section
        icon={Lock}
        title="Security"
        description="Keep your account secure with a strong password"
      >
        <form onSubmit={handlePassword} className="space-y-4">
          <Field label="New Password" hint="Minimum 8 characters">
            <div className="relative">
              <Input
                name="new_password"
                type={showNew ? 'text' : 'password'}
                placeholder="Enter new password"
                minLength={8}
                required
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
          <Field label="Confirm New Password">
            <div className="relative">
              <Input
                name="confirm_password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat new password"
                required
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

      {/* ── Danger Zone ───────────────────────────────────────────────────── */}
      <Section
        icon={AlertCircle}
        title="Danger Zone"
        description="Irreversible actions — proceed with caution"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-danger-light)] bg-[var(--color-danger-light)]">
            <div>
              <p className="text-sm font-semibold text-[var(--color-danger)]">Delete Account</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Permanently delete your account, store, and all data. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => toast.error('Please contact support to delete your account.')}
              className="ml-4 shrink-0 px-4 py-2 rounded-xl border border-[var(--color-danger)] text-[var(--color-danger)] text-sm font-semibold hover:bg-[var(--color-danger)] hover:text-white transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </Section>

    </div>
  )
}