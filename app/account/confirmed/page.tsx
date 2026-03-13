import Link from 'next/link'
import { Package, CheckCircle2, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Account Confirmed – ImportFlow',
}

export default function ConfirmedPage({
  searchParams
}: {
  searchParams: { store?: string }
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-(--color-surface) px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--color-brand)">
          <Package className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-(--color-text-primary) tracking-tight">
          ImportFlow <span className="text-(--color-brand)">PRO</span>
        </span>
      </Link>

      {/* Success Card */}
      <div className="w-full max-w-md rounded-2xl border border-(--color-border) bg-(--color-card) p-8 shadow-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--color-success-light)">
            <CheckCircle2 className="h-8 w-8 text-(--color-success)" />
          </div>
          
          <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-(--color-text-primary)">
            Account confirmed!
          </h1>
          <p className="text-sm text-(--color-text-muted) leading-relaxed">
            {searchParams.store 
              ? `Welcome to ${searchParams.store}! Check your email, confirm, then login to start shopping.`
              : 'Your account is ready. Check your email to confirm then login.'}
          </p>
          </div>

          <Link
            href={searchParams.store ? `/store/${searchParams.store}/login` : '/login'}
            className="w-full rounded-lg bg-(--color-brand) px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--color-brand-dark) flex items-center justify-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            {searchParams.store ? 'Login to Store' : 'Login to Dashboard'}
          </Link>

          <p className="text-xs text-(--color-text-muted)">
            New to ImportFlow?{' '}
            <Link href="/register" className="text-(--color-brand) hover:text-(--color-brand-dark) font-medium">
              Create another account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
