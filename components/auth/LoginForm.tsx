'use client'

import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import FormInput from './FormInput'
import { loginAction } from '@/lib/actions'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
  const result = await loginAction({ email: data.email, password: data.password })
  if (result?.error) {
    // Check if the error hints at a customer trying to use the importer login
    if (result.error.toLowerCase().includes('customer') || result.error === 'no_importer') {
      toast.error('This account is a customer account. Please log in at your store instead.')
    } else {
      toast.error(result.error)
    }
  }
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
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Logging in…
          </>
        ) : (
          'Login'
        )}
      </button>

      <p className="text-center text-sm text-(--color-text-muted)">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-(--color-brand) hover:text-(--color-brand-dark) transition-colors"
        >
          Create one free
        </Link>
      </p>
    </form>
  )
}
