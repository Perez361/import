import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

export const metadata = {
  title: 'Forgot Password – ImportFlow PRO',
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-(--color-surface) px-4 py-12">
      <div className="mb-4 w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </div>

      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--color-brand)">
          <Package className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-(--color-text-primary) tracking-tight">
          ImportFlow <span className="text-(--color-brand)">PRO</span>
        </span>
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-(--color-border) bg-(--color-card) p-5 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col gap-1.5 sm:mb-8">
          <h1 className="text-2xl font-bold text-(--color-text-primary)">Reset your password</h1>
          <p className="text-sm text-(--color-text-muted)">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
