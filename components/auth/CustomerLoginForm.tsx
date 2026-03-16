'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import FormInput from './FormInput'
import GoogleButton from './GoogleButton'
import { createCustomerClient } from '@/lib/supabase/customer-client'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function CustomerLoginForm({ slug }: { slug: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || `/store/${slug}`

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    const supabase = createCustomerClient(slug)
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    const { data: importerCheck } = await supabase
      .from('importers')
      .select('id')
      .eq('id', authData.user.id)
      .maybeSingle()

    if (importerCheck) {
      await supabase.auth.signOut()
      toast.error('This is an importer account. Please log in at importflow.app/login to access your dashboard.')
      return
    }

    const { data: customerCheck } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (!customerCheck) {
      await supabase.auth.signOut()
      toast.error('No customer account found for this store. Please create an account first.')
      return
    }

    toast.success('Welcome back!')
    await router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      <GoogleButton
        label="Continue with Google"
        userType="customer"
        storeSlug={slug}
        redirectTo={redirectTo}
      />

      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-(--color-border)" />
        <span className="text-xs text-(--color-text-muted)">or continue with email</span>
        <div className="h-px flex-1 bg-(--color-border)" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <FormInput
          label="Email"
          type="email"
          placeholder="you@example.com"
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
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Logging in…</>
          ) : (
            'Continue Shopping'
          )}
        </button>

        <p className="text-center text-sm text-(--color-text-muted)">
          New customer?{' '}
          <Link
            href={`/store/${slug}/register?redirect=${encodeURIComponent(redirectTo)}`}
            className="font-medium text-(--color-brand) hover:text-(--color-brand-dark) transition-colors"
          >
            Create account
          </Link>
        </p>
      </form>
    </div>
  )
}