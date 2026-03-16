'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu, X, Package, Home, ShoppingCart, Users, Truck,
  Store, TrendingUp, Settings, LogOut, BarChart2,
  ClipboardCheck, ChevronRight,
} from 'lucide-react'
import { logoutAction } from '@/lib/actions'
import { toast } from 'sonner'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/pre-orders', label: 'Pre-orders', icon: ClipboardCheck },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/shipments', label: 'Shipments', icon: Truck },
  { href: '/dashboard/storefront', label: 'My Store', icon: Store },
  { href: '/dashboard/finances', label: 'Finances', icon: TrendingUp },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

interface Props {
  businessName: string
  email: string
  children: React.ReactNode
}

export default function MobileDashboardShell({ businessName, email, children }: Props) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Close sidebar on escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleLogout = async () => {
    await logoutAction()
    window.location.href = '/login'
  }

  const currentPage = navItems.find(
    (item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
  )

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col">

      {/* ── Top header (mobile + desktop) ────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">

          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand)]">
                <Package className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-[var(--color-text-primary)] tracking-tight hidden sm:block">
                ImportFlow <span className="text-[var(--color-brand)]">PRO</span>
              </span>
            </Link>
          </div>

          {/* Center: current page name on mobile */}
          {currentPage && (
            <span className="text-sm font-semibold text-[var(--color-text-primary)] lg:hidden">
              {currentPage.label}
            </span>
          )}

          {/* Right: add product + user */}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/products/new"
              className="hidden sm:flex items-center gap-1.5 rounded-lg bg-[var(--color-success)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--color-success)]/90 transition-all"
            >
              <Package className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Add Product</span>
              <span className="md:hidden">Add</span>
            </Link>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-[var(--color-text-primary)] max-w-[120px] truncate">{businessName}</span>
              <span className="text-[10px] text-[var(--color-text-muted)] max-w-[120px] truncate">{email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-2.5 py-2 text-xs font-medium text-[var(--color-text-muted)] hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Desktop sidebar ───────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-60 border-r border-[var(--color-border)] bg-[var(--color-card)] shrink-0">
          <div className="p-4 border-b border-[var(--color-border)]">
            <p className="font-bold text-[var(--color-text-primary)] truncate text-sm">{businessName}</p>
            <p className="text-xs text-[var(--color-text-muted)] truncate">{email}</p>
          </div>
          <nav className="flex-1 p-2 overflow-y-auto">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all mb-0.5 ${
                    isActive
                      ? 'bg-[var(--color-brand-light)] text-[var(--color-brand)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              )
            })}
          </nav>
          <div className="p-2 border-t border-[var(--color-border)]">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        {/* ── Mobile sidebar overlay ────────────────────────────────────── */}
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Drawer */}
            <div className="fixed inset-y-0 left-0 z-50 w-72 bg-[var(--color-card)] shadow-2xl flex flex-col lg:hidden">
              {/* Drawer header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand)]">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">
                    ImportFlow <span className="text-[var(--color-brand)]">PRO</span>
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Business info */}
              <div className="px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{businessName}</p>
                <p className="text-xs text-[var(--color-text-muted)] truncate">{email}</p>
              </div>

              {/* Nav */}
              <nav className="flex-1 p-3 overflow-y-auto">
                {navItems.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all mb-1 ${
                        isActive
                          ? 'bg-[var(--color-brand-light)] text-[var(--color-brand)]'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{label}</span>
                      {isActive && <ChevronRight className="h-3.5 w-3.5" />}
                    </Link>
                  )
                })}
              </nav>

              {/* Add product CTA */}
              <div className="p-3 border-t border-[var(--color-border)]">
                <Link
                  href="/dashboard/products/new"
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-[var(--color-success)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-success)]/90 transition-all mb-2"
                >
                  <Package className="h-4 w-4" />
                  Add New Product
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Main content ──────────────────────────────────────────────── */}
        <main className="flex-1 overflow-auto min-w-0">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ─────────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--color-card)] border-t border-[var(--color-border)] shadow-lg">
        <div className="flex items-center justify-around px-2 py-1.5">
          {[
            { href: '/dashboard', label: 'Home', icon: Home },
            { href: '/dashboard/products', label: 'Products', icon: Package },
            { href: '/dashboard/pre-orders', label: 'Pre-orders', icon: ClipboardCheck },
            { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
            { href: '/dashboard/customers', label: 'Customers', icon: Users },
          ].map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-[var(--color-brand)]'
                    : 'text-[var(--color-text-muted)]'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-[var(--color-brand)]' : ''}`} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[var(--color-text-muted)]"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="lg:hidden h-16" />
    </div>
  )
}