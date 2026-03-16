'use client'

import { useCallback } from 'react'
import { useStore } from '@/components/store/StoreContext'
import { createCustomerClient } from '@/lib/supabase/customer-client'
import { useInactivityTimeout } from '@/lib/hooks/useInactivityTimeout'
import InactivityWarning from '@/components/InactivityWarning'
import { toast } from 'sonner'

const TIMEOUT_MS = 15 * 60 * 1000  // 15 minutes
const WARNING_MS = 2 * 60 * 1000   // warn 2 min before

export default function CustomerInactivityGuard({
  slug,
  children,
}: {
  slug: string
  children: React.ReactNode
}) {
  const store = useStore()

  const handleTimeout = useCallback(async () => {
    if (!store.isLoggedIn) return
    try {
      const supabase = createCustomerClient(slug)
      await supabase.auth.signOut()
      toast.error('You were signed out due to inactivity.')
      window.location.href = `/store/${slug}`
    } catch (e) {
      console.error('Auto-logout error:', e)
    }
  }, [slug, store.isLoggedIn])

  const { showWarning, secondsLeft, resetTimer } = useInactivityTimeout({
    timeoutMs: TIMEOUT_MS,
    warningMs: WARNING_MS,
    onTimeout: handleTimeout,
  })

  const shouldWarn = showWarning && store.isLoggedIn

  return (
    <>
      {children}
      {shouldWarn && (
        <InactivityWarning
          secondsLeft={secondsLeft}
          onStayLoggedIn={resetTimer}
          onLogout={handleTimeout}
        />
      )}
    </>
  )
}