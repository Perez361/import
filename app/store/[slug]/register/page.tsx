import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Package, ArrowLeft } from 'lucide-react'
import CustomerRegisterForm from '@/components/auth/CustomerRegisterForm'
import { getImporterBySlug } from '@/lib/store'
import { getImporterUser, getCustomerUser } from '@/lib/auth/user-type'

export const metadata = {
  title: 'Create Account – Store Customer',
}

export default async function CustomerRegisterPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>
  searchParams: { redirect?: string }
}) {
  const { slug } = await params
  const importer = await getImporterBySlug(slug)

  if (!importer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-(--color-surface) px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-(--color-text-primary)">Store Not Found</h1>
          <Link href="/" className="mt-4 text-(--color-brand) hover:text-(--color-brand-dark)">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Check if user is logged in as importer - redirect to dashboard
  const importerUser = await getImporterUser()
  if (importerUser) {
    redirect('/dashboard')
  }

  // Check if user is logged in as a customer for a different store
  const customer = await getCustomerUser()
  if (customer && customer.store_slug !== slug) {
    // User is customer for a different store, redirect to their store
    redirect(`/store/${customer.store_slug}`)
  }

  // If user is customer for this store, redirect to the store
  if (customer && customer.store_slug === slug) {
    redirect(`/store/${slug}`)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-(--color-surface) px-4 py-12">
      <div className="mb-4 w-full max-w-md">
        <Link
          href={`/store/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {importer.business_name}
        </Link>
      </div>

      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--color-brand)">
          <Package className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-(--color-text-primary) tracking-tight">
          New Customer
        </span>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-(--color-border) bg-(--color-card) p-5 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col gap-1.5 sm:mb-8">
          <h1 className="text-2xl font-bold text-(--color-text-primary)">Join {importer.business_name}</h1>
          <p className="text-sm text-(--color-text-muted)">
            Create account to start shopping and placing orders.
          </p>
        </div>

        <CustomerRegisterForm slug={slug} />
      </div>
    </div>
  )
}

