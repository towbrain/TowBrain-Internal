import { useState } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { toast } from 'sonner'
import { KanbanColumn } from '@/components/kanban/KanbanColumn'
import { updateLeadStatus } from '@/lib/leadsApi'
import type { Lead, PipelineStage, Profile } from '@/types/domain'

export function KanbanBoard({
  leads,
  stages,
  profiles,
  onChanged,
}: {
  leads: Lead[]
  stages: PipelineStage[]
  profiles: Profile[]
  onChanged: () => void
}) {
  const [movingId, setMovingId] = useState<string | null>(null)
  const profilesById = new Map(profiles.map((p) => [p.id, p]))
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const lead = leads.find((l) => l.id === active.id)
    const destinationStage = stages.find((s) => s.key === over.id)
    if (!lead || !destinationStage || !destinationStage.is_active) return
    if (lead.status === destinationStage.key) return

    setMovingId(lead.id)
    const result = await updateLeadStatus(lead.id, destinationStage.key, lead.updated_at)
    setMovingId(null)

    if (!result.ok) {
      if (result.conflict) {
        toast.error('This lead changed elsewhere. Refreshing to show the latest state.')
      } else {
        toast.error(result.error)
      }
    }
    onChanged()
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {stages
          .filter((s) => s.is_active)
          .map((stage) => (
            <KanbanColumn
              key={stage.key}
              stage={stage}
              leads={leads.filter((l) => l.status === stage.key)}
              profilesById={profilesById}
              onChanged={onChanged}
            />
          ))}
      </div>
      {movingId && <p className="mt-2 text-xs text-muted-foreground">Saving move…</p>}
    </DndContext>
  )
}
