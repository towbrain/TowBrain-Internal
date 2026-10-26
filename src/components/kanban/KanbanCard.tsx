import { useDraggable } from '@dnd-kit/core'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/dateHelpers'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { LeadDetailDialog } from '@/components/leads/LeadDetailDialog'
import { APPROVAL_STATUS_LABELS, type Lead, type Profile } from '@/types/domain'

export function KanbanCard({
  lead,
  assignee,
  onChanged,
}: {
  lead: Lead
  assignee: Profile | null
  onChanged: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id })
  const overdue = lead.follow_up_at && new Date(lead.follow_up_at) < new Date()

  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={cn(
        'rounded-md border border-border bg-card p-3 shadow-sm',
        isDragging && 'z-10 opacity-60 shadow-lg',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <LeadDetailDialog
          lead={lead}
          onChanged={onChanged}
          trigger={
            <button className="text-left text-sm font-medium text-foreground hover:underline">
              {lead.client_name}
            </button>
          }
        />
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded-sm p-0.5 text-muted-foreground hover:bg-accent active:cursor-grabbing"
          aria-label={`Drag ${lead.client_name}`}
        >
          ⠿
        </button>
      </div>
      {lead.company_name && <p className="text-xs text-muted-foreground">{lead.company_name}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="text-[10px]">
          {APPROVAL_STATUS_LABELS[lead.approval_status]}
        </Badge>
        {lead.follow_up_at && (
          <span className={cn('flex items-center gap-1 text-[10px]', overdue ? 'text-destructive' : 'text-muted-foreground')}>
            <Calendar className="size-3" /> {formatDate(lead.follow_up_at)}
          </span>
        )}
      </div>
      {assignee && (
        <div className="mt-2 flex items-center gap-1.5">
          <Avatar name={assignee.full_name} src={assignee.avatar_url} className="size-5 text-[10px]" />
          <span className="text-xs text-muted-foreground">{assignee.full_name}</span>
        </div>
      )}
    </div>
  )
}
