import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { KanbanCard } from '@/components/kanban/KanbanCard'
import type { Lead, PipelineStage, Profile } from '@/types/domain'

export function KanbanColumn({
  stage,
  leads,
  profilesById,
  onChanged,
}: {
  stage: PipelineStage
  leads: Lead[]
  profilesById: Map<string, Profile>
  onChanged: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key })

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-md bg-muted/40">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: stage.color }} />
          <h3 className="text-sm font-semibold text-foreground">{stage.label}</h3>
        </div>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-2 overflow-y-auto px-2 pb-3 transition-colors',
          isOver && 'bg-primary/5 ring-1 ring-inset ring-primary/30',
        )}
      >
        {leads.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">No leads in this stage.</p>
        )}
        {leads.map((lead) => (
          <KanbanCard
            key={lead.id}
            lead={lead}
            assignee={lead.assigned_to ? profilesById.get(lead.assigned_to) ?? null : null}
            onChanged={onChanged}
          />
        ))}
      </div>
    </div>
  )
}
