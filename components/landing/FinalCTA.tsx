import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function FinalCTA() {
  return (
    <section className="bg-slate-900 px-4 py-14 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-extrabold text-white sm:text-4xl lg:text-5xl">
          Start Your Free{' '}
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            ImportFlow
          </span>{' '}
          Account
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-400 sm:mt-6 sm:text-lg">
          Join importers who are already managing their business smarter.
          Set up your account in under two minutes.
        </p>
        <div className="mt-8 flex flex-col items-stretch gap-3 px-2 sm:mt-10 sm:flex-row sm:items-center sm:justify-center sm:px-0 sm:gap-4">
          <Link
            href="/register"
            className="group flex items-center justify-center gap-2 rounded-xl bg-(--color-brand) px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-(--color-brand-dark) hover:-translate-y-0.5 sm:px-8 sm:py-4"
          >
            Get Started — It&apos;s Free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center rounded-xl border border-white/20 px-6 py-3.5 text-base font-semibold text-slate-300 transition-colors hover:text-white sm:px-8 sm:py-4"
          >
            Already have an account?
          </Link>
        </div>
      </div>
    </section>
  )
}
