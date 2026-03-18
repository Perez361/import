'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Camera, Phone, MessageSquare } from 'lucide-react'
import FormInput from './FormInput'
import GoogleButton from './GoogleButton'
import { createCustomerClient } from '@/lib/supabase/customer-client'
import { getDefaultAvatarUrl, uploadCustomerAvatar } from '@/lib/avatar'

// ── Email/password schema (unchanged) ────────────────────────────────────────

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  username: z.string().min(2, 'Username must be at least 2 characters'),
  contact: z.string().min(10, 'Contact number is required'),
  email: z.string().email('Enter a valid email address'),
  location: z.string().optional(),
  shippingAddress: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

// ── Phone-only schema ─────────────────────────────────────────────────────────

const phoneRegisterSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  username: z.string().min(2, 'Username must be at least 2 characters'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  location: z.string().optional(),
  shippingAddress: z.string().optional(),
})

type PhoneRegisterFormData = z.infer<typeof phoneRegisterSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length === 10) return '+233' + digits.slice(1)
  if (!raw.trim().startsWith('+')) return '+' + digits
  return raw.trim()
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CustomerRegisterForm({ slug }: { slug: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || `/store/${slug}`

  // Tab
  const [tab, setTab] = useState<'email' | 'phone'>('email')

  // Shared avatar state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Email/password form
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })
  const fullNameValue = watch('fullName', '')

  // Phone register form
  const {
    register: registerPhone,
    handleSubmit: handleSubmitPhone,
    watch: watchPhone,
    formState: { errors: phoneErrors, isSubmitting: phoneSubmitting },
  } = useForm<PhoneRegisterFormData>({ resolver: zodResolver(phoneRegisterSchema) })
  const phoneFullName = watchPhone('fullName', '')

  // Phone OTP state
  const [phoneOtpStep, setPhoneOtpStep] = useState<'details' | 'otp'>('details')
  const [pendingPhoneData, setPendingPhoneData] = useState<PhoneRegisterFormData | null>(null)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  // ── Avatar handler ────────────────────────────────────────────────────────

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  // ── Shared: set avatar after account creation ─────────────────────────────

  async function setAvatarAfterSignup(
    supabase: ReturnType<typeof createCustomerClient>,
    customerId: string,
    displayName: string,
    username: string,
  ) {
    let avatarUrl: string
    if (avatarFile) {
      const { url, error } = await uploadCustomerAvatar(supabase, customerId, avatarFile)
      avatarUrl = error || !url ? getDefaultAvatarUrl(displayName || username) : url
      if (error) toast.error(`Avatar upload failed: ${error}`)
    } else {
      avatarUrl = getDefaultAvatarUrl(displayName || username)
    }
    await supabase.from('customers').update({ avatar_url: avatarUrl }).eq('id', customerId)
  }

  // ── Email / password register ─────────────────────────────────────────────

  const onEmailSubmit = async (data: RegisterFormData) => {
    const supabase = createCustomerClient(slug)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          store_slug: slug,
          customer: true,
          full_name: data.fullName,
          username: data.username,
          contact: data.contact,
          location: data.location || '',
          shipping_address: data.shippingAddress || '',
          email: data.email,
        },
      },
    })

    if (authError || !authData.user) {
      toast.error(authError?.message || 'Registration failed')
      return
    }

    await new Promise((r) => setTimeout(r, 800))

    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (customer?.id) {
      await setAvatarAfterSignup(supabase, customer.id, data.fullName, data.username)
    }

    toast.success('Account created! Please check your email to confirm.')
    router.push(`/account/confirmed?store=${slug}`)
  }

  // ── Phone register: Step 1 — collect details + send OTP ──────────────────

  const onPhoneDetailsSubmit = async (data: PhoneRegisterFormData) => {
    const supabase = createCustomerClient(slug)
    const normPhone = normalisePhone(data.phone)

    // Send OTP to the phone number
    const { error } = await supabase.auth.signInWithOtp({ phone: normPhone })
    if (error) { toast.error(error.message); return }

    setPendingPhoneData(data)
    setOtp('')
    setPhoneOtpStep('otp')
    toast.success('Code sent! Check your SMS.')
  }

  // ── Phone register: Step 2 — verify OTP + create customer row ────────────

  async function handleVerifyAndRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingPhoneData) return
    if (otp.length < 4) { toast.error('Enter the 6-digit code'); return }

    setOtpLoading(true)
    const supabase = createCustomerClient(slug)
    const normPhone = normalisePhone(pendingPhoneData.phone)

    const { data: authData, error } = await supabase.auth.verifyOtp({
      phone: normPhone,
      token: otp,
      type: 'sms',
    })

    if (error || !authData.user) {
      setOtpLoading(false)
      toast.error(error?.message || 'Invalid code. Please try again.')
      return
    }

    // Find the store
    const { data: importer } = await supabase
      .from('importers')
      .select('id')
      .eq('store_slug', slug)
      .single()

    if (!importer) {
      setOtpLoading(false)
      toast.error('Store not found.')
      return
    }

    // Check if customer row already exists (returning user)
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', authData.user.id)
      .eq('store_id', importer.id)
      .maybeSingle()

    let customerId: string

    if (existingCustomer) {
      // Returning user — just log them in
      customerId = existingCustomer.id
      toast.success('Welcome back!')
    } else {
      // New user — create customer row manually (no email trigger fires for phone)
      const username = pendingPhoneData.username.toLowerCase().replace(/[^a-z0-9_]/g, '_')
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          store_id: importer.id,
          user_id: authData.user.id,
          full_name: pendingPhoneData.fullName,
          username,
          contact: pendingPhoneData.phone,
          email: '',
          location: pendingPhoneData.location || '',
          shipping_address: pendingPhoneData.shippingAddress || '',
        })
        .select('id')
        .single()

      if (insertError || !newCustomer) {
        setOtpLoading(false)
        toast.error(insertError?.message || 'Failed to create account.')
        return
      }

      customerId = newCustomer.id
      await setAvatarAfterSignup(supabase, customerId, pendingPhoneData.fullName, username)
      toast.success('Account created!')
    }

    setOtpLoading(false)
    router.push(redirectTo)
    router.refresh()
  }

  // ── Avatar preview seed ───────────────────────────────────────────────────

  const emailAvatarSeed = fullNameValue || 'user'
  const phoneAvatarSeed = phoneFullName || 'user'
  const isDefaultAvatar = !avatarPreview

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">

      {/* Google — always visible */}
      <GoogleButton
        label="Sign up with Google"
        userType="customer"
        storeSlug={slug}
        redirectTo={redirectTo}
      />

      {/* Tab switcher */}
      <div className="flex rounded-xl border border-(--color-border) overflow-hidden">
        <button
          type="button"
          onClick={() => setTab('email')}
          className={`flex-1 py-2 text-sm font-semibold transition-colors ${
            tab === 'email'
              ? 'bg-(--color-brand) text-white'
              : 'bg-(--color-card) text-(--color-text-muted) hover:text-(--color-text-primary)'
          }`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => { setTab('phone'); setPhoneOtpStep('details'); setOtp('') }}
          className={`flex-1 py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
            tab === 'phone'
              ? 'bg-(--color-brand) text-white'
              : 'bg-(--color-card) text-(--color-text-muted) hover:text-(--color-text-primary)'
          }`}
        >
          <Phone className="h-3.5 w-3.5" /> Phone
        </button>
      </div>

      {/* ── Shared avatar picker ── */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-(--color-border) hover:border-(--color-brand) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-brand)"
            title="Upload profile photo (optional)"
          >
            <img
              src={avatarPreview || getDefaultAvatarUrl(tab === 'email' ? emailAvatarSeed : phoneAvatarSeed)}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity rounded-full">
              <Camera className="h-5 w-5 text-white" />
            </div>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-(--color-brand) text-white shadow-sm hover:bg-(--color-brand-dark) transition-colors"
            title="Change photo"
          >
            <Camera className="h-3 w-3" />
          </button>
        </div>
        <p className="text-xs text-(--color-text-muted)">
          {isDefaultAvatar ? 'Tap to add a photo (optional)' : 'Photo selected'}
        </p>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      </div>

      {/* ── Email / Password tab ── */}
      {tab === 'email' && (
        <form onSubmit={handleSubmit(onEmailSubmit)} className="flex flex-col gap-5">
          <FormInput label="Full Name" placeholder="John Doe" error={errors.fullName?.message} {...register('fullName')} />
          <FormInput label="Username" placeholder="johndoe123" error={errors.username?.message} {...register('username')} />
          <FormInput label="Contact" type="tel" placeholder="0541234567" error={errors.contact?.message} {...register('contact')} />
          <FormInput label="Email" type="email" placeholder="john@example.com" error={errors.email?.message} {...register('email')} />
          <FormInput label="Location" placeholder="Accra, Ghana (optional)" {...register('location')} />
          <FormInput label="Shipping Address" placeholder="123 Street, Accra (optional)" {...register('shippingAddress')} />
          <FormInput label="Password" type="password" placeholder="At least 6 characters" error={errors.password?.message} {...register('password')} />
          <FormInput label="Confirm Password" type="password" placeholder="Re-enter your password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-(--color-brand) px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--color-brand-dark) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account…</> : 'Create Account'}
          </button>
        </form>
      )}

      {/* ── Phone OTP tab ── */}
      {tab === 'phone' && (
        <>
          {/* Step 1: fill in details + phone */}
          {phoneOtpStep === 'details' && (
            <form onSubmit={handleSubmitPhone(onPhoneDetailsSubmit)} className="flex flex-col gap-5">
              <FormInput label="Full Name" placeholder="John Doe" error={phoneErrors.fullName?.message} {...registerPhone('fullName')} />
              <FormInput label="Username" placeholder="johndoe123" error={phoneErrors.username?.message} {...registerPhone('username')} />

              {/* Phone number field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-(--color-text-primary)">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-text-muted)" />
                  <input
                    type="tel"
                    placeholder="0541234567"
                    className="w-full rounded-lg border border-(--color-border) bg-(--color-card) pl-10 pr-4 py-3 text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) outline-none focus:border-(--color-brand) focus:ring-2 focus:ring-(--color-brand)/20 transition-all"
                    autoComplete="tel"
                    {...registerPhone('phone')}
                  />
                </div>
                {phoneErrors.phone && <p className="text-xs text-(--color-danger)">{phoneErrors.phone.message}</p>}
                <p className="text-xs text-(--color-text-muted)">A verification code will be sent to this number.</p>
              </div>

              <FormInput label="Location" placeholder="Accra, Ghana (optional)" {...registerPhone('location')} />
              <FormInput label="Shipping Address" placeholder="123 Street, Accra (optional)" {...registerPhone('shippingAddress')} />

              <button
                type="submit"
                disabled={phoneSubmitting}
                className="flex items-center justify-center gap-2 rounded-lg bg-(--color-brand) px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--color-brand-dark) disabled:cursor-not-allowed disabled:opacity-60"
              >
                {phoneSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Sending code…</> : 'Send Verification Code'}
              </button>
            </form>
          )}

          {/* Step 2: enter OTP */}
          {phoneOtpStep === 'otp' && (
            <form onSubmit={handleVerifyAndRegister} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-(--color-text-primary)">Verification Code</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-text-muted)" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-lg border border-(--color-border) bg-(--color-card) pl-10 pr-4 py-3 text-sm font-mono tracking-widest text-(--color-text-primary) placeholder:text-(--color-text-muted) outline-none focus:border-(--color-brand) focus:ring-2 focus:ring-(--color-brand)/20 transition-all"
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>
                <p className="text-xs text-(--color-text-muted)">
                  Code sent to <span className="font-semibold">{pendingPhoneData?.phone}</span>.{' '}
                  <button
                    type="button"
                    onClick={() => { setPhoneOtpStep('details'); setOtp('') }}
                    className="text-(--color-brand) hover:underline"
                  >
                    Change number
                  </button>
                </p>
              </div>
              <button
                type="submit"
                disabled={otpLoading}
                className="flex items-center justify-center gap-2 rounded-lg bg-(--color-brand) px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--color-brand-dark) disabled:cursor-not-allowed disabled:opacity-60"
              >
                {otpLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Verifying…</> : 'Verify & Create Account'}
              </button>
            </form>
          )}
        </>
      )}

      <p className="text-center text-sm text-(--color-text-muted)">
        Already have an account?{' '}
        <Link
          href={`/store/${slug}/login?redirect=${encodeURIComponent(redirectTo)}`}
          className="font-medium text-(--color-brand) hover:text-(--color-brand-dark) transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}