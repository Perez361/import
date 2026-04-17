'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Package, CheckCircle2, XCircle } from 'lucide-react'
import FormInput from '@/components/auth/FormInput'
import { createClient } from '@/lib/supabase/client'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    const supabase = createClient()
    let settled = false

    // Supabase fires PASSWORD_RECOVERY when it detects recovery tokens in the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (settled) return
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        settled = true
        setReady(true)
      }
    })

    // Also check immediately — handles page refreshes where session is already in storage
    supabase.auth.getSession().then((result) => {
      const session = result.data.session
      if (settled) return
      if (session) { settled = true; setReady(true) }
    })

    // If nothing fires after 4s, the link is invalid or already used
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true
        setLinkError('This reset link is invalid or has already been used. Please request a new one.')
      }
    }, 4000)

    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [])

  const onSubmit = async (data: FormData) => {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) { toast.error(error.message); return }
    setDone(true)
    setTimeout(() => router.replace('/dashboard'), 2500)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-(--color-surface) px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--color-brand)">
          <Package className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-(--color-text-primary) tracking-tight">
          ImportFlow <span className="text-(--color-brand)">PRO</span>
        </span>
      </Link>

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
              href="/forgot-password"
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
              <p className="mt-1 text-sm text-(--color-text-muted)">Redirecting you to your dashboard…</p>
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
              <p className="text-sm text-(--color-text-muted)">Choose a strong password for your account.</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <FormInput
                label="New Password"
                type="password"
                placeholder="At least 8 characters"
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
                <Link href="/forgot-password" className="font-medium text-(--color-brand) hover:text-(--color-brand-dark)">
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
