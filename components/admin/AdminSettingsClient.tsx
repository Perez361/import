'use client'

import { useState } from 'react'
import { Shield, Plus, Loader2, Crown, User } from 'lucide-react'
import { toast } from 'sonner'
import { createAdminAction } from '@/lib/admin/actions'
import type { AdminUser } from '@/lib/admin/session'

interface Admin {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

interface Props {
  currentAdmin: AdminUser
  admins: Admin[]
}

export default function AdminSettingsClient({ currentAdmin, admins }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', fullName: '', password: '', role: 'admin' as 'admin' | 'super_admin' })
  const [loading, setLoading] = useState(false)

  const isSuperAdmin = currentAdmin.role === 'super_admin'

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.fullName || !form.password) return
    setLoading(true)
    const result = await createAdminAction(form.email, form.fullName, form.password, form.role)
    setLoading(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Admin account created!')
    setShowForm(false)
    setForm({ email: '', fullName: '', password: '', role: 'admin' })
  }

  return (
    <div className="space-y-6">

      {/* Admin accounts list */}
      <div className="rounded-2xl border border-white/8 bg-white/4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="text-sm font-semibold text-white">Admin Accounts</h2>
          {isSuperAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Admin
            </button>
          )}
        </div>

        {/* Add admin form */}
        {showForm && isSuperAdmin && (
          <form onSubmit={handleCreate} className="px-5 py-4 border-b border-white/8 bg-blue-500/5 space-y-3">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">New Admin</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Jane Doe"
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-white/6 border border-white/10 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="jane@importflow.app"
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-white/6 border border-white/10 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Min. 8 characters"
                  minLength={8}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-white/6 border border-white/10 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value as any }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/6 border border-white/10 text-sm text-white outline-none focus:border-blue-500 transition-all"
                >
                  <option value="admin" className="bg-[#0D1220]">Admin</option>
                  <option value="super_admin" className="bg-[#0D1220]">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Admin
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Admins list */}
        <div className="divide-y divide-white/6">
          {admins.map((a) => (
            <div key={a.id} className="flex items-center gap-4 px-5 py-4">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                a.role === 'super_admin'
                  ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                  : 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
              }`}>
                {a.full_name?.charAt(0).toUpperCase() || a.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">{a.full_name || 'Admin'}</p>
                  {a.role === 'super_admin' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                      <Crown className="h-2.5 w-2.5" /> Super
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 border border-blue-500/30 text-blue-400">
                      <Shield className="h-2.5 w-2.5" /> Admin
                    </span>
                  )}
                  {a.id === currentAdmin.id && (
                    <span className="text-[10px] text-slate-500 font-medium">(you)</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{a.email}</p>
              </div>
              <p className="text-xs text-slate-600 whitespace-nowrap shrink-0">
                {new Date(a.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-xs font-semibold text-amber-400 mb-1">Creating the first super admin</p>
        <p className="text-xs text-slate-400 leading-relaxed">
          To create your first super admin account, run the SQL below in your Supabase SQL editor after creating the auth user manually in the Supabase dashboard:
        </p>
        <pre className="mt-2 text-xs text-slate-300 bg-black/30 rounded-lg p-3 overflow-x-auto">
{`INSERT INTO public.admins (user_id, email, full_name, role)
VALUES ('YOUR_AUTH_USER_ID', 'you@example.com', 'Your Name', 'super_admin');`}
        </pre>
      </div>
    </div>
  )
}