import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { LeadFormDialog } from '@/components/leads/LeadFormDialog'
import { useLeads, DEFAULT_LEAD_FILTERS } from '@/hooks/useLeads'
import { useProfiles } from '@/hooks/useProfiles'
import { usePipelineStages } from '@/hooks/usePipelineStages'
import { APPROVAL_STATUS_LABELS, LEAD_SOURCES } from '@/types/domain'

const selectClass = 'h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm'

export function PipelinePage() {
  const [filters, setFilters] = useState({ ...DEFAULT_LEAD_FILTERS, pageSize: 500 })
  const { leads, loading, refresh } = useLeads(filters)
  const { profiles } = useProfiles()
  const { activeStages, loading: stagesLoading } = usePipelineStages()

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
    <AppLayout title="Pipeline" actions={addLeadButton}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search…"
            className="w-56"
            aria-label="Search leads"
          />
          <select
            className={selectClass}
            value={filters.assignedTo}
            onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
          >
            <option value="all">Everyone</option>
            <option value="unassigned">Unassigned</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
          >
            <option value="all">All sources</option>
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={filters.approvalStatus}
            onChange={(e) => setFilters({ ...filters, approvalStatus: e.target.value as typeof filters.approvalStatus })}
          >
            <option value="all">All approval statuses</option>
            {Object.entries(APPROVAL_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-foreground">
            <input
              type="checkbox"
              checked={filters.overdueOnly}
              onChange={(e) => setFilters({ ...filters, overdueOnly: e.target.checked })}
            />
            Overdue only
          </label>
        </div>

        {loading || stagesLoading ? (
          <p className="text-sm text-muted-foreground">Loading board…</p>
        ) : activeStages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pipeline stages configured yet.</p>
        ) : (
          <KanbanBoard leads={leads} stages={activeStages} profiles={profiles} onChanged={refresh} />
        )}
      </div>
    </AppLayout>
  )
}
