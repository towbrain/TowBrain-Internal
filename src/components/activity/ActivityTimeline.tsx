import { useActivity } from '@/hooks/useActivity'
import { useProfiles } from '@/hooks/useProfiles'
import { usePipelineStages } from '@/hooks/usePipelineStages'
import { describeActivity, actorName } from '@/components/activity/activityFormat'
import { formatDateTime } from '@/utils/dateHelpers'
import { Skeleton } from '@/components/ui/skeleton'

export function ActivityTimeline({ leadId }: { leadId: string }) {
  const { activity, loading } = useActivity(leadId)
  const { profilesById } = useProfiles()
  const { stagesByKey } = usePipelineStages()

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (activity.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
  }

  return (
    <ol className="space-y-3 border-l border-border pl-4">
      {activity.map((log) => (
        <li key={log.id} className="relative">
          <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" />
          <p className="text-sm text-foreground">{describeActivity(log, profilesById, stagesByKey)}</p>
          <p className="text-xs text-muted-foreground">
            {actorName(log.actor_id, profilesById)} · {formatDateTime(log.created_at)}
          </p>
        </li>
      ))}
    </ol>
  )
}
