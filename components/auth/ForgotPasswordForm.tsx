'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail } from 'lucide-react'
import FormInput from './FormInput'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    // Always show success — never reveal whether email exists
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-5 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--color-brand-light)">
          <Mail className="h-7 w-7 text-(--color-brand)" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-(--color-text-primary)">Check your email</h2>
          <p className="max-w-xs text-sm leading-relaxed text-(--color-text-muted)">
            If an account exists for that email, you'll receive a password reset link shortly.
            Check your spam folder if you don't see it.
          </p>
        </div>
        <Link
          href="/login"
          className="mt-1 text-sm font-medium text-(--color-brand) hover:text-(--color-brand-dark) transition-colors"
        >
          Back to Login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <FormInput
        label="Email"
        type="email"
        placeholder="you@business.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-(--color-brand) px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--color-brand-dark) disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Sending…</>
        ) : (
          'Send Reset Link'
        )}
      </button>
      <p className="text-center text-sm text-(--color-text-muted)">
        Remember your password?{' '}
        <Link
          href="/login"
          className="font-medium text-(--color-brand) hover:text-(--color-brand-dark) transition-colors"
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}
