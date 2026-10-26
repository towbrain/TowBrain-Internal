import { Plus } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { LeadMiniList } from '@/components/dashboard/LeadMiniList'
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed'
import { StageBreakdown, AssigneeBreakdown } from '@/components/dashboard/StageBreakdown'
import { LeadFormDialog } from '@/components/leads/LeadFormDialog'
import { useDashboard } from '@/hooks/useDashboard'
import { useProfiles } from '@/hooks/useProfiles'
import { usePipelineStages } from '@/hooks/usePipelineStages'

export function OverviewPage() {
  const { stats, recentlyAdded, recentlyUpdated, upcomingFollowUps, byStage, byAssignee, loading, refresh } =
    useDashboard()
  const { profiles } = useProfiles()
  const { activeStages } = usePipelineStages()

  const addLeadButton = (
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
  )

  if (loading || !stats) {
    return (
      <AppLayout title="Overview" actions={addLeadButton}>
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      </AppLayout>
    )
  }

  if (stats.totalActive === 0) {
    return (
      <AppLayout title="Overview" actions={addLeadButton}>
        <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-lg font-medium text-foreground">No leads yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add your first lead to start tracking it through your pipeline, from first contact to onboarding.
          </p>
          {addLeadButton}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Overview" actions={addLeadButton}>
      <div className="space-y-6">
        <SummaryCards stats={stats} />

        <div className="grid gap-4 lg:grid-cols-2">
          <LeadMiniList title="Upcoming follow-ups" leads={upcomingFollowUps} emptyText="No follow-ups scheduled." dateField="follow_up_at" />
          <RecentActivityFeed />
          <LeadMiniList title="Recently added leads" leads={recentlyAdded} emptyText="No leads yet." dateField="created_at" />
          <LeadMiniList title="Recently updated leads" leads={recentlyUpdated} emptyText="No updates yet." dateField="updated_at" />
          <StageBreakdown stages={activeStages} counts={byStage} />
          {profiles.length > 0 && <AssigneeBreakdown profiles={profiles} counts={byAssignee} />}
        </div>
      </div>
    </AppLayout>
  )
}
