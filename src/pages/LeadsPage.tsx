import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Download } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LeadFilters } from '@/components/leads/LeadFilters'
import { LeadsTable } from '@/components/leads/LeadsTable'
import { LeadFormDialog } from '@/components/leads/LeadFormDialog'
import { useLeads, DEFAULT_LEAD_FILTERS, type LeadSort } from '@/hooks/useLeads'
import { useProfiles } from '@/hooks/useProfiles'
import { usePipelineStages } from '@/hooks/usePipelineStages'
import { useAuth } from '@/auth/useAuth'
import { leadsToCsv, downloadCsv } from '@/utils/csvExport'

export function LeadsPage() {
  const [searchParams] = useSearchParams()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [filters, setFilters] = useState({
    ...DEFAULT_LEAD_FILTERS,
    search: searchParams.get('search') ?? '',
    status: searchParams.get('status') ?? profile?.preferences.defaultStatusFilter ?? 'all',
    approvalStatus: (searchParams.get('approval') as typeof DEFAULT_LEAD_FILTERS.approvalStatus) ?? 'all',
    overdueOnly: searchParams.get('overdue') === '1',
    assignedTo: searchParams.get('assignee') ?? 'all',
  })
  const { leads, total, loading, refresh } = useLeads(filters)
  const { profiles, profilesById } = useProfiles()
  const { stages, activeStages, stagesByKey } = usePipelineStages()

  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize))

  function exportCsv() {
    const csv = leadsToCsv(leads, profilesById, stagesByKey)
    downloadCsv(`leads-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  const addLeadButton = useMemo(
    () => (
      <LeadFormDialog
        profiles={profiles}
        stages={activeStages}
        onSaved={refresh}
        trigger={
          <Button size="sm">
            <Plus className="size-4" /> Add Lead
          </Button>
        }
      />
    ),
    [profiles, activeStages, refresh],
  )

  return (
    <AppLayout title="Leads" actions={addLeadButton}>
      <div className="space-y-4">
        {isAdmin && (
          <Tabs value={filters.deletedOnly ? 'deleted' : 'active'}>
            <TabsList>
              <TabsTrigger value="active" onClick={() => setFilters({ ...filters, deletedOnly: false, page: 0 })}>
                Active
              </TabsTrigger>
              <TabsTrigger value="deleted" onClick={() => setFilters({ ...filters, deletedOnly: true, page: 0 })}>
                Deleted
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <LeadFilters filters={filters} onChange={setFilters} profiles={profiles} stages={stages} />
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm"
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value as LeadSort })}
            >
              <option value="created_desc">Newest first</option>
              <option value="created_asc">Oldest first</option>
              <option value="updated_desc">Recently updated</option>
              <option value="client_name">Client name</option>
              <option value="follow_up_asc">Upcoming follow-up</option>
              <option value="follow_up_overdue">Overdue follow-up</option>
            </select>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={leads.length === 0}>
              <Download className="size-3.5" /> Export CSV
            </Button>
          </div>
        </div>

        <LeadsTable
          leads={leads}
          loading={loading}
          profiles={profiles}
          stages={stages}
          sort={filters.sort}
          onSortChange={(sort) => setFilters({ ...filters, sort, page: 0 })}
          onChanged={refresh}
        />

        {total > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {total} lead{total === 1 ? '' : 's'} · page {filters.page + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page === 0}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page + 1 >= totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
