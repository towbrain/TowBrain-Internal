import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { restoreLead } from '@/lib/leadsApi'
import { leadsToCsv, downloadCsv } from '@/utils/csvExport'
import { useAuth } from '@/auth/useAuth'
import { useProfiles } from '@/hooks/useProfiles'
import { usePipelineStages } from '@/hooks/usePipelineStages'
import { useLeads, DEFAULT_LEAD_FILTERS } from '@/hooks/useLeads'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/utils/dateHelpers'

function useRecordCounts() {
  const [counts, setCounts] = useState<{ active: number; deleted: number; notes: number; activity: number } | null>(
    null,
  )

  const refresh = useCallback(async () => {
    const [active, deleted, notes, activity] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('leads').select('*', { count: 'exact', head: true }).not('deleted_at', 'is', null),
      supabase.from('lead_notes').select('*', { count: 'exact', head: true }),
      supabase.from('activity_logs').select('*', { count: 'exact', head: true }),
    ])
    setCounts({
      active: active.count ?? 0,
      deleted: deleted.count ?? 0,
      notes: notes.count ?? 0,
      activity: activity.count ?? 0,
    })
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { counts, refresh }
}

export function DataManagementSettings() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const { profilesById } = useProfiles()
  const { stagesByKey } = usePipelineStages()
  const { counts, refresh: refreshCounts } = useRecordCounts()
  const { leads: deletedLeads, refresh: refreshDeleted } = useLeads({
    ...DEFAULT_LEAD_FILTERS,
    deletedOnly: true,
    pageSize: 100,
  })

  async function exportAll() {
    const { data, error } = await supabase.from('leads').select('*').is('deleted_at', null)
    if (error || !data) {
      toast.error(error?.message ?? 'Export failed')
      return
    }
    downloadCsv(`leads-export-${new Date().toISOString().slice(0, 10)}.csv`, leadsToCsv(data, profilesById, stagesByKey))
  }

  async function handleRestore(id: string) {
    const { error } = await restoreLead(id)
    if (error) toast.error(error.message)
    else {
      toast.success('Lead restored')
      refreshDeleted()
      refreshCounts()
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Record counts</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {counts &&
            Object.entries({
              'Active leads': counts.active,
              'Deleted leads': counts.deleted,
              Notes: counts.notes,
              'Activity events': counts.activity,
            }).map(([label, value]) => (
              <div key={label} className="rounded-md border border-border p-3">
                <p className="text-xl font-semibold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Export</h3>
        <Button variant="outline" onClick={exportAll}>
          <Download className="size-4" /> Export all active leads to CSV
        </Button>
      </div>

      {isAdmin && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Deleted leads</h3>
          {deletedLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing in the deleted-leads list.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {deletedLeads.map((lead) => (
                <li key={lead.id} className="flex items-center justify-between gap-2 p-2.5 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{lead.client_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Deleted {formatDateTime(lead.deleted_at)}
                      {lead.deleted_by && ` by ${profilesById.get(lead.deleted_by)?.full_name ?? 'Unknown'}`}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleRestore(lead.id)}>
                    Restore
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
