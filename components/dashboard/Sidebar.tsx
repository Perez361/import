'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Users, 
  Truck, 
  Store, 
  TrendingUp, 
  Settings, 
  LogOut 
} from 'lucide-react'
import { logoutAction } from '@/lib/actions'

interface SidebarProps {
  businessName: string
}

export default function Sidebar({ businessName }: SidebarProps) {
  const pathname = usePathname()

  const handleLogout = async () => {
  await logoutAction()
  window.location.href = '/login'
}

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/products', label: 'Products', icon: Package },
    { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/dashboard/customers', label: 'Customers', icon: Users },
    { href: '/dashboard/shipments', label: 'Shipments', icon: Truck },
    { href: '/dashboard/storefront', label: 'My Store', icon: Store },
    { href: '/dashboard/finances', label: 'Finances', icon: TrendingUp },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="w-64 border-r border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
      {/* Business Header */}
      <div className="p-6 border-b border-[var(--color-border)]">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)] truncate">
          {businessName}
        </h1>
        <p className="text-xs text-[var(--color-text-muted)]">Importer Dashboard</p>
      </div>

      {/* Nav Links */}
      <nav className="p-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[var(--color-brand-light)] text-[var(--color-brand)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--color-border)]">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)]"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  )
}

