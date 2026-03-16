'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface UseInactivityTimeoutOptions {
  timeoutMs: number        // total inactivity time before logout
  warningMs: number        // how many ms before timeout to show warning
  onTimeout: () => void    // called when timeout fires
}

export function useInactivityTimeout({
  timeoutMs,
  warningMs,
  onTimeout,
}: UseInactivityTimeoutOptions) {
  const [showWarning, setShowWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const onTimeoutRef = useRef(onTimeout)

  // Keep ref in sync so we don't re-register listeners on every render
  useEffect(() => { onTimeoutRef.current = onTimeout }, [onTimeout])

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }, [])

  const startTimers = useCallback(() => {
    clearAllTimers()
    setShowWarning(false)

    // Warning timer
    warningRef.current = setTimeout(() => {
      const secs = Math.floor(warningMs / 1000)
      setShowWarning(true)
      setSecondsLeft(secs)
      countdownRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, timeoutMs - warningMs)

    // Logout timer
    timeoutRef.current = setTimeout(() => {
      clearAllTimers()
      setShowWarning(false)
      onTimeoutRef.current()
    }, timeoutMs)
  }, [timeoutMs, warningMs, clearAllTimers])

  const resetTimer = useCallback(() => {
    startTimers()
  }, [startTimers])

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click', 'wheel']

    // Throttle resets — only reset if at least 5s since last reset
    let lastReset = Date.now()
    const handleActivity = () => {
      const now = Date.now()
      if (now - lastReset > 5000) {
        lastReset = now
        resetTimer()
      }
    }

    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }))
    startTimers()

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity))
      clearAllTimers()
    }
  }, [startTimers, resetTimer, clearAllTimers])

  return { showWarning, secondsLeft, resetTimer }
}
