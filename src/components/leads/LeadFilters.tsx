import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { APPROVAL_STATUS_LABELS, LEAD_SOURCES, type Profile, type PipelineStage } from '@/types/domain'
import { DEFAULT_LEAD_FILTERS, type LeadFilters as LeadFiltersState } from '@/hooks/useLeads'

const selectClass = 'h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm'

export function LeadFilters({
  filters,
  onChange,
  profiles,
  stages,
}: {
  filters: LeadFiltersState
  onChange: (filters: LeadFiltersState) => void
  profiles: Profile[]
  stages: PipelineStage[]
}) {
  const [searchInput, setSearchInput] = useState(filters.search)

  useEffect(() => setSearchInput(filters.search), [filters.search])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== filters.search) onChange({ ...filters, search: searchInput, page: 0 })
    }, 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const isDefault =
    filters.search === '' &&
    filters.status === 'all' &&
    filters.approvalStatus === 'all' &&
    filters.assignedTo === 'all' &&
    filters.source === 'all' &&
    !filters.overdueOnly

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search client, company, email, phone…"
        className="w-full sm:w-64"
        aria-label="Search leads"
      />

      <select
        className={selectClass}
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value, page: 0 })}
      >
        <option value="all">All stages</option>
        {stages.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={filters.approvalStatus}
        onChange={(e) => onChange({ ...filters, approvalStatus: e.target.value as LeadFiltersState['approvalStatus'], page: 0 })}
      >
        <option value="all">All approval statuses</option>
        {Object.entries(APPROVAL_STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={filters.assignedTo}
        onChange={(e) => onChange({ ...filters, assignedTo: e.target.value, page: 0 })}
      >
        <option value="all">Everyone</option>
        <option value="unassigned">Unassigned</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.full_name}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={filters.source}
        onChange={(e) => onChange({ ...filters, source: e.target.value, page: 0 })}
      >
        <option value="all">All sources</option>
        {LEAD_SOURCES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-1.5 text-sm text-foreground">
        <Checkbox
          checked={filters.overdueOnly}
          onCheckedChange={(checked) => onChange({ ...filters, overdueOnly: checked === true, page: 0 })}
        />
        <Label className="cursor-pointer">Overdue only</Label>
      </label>

      {!isDefault && (
        <Button variant="ghost" size="sm" onClick={() => onChange({ ...DEFAULT_LEAD_FILTERS, deletedOnly: filters.deletedOnly })}>
          <X className="size-3.5" /> Clear filters
        </Button>
      )}
    </div>
  )
}
