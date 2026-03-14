'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface CustomerProfile {
  id: string
  full_name: string | null
  username: string | null
  store_id: string
  store_slug: string
}

interface StoreContextType {
  slug: string | null
  customerId: string | null
  storeId: string | null
  customerName: string
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
  const [slug, setSlug] = useState<string | null>(initialSlug)
  const [customerId, setCustomerId] = useState<string | null>(initialCustomer?.id ?? null)
  const [storeId, setStoreId] = useState<string | null>(initialCustomer?.storeId ?? null)
  const [customerName, setCustomerName] = useState(initialCustomer?.name ?? '')
  const [isLoggedIn, setIsLoggedIn] = useState(!!initialCustomer)
  const [loading, setLoading] = useState(true)  // Let dependents know when ready

  const fetchCustomer = useCallback(async (currentSlug: string) => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user || !currentSlug) {
        setIsLoggedIn(false)
        setCustomerName('')
        setCustomerId(null)
        setStoreId(null)
        return
      }

      // Get importer by store_slug
      const { data: importer } = await supabase
        .from('importers')
        .select('id, store_slug')
        .eq('store_slug', currentSlug)
        .single()

      if (!importer) {
        console.warn('Store not found for slug:', currentSlug)
        return
      }

      // Get customer for this store
      const { data: customer } = await supabase
        .from('customers')
        .select('id, store_id, full_name, username')
        .eq('user_id', session.user.id)
        .eq('store_id', importer.id)
        .single()

      if (customer) {
        setCustomerId(customer.id)
        setStoreId(customer.store_id)
        setCustomerName(customer.full_name || customer.username || '')
        setIsLoggedIn(true)
      } else {
        setIsLoggedIn(false)
        setCustomerName('')
        setCustomerId(null)
        setStoreId(null)
      }
    } catch (error) {
      console.error('Fetch customer error:', error)
      toast.error('Session check failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Only fetch customer if we don't have initial data and have a slug
    if (initialCustomer) {
      setLoading(false)
    } else if (slug) {
      fetchCustomer(slug)
    }
  }, [slug, fetchCustomer, initialCustomer])

  // Listen for auth changes but don't auto-clear - let fetchCustomer handle it
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only refetch customer if we have a session or previously had a session
      // This prevents clearing state on initial load before session is checked
      if (session?.user && slug) {
        await fetchCustomer(slug)
      } else if (event === 'SIGNED_OUT') {
        // Only clear on explicit sign out
        setIsLoggedIn(false)
        setCustomerName('')
        setCustomerId(null)
        setStoreId(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [slug, fetchCustomer])

  const value: StoreContextType = {
    slug,
    customerId,
    storeId,
    customerName,
    isLoggedIn,
    loading,
    refetchCustomer: () => fetchCustomer(slug!)
  }

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within StoreProvider')
  }
  return context
}

