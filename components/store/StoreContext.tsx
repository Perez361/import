'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
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
  const isFetchingRef = useRef(false)

  const fetchCustomer = useCallback(async (currentSlug: string) => {
    if (isFetchingRef.current) {
      console.log('StoreContext: Skipping concurrent customer fetch')
      return
    }
    isFetchingRef.current = true
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
    } catch (error: any) {
      console.error('Fetch customer error:', error)
      if (error.name === 'AbortError' || error.message?.includes('lock')) {
        console.warn('Store session check aborted (IDB lock contention), retrying...')
        // Self-retry after delay to avoid concurrent conflicts
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
    // If we have initialCustomer from server, set state immediately and don't fetch
    if (initialCustomer) {
      setCustomerId(initialCustomer.id)
      setStoreId(initialCustomer.storeId)
      setCustomerName(initialCustomer.name)
      setIsLoggedIn(true)
      setLoading(false)
    } else if (slug) {
      // Only fetch if we don't have initialCustomer
      fetchCustomer(slug)
    }
  }, [slug, fetchCustomer, initialCustomer])

  // Listen for auth changes but preserve initial customer state
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // On initial load, if we have initialCustomer from server, don't clear it
      if (event === 'INITIAL_SESSION') {
        // If we have a session and initialCustomer wasn't provided, fetch it
        if (session?.user && !initialCustomer && slug) {
          await fetchCustomer(slug)
        }
        // If we have initialCustomer, keep it regardless of session state
        return
      }
      
      // On signed out, clear state
      if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false)
        setCustomerName('')
        setCustomerId(null)
        setStoreId(null)
        return
      }
      
      // On session changed, refetch customer if we have a session
      if (session?.user && slug) {
        await fetchCustomer(slug)
      }
    })

    return () => subscription.unsubscribe()
  }, [slug, fetchCustomer, initialCustomer])

  const value: StoreContextType = {
    slug,
    customerId,
    storeId,
    customerName,
    isLoggedIn,
    loading,
    refetchCustomer: () => fetchCustomer(slug || '')
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

