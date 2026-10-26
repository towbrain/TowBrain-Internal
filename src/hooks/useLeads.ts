import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'
import type { ApprovalStatus, Lead } from '@/types/domain'

export type LeadSort =
  | 'created_desc'
  | 'created_asc'
  | 'updated_desc'
  | 'client_name'
  | 'follow_up_asc'
  | 'follow_up_overdue'

export interface LeadFilters {
  search: string
  status: string | 'all'
  approvalStatus: ApprovalStatus | 'all'
  assignedTo: string | 'all' | 'unassigned'
  source: string | 'all'
  overdueOnly: boolean
  sort: LeadSort
  page: number
  pageSize: number
  /** When true, lists soft-deleted leads instead of active ones (admin deleted-leads view). */
  deletedOnly?: boolean
}

export const DEFAULT_LEAD_FILTERS: LeadFilters = {
  search: '',
  status: 'all',
  approvalStatus: 'all',
  assignedTo: 'all',
  source: 'all',
  overdueOnly: false,
  sort: 'created_desc',
  page: 0,
  pageSize: 25,
}

export function useLeads(filters: LeadFilters) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('leads').select('*', { count: 'exact' })

    query = filters.deletedOnly ? query.not('deleted_at', 'is', null) : query.is('deleted_at', null)

    if (filters.search.trim()) {
      const term = filters.search.trim().replace(/[%,]/g, '')
      query = query.or(
        `client_name.ilike.%${term}%,company_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
      )
    }
    if (filters.status !== 'all') query = query.eq('status', filters.status)
    if (filters.approvalStatus !== 'all') query = query.eq('approval_status', filters.approvalStatus)
    if (filters.assignedTo === 'unassigned') query = query.is('assigned_to', null)
    else if (filters.assignedTo !== 'all') query = query.eq('assigned_to', filters.assignedTo)
    if (filters.source !== 'all') query = query.eq('source', filters.source)
    if (filters.overdueOnly || filters.sort === 'follow_up_overdue') {
      query = query.lt('follow_up_at', new Date().toISOString())
    }

    switch (filters.sort) {
      case 'created_asc':
        query = query.order('created_at', { ascending: true })
        break
      case 'updated_desc':
        query = query.order('updated_at', { ascending: false })
        break
      case 'client_name':
        query = query.order('client_name', { ascending: true })
        break
      case 'follow_up_asc':
        query = query.order('follow_up_at', { ascending: true, nullsFirst: false })
        break
      case 'follow_up_overdue':
        query = query.order('follow_up_at', { ascending: true })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    const from = filters.page * filters.pageSize
    query = query.range(from, from + filters.pageSize - 1)

    const { data, error, count } = await query
    if (error) setError(error.message)
    else {
      setLeads(data ?? [])
      setTotal(count ?? 0)
      setError(null)
    }
    setLoading(false)
  }, [filters])

  useEffect(() => {
    refresh()
  }, [refresh])

  useRealtimeTable('leads', refresh)

  return { leads, total, loading, error, refresh }
}
