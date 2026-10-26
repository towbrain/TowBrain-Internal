import { useNavigate } from 'react-router-dom'
import { useRecentActivity } from '@/hooks/useActivity'
import { useProfiles } from '@/hooks/useProfiles'
import { usePipelineStages } from '@/hooks/usePipelineStages'
import { describeActivity } from '@/components/activity/activityFormat'
import { formatRelative } from '@/utils/dateHelpers'

export function RecentActivityFeed() {
  const { activity, loading } = useRecentActivity(8)
  const { profilesById } = useProfiles()
  const { stagesByKey } = usePipelineStages()
  const navigate = useNavigate()

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Recent activity</h3>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : activity.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing has happened yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {activity.map((log) => (
            <li key={log.id}>
              <button onClick={() => navigate('/leads')} className="block w-full text-left text-sm hover:underline">
                {describeActivity(log, profilesById, stagesByKey)}
              </button>
              <p className="text-xs text-muted-foreground">{formatRelative(log.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
