import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { Users, Phone, MapPin, ShoppingCart } from 'lucide-react'

export const metadata = {
  title: 'Customers – ImportFlow PRO',
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const search = params.q?.toLowerCase() || ''

  const supabase = await createClient()

  // Fetch customers with their order stats
  const { data: customers, error } = await supabase
    .from('customers')
    .select(`
      id,
      full_name,
      username,
      contact,
      email,
      location,
      shipping_address,
      created_at,
      orders (
        id,
        total,
        status
      )
    `)
    .eq('store_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching customers:', error)
  }

  const fmt = (n: number) =>
    n.toLocaleString('en-GH', { maximumFractionDigits: 0 })

  const getTimeAgo = (dateStr: string) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Build enriched list
  const enriched = (customers || []).map((c: any) => {
    const orders = c.orders || []
    const totalSpent = orders.reduce(
      (sum: number, o: any) => sum + (parseFloat(String(o.total)) || 0),
      0
    )
    const lastOrder = orders.length > 0
      ? orders.sort((a: any, b: any) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        )[0]
      : null

    return {
      ...c,
      displayName: c.full_name || c.username || 'Unknown',
      orderCount: orders.length,
      totalSpent,
      lastOrderAgo: lastOrder ? getTimeAgo(lastOrder.created_at) : 'No orders',
    }
  })

  // Client-side search filter (done server side here via filter)
  const filtered = search
    ? enriched.filter(
        (c) =>
          c.displayName.toLowerCase().includes(search) ||
          c.email?.toLowerCase().includes(search) ||
          c.contact?.toLowerCase().includes(search) ||
          c.location?.toLowerCase().includes(search)
      )
    : enriched

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Customers</h1>
        <span className="text-sm text-[var(--color-text-muted)]">
          {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-[var(--color-border)]">
          <form method="GET">
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Search by name, email, phone or location…"
              className="w-full max-w-sm px-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
            />
          </form>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-16 w-16 text-[var(--color-text-muted)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              {search ? 'No customers found' : 'No customers yet'}
            </h3>
            <p className="text-[var(--color-text-muted)]">
              {search
                ? 'Try a different search term.'
                : 'Customers who register on your store will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {['Customer', 'Contact', 'Location', 'Orders', 'Total Spent', 'Last Order', 'Joined'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] text-sm uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-[var(--color-surface)] transition-colors"
                  >
                    {/* Customer */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand)] font-bold text-sm shrink-0">
                          {customer.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--color-text-primary)]">
                            {customer.displayName}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]">{customer.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4 text-sm text-[var(--color-text-primary)]">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                        {customer.contact || '—'}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4 text-sm text-[var(--color-text-primary)] max-w-[160px] truncate">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[var(--color-text-muted)] shrink-0" />
                        {customer.location || '—'}
                      </span>
                    </td>

                    {/* Orders */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-brand-light)] text-[var(--color-brand)]">
                        <ShoppingCart className="h-3 w-3" />
                        {customer.orderCount}
                      </span>
                    </td>

                    {/* Total Spent */}
                    <td className="px-6 py-4 font-semibold text-[var(--color-success)]">
                      GH₵{fmt(customer.totalSpent)}
                    </td>

                    {/* Last Order */}
                    <td className="px-6 py-4 text-sm text-[var(--color-text-muted)]">
                      {customer.lastOrderAgo}
                    </td>

                    {/* Joined */}
                    <td className="px-6 py-4 text-sm text-[var(--color-text-muted)] whitespace-nowrap">
                      {new Date(customer.created_at).toLocaleDateString('en', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}