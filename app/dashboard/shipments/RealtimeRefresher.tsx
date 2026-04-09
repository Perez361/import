'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RealtimeRefresher({ importerId }: { importerId: string }) {
  const router = useRouter()

  useEffect(() => {
    if (!importerId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`shipments-${importerId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shipment_batches',
        filter: `importer_id=eq.${importerId}`,
      }, () => {
        // Use Next.js router refresh instead of window.location.reload()
        // This re-fetches server data without a full page reload
        router.refresh()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [importerId, router])

  return null
}