'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, LogOut, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DashboardHeaderProps {
  businessName: string
  email: string
}

export default function DashboardHeader({ businessName, email }: DashboardHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-(--color-border) bg-(--color-card) shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--color-brand)">
            <Package className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-(--color-text-primary) tracking-tight">
            ImportFlow <span className="text-(--color-brand)">PRO</span>
          </span>
        </Link>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/products/new"
            className="flex items-center gap-2 rounded-lg bg-[var(--color-success)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-[var(--color-success-dark)] transition-all"
          >
            <Package className="h-4 w-4" />
            + Add Product
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
            >
              <LayoutDashboard className="h-4 w-4" />
            </Link>
          </nav>
        </div>

        {/* User + Logout */}
        <div className="flex items-center gap-4">
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-sm font-semibold text-(--color-text-primary)">{businessName}</span>
            <span className="text-xs text-(--color-text-muted)">{email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-(--color-border) px-3 py-2 text-sm font-medium text-(--color-text-muted) transition-colors hover:border-(--color-danger) hover:text-(--color-danger)"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
