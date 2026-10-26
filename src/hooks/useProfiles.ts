import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'
import type { Profile } from '@/types/domain'

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('full_name')
    if (error) setError(error.message)
    else setProfiles(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useRealtimeTable('profiles', refresh)

  const profilesById = new Map(profiles.map((p) => [p.id, p]))

  return { profiles, profilesById, loading, error, refresh }
}
