'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Package, CheckCircle2, XCircle } from 'lucide-react'
import FormInput from '@/components/auth/FormInput'
import { createCustomerClient } from '@/lib/supabase/customer-client'

const schema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
type FormData = z.infer<typeof schema>

export default function CustomerResetPasswordPage() {
  const router = useRouter()
  const { slug } = useParams<{ slug: string }>()
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!slug) return
    const supabase = createCustomerClient(slug)

    // detectSessionInUrl is false on the customer client, so parse the hash manually
    const hash = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type = params.get('type')

    if (accessToken && type === 'recovery') {
      ;(async () => {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken ?? '' })
        if (error) setLinkError('Invalid or expired reset link. Please request a new one.')
        else setReady(true)
      })()
    } else {
      // Fallback: check if there's already a live session (e.g. page refresh)
      ;(async () => {
        const { data } = await supabase.auth.getSession()
        if (data.session) setReady(true)
        else setLinkError('Invalid or expired reset link. Please request a new one.')
      })()
    }
  }, [slug])

  const onSubmit = async (data: FormData) => {
    const supabase = createCustomerClient(slug)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) { toast.error(error.message); return }
    setDone(true)
    setTimeout(() => router.replace(`/store/${slug}/login`), 2500)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-(--color-surface) px-4 py-12">
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--color-brand)">
          <Package className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-(--color-text-primary) tracking-tight">
          Reset Password
        </span>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-(--color-border) bg-(--color-card) p-5 shadow-sm sm:p-8">
        {linkError ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-(--color-danger-light)">
              <XCircle className="h-7 w-7 text-(--color-danger)" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-(--color-text-primary)">Link invalid</h2>
              <p className="mt-1 text-sm text-(--color-text-muted)">{linkError}</p>
            </div>
            <Link
              href={`/store/${slug}/forgot-password`}
              className="rounded-lg bg-(--color-brand) px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-(--color-brand-dark)"
            >
              Request a new link
            </Link>
          </div>
        ) : done ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-(--color-success-light)">
              <CheckCircle2 className="h-7 w-7 text-(--color-success)" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-(--color-text-primary)">Password updated!</h2>
              <p className="mt-1 text-sm text-(--color-text-muted)">Redirecting you to sign in…</p>
            </div>
          </div>
        ) : !ready ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-6 w-6 animate-spin text-(--color-brand)" />
            <p className="text-sm text-(--color-text-muted)">Verifying reset link…</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-1.5 sm:mb-8">
              <h1 className="text-2xl font-bold text-(--color-text-primary)">Set new password</h1>
              <p className="text-sm text-(--color-text-muted)">Choose a new password for your account.</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <FormInput
                label="New Password"
                type="password"
                placeholder="At least 6 characters"
                error={errors.password?.message}
                {...register('password')}
              />
              <FormInput
                label="Confirm Password"
                type="password"
                placeholder="Re-enter your password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-(--color-brand) px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--color-brand-dark) disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Updating…</>
                  : 'Update Password'}
              </button>
              <p className="text-center text-sm text-(--color-text-muted)">
                Link expired?{' '}
                <Link href={`/store/${slug}/forgot-password`} className="font-medium text-(--color-brand) hover:text-(--color-brand-dark)">
                  Request a new one
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
