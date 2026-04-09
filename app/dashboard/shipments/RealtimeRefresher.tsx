'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RealtimeRefresher({ importerId }: { importerId: string }) {
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
        // Refresh the page to show updated shipments
        window.location.reload()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [importerId])

  return null // This component doesn't render anything
}