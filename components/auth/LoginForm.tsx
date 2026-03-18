'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Phone, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import FormInput from './FormInput'
import GoogleButton from './GoogleButton'
import { loginAction, sendPhoneOtpAction, verifyPhoneOtpAction } from '@/lib/actions'

// ── Schema ────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length === 10) return '+233' + digits.slice(1)
  if (!raw.trim().startsWith('+')) return '+' + digits
  return raw.trim()
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoginForm() {
  const router = useRouter()

  // Tab: 'email' | 'phone'
  const [tab, setTab] = useState<'email' | 'phone'>('email')

  // Phone OTP state
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpStep, setOtpStep] = useState<'phone' | 'otp'>('phone')
  const [phoneLoading, setPhoneLoading] = useState(false)

  // Email/password form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  // ── Email / password submit ───────────────────────────────────────────────

  const onEmailSubmit = async (data: LoginFormData) => {
    const result = await loginAction({ email: data.email, password: data.password })
    if (result?.error) {
      if (result.error.toLowerCase().includes('customer') || result.error === 'no_importer') {
        toast.error('This account is a customer account. Please log in at your store instead.')
      } else {
        toast.error(result.error)
      }
    }
  }

  // ── Phone: send OTP ───────────────────────────────────────────────────────

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim()) { toast.error('Enter your phone number'); return }
    setPhoneLoading(true)
    const result = await sendPhoneOtpAction(normalisePhone(phone))
    setPhoneLoading(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Code sent! Check your SMS.')
    setOtpStep('otp')
  }

  // ── Phone: verify OTP ─────────────────────────────────────────────────────

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length < 4) { toast.error('Enter the 6-digit code'); return }
    setPhoneLoading(true)
    const result = await verifyPhoneOtpAction(normalisePhone(phone), otp)
    setPhoneLoading(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Welcome back!')
    router.push('/dashboard')
    router.refresh()
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">

      {/* Google — always visible */}
      <GoogleButton
        label="Continue with Google"
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
          onClick={() => { setTab('phone'); setOtpStep('phone'); setOtp('') }}
          className={`flex-1 py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
            tab === 'phone'
              ? 'bg-(--color-brand) text-white'
              : 'bg-(--color-card) text-(--color-text-muted) hover:text-(--color-text-primary)'
          }`}
        >
          <Phone className="h-3.5 w-3.5" /> Phone
        </button>
      </div>

      {/* ── Email / Password tab ── */}
      {tab === 'email' && (
        <form onSubmit={handleSubmit(onEmailSubmit)} className="flex flex-col gap-5">
          <FormInput
            label="Email"
            type="email"
            placeholder="you@business.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <FormInput
            label="Password"
            type="password"
            placeholder="Your password"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-(--color-brand) px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--color-brand-dark) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Logging in…</> : 'Login'}
          </button>
        </form>
      )}

      {/* ── Phone OTP tab ── */}
      {tab === 'phone' && (
        <>
          {otpStep === 'phone' ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-(--color-text-primary)">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-text-muted)" />
                  <input
                    type="tel"
                    placeholder="0541234567"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-(--color-border) bg-(--color-card) pl-10 pr-4 py-3 text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) outline-none focus:border-(--color-brand) focus:ring-2 focus:ring-(--color-brand)/20 transition-all"
                    autoComplete="tel"
                  />
                </div>
                <p className="text-xs text-(--color-text-muted)">
                  We'll send a 6-digit verification code via SMS.
                </p>
              </div>
              <button
                type="submit"
                disabled={phoneLoading}
                className="flex items-center justify-center gap-2 rounded-lg bg-(--color-brand) px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--color-brand-dark) disabled:cursor-not-allowed disabled:opacity-60"
              >
                {phoneLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</> : 'Send Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
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
                  Code sent to <span className="font-semibold">{phone}</span>.{' '}
                  <button
                    type="button"
                    onClick={() => { setOtpStep('phone'); setOtp('') }}
                    className="text-(--color-brand) hover:underline"
                  >
                    Change number
                  </button>
                </p>
              </div>
              <button
                type="submit"
                disabled={phoneLoading}
                className="flex items-center justify-center gap-2 rounded-lg bg-(--color-brand) px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--color-brand-dark) disabled:cursor-not-allowed disabled:opacity-60"
              >
                {phoneLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Verifying…</> : 'Verify & Login'}
              </button>
            </form>
          )}
        </>
      )}

      <p className="text-center text-sm text-(--color-text-muted)">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-(--color-brand) hover:text-(--color-brand-dark) transition-colors">
          Create one free
        </Link>
      </p>
    </div>
  )
}