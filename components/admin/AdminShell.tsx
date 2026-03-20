'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Shield, LayoutDashboard, Users, CreditCard,
  Settings, LogOut, Menu, X, ChevronRight,
} from 'lucide-react'
import { adminLogoutAction } from '@/lib/admin/actions'
import type { AdminUser } from '@/lib/admin/session'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/importers', label: 'Importers', icon: Users },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminShell({
  admin,
  children,
}: {
  admin: AdminUser
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  const handleLogout = async () => {
    await adminLogoutAction()
    router.push('/admin/login')
    router.refresh()
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
        <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">ImportFlow</p>
          <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/6'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="h-3.5 w-3.5" />}
            </Link>
          )
        })}
      </nav>

      {/* Admin info + logout */}
      <div className="p-3 border-t border-white/8">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
          <div className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
            {admin.full_name?.charAt(0).toUpperCase() || admin.email.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{admin.full_name || 'Admin'}</p>
            <p className="text-[10px] text-slate-500 truncate">{admin.role.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="h-screen bg-[#0A0F18] flex overflow-hidden">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#0D1220] border-r border-white/8 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-[#0D1220] border-r border-white/8 flex flex-col lg:hidden">
            <SidebarContent />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-[#0D1220] shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:bg-white/8 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-bold text-white">Admin</span>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}