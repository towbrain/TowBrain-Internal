import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'
import type { LeadNote } from '@/types/domain'

export function useLeadNotes(leadId: string | null) {
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!leadId) {
      setNotes([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('lead_notes')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setNotes(data ?? [])
    setLoading(false)
  }, [leadId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useRealtimeTable('lead_notes', refresh, leadId ? `lead_id=eq.${leadId}` : undefined, Boolean(leadId))

  return { notes, loading, error, refresh }
}
