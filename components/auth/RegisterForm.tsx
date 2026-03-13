'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Mail } from 'lucide-react'
import FormInput from './FormInput'
import { createClient } from '@/lib/supabase/client'

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

export default function RegisterForm() {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    const supabase = createClient()
    const { data: signupResult, error } = await supabase.auth.signUp({
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

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Account created! Check your email.')
    setSubmitted(true)
  }

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
        label="Business Name"
        placeholder="Acme Imports Ltd."
        error={errors.businessName?.message}
        {...register('businessName')}
      />
      <FormInput
        label="Full Name"
        placeholder="John Doe"
        error={errors.fullName?.message}
        {...register('fullName')}
      />
      <FormInput
        label="Username"
        placeholder="john_doe"
        error={errors.username?.message}
        {...register('username')}
      />
      <FormInput
        label="Phone Number"
        type="tel"
placeholder="+233 80 000 0000"
        error={errors.phone?.message}
        {...register('phone')}
      />

      {/* Location */}
      <FormInput
        label="Location"
placeholder="Accra, Ghana"
        error={errors.location?.message}
        {...register('location')}
      />

      {/* Email */}
      <FormInput
        label="Email"
        type="email"
        placeholder="you@business.com"
        error={errors.email?.message}
        {...register('email')}
      />

      {/* Password */}
      <FormInput
        label="Password"
        type="password"
        placeholder="Min. 8 characters"
        error={errors.password?.message}
        {...register('password')}
      />

      {/* Confirm Password */}
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
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating account…
          </>
        ) : (
          'Create Free Account'
        )}
      </button>

      <p className="text-center text-sm text-(--color-text-muted)">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-(--color-brand) hover:text-(--color-brand-dark) transition-colors"
        >
          Log in
        </Link>
      </p>
    </form>
  )
}
