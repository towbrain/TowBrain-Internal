import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'
import type { PipelineStage } from '@/types/domain'

export function usePipelineStages() {
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from('pipeline_stages').select('*').order('sort_order')
    if (error) setError(error.message)
    else setStages(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useRealtimeTable('pipeline_stages', refresh)

  const stagesByKey = new Map(stages.map((s) => [s.key, s]))
  const activeStages = stages.filter((s) => s.is_active)

  return { stages, activeStages, stagesByKey, loading, error, refresh }
}
