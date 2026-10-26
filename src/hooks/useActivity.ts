import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'
import type { ActivityLog } from '@/types/domain'

export function useActivity(leadId: string | null) {
  const [activity, setActivity] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!leadId) {
      setActivity([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setActivity(data ?? [])
    setLoading(false)
  }, [leadId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useRealtimeTable('activity_logs', refresh, leadId ? `lead_id=eq.${leadId}` : undefined, Boolean(leadId))

  return { activity, loading, error, refresh }
}

/** Most recent activity across all leads, for the dashboard feed. */
export function useRecentActivity(limit = 10) {
  const [activity, setActivity] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    setActivity(data ?? [])
    setLoading(false)
  }, [limit])

  useEffect(() => {
    refresh()
  }, [refresh])

  useRealtimeTable('activity_logs', refresh)

  return { activity, loading }
}
