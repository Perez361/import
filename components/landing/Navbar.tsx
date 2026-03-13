import Link from 'next/link'
import { Package } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--color-brand)">
            <Package className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-white tracking-tight sm:text-lg">
            ImportFlow <span className="text-(--color-brand) font-extrabold">PRO</span>
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/account/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white sm:px-4"
          >
            Login
          </Link>
          <Link
            href="/account/register"
            className="rounded-lg bg-(--color-brand) px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-(--color-brand-dark) sm:px-4"
          >
            <span className="sm:hidden">Sign Up</span>
            <span className="hidden sm:inline">Create Free Account</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
