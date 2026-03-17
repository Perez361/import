'use client'

import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
import { createCustomerClient } from '@/lib/supabase/customer-client'
import { toast } from 'sonner'

interface StoreContextType {
  slug: string | null
  customerId: string | null
  storeId: string | null
  customerName: string
  customerAvatar: string | null   // ← NEW: avatar_url from customers table
  isLoggedIn: boolean
  loading: boolean
  refetchCustomer: () => Promise<void>
}

const StoreContext = createContext<StoreContextType | null>(null)

import { InitialCustomer } from '@/lib/auth/store-session'

interface StoreProviderProps {
  children: ReactNode
  initialSlug: string
  initialCustomer?: InitialCustomer
}

export function StoreProvider({ children, initialSlug, initialCustomer }: StoreProviderProps) {
  const [slug] = useState<string | null>(initialSlug)
  const [customerId, setCustomerId] = useState<string | null>(initialCustomer?.id ?? null)
  const [storeId, setStoreId] = useState<string | null>(initialCustomer?.storeId ?? null)
  const [customerName, setCustomerName] = useState(initialCustomer?.name ?? '')
  const [customerAvatar, setCustomerAvatar] = useState<string | null>(initialCustomer?.avatar ?? null)
  const [isLoggedIn, setIsLoggedIn] = useState(!!initialCustomer)
  const [loading, setLoading] = useState(!initialCustomer)
  const isFetchingRef = useRef(false)

  const fetchCustomer = useCallback(async (currentSlug: string) => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    try {
      const supabase = createCustomerClient(currentSlug)
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        setIsLoggedIn(false)
        setCustomerName('')
        setCustomerAvatar(null)
        setCustomerId(null)
        setStoreId(null)
        return
      }

      const { data: importer } = await supabase
        .from('importers')
        .select('id, store_slug')
        .eq('store_slug', currentSlug)
        .single()

      if (!importer) return

      const { data: customer } = await supabase
        .from('customers')
        .select('id, store_id, full_name, username, avatar_url')
        .eq('user_id', user.id)
        .eq('store_id', importer.id)
        .single()

      if (customer) {
        setCustomerId(customer.id)
        setStoreId(customer.store_id)
        setCustomerName(customer.full_name || customer.username || '')
        setCustomerAvatar(customer.avatar_url ?? null)
        setIsLoggedIn(true)
      } else {
        setIsLoggedIn(false)
        setCustomerName('')
        setCustomerAvatar(null)
        setCustomerId(null)
        setStoreId(null)
      }
    } catch (error: any) {
      console.error('Fetch customer error:', error)
      if (error.name === 'AbortError' || error.message?.includes('lock')) {
        setTimeout(() => fetchCustomer(currentSlug).catch(console.error), 1500)
      } else {
        toast.error('Session check failed')
      }
    } finally {
      isFetchingRef.current = false
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialCustomer) {
      setLoading(false)
      return
    }
    if (slug) fetchCustomer(slug)
  }, [slug, fetchCustomer, initialCustomer])

  useEffect(() => {
    if (!slug) return
    const supabase = createCustomerClient(slug)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false)
          setCustomerName('')
          setCustomerAvatar(null)
          setCustomerId(null)
          setStoreId(null)
        } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          await fetchCustomer(slug)
        } else if (event === 'INITIAL_SESSION') {
          if (session?.user) await fetchCustomer(slug)
          else setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [slug, fetchCustomer])

  return (
    <StoreContext.Provider value={{
      slug,
      customerId,
      storeId,
      customerName,
      customerAvatar,
      isLoggedIn,
      loading,
      refetchCustomer: () => fetchCustomer(slug || '')
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used within StoreProvider')
  return context
}