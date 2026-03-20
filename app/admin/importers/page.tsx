import { requireAdmin } from '@/lib/admin/session'
import { getAdminImportersList } from '@/lib/admin/data'
import Link from 'next/link'
import { Search, Crown, Zap, Gift, ExternalLink, ChevronRight } from 'lucide-react'

export const metadata = { title: 'Importers – Admin' }

const PLAN_BADGE: Record<string, { label: string; classes: string; icon: any }> = {
  free:     { label: 'Free',     classes: 'bg-slate-500/20 text-slate-400 border-slate-500/30',  icon: Gift },
  pro:      { label: 'Pro',      classes: 'bg-blue-500/20 text-blue-400 border-blue-500/30',     icon: Zap },
  business: { label: 'Business', classes: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Crown },
}

const STATUS_BADGE: Record<string, string> = {
  active:    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  trialing:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
  cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  past_due:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

export default async function AdminImportersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plan?: string; page?: string }>
}) {
  await requireAdmin()
  const params = await searchParams
  const search = params.q || ''
  const planFilter = params.plan || ''
  const page = parseInt(params.page || '0')

  const { importers } = await getAdminImportersList(search, planFilter, page)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Importers</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage all registered importers</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <form method="GET" className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            name="q"
            defaultValue={search}
            placeholder="Search by name, email, username…"
            className="pl-10 pr-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500 w-72 transition-all"
          />
        </form>
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/6 p-1">
          {['', 'free', 'pro', 'business'].map((plan) => (
            <Link
              key={plan || 'all'}
              href={`/admin/importers?plan=${plan}${search ? `&q=${search}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                planFilter === plan
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/8'
              }`}
            >
              {plan === '' ? 'All' : plan.charAt(0).toUpperCase() + plan.slice(1)}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/8 bg-white/4 overflow-hidden">
        {importers.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No importers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {['Importer', 'Store', 'Plan', 'Status', 'Joined', ''].map((h, i) => (
                    <th
                      key={h || i}
                      className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {importers.map((imp: any) => {
                  const sub = imp.importer_subscriptions?.[0]
                  const planName = sub?.subscription_plans?.name || 'free'
                  const status = sub?.status || 'active'
                  const plan = PLAN_BADGE[planName] || PLAN_BADGE.free
                  const PlanIcon = plan.icon

                  return (
                    <tr key={imp.id} className="hover:bg-white/4 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-400 shrink-0">
                            {(imp.business_name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white truncate max-w-[160px]">
                              {imp.business_name || 'Unnamed'}
                            </p>
                            <p className="text-xs text-slate-500 truncate max-w-[160px]">{imp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {imp.store_slug ? (
                          <a
                            href={`/store/${imp.store_slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            /{imp.store_slug}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${plan.classes}`}>
                          <PlanIcon className="h-3 w-3" />
                          {plan.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${STATUS_BADGE[status] || STATUS_BADGE.active}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(imp.created_at).toLocaleDateString('en', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/importers/${imp.id}`}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                        >
                          Manage <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}