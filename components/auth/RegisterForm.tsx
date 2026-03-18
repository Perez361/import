'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Mail, Phone, MessageSquare } from 'lucide-react'
import FormInput from './FormInput'
import GoogleButton from './GoogleButton'
import { createClient } from '@/lib/supabase/client'
import { sendPhoneOtpAction, verifyPhoneOtpAction } from '@/lib/actions'

// ── Email/password schema (unchanged) ────────────────────────────────────────

const registerSchema = z
  .object({
    businessName: z.string().min(2, 'Business name must be at least 2 characters'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers and underscores'),
    phone: z.string().min(7, 'Enter a valid phone number'),
    location: z.string().min(2, 'Please enter your location'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

// ── Phone-only schema ─────────────────────────────────────────────────────────

const phoneRegisterSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers and underscores'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  location: z.string().min(2, 'Please enter your location'),
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

export default function RegisterForm() {
  const router = useRouter()

  // Tab
  const [tab, setTab] = useState<'email' | 'phone'>('email')

  // Email form submitted state
  const [submitted, setSubmitted] = useState(false)

  // Email/password form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  // Phone register form
  const {
    register: registerPhone,
    handleSubmit: handleSubmitPhone,
    formState: { errors: phoneErrors, isSubmitting: phoneSubmitting },
  } = useForm<PhoneRegisterFormData>({ resolver: zodResolver(phoneRegisterSchema) })

  // Phone OTP state
  const [phoneOtpStep, setPhoneOtpStep] = useState<'details' | 'otp'>('details')
  const [pendingPhoneData, setPendingPhoneData] = useState<PhoneRegisterFormData | null>(null)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  // ── Email / password register (unchanged) ─────────────────────────────────

  const onEmailSubmit = async (data: RegisterFormData) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          business_name: data.businessName,
          full_name: data.fullName,
          username: data.username,
          phone: data.phone,
          location: data.location,
        },
      },
    })

    if (error) { toast.error(error.message); return }
    toast.success('Account created! Check your email.')
    setSubmitted(true)
  }

  // ── Phone register: Step 1 — collect details + send OTP ──────────────────

  const onPhoneDetailsSubmit = async (data: PhoneRegisterFormData) => {
    const normPhone = normalisePhone(data.phone)
    const result = await sendPhoneOtpAction(normPhone)
    if (result.error) { toast.error(result.error); return }
    setPendingPhoneData(data)
    setOtp('')
    setPhoneOtpStep('otp')
    toast.success('Code sent! Check your SMS.')
  }

  // ── Phone register: Step 2 — verify OTP + create importer row ────────────

  async function handleVerifyAndRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingPhoneData) return
    if (otp.length < 4) { toast.error('Enter the 6-digit code'); return }

    setOtpLoading(true)
    const normPhone = normalisePhone(pendingPhoneData.phone)

    // verifyPhoneOtpAction sets the server-side session cookie
    const verifyResult = await verifyPhoneOtpAction(normPhone, otp)

    if (verifyResult.error) {
      // If verifyPhoneOtpAction returned "no importer", the user is new — create the row
      // The verifyOtp call still succeeds and sets a session; we just need to insert the importer
      if (!verifyResult.error.includes('No importer account')) {
        setOtpLoading(false)
        toast.error(verifyResult.error)
        return
      }
    }

    // At this point the session is established. Use client supabase to get user + insert importer row.
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setOtpLoading(false)
      toast.error('Session not established. Please try again.')
      return
    }

    // Check if importer row already exists (returning user via phone)
    const { data: existing } = await supabase
      .from('importers')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!existing) {
      const username = pendingPhoneData.username.toLowerCase().replace(/[^a-z0-9_]/g, '_')
      const { error: insertError } = await supabase.from('importers').insert({
        id: user.id,
        user_id: user.id,
        business_name: pendingPhoneData.businessName,
        full_name: pendingPhoneData.fullName,
        username,
        phone: pendingPhoneData.phone,
        location: pendingPhoneData.location,
        store_slug: username,
        email: '',
      })

      if (insertError) {
        setOtpLoading(false)
        toast.error(insertError.message)
        return
      }
    }

    setOtpLoading(false)
    toast.success('Account created!')
    router.push('/dashboard')
    router.refresh()
  }

  // ── Email submitted state ─────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-5 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--color-brand-light)">
          <Mail className="h-7 w-7 text-(--color-brand)" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-(--color-text-primary)">Check your email</h2>
          <p className="max-w-xs text-sm leading-relaxed text-(--color-text-muted)">
            We sent a verification link to your email address. Click it to activate your account.
          </p>
        </div>
        <Link href="/login" className="mt-1 text-sm font-medium text-(--color-brand) hover:text-(--color-brand-dark) transition-colors">
          Back to Login
        </Link>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">

      {/* Google — always visible */}
      <GoogleButton
        label="Sign up with Google"
        userType="importer"
        redirectTo="/dashboard"
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

      {/* ── Email / Password tab (unchanged) ── */}
      {tab === 'email' && (
        <form onSubmit={handleSubmit(onEmailSubmit)} className="flex flex-col gap-5">
          <FormInput label="Business Name" placeholder="Acme Imports Ltd." error={errors.businessName?.message} {...register('businessName')} />
          <FormInput label="Full Name" placeholder="John Doe" error={errors.fullName?.message} {...register('fullName')} />
          <FormInput label="Username" placeholder="john_doe" error={errors.username?.message} {...register('username')} />
          <FormInput label="Phone Number" type="tel" placeholder="+233 80 000 0000" error={errors.phone?.message} {...register('phone')} />
          <FormInput label="Location" placeholder="Accra, Ghana" error={errors.location?.message} {...register('location')} />
          <FormInput label="Email" type="email" placeholder="you@business.com" error={errors.email?.message} {...register('email')} />
          <FormInput label="Password" type="password" placeholder="Min. 8 characters" error={errors.password?.message} {...register('password')} />
          <FormInput label="Confirm Password" type="password" placeholder="Re-enter your password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-(--color-brand) px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--color-brand-dark) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account…</> : 'Create Free Account'}
          </button>
        </form>
      )}

      {/* ── Phone OTP tab ── */}
      {tab === 'phone' && (
        <>
          {/* Step 1: business details + phone */}
          {phoneOtpStep === 'details' && (
            <form onSubmit={handleSubmitPhone(onPhoneDetailsSubmit)} className="flex flex-col gap-5">
              <FormInput label="Business Name" placeholder="Acme Imports Ltd." error={phoneErrors.businessName?.message} {...registerPhone('businessName')} />
              <FormInput label="Full Name" placeholder="John Doe" error={phoneErrors.fullName?.message} {...registerPhone('fullName')} />
              <FormInput label="Username" placeholder="john_doe" error={phoneErrors.username?.message} {...registerPhone('username')} />

              {/* Phone number */}
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

              <FormInput label="Location" placeholder="Accra, Ghana" error={phoneErrors.location?.message} {...registerPhone('location')} />

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
        <Link href="/login" className="font-medium text-(--color-brand) hover:text-(--color-brand-dark) transition-colors">
          Log in
        </Link>
      </p>
    </div>
  )
}