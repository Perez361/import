'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Truck, Plus, Package, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import NewBatchForm from './NewBatchForm'
import RealtimeRefresher from './RealtimeRefresher'

export default function ShipmentsPage() {
  const router = useRouter()
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [importerId, setImporterId] = useState<string>('')

  const fetchBatches = useCallback(async () => {
    try {
      const supabase = createClient()

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/login')
        return
      }

      setImporterId(user.id)

      const { data: batchesData, error: batchesError } = await supabase
        .from('shipment_batches')
        .select(`
          id, name, shipping_company, status, notes, created_at,
          shipment_items ( id, status, pushed_to_order )
        `)
        .eq('importer_id', user.id)
        .order('created_at', { ascending: false })

      if (batchesError) {
        console.error('Error fetching batches:', batchesError)
        setError(batchesError.message)
      } else {
        setBatches(batchesData || [])
      }
    } catch (err: any) {
      console.error('Shipments page error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  const batchList = batches || []

  const statusConfig: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
    open: {
      label: 'Open',
      classes: 'bg-blue-100 text-blue-700',
      icon: <Clock className="h-3 w-3" />,
    },
    received: {
      label: 'Received',
      classes: 'bg-yellow-100 text-yellow-700',
      icon: <Package className="h-3 w-3" />,
    },
    reconciled: {
      label: 'Reconciled',
      classes: 'bg-green-100 text-green-700',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Shipments</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Track overseas freight batches and reconcile deliveries
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden p-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[var(--color-brand)] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[var(--color-text-muted)]">Loading shipments...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Shipments</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Track overseas freight batches and reconcile deliveries
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 shadow-sm overflow-hidden p-12 text-center">
          <p className="text-red-700 mb-4">Error loading shipments: {error}</p>
          <button
            onClick={fetchBatches}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <RealtimeRefresher importerId={importerId} />
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Shipments</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Track overseas freight batches and reconcile deliveries
          </p>
        </div>
        <NewBatchForm />
      </div>
      </div>

      {/* New batch form */}
      <NewBatchForm />

      {/* Batch list */}
      {batchList.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] p-12 text-center">
          <Truck className="h-14 w-14 text-[var(--color-text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
            No shipment batches yet
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Create a batch for each delivery from your freight company.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {batchList.map((batch: any) => {
            const items = batch.shipment_items || []
            const total = items.length
            const received = items.filter((i: any) => i.status === 'received').length
            const missing = items.filter((i: any) => i.status === 'missing').length
            const pushed = items.filter((i: any) => i.pushed_to_order).length
            const cfg = statusConfig[batch.status] || statusConfig['open']

            return (
              <Link
                key={batch.id}
                href={`/dashboard/shipments/${batch.id}`}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm hover:shadow-md hover:border-[var(--color-brand)] transition-all block"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-brand-light)]">
                      <Truck className="h-5 w-5 text-[var(--color-brand)]" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--color-text-primary)]">{batch.name}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {batch.shipping_company || 'No company set'} ·{' '}
                        {new Date(batch.created_at).toLocaleDateString('en', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.classes}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>

                {/* Stats row */}
                <div className="mt-4 flex items-center gap-4 flex-wrap">
                  <Stat label="Total Items" value={total} color="text-[var(--color-text-primary)]" />
                  <Stat label="Received" value={received} color="text-[var(--color-success)]" />
                  {missing > 0 && (
                    <Stat label="Missing" value={missing} color="text-[var(--color-danger)]" icon={<AlertCircle className="h-3 w-3" />} />
                  )}
                  <Stat label="Billed to Orders" value={pushed} color="text-[var(--color-brand)]" />
                </div>

                {/* Progress bar */}
                {total > 0 && (
                  <div className="mt-3 h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-success)] transition-all"
                      style={{ width: `${Math.round((received / total) * 100)}%` }}
                    />
                  </div>
                )}

                {batch.notes && (
                  <p className="mt-3 text-xs text-[var(--color-text-muted)] line-clamp-1">
                    📝 {batch.notes}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color, icon }: { label: string; value: number; color: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className={`text-sm font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
    </div>
  )
}