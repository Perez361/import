import { requireAdmin } from '@/lib/admin/session'
import { getAdminImporterDetail, getAllPlans } from '@/lib/admin/data'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Package, Users, ShoppingCart,
  TrendingUp, ExternalLink, Store,
} from 'lucide-react'
import AdminImporterActions from '@/components/admin/AdminImporterActions'

export default async function AdminImporterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const [detail, plans] = await Promise.all([
    getAdminImporterDetail(id),
    getAllPlans(),
  ])

  if (!detail.importer) notFound()

  const { importer, productCount, customerCount, totalOrders, totalRevenue, subscription, recentOrders } = detail
  const planName = (subscription as any)?.subscription_plans?.name || 'free'
  const status = (subscription as any)?.status || 'active'

  const fmt = (n: number) => n.toLocaleString('en-GH', { maximumFractionDigits: 0 })

  const stats = [
    { label: 'Products', value: productCount, icon: Package, color: 'text-blue-400' },
    { label: 'Customers', value: customerCount, icon: Users, color: 'text-purple-400' },
    { label: 'Orders', value: totalOrders, icon: ShoppingCart, color: 'text-emerald-400' },
    { label: 'Revenue', value: `GH₵${fmt(Math.round(totalRevenue))}`, icon: TrendingUp, color: 'text-amber-400', isStr: true },
  ]

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    product_paid: 'bg-blue-500/20 text-blue-400',
    processing: 'bg-indigo-500/20 text-indigo-400',
    arrived: 'bg-purple-500/20 text-purple-400',
    shipping_billed: 'bg-orange-500/20 text-orange-400',
    shipping_paid: 'bg-emerald-500/20 text-emerald-400',
    delivered: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/admin/importers" className="p-2 rounded-lg hover:bg-white/8 transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-400" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="h-11 w-11 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-lg font-bold text-blue-400 shrink-0">
            {(importer.business_name || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{importer.business_name}</h1>
            <p className="text-sm text-slate-500">{importer.email}</p>
          </div>
          {importer.store_slug && (
            <a
              href={`/store/${importer.store_slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-slate-400 hover:text-white hover:border-white/20 transition-all"
            >
              <Store className="h-3.5 w-3.5" />
              View Store
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color, isStr }) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-white/4 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{label}</span>
            </div>
            <span className="text-2xl font-bold text-white tabular-nums">
              {isStr ? value : fmt(Number(value))}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Profile info */}
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white">Profile</h2>
          {[
            { label: 'Username', value: importer.username },
            { label: 'Phone', value: importer.phone },
            { label: 'Location', value: importer.location },
            { label: 'Store slug', value: importer.store_slug },
            { label: 'Member since', value: new Date(importer.created_at).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' }) },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
              <span className="text-sm text-white">{value || '—'}</span>
            </div>
          ))}
        </div>

        {/* Subscription management */}
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Subscription</h2>
          <AdminImporterActions
            importerId={id}
            currentPlan={planName}
            currentStatus={status}
            notes={(subscription as any)?.notes || ''}
            plans={plans}
          />
        </div>

        {/* Recent orders */}
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No orders yet</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-white/6 last:border-0">
                  <div>
                    <p className="text-xs font-mono text-slate-400">#{order.id.slice(-8).toUpperCase()}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize mt-0.5 ${STATUS_COLORS[order.status] || 'bg-slate-500/20 text-slate-400'}`}>
                      {order.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-white tabular-nums">
                    GH₵{fmt(Math.round((Number(order.total) || 0) + (Number(order.shipping_fee) || 0)))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}