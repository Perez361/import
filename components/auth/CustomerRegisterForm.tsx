'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Camera } from 'lucide-react'
import FormInput from './FormInput'
import GoogleButton from './GoogleButton'
import { createCustomerClient } from '@/lib/supabase/customer-client'
import { getDefaultAvatarUrl, uploadCustomerAvatar } from '@/lib/avatar'

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

export default function CustomerRegisterForm({ slug }: { slug: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || `/store/${slug}`

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const fullNameValue = watch('fullName', '')

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB')
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data: RegisterFormData) => {
    const supabase = createCustomerClient(slug)

    // 1. Sign up
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

    // 2. Wait briefly for the trigger to create the customer row, then find it
    await new Promise((r) => setTimeout(r, 800))

    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', authData.user.id)
      .maybeSingle()

    // 3. Set avatar_url — upload custom photo or assign DiceBear default
    if (customer?.id) {
      let avatarUrl: string

      if (avatarFile) {
        const { url, error: uploadError } = await uploadCustomerAvatar(supabase, customer.id, avatarFile)
        if (uploadError) {
          toast.error(`Avatar upload failed: ${uploadError}`)
          avatarUrl = getDefaultAvatarUrl(data.fullName || data.username)
        } else {
          avatarUrl = url!
        }
      } else {
        avatarUrl = getDefaultAvatarUrl(data.fullName || data.username)
      }

      await supabase
        .from('customers')
        .update({ avatar_url: avatarUrl })
        .eq('id', customer.id)
    }

    toast.success('Account created! Please check your email to confirm.')
    router.push(`/account/confirmed?store=${slug}`)
  }

  // Determine what to show in the avatar circle preview
  const defaultAvatarSeed = fullNameValue || 'user'
  const previewSrc = avatarPreview || getDefaultAvatarUrl(defaultAvatarSeed)
  const isDefaultAvatar = !avatarPreview

  return (
    <div className="flex flex-col gap-5">
      <GoogleButton
        label="Sign up with Google"
        userType="customer"
        storeSlug={slug}
        redirectTo={redirectTo}
      />

      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-(--color-border)" />
        <span className="text-xs text-(--color-text-muted)">or register with email</span>
        <div className="h-px flex-1 bg-(--color-border)" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* Avatar upload */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-(--color-border) hover:border-(--color-brand) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-brand)"
              title="Upload profile photo (optional)"
            >
              <img
                src={previewSrc}
                alt="Avatar preview"
                className="w-full h-full object-cover"
              />
              {/* Camera overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity rounded-full">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </button>
            {/* Camera badge */}
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

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
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Creating account…</>
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
    </div>
  )
}