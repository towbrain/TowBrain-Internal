import { useNavigate } from 'react-router-dom'
import type { DashboardStats } from '@/hooks/useDashboard'

const CARDS: { key: keyof DashboardStats; label: string; query: string }[] = [
  { key: 'totalActive', label: 'Total active leads', query: '' },
  { key: 'newLeads', label: 'New leads', query: 'status=new' },
  { key: 'contacted', label: 'Leads contacted', query: 'status=contacted' },
  { key: 'requiringFollowUp', label: 'Requiring follow-up', query: 'overdue=1' },
  { key: 'awaitingDecision', label: 'Awaiting decision', query: 'approval=pending' },
  { key: 'approved', label: 'Approved', query: 'approval=approved' },
  { key: 'onboarded', label: 'Onboarded', query: 'status=onboarded' },
  { key: 'rejectedOrLost', label: 'Rejected / Lost', query: 'status=rejected' },
]

export function SummaryCards({ stats }: { stats: DashboardStats }) {
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {CARDS.map(({ key, label, query }) => (
        <button
          key={key}
          onClick={() => navigate(query ? `/leads?${query}` : '/leads')}
          className="rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent/50"
        >
          <p className="text-2xl font-semibold text-foreground">{stats[key]}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </button>
      ))}
    </div>
  )
}
