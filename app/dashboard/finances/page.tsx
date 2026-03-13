import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { getImporter } from '@/lib/importer'
import { TrendingUp, DollarSign, BarChart3, PieChart, Edit3 } from 'lucide-react'

export default async function FinancesPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  const importer = await getImporter(user.id)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Finances (Phase 4)</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-success-light)]">
              <DollarSign className="h-6 w-6 text-[var(--color-success)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">This Month</h2>
              <p className="text-[var(--color-text-muted)]">Revenue & Profit</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-text-muted)]">Revenue</span>
              <span className="text-2xl font-bold text-[var(--color-success)]">GH₵8,450</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-text-muted)]">Orders</span>
              <span className="text-xl font-semibold text-[var(--color-text-primary)]">12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-text-muted)]">Profit</span>
              <span className="text-2xl font-bold text-[var(--color-brand)]">GH₵2,840</span>
            </div>
            <div className="flex justify-between pt-4 border-t border-[var(--color-border)]">
              <span className="text-sm text-[var(--color-text-muted)]">Avg Order Value</span>
              <span className="text-lg font-semibold text-[var(--color-text-primary)]">GH₵704</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-light)]">
              <TrendingUp className="h-6 w-6 text-[var(--color-brand)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Growth</h2>
              <p className="text-[var(--color-text-muted)]">This month vs last</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between text-3xl font-bold text-[var(--color-success)]">
              <span>+18%</span>
              <TrendingUp className="h-8 w-8" />
            </div>
            <div className="text-sm text-[var(--color-text-muted)]">
              Revenue up 18% from GH₵7,160 last month
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-warning-light)]">
              <BarChart3 className="h-6 w-6 text-[var(--color-warning)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Top Products</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between py-2">
              <span>Nike Air Max</span>
              <span>12 sold (GH₵7,800)</span>
            </div>
            <div className="flex justify-between py-2">
              <span>iPhone 15</span>
              <span>3 sold (GH₵29,400)</span>
            </div>
            <div className="flex justify-between py-2">
              <span>T-Shirts Pack</span>
              <span>15 sold (GH₵225)</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-light)]">
              <PieChart className="h-6 w-6 text-[var(--color-brand)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Expenses</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Shipments</span>
              <span>GH₵1,850</span>
            </div>
            <div className="flex justify-between">
              <span>Product Cost</span>
              <span>GH₵3,760</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee</span>
              <span>GH₵425 (2%)</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t border-[var(--color-border)]">
              <span>Total Cost</span>
              <span>GH₵6,035</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 p-8 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] text-center">
        <Edit3 className="h-12 w-12 mx-auto mb-4 text-[var(--color-muted)]" />
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Advanced Analytics Coming in Phase 4</h3>
        <p className="text-[var(--color-text-muted)] max-w-md mx-auto">Detailed profit/loss statements, tax reports, cashflow analysis, and accounting exports.</p>
      </div>
    </div>
  )
}

