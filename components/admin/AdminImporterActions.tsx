'use client'

import { useState } from 'react'
import { Crown, Zap, Gift, Loader2, ShieldOff, ShieldCheck, Save } from 'lucide-react'
import { toast } from 'sonner'
import {
  updateImporterSubscriptionAction,
  suspendImporterAction,
  unsuspendImporterAction,
} from '@/lib/admin/actions'

interface Plan {
  id: string
  name: string
  display_name: string
  price_monthly: number
}

interface Props {
  importerId: string
  currentPlan: string
  currentStatus: string
  notes: string
  plans: Plan[]
}

const PLAN_ICONS: Record<string, any> = { free: Gift, pro: Zap, business: Crown }

export default function AdminImporterActions({
  importerId, currentPlan, currentStatus, notes: initialNotes, plans,
}: Props) {
  const [plan, setPlan] = useState(currentPlan)
  const [status, setStatus] = useState(currentStatus)
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const [suspending, setSuspending] = useState(false)

  const isSuspended = status === 'suspended'

  const handleSave = async () => {
    setSaving(true)
    const result = await updateImporterSubscriptionAction(importerId, plan, status, notes)
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Subscription updated!')
  }

  const handleSuspend = async () => {
    if (!confirm('Suspend this importer? Their store will stop working.')) return
    setSuspending(true)
    const result = await suspendImporterAction(importerId, notes || undefined)
    setSuspending(false)
    if (result.error) { toast.error(result.error); return }
    setStatus('suspended')
    toast.success('Importer suspended.')
  }

  const handleUnsuspend = async () => {
    setSuspending(true)
    const result = await unsuspendImporterAction(importerId)
    setSuspending(false)
    if (result.error) { toast.error(result.error); return }
    setStatus('active')
    toast.success('Importer reactivated.')
  }

  return (
    <div className="space-y-4">

      {/* Current status badge */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${
          isSuspended
            ? 'bg-red-500/20 text-red-400 border-red-500/30'
            : status === 'active'
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
        }`}>
          {status}
        </span>
      </div>

      {/* Plan selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Plan</label>
        <div className="space-y-2">
          {plans.map((p) => {
            const Icon = PLAN_ICONS[p.name] || Gift
            const selected = plan === p.name
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlan(p.name)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all ${
                  selected
                    ? 'border-blue-500/50 bg-blue-500/15 text-white'
                    : 'border-white/10 bg-white/4 text-slate-400 hover:border-white/20 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${selected ? 'text-blue-400' : ''}`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{p.display_name}</p>
                  <p className="text-xs opacity-60">
                    {p.price_monthly === 0 ? 'Free' : `GH₵${p.price_monthly}/mo`}
                  </p>
                </div>
                {selected && (
                  <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Status override */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Status</label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-white/6 border border-white/10 text-sm text-white outline-none focus:border-blue-500 transition-all"
        >
          {['active', 'trialing', 'past_due', 'cancelled', 'suspended'].map(s => (
            <option key={s} value={s} className="bg-[#0D1220] capitalize">{s}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Admin Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Optional notes about this importer…"
          className="w-full px-3 py-2.5 rounded-xl bg-white/6 border border-white/10 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500 transition-all resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all disabled:opacity-50 flex-1 justify-center"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
        {isSuspended ? (
          <button
            onClick={handleUnsuspend}
            disabled={suspending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-sm font-semibold transition-all disabled:opacity-50 flex-1 justify-center"
          >
            {suspending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Unsuspend
          </button>
        ) : (
          <button
            onClick={handleSuspend}
            disabled={suspending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-semibold transition-all disabled:opacity-50 flex-1 justify-center"
          >
            {suspending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
            Suspend
          </button>
        )}
      </div>
    </div>
  )
}