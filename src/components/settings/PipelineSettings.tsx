import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowUp, ArrowDown, Plus } from 'lucide-react'
import { usePipelineStages } from '@/hooks/usePipelineStages'
import { createPipelineStage, updatePipelineStage } from '@/lib/settingsApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

function slugify(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function PipelineSettings() {
  const { stages, loading, refresh } = usePipelineStages()
  const [newLabel, setNewLabel] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd() {
    const label = newLabel.trim()
    if (!label) return
    const key = slugify(label)
    if (stages.some((s) => s.key === key)) {
      toast.error('A stage with a similar name already exists')
      return
    }
    setAdding(true)
    const { error } = await createPipelineStage({
      key,
      label,
      color: '#64748b',
      sort_order: (stages.at(-1)?.sort_order ?? 0) + 1,
    })
    setAdding(false)
    if (error) toast.error(error.message)
    else {
      setNewLabel('')
      refresh()
    }
  }

  async function handleRename(key: string, label: string) {
    const { error } = await updatePipelineStage(key, { label })
    if (error) toast.error(error.message)
    else refresh()
  }

  async function handleColor(key: string, color: string) {
    const { error } = await updatePipelineStage(key, { color })
    if (error) toast.error(error.message)
    else refresh()
  }

  async function handleToggleActive(key: string, isActive: boolean) {
    const { error } = await updatePipelineStage(key, { is_active: !isActive })
    if (error) toast.error(error.message)
    else refresh()
  }

  async function handleReorder(index: number, direction: -1 | 1) {
    const target = stages[index + direction]
    if (!target) return
    const current = stages[index]
    await Promise.all([
      updatePipelineStage(current.key, { sort_order: target.sort_order }),
      updatePipelineStage(target.key, { sort_order: current.sort_order }),
    ])
    refresh()
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading stages…</p>

  return (
    <div className="max-w-xl space-y-4">
      <ul className="divide-y divide-border rounded-md border border-border">
        {stages.map((stage, index) => (
          <li key={stage.key} className="flex items-center gap-2 p-2.5">
            <div className="flex flex-col">
              <button
                disabled={index === 0}
                onClick={() => handleReorder(index, -1)}
                className="rounded-sm p-0.5 text-muted-foreground hover:bg-accent disabled:opacity-30"
                aria-label={`Move ${stage.label} up`}
              >
                <ArrowUp className="size-3.5" />
              </button>
              <button
                disabled={index === stages.length - 1}
                onClick={() => handleReorder(index, 1)}
                className="rounded-sm p-0.5 text-muted-foreground hover:bg-accent disabled:opacity-30"
                aria-label={`Move ${stage.label} down`}
              >
                <ArrowDown className="size-3.5" />
              </button>
            </div>
            <input
              type="color"
              value={stage.color}
              onChange={(e) => handleColor(stage.key, e.target.value)}
              className="size-7 shrink-0 cursor-pointer rounded border border-border"
              aria-label={`Color for ${stage.label}`}
            />
            <Input
              defaultValue={stage.label}
              onBlur={(e) => e.target.value.trim() && e.target.value !== stage.label && handleRename(stage.key, e.target.value.trim())}
              className="flex-1"
            />
            {!stage.is_active && <Badge variant="secondary">Inactive</Badge>}
            <Button size="sm" variant="outline" onClick={() => handleToggleActive(stage.key, stage.is_active)}>
              {stage.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="New stage name"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={adding || !newLabel.trim()}>
          <Plus className="size-4" /> Add stage
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Deactivating a stage hides it from the board without deleting its leads. A stage with leads in it can't be
        removed from the database — reassign those leads to another stage first if you need it fully gone.
      </p>
    </div>
  )
}
