'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface UseSessionReturn {
  user: any | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

export function useSession(): UseSessionReturn {
  const [user, setUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Error fetching user:', error)
        setUser(null)
      } else {
        setUser(user)
      }
    } catch (error) {
      console.error('Session fetch error:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        toast.error('Failed to sign out')
        console.error('Sign out error:', error)
      } else {
        setUser(null)
        toast.success('Signed out successfully')
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Session refresh error:', error)
        toast.error('Session expired. Please sign in again.')
        setUser(null)
      } else if (session?.user) {
        setUser(session.user)
      }
    } catch (error) {
      console.error('Session refresh error:', error)
    }
  }, [])

  useEffect(() => {
    // Initial session fetch
    fetchUser()

    // Set up auth state listener
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        switch (event) {
          case 'INITIAL_SESSION':
            // Handle initial session
            if (session?.user) {
              setUser(session.user)
            }
            setIsLoading(false)
            break
            
          case 'SIGNED_IN':
            // User signed in
            if (session?.user) {
              setUser(session.user)
              toast.success('Welcome back!')
            }
            break
            
          case 'SIGNED_OUT':
            // User signed out
            setUser(null)
            break
            
          case 'TOKEN_REFRESHED':
            // Token was refreshed successfully
            if (session?.user) {
              setUser(session.user)
            }
            break
            
          case 'USER_UPDATED':
            // User data was updated
            if (session?.user) {
              setUser(session.user)
            }
            break
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUser])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    refreshSession
  }
}

// Session timeout hook - warns user before session expires
export function useSessionTimeout(timeoutMinutes: number = 30) {
  const [showWarning, setShowWarning] = useState(false)
  const [remainingTime, setRemainingTime] = useState(0)
  const { user, refreshSession, signOut } = useSession()

  useEffect(() => {
    if (!user) {
      setShowWarning(false)
      return
    }

    let warningTimeout: NodeJS.Timeout
    let countdownInterval: NodeJS.Timeout

    // Set timeout to show warning
    warningTimeout = setTimeout(() => {
      setShowWarning(true)
      
      // Start countdown
      const warningDuration = 60 // 1 minute warning duration
      setRemainingTime(warningDuration)
      
      countdownInterval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            // Auto sign out when time runs out
            signOut()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, (timeoutMinutes - 1) * 60 * 1000) // Show warning 1 minute before timeout

    return () => {
      clearTimeout(warningTimeout)
      clearInterval(countdownInterval)
    }
  }, [user, timeoutMinutes, signOut])

  const extendSession = useCallback(async () => {
    await refreshSession()
    setShowWarning(false)
    setRemainingTime(0)
  }, [refreshSession])

  return {
    showWarning,
    remainingTime,
    extendSession,
    signOut
  }
}
