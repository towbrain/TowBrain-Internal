import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Subscribes to postgres_changes for one table and calls `onChange` for every event.
 * One channel per (table, filter) pair; torn down on unmount or when filter changes.
 * Callers refetch authoritative data on each event rather than trusting the payload,
 * since Realtime does not guarantee exactly-once delivery across reconnects.
 */
export function useRealtimeTable(table: string, onChange: () => void, filter?: string, enabled = true) {
  const callbackRef = useRef(onChange)
  callbackRef.current = onChange

  useEffect(() => {
    if (!enabled) return
    const channel = supabase
      .channel(`realtime:${table}:${filter ?? 'all'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) },
        () => callbackRef.current(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter, enabled])
}
