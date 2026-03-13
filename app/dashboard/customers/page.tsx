import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { getImporter } from '@/lib/importer'
import { Users, Phone, MapPin, ShoppingCart, Edit3, Trash2 } from 'lucide-react'

export default async function CustomersPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  const importer = await getImporter(user.id)

  const demoCustomers = [
    { id: 'CUST001', name: 'Kofi Mensah', phone: '+233 24 123 4567', address: 'Accra Central', orders: 5, totalSpent: 'GH₵2,340', lastOrder: '3 days ago' },
    { id: 'CUST002', name: 'Abena Boateng', phone: '+233 20 987 6543', address: 'Kumasi Adum', orders: 3, totalSpent: 'GH₵1,820', lastOrder: '1 week ago' },
    { id: 'CUST003', name: 'Kwame Addo', phone: '+233 54 555 7777', address: 'Takoradi', orders: 8, totalSpent: 'GH₵4,560', lastOrder: '2 days ago' },
    { id: 'CUST004', name: 'Akosua Darko', phone: '+233 26 444 2222', address: 'Tema Community 25', orders: 2, totalSpent: 'GH₵890', lastOrder: '10 days ago' },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Customers</h1>
        <button className="flex items-center gap-2 rounded-xl bg-[var(--color-brand)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-[var(--color-brand)]/90 transition-all">
          <Users className="h-4 w-4" />
          + New Customer
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[var(--color-border)]">
          <span className="text-sm font-medium text-[var(--color-text-muted)]">8 total customers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">ID</th>
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Name</th>
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Phone</th>
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Address</th>
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Orders</th>
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Total Spent</th>
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Last Order</th>
                <th className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {demoCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-[var(--color-surface)] transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-[var(--color-text-muted)]">{customer.id}</td>
                  <td className="px-6 py-4 font-semibold text-[var(--color-text-primary)]">{customer.name}</td>
                  <td className="px-6 py-4 text-[var(--color-text-primary)]">
                    <Phone className="h-4 w-4 inline mr-1 text-[var(--color-muted)]" />
                    {customer.phone}
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-primary)] max-w-xs truncate">
                    <MapPin className="h-4 w-4 inline mr-1 text-[var(--color-muted)]" />
                    {customer.address}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-[var(--color-success)]">{customer.orders}</td>
                  <td className="px-6 py-4 font-semibold text-[var(--color-success)]">GH₵{customer.totalSpent}</td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-muted)]">{customer.lastOrder}</td>
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
          Order history and repeat customer insights coming soon...
        </div>
      </div>
    </div>
  )
}

