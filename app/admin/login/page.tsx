import { requireAdmin } from '@/lib/admin/session'
import { getAdminOverviewStats } from '@/lib/admin/data'
import {
  Users, ShoppingCart, TrendingUp, Package,
  Crown, Zap, Gift, Clock,
} from 'lucide-react'

export const metadata = { title: 'Admin Overview – ImportFlow' }

const fmt = (n: number) => n.toLocaleString('en-GH', { maximumFractionDigits: 0 })

export default async function AdminOverviewPage() {
  await requireAdmin()
  const stats = await getAdminOverviewStats()

  const kpis = [
    {
      label: 'Total Importers',
      value: stats.totalImporters,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      label: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Platform MRR',
      value: `GH₵${fmt(stats.mrr)}`,
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      isString: true,
    },
  ]

  const planCards = [
    { name: 'free', label: 'Free', icon: Gift, color: 'text-slate-400', count: stats.planCounts['free'] || 0 },
    { name: 'pro', label: 'Pro', icon: Zap, color: 'text-blue-400', count: stats.planCounts['pro'] || 0 },
    { name: 'business', label: 'Business', icon: Crown, color: 'text-amber-400', count: stats.planCounts['business'] || 0 },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-sm text-slate-500 mt-0.5">Platform-wide stats and recent activity</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg, border, isString }) => (
          <div key={label} className={`rounded-2xl border ${border} ${bg} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
              <div className={`h-8 w-8 rounded-lg ${bg} flex items-center justify-center border ${border}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
            <span className={`text-2xl font-bold text-white tabular-nums`}>
              {isString ? value : fmt(Number(value))}
            </span>
          </div>
        ))}
      </div>

      {/* Plan breakdown + recent signups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Plan breakdown */}
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Subscription Breakdown</h2>
          <div className="space-y-3">
            {planCards.map(({ label, icon: Icon, color, count, name }) => {
              const total = stats.totalImporters || 1
              const pct = Math.round((count / total) * 100)
              return (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-2 text-sm text-slate-300">
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                      {label}
                    </span>
                    <span className="text-sm font-semibold text-white tabular-nums">
                      {count} <span className="font-normal text-slate-500">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        name === 'business' ? 'bg-amber-400' : name === 'pro' ? 'bg-blue-400' : 'bg-slate-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-white/8">
            <p className="text-xs text-slate-500">30-day importer GMV</p>
            <p className="text-lg font-bold text-emerald-400 tabular-nums mt-0.5">
              GH₵{fmt(Math.round(stats.thirtyDayRevenue))}
            </p>
          </div>
        </div>

        {/* Recent signups */}
        <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-white/4 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Signups</h2>
          {stats.recentImporters.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No importers yet</p>
          ) : (
            <div className="divide-y divide-white/6">
              {stats.recentImporters.map((imp: any) => (
                <div key={imp.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                      {(imp.business_name || imp.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white truncate max-w-[180px]">
                        {imp.business_name || 'Unnamed'}
                      </p>
                      <p className="text-xs text-slate-500 truncate max-w-[180px]">{imp.email}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(imp.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </p>
                    {imp.store_slug && (
                      <a
                        href={`/store/${imp.store_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        /store/{imp.store_slug}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}