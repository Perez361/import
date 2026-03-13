import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-slate-900 overflow-hidden flex items-center">
      {/* Gradient orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-3xl sm:h-[600px] sm:w-[600px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[300px] w-[300px] rounded-full bg-indigo-600/15 blur-3xl sm:h-[500px] sm:w-[500px]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pt-28 pb-16 text-center sm:px-6 sm:pt-32 sm:pb-20 lg:py-36">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 sm:mb-8 sm:px-4">
          <Sparkles className="h-3 w-3 text-blue-400 sm:h-3.5 sm:w-3.5" />
          <span className="text-xs font-medium text-blue-400 sm:text-sm">Mini-Importation Made Simple</span>
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Manage your importation business{' '}
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            in one place.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:mt-8 sm:text-xl">
          Track products, customers and shipments with ease. Built specifically
          for mini-importers who mean business.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 px-2 sm:mt-12 sm:flex-row sm:items-center sm:px-0 sm:gap-4">
          <Link
            href="/register"
            className="group flex items-center justify-center gap-2 rounded-xl bg-(--color-brand) px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-(--color-brand-dark) hover:shadow-blue-600/50 hover:-translate-y-0.5 sm:px-8 sm:py-4"
          >
            Create Free Account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:-translate-y-0.5 sm:px-8 sm:py-4"
          >
            Login
          </Link>
        </div>

        {/* Trust line */}
        <p className="mt-8 text-sm text-slate-500 sm:mt-10">
          Free to start · No credit card required
        </p>
      </div>
    </section>
  )
}
