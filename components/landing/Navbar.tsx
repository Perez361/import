import Link from 'next/link'
import { Package } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 sm:pt-5">
      <div className="w-full max-w-6xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-5 py-3 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
            <Package className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">
            Import<span className="text-blue-400">Flow</span> <span className="text-white/60 font-normal">PRO</span>
          </span>
        </Link>

        {/* Links */}
        <div className="hidden sm:flex items-center gap-1 text-sm text-white/60">
          <a href="#features" className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-all">Features</a>
          <a href="#how-it-works" className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-all">How it works</a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden sm:block px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-semibold text-slate-900 bg-white rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
          >
            Get started free
          </Link>
        </div>
      </div>
    </nav>
  )
}