import { useNavigate } from 'react-router-dom'
import type { PipelineStage, Profile } from '@/types/domain'

export function StageBreakdown({ stages, counts }: { stages: PipelineStage[]; counts: Record<string, number> }) {
  const navigate = useNavigate()
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Leads by stage</h3>
      <ul className="space-y-2">
        {stages.map((stage) => (
          <li key={stage.key}>
            <button
              onClick={() => navigate(`/leads?status=${stage.key}`)}
              className="flex w-full items-center justify-between gap-2 text-sm hover:underline"
            >
              <span className="flex items-center gap-2 text-foreground">
                <span className="size-2 rounded-full" style={{ backgroundColor: stage.color }} />
                {stage.label}
              </span>
              <span className="text-muted-foreground">{counts[stage.key] ?? 0}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AssigneeBreakdown({ profiles, counts }: { profiles: Profile[]; counts: Record<string, number> }) {
  const navigate = useNavigate()
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Leads by team member</h3>
      <ul className="space-y-2">
        {profiles.map((profile) => (
          <li key={profile.id}>
            <button
              onClick={() => navigate(`/leads?assignee=${profile.id}`)}
              className="flex w-full items-center justify-between gap-2 text-sm hover:underline"
            >
              <span className="text-foreground">{profile.full_name}</span>
              <span className="text-muted-foreground">{counts[profile.id] ?? 0}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
