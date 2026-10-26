import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'
import type { Lead } from '@/types/domain'

export interface DashboardStats {
  totalActive: number
  newLeads: number
  contacted: number
  requiringFollowUp: number
  awaitingDecision: number
  approved: number
  onboarded: number
  rejectedOrLost: number
}

async function getCount(query: PromiseLike<{ count: number | null }>) {
  const { count } = await query
  return count ?? 0
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentlyAdded, setRecentlyAdded] = useState<Lead[]>([])
  const [recentlyUpdated, setRecentlyUpdated] = useState<Lead[]>([])
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<Lead[]>([])
  const [byStage, setByStage] = useState<Record<string, number>>({})
  const [byAssignee, setByAssignee] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const now = new Date().toISOString()
    const [
      totalActive,
      newLeads,
      contacted,
      requiringFollowUp,
      awaitingDecision,
      approved,
      onboarded,
      rejectedOrLost,
      addedRes,
      updatedRes,
      followUpRes,
      groupingRes,
    ] = await Promise.all([
      getCount(supabase.from('leads').select('*', { count: 'exact', head: true }).is('deleted_at', null)),
      getCount(
        supabase.from('leads').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'new'),
      ),
      getCount(
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null)
          .eq('status', 'contacted'),
      ),
      getCount(
        supabase.from('leads').select('*', { count: 'exact', head: true }).is('deleted_at', null).lt('follow_up_at', now),
      ),
      getCount(
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null)
          .eq('approval_status', 'pending'),
      ),
      getCount(
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null)
          .eq('approval_status', 'approved'),
      ),
      getCount(
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null)
          .eq('status', 'onboarded'),
      ),
      getCount(
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null)
          .in('status', ['rejected', 'lost']),
      ),
      supabase.from('leads').select('*').is('deleted_at', null).order('created_at', { ascending: false }).limit(5),
      supabase.from('leads').select('*').is('deleted_at', null).order('updated_at', { ascending: false }).limit(5),
      supabase
        .from('leads')
        .select('*')
        .is('deleted_at', null)
        .not('follow_up_at', 'is', null)
        .order('follow_up_at', { ascending: true })
        .limit(5),
      supabase.from('leads').select('status, assigned_to').is('deleted_at', null),
    ])

    setStats({
      totalActive,
      newLeads,
      contacted,
      requiringFollowUp,
      awaitingDecision,
      approved,
      onboarded,
      rejectedOrLost,
    })
    setRecentlyAdded(addedRes.data ?? [])
    setRecentlyUpdated(updatedRes.data ?? [])
    setUpcomingFollowUps(followUpRes.data ?? [])

    const stageCounts: Record<string, number> = {}
    const assigneeCounts: Record<string, number> = {}
    for (const row of groupingRes.data ?? []) {
      stageCounts[row.status] = (stageCounts[row.status] ?? 0) + 1
      if (row.assigned_to) assigneeCounts[row.assigned_to] = (assigneeCounts[row.assigned_to] ?? 0) + 1
    }
    setByStage(stageCounts)
    setByAssignee(assigneeCounts)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useRealtimeTable('leads', refresh)

  return { stats, recentlyAdded, recentlyUpdated, upcomingFollowUps, byStage, byAssignee, loading, refresh }
}
