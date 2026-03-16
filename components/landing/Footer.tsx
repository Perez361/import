import Link from 'next/link'
import { Package } from 'lucide-react'

const links = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Pricing', href: '#' },
  ],
  Platform: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Register', href: '/register' },
    { label: 'Login', href: '/login' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-[#0A0F18] border-t border-white/8 px-4 pt-14 pb-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-14">

          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/20">
                <Package className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-white">
                Import<span className="text-blue-400">Flow</span> <span className="text-white/55 font-normal">PRO</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-[180px]">
              The all-in-one business platform for Ghana's mini-importers.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/45 mb-4">{section}</p>
              <ul className="space-y-3">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-slate-400 hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/8 pt-8">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} ImportFlow PRO. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">
            Made with ❤️ for Ghanaian importers
          </p>
        </div>
      </div>
    </footer>
  )
}