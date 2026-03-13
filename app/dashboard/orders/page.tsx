import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { getImporter } from '@/lib/importer'
import { ShoppingCart, Clock, PackageCheck, XCircle, Edit3, Trash2 } from 'lucide-react'

export default async function OrdersPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  const importer = await getImporter(user.id)

  const demoOrders = [
    { id: '#124', customer: 'Kofi Mensah', product: 'Nike Shoes', amount: '450', status: 'Pending', date: '2024-10-15' },
    { id: '#123', customer: 'Abena Boateng', product: 'iPhone 15', amount: '8200', status: 'Processing', date: '2024-10-14' },
    { id: '#122', customer: 'Kwame Addo', product: 'T-Shirts x3', amount: '180', status: 'Delivered', date: '2024-10-13' },
    { id: '#121', customer: 'Akosua Darko', product: 'Laptop Bag', amount: '320', status: 'Cancelled', date: '2024-10-12' },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Manage Orders</h1>
        <button className="flex items-center gap-2 rounded-xl bg-[var(--color-brand)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-[var(--color-brand)]/90 transition-all">
          <ShoppingCart className="h-4 w-4" />
          + New Order
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-[var(--color-text-muted)]">Status:</span>
            <span className="px-3 py-1 rounded-full text-xs bg-[var(--color-muted)] text-[var(--color-text-muted)] cursor-pointer hover:bg-[var(--color-muted)]/80">All Orders</span>
            <span className="px-3 py-1 rounded-full text-xs bg-[var(--color-warning)] text-white cursor-pointer hover:bg-[var(--color-warning)]/90">Pending</span>
            <span className="px-3 py-1 rounded-full text-xs bg-[var(--color-success)] text-white cursor-pointer hover:bg-[var(--color-success)]/90">Delivered</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Order ID</th>
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Customer</th>
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Product</th>
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Amount</th>
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Date</th>
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {demoOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[var(--color-surface)] transition-colors">
                  <td className="px-6 py-4 font-medium text-[var(--color-text-primary)]">{order.id}</td>
                  <td className="px-6 py-4 text-[var(--color-text-primary)] font-medium">{order.customer}</td>
                  <td className="px-6 py-4 text-[var(--color-text-primary)]">{order.product}</td>
                  <td className="px-6 py-4 font-semibold text-[var(--color-success)]">GH₵{order.amount}</td>
                  <td className="px-6 py-4">
                    {order.status === 'Pending' && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-[var(--color-warning-light)] text-[var(--color-warning)]">
                        <Clock className="h-3 w-3" />
                        {order.status}
                      </span>
                    )}
                    {order.status === 'Processing' && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-[var(--color-brand-light)] text-[var(--color-brand)]">
                        Processing...
                      </span>
                    )}
                    {order.status === 'Delivered' && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-[var(--color-success-light)] text-[var(--color-success)]">
                        <PackageCheck className="h-3 w-3" />
                        {order.status}
                      </span>
                    )}
                    {order.status === 'Cancelled' && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-[var(--color-danger-light)] text-[var(--color-danger)]">
                        <XCircle className="h-3 w-3" />
                        {order.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-muted)]">{order.date}</td>
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
          Full order management coming soon...
        </div>
      </div>
    </div>
  )
}

