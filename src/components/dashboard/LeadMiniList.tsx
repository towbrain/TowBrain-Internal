import { useNavigate } from 'react-router-dom'
import { formatRelative, formatDate } from '@/utils/dateHelpers'
import { useAuth } from '@/auth/useAuth'
import type { Lead } from '@/types/domain'

export function LeadMiniList({
  title,
  leads,
  emptyText,
  dateField = 'created_at',
}: {
  title: string
  leads: Lead[]
  emptyText: string
  dateField?: 'created_at' | 'updated_at' | 'follow_up_at'
}) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const formatValue = profile?.preferences.dateFormat === 'absolute' ? formatDate : formatRelative

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {leads.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {leads.map((lead) => (
            <li key={lead.id}>
              <button
                onClick={() => navigate('/leads')}
                className="flex w-full items-center justify-between gap-2 text-left text-sm hover:underline"
              >
                <span className="truncate text-foreground">{lead.client_name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatValue(lead[dateField])}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
