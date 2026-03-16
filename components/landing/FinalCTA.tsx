import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

const perks = [
  'Free to start — no credit card',
  'Your own store link in minutes',
  'MoMo payment tracking built-in',
  'WhatsApp billing with one tap',
  'Works on mobile & desktop',
  'Shipment reconciliation tools',
]

export default function FinalCTA() {
  return (
    <section className="bg-[#060A10] px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <div className="relative rounded-3xl overflow-hidden border border-blue-500/20">

          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-transparent" />
          <div className="absolute inset-0 bg-[#080C14]/60" />

          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px',
            }}
          />

          <div className="relative px-8 py-14 sm:px-14 sm:py-16 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4">Ready to scale?</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              Start managing your imports
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                like a pro.
              </span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-10">
              Join importers across Ghana who've ditched the spreadsheets. Get your store live in under 5 minutes.
            </p>

            {/* Perks grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg mx-auto mb-10 text-left">
              {perks.map((perk) => (
                <div key={perk} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-sm text-slate-300">{perk}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="group flex items-center gap-2 rounded-xl bg-blue-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-400 hover:-translate-y-0.5 transition-all duration-200 w-full sm:w-auto justify-center"
              >
                Create free account
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl border border-white/10 px-8 py-3.5 text-sm font-semibold text-white/70 hover:text-white hover:border-white/20 transition-all duration-200 w-full sm:w-auto justify-center"
              >
                Already have an account →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}