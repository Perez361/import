import Link from 'next/link'
import { ArrowRight, TrendingUp, Package, Users, CheckCircle } from 'lucide-react'

const stats = [
  { value: '2×', label: 'Faster order processing' },
  { value: 'GH₵0', label: 'Setup cost' },
  { value: '100%', label: 'Yours to keep' },
]

const badges = [
  'Pre-orders',
  'Shipment tracking',
  'Customer portal',
  'MoMo payments',
  'Analytics',
  'WhatsApp billing',
]

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-[#080C14] overflow-hidden flex flex-col items-center justify-center pt-28 pb-20 px-4">

      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Glow blobs */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/2 right-0 h-[300px] w-[300px] rounded-full bg-cyan-500/8 blur-[80px]" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">

        {/* Top pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-medium text-blue-300 tracking-wide">Built for Ghanaian importers</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight mb-6">
          Run your import
          <br />
          <span className="relative">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
              business smarter.
            </span>
            {/* underline accent */}
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 400 12" fill="none" preserveAspectRatio="none">
              <path d="M2 8 C100 2, 300 2, 398 8" stroke="url(#ugrad)" strokeWidth="3" strokeLinecap="round"/>
              <defs>
                <linearGradient id="ugrad" x1="0" y1="0" x2="1" y2="0">
                  <stop stopColor="#60A5FA" />
                  <stop offset="1" stopColor="#67E8F9" />
                </linearGradient>
              </defs>
            </svg>
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed mb-10">
          ImportFlow PRO is the all-in-one platform for mini-importers. Manage pre-orders, track shipments, collect payments via MoMo, and keep customers informed — all from one beautiful dashboard.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
          <Link
            href="/register"
            className="group flex items-center gap-2 rounded-xl bg-blue-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-400 hover:-translate-y-0.5 transition-all duration-200"
          >
            Start for free
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            Sign in to dashboard
          </Link>
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-16">
          {badges.map((b) => (
            <span
              key={b}
              className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs text-white/50"
            >
              <CheckCircle className="h-3 w-3 text-blue-400 shrink-0" />
              {b}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {stats.map(({ value, label }) => (
            <div key={label} className="rounded-2xl border border-white/8 bg-white/3 p-4 backdrop-blur-sm">
              <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">{value}</p>
              <p className="text-xs text-slate-500 mt-1 leading-snug">{label}</p>
            </div>
          ))}
        </div>

        {/* Dashboard mockup hint */}
        <div className="mt-16 mx-auto max-w-3xl">
          <div className="rounded-2xl border border-white/10 bg-white/3 backdrop-blur-sm p-3 shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
            {/* Browser chrome */}
            <div className="rounded-xl bg-slate-900 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                <div className="flex-1 mx-4 rounded-md bg-white/5 px-3 py-1 text-xs text-white/30 text-center">importflow.app/dashboard</div>
              </div>
              {/* Fake dashboard UI */}
              <div className="p-4 sm:p-6 space-y-4">
                {/* Stat cards row */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Products', val: '12', icon: Package, color: 'text-blue-400' },
                    { label: 'Orders', val: '48', icon: TrendingUp, color: 'text-emerald-400' },
                    { label: 'Customers', val: '31', icon: Users, color: 'text-purple-400' },
                    { label: 'Revenue', val: 'GH₵9.4k', icon: TrendingUp, color: 'text-amber-400' },
                  ].map(({ label, val, icon: Icon, color }) => (
                    <div key={label} className="rounded-xl bg-white/4 border border-white/6 p-3">
                      <Icon className={`h-4 w-4 ${color} mb-2`} />
                      <p className="text-sm font-bold text-white">{val}</p>
                      <p className="text-[10px] text-white/40">{label}</p>
                    </div>
                  ))}
                </div>
                {/* Fake order rows */}
                <div className="rounded-xl bg-white/3 border border-white/5 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/60">Recent Orders</span>
                    <span className="text-[10px] text-blue-400">View all →</span>
                  </div>
                  {[
                    { id: 'A3F82C', name: 'Kwame Asante', status: 'Delivered', amount: 'GH₵650', color: 'text-emerald-400 bg-emerald-400/10' },
                    { id: 'B19D4A', name: 'Ama Owusu', status: 'Shipping billed', amount: 'GH₵430', color: 'text-orange-400 bg-orange-400/10' },
                    { id: 'C77E12', name: 'Kofi Mensah', status: 'Processing', amount: 'GH₵1,200', color: 'text-blue-400 bg-blue-400/10' },
                  ].map((row) => (
                    <div key={row.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/4 last:border-0">
                      <span className="font-mono text-[10px] text-white/30">#{row.id}</span>
                      <span className="flex-1 text-xs text-white/60 text-left">{row.name}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${row.color}`}>{row.status}</span>
                      <span className="text-xs font-semibold text-white tabular-nums">{row.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}