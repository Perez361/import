import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { getImporter } from '@/lib/importer'
import { Truck, MapPin, Clock, Package, Edit3, Trash2 } from 'lucide-react'

export default async function ShipmentsPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  const importer = await getImporter(user.id)

  const demoShipments = [
    { tracking: 'GHX789456', supplier: 'Alibaba Supplier A', status: 'In Transit', expected: '2024-10-20', items: '24', value: 'GH₵12,500' },
    { tracking: 'UPS123456789', supplier: 'AliExpress', status: 'Arrived', expected: '2024-10-18', items: '12', value: 'GH₵5,800' },
    { tracking: 'DHL987654321', supplier: 'Global Imports Ltd', status: 'Processing', expected: '2024-10-22', items: '36', value: 'GH₵18,200' },
    { tracking: 'FEDEX456123789', supplier: 'China Wholesale', status: 'Delivered', expected: '2024-10-16', items: '8', value: 'GH₵3,200' },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Shipments</h1>
        <button className="flex items-center gap-2 rounded-xl bg-[var(--color-brand)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-[var(--color-brand)]/90 transition-all">
          <Truck className="h-4 w-4" />
          + New Shipment
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[var(--color-border)]">
          <span className="text-sm font-medium text-[var(--color-text-muted)]">4 active shipments</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Tracking #</th>
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Supplier</th>
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Expected</th>
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Items</th>
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Value</th>
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {demoShipments.map((shipment) => (
                <tr key={shipment.tracking} className="hover:bg-[var(--color-surface)] transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-[var(--color-text-primary)]">{shipment.tracking}</td>
                  <td className="px-6 py-4 font-medium text-[var(--color-text-primary)]">{shipment.supplier}</td>
                  <td className="px-6 py-4">
                    {shipment.status === 'Processing' && (
                      <span className="px-3 py-1 rounded-full text-xs bg-[var(--color-brand-light)] text-[var(--color-brand)]">
                        Processing
                      </span>
                    )}
                    {shipment.status === 'In Transit' && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-[var(--color-warning-light)] text-[var(--color-warning)]">
                        <Clock className="h-3 w-3" />
                        In Transit
                      </span>
                    )}
                    {shipment.status === 'Arrived' && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-[var(--color-success-light)] text-[var(--color-success)]">
                        <Package className="h-3 w-3" />
                        Arrived
                      </span>
                    )}
                    {shipment.status === 'Delivered' && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-[var(--color-success)] text-white">
                        Delivered ✓
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-[var(--color-text-primary)]">{shipment.expected}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[var(--color-success)]">{shipment.items}</td>
                  <td className="px-6 py-4 font-semibold text-[var(--color-success)]">GH₵{shipment.value}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <button className="p-1.5 text-[var(--color-brand)] hover:bg-[var(--color-brand-light)] rounded-lg transition-all">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] rounded-lg transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 text-center py-12 text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
          Supplier shipment tracking coming soon...
        </div>
      </div>
    </div>
  )
}

