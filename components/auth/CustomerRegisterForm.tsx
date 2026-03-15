'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import FormInput from './FormInput'
import { createCustomerClient } from '@/lib/supabase/customer-client'

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  username: z.string().min(2, 'Username must be at least 2 characters'),
  contact: z.string().min(10, 'Contact number is required'),
  email: z.string().email('Enter a valid email address'),
  location: z.string().min(1, 'Location is required'),
  shippingAddress: z.string().min(1, 'Shipping address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function CustomerRegisterForm({ slug }: { slug: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || `/store/${slug}`

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterFormData) => {
    // Always use the customer client scoped to this slug
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
          location: data.location,
          shipping_address: data.shippingAddress,
          email: data.email,
        },
      },
    })

    if (authError || !authData.user) {
      toast.error(authError?.message || 'Registration failed')
      return
    }

    toast.success('Account created! Please check your email to confirm.')
    router.push(`/account/confirmed?store=${slug}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <FormInput label="Full Name" placeholder="John Doe" error={errors.fullName?.message} {...register('fullName')} />
      <FormInput label="Username" placeholder="johndoe123" error={errors.username?.message} {...register('username')} />
      <FormInput label="Contact" type="tel" placeholder="0541234567" error={errors.contact?.message} {...register('contact')} />
      <FormInput label="Email" type="email" placeholder="john@example.com" error={errors.email?.message} {...register('email')} />
      <FormInput label="Location" placeholder="Accra, Ghana" error={errors.location?.message} {...register('location')} />
      <FormInput label="Shipping Address" placeholder="123 Street, Accra" error={errors.shippingAddress?.message} {...register('shippingAddress')} />
      <FormInput label="Password" type="password" placeholder="At least 6 characters" error={errors.password?.message} {...register('password')} />
      <FormInput label="Confirm Password" type="password" placeholder="Re-enter your password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />

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
          'Create Account'
        )}
      </button>

      <p className="text-center text-sm text-(--color-text-muted)">
        Already have an account?{' '}
        <Link href={`/store/${slug}/login?redirect=${encodeURIComponent(redirectTo)}`} className="font-medium text-(--color-brand) hover:text-(--color-brand-dark) transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  )
}
