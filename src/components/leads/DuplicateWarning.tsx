import { AlertTriangle } from 'lucide-react'
import type { Lead } from '@/types/domain'

export function DuplicateWarning({ matches }: { matches: Lead[] }) {
  if (matches.length === 0) return null
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-medium">Possible duplicate contact</p>
        <ul className="mt-1 space-y-0.5">
          {matches.map((lead) => (
            <li key={lead.id}>
              {lead.client_name}
              {lead.company_name ? ` — ${lead.company_name}` : ''}
            </li>
          ))}
        </ul>
        <p className="mt-1 text-xs opacity-80">You can still save; review the existing record first.</p>
      </div>
    </div>
  )
}
