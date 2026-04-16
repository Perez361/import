'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Detects Supabase auth tokens in the URL hash on any page and redirects
 * to the correct handler. This catches the case where Supabase sends tokens
 * to the site root (/) instead of the intended page.
 *
 * type=recovery → /reset-password (importer) or /store/[slug]/reset-password (customer)
 * type=signup   → /account/verified (importer) or /account/verified?store=[slug] (customer)
 */
export default function AuthHashRedirect() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) return

    const params = new URLSearchParams(hash)
    const type = params.get('type')
    if (!type) return

    // Already on a handler page — don't redirect
    const path = window.location.pathname
    if (
      path.includes('/reset-password') ||
      path.includes('/account/verified')
    ) return

    if (type === 'recovery') {
      // Decode the JWT to check if this is a customer token (has store_slug)
      const accessToken = params.get('access_token') ?? ''
      let storeSlug: string | null = null
      try {
        const b64 = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(b64))
        storeSlug = payload?.user_metadata?.store_slug ?? null
      } catch { /* malformed token, ignore */ }

      if (storeSlug) {
        window.location.replace(`/store/${storeSlug}/reset-password${window.location.hash}`)
      } else {
        window.location.replace(`/reset-password${window.location.hash}`)
      }
      return
    }

    if (type === 'signup') {
      const accessToken = params.get('access_token') ?? ''
      let storeSlug: string | null = null
      try {
        const b64 = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(b64))
        storeSlug = payload?.user_metadata?.store_slug ?? null
      } catch { /* ignore */ }

      const dest = storeSlug
        ? `/account/verified?store=${storeSlug}`
        : '/account/verified'
      window.location.replace(dest)
    }
  }, [])

  return null
}
