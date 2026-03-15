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
      // Use getUser() for secure server-validated session check
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
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
        .eq('user_id', user.id)
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

  // Listen for auth changes - sync with server-side initialCustomer
  useEffect(() => {
    const supabase = createClient()
    
    // Function to handle session changes
    const handleAuthChange = async (event: string, session: any) => {
      switch (event) {
        case 'INITIAL_SESSION':
          // On initial load, check if we need to fetch customer
          if (session?.user) {
            // If server didn't provide initialCustomer, fetch it client-side
            if (!initialCustomer && slug) {
              await fetchCustomer(slug)
            }
            // If server provided initialCustomer but we have no customerId yet,
            // we might need to re-validate (handles edge cases)
            else if (initialCustomer && slug && !customerId) {
              await fetchCustomer(slug)
            }
          }
          break
          
        case 'SIGNED_IN':
          // New sign in - fetch customer data
          if (session?.user && slug) {
            await fetchCustomer(slug)
          }
          break
        
        case 'SIGNED_OUT':
          // Clear all state on sign out
          setIsLoggedIn(false)
          setCustomerName('')
          setCustomerId(null)
          setStoreId(null)
          break
          
        case 'TOKEN_REFRESHED':
          // Token refreshed - if we have a user, ensure customer data is current
          if (session?.user && slug) {
            await fetchCustomer(slug)
          }
          break
      }
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange)

    return () => subscription.unsubscribe()
  }, [slug, fetchCustomer, initialCustomer, customerId])

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

