import { createClient } from '@/lib/supabase/server'
import { Crown, Zap, Gift } from 'lucide-react'

export const metadata = { title: 'Subscriptions – Admin' }

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient()

  const { data: subs } = await supabase
    .from('importer_subscriptions')
    .select(`
      id, status, current_period_end, created_at, notes,
      importers ( id, business_name, email, store_slug ),
      subscription_plans ( name, display_name, price_monthly )
    `)
    .order('created_at', { ascending: false })

  const fmt = (n: number) => n.toLocaleString('en-GH', { maximumFractionDigits: 0 })
  const allSubs = subs || []

  const mrr = allSubs
    .filter(s => s.status === 'active')
    .reduce((sum: number, s: any) => sum + (Number(s.subscription_plans?.price_monthly) || 0), 0)

  const byPlan = allSubs.reduce((acc: Record<string, number>, s: any) => {
    const name = s.subscription_plans?.name || 'free'
    acc[name] = (acc[name] || 0) + 1
    return acc
  }, {})

  const PLAN_CONFIG: Record<string, { icon: any; color: string; border: string; bg: string }> = {
    free:     { icon: Gift,  color: 'text-slate-400', border: 'border-slate-500/30', bg: 'bg-slate-500/10' },
    pro:      { icon: Zap,   color: 'text-blue-400',  border: 'border-blue-500/30',  bg: 'bg-blue-500/10' },
    business: { icon: Crown, color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
  }

  const STATUS_COLORS: Record<string, string> = {
    active:    'bg-emerald-500/20 text-emerald-400',
    trialing:  'bg-blue-500/20 text-blue-400',
    suspended: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-slate-500/20 text-slate-400',
    past_due:  'bg-amber-500/20 text-amber-400',
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
        <p className="text-sm text-slate-500 mt-0.5">All importer subscription records</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">MRR</p>
          <p className="text-2xl font-bold text-amber-400 tabular-nums">GH₵{fmt(mrr)}</p>
        </div>
        {['free', 'pro', 'business'].map(plan => {
          const cfg = PLAN_CONFIG[plan]
          const Icon = cfg.icon
          return (
            <div key={plan} className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-4`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${cfg.color}`} />
                <p className={`text-xs font-semibold uppercase tracking-wider ${cfg.color}`}>
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </p>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">{byPlan[plan] || 0}</p>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/8 bg-white/4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {['Importer', 'Plan', 'Status', 'Period End', 'Notes'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {allSubs.map((sub: any) => {
                const plan = sub.subscription_plans
                const importer = sub.importers
                const cfg = PLAN_CONFIG[plan?.name || 'free']
                const Icon = cfg.icon
                return (
                  <tr key={sub.id} className="hover:bg-white/4 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{importer?.business_name || '—'}</p>
                      <p className="text-xs text-slate-500">{importer?.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.border} ${cfg.bg} ${cfg.color}`}>
                        <Icon className="h-3 w-3" />
                        {plan?.display_name || 'Free'}
                        {plan?.price_monthly > 0 && <span className="opacity-60">· GH₵{plan.price_monthly}/mo</span>}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[sub.status] || ''}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {sub.current_period_end
                        ? new Date(sub.current_period_end).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 max-w-[200px] truncate">
                      {sub.notes || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}