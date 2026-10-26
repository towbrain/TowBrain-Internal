import { ArrowUpDown, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { LeadDetailDialog } from '@/components/leads/LeadDetailDialog'
import { LeadFormDialog } from '@/components/leads/LeadFormDialog'
import { DeleteLeadDialog } from '@/components/leads/DeleteLeadDialog'
import { formatDate } from '@/utils/dateHelpers'
import { APPROVAL_STATUS_LABELS, type Lead, type Profile, type PipelineStage } from '@/types/domain'
import type { LeadSort } from '@/hooks/useLeads'
import { cn } from '@/lib/utils'

const COLUMNS: { key: LeadSort | null; label: string }[] = [
  { key: 'client_name', label: 'Client' },
  { key: null, label: 'Company' },
  { key: null, label: 'Stage' },
  { key: null, label: 'Approval' },
  { key: null, label: 'Assigned' },
  { key: 'follow_up_asc', label: 'Follow-up' },
  { key: 'created_desc', label: 'Created' },
  { key: null, label: '' },
]

export function LeadsTable({
  leads,
  loading,
  profiles,
  stages,
  sort,
  onSortChange,
  onChanged,
}: {
  leads: Lead[]
  loading: boolean
  profiles: Profile[]
  stages: PipelineStage[]
  sort: LeadSort
  onSortChange: (sort: LeadSort) => void
  onChanged: () => void
}) {
  const profilesById = new Map(profiles.map((p) => [p.id, p]))
  const stagesByKey = new Map(stages.map((s) => [s.key, s]))

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        No leads match these filters.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-muted/50 text-left text-xs font-medium text-muted-foreground">
          <tr>
            {COLUMNS.map((col) => (
              <th key={col.label} className="px-3 py-2">
                {col.key ? (
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => onSortChange(col.key!)}
                  >
                    {col.label}
                    <ArrowUpDown className={cn('size-3', sort === col.key && 'text-foreground')} />
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {leads.map((lead) => {
            const stage = stagesByKey.get(lead.status)
            const overdue = lead.follow_up_at && new Date(lead.follow_up_at) < new Date()
            return (
              <tr key={lead.id} className="hover:bg-accent/50">
                <td className="px-3 py-2">
                  <LeadDetailDialog
                    lead={lead}
                    onChanged={onChanged}
                    trigger={<button className="font-medium text-foreground hover:underline">{lead.client_name}</button>}
                  />
                </td>
                <td className="px-3 py-2 text-muted-foreground">{lead.company_name ?? '—'}</td>
                <td className="px-3 py-2">
                  <Badge style={{ backgroundColor: stage?.color, color: 'white', border: 'none' }}>
                    {stage?.label ?? lead.status}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{APPROVAL_STATUS_LABELS[lead.approval_status]}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {lead.assigned_to ? profilesById.get(lead.assigned_to)?.full_name ?? 'Unknown' : '—'}
                </td>
                <td className={cn('px-3 py-2', overdue ? 'font-medium text-destructive' : 'text-muted-foreground')}>
                  {formatDate(lead.follow_up_at)}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{formatDate(lead.created_at)}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <LeadFormDialog
                      lead={lead}
                      profiles={profiles}
                      stages={stages}
                      onSaved={onChanged}
                      trigger={
                        <Button size="icon" variant="ghost" aria-label={`Edit ${lead.client_name}`}>
                          <Pencil className="size-3.5" />
                        </Button>
                      }
                    />
                    <DeleteLeadDialog
                      lead={lead}
                      onDeleted={onChanged}
                      trigger={
                        <Button size="icon" variant="ghost" aria-label={`Delete ${lead.client_name}`}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      }
                    />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
